# Bayit (בית) — V1 Product Requirements Document

**Owner:** Ido | **Last updated:** February 6, 2026 | **Status:** Draft

---

## Problem Statement

Israeli couples manage their household through WhatsApp — forwarding plumber messages, sharing receipts, coordinating appointments — but none of it turns into action. Messages sink into chat history, voice notes go unheard, and nobody remembers who was supposed to call the insurance company. Existing task tools (Trello, Monday, Asana) are built for 10+ person teams, require context-switching to a separate app, and kill adoption with enterprise complexity. The result: dropped tasks, repeated arguments, and a mental load that falls unevenly.

---

## Goals

1. **Zero-friction capture:** Any WhatsApp message (text, image, voice) becomes a structured task in under 10 seconds, with no app-switching or manual data entry.
2. **Hebrew-native intelligence:** AI that thinks in Hebrew, understands Israeli context (קופת חולים, ועד בית, גן ילדים), and generates natural Hebrew task titles — not translated English.
3. **Two-person clarity:** At any moment, both partners can see what's pending, who owns what, and what's due — from their home screen.
4. **Calendar integration:** Time-bound tasks automatically create Google Calendar events on approval, eliminating the "I forgot to add it to the calendar" failure mode.
5. **Run cost under $10/month:** No subscriptions, no per-seat pricing. The whole stack stays under ~$8/month.

---

## Non-Goals (V1)

| Non-Goal | Why |
|---|---|
| **Recurring tasks** | Adds scheduling complexity. V1 focuses on one-off task capture. Revisit in V2. |
| **Expense tracking / receipt scanning** | Interesting but separate problem. V1 extracts tasks from receipts, not line items. |
| **Shopping list mode** | Tempting, but a different UX pattern. V1 tasks are "do this thing," not "buy these items." |
| **AI learning from approval patterns** | Owner suggestion improves over time is V2. V1 uses simple heuristics + user-configured defaults. |
| **Multi-household support** | V1 is one household. No account switching, no multi-tenancy complexity. |
| **Native mobile app** | PWA is the play. No App Store review, no Apple Developer fee, instant deployment. |

---

## User Stories

### As the message forwarder (capture)

- **As a partner, I want to forward a WhatsApp text message to the Bayit number** so that it becomes a task without me typing anything into a separate app.
- **As a partner, I want to forward a photo** (receipt, letter, screenshot) **to the Bayit number** so that AI reads it and extracts the task.
- **As a partner, I want to forward a voice note to the Bayit number** so that it gets transcribed and turned into a task.
- **As a partner, I want to send a manual task** by messaging "משימה: לקנות חלב" so that I can capture quick thoughts without forwarding anything.

### As the task reviewer (approval)

- **As a partner, I want to see all pending AI-suggested tasks in an inbox** so that I can approve, edit, or reject them before they become real.
- **As a partner, I want to edit the owner, title, due date, or category of a suggested task** so that AI mistakes don't propagate.
- **As a partner, I want to reject non-actionable messages** (memes, jokes, casual chat) so that the task list stays clean.

### As the task doer (execution)

- **As a partner, I want to filter active tasks by "mine" vs. "theirs" vs. "all"** so that I know what I need to do today.
- **As a partner, I want to mark a task as done** so that it moves to the archive and my partner sees it's handled.
- **As a partner, I want approved time-bound tasks to appear in my Google Calendar** so that I don't have to manually create events.

### As a household (shared awareness)

- **As a partner, I want push notifications when a new task is suggested, approved, or completed** so that I stay in sync without checking the app.
- **As a partner, I want a WhatsApp confirmation sent back** when a task is approved, so that the original message thread has closure.
- **As a partner, I want to configure default owner rules** (e.g., "חשבונות always goes to Ido") so that AI suggestions improve over time.

---

## Requirements

### P0 — Must-Have

These are required for V1 to be usable. Ship nothing without these.

#### WhatsApp Intake Pipeline

| # | Requirement | Acceptance Criteria |
|---|---|---|
| P0-1 | **Receive text messages** via Green API webhook | Text message forwarded to Bayit number → webhook fires → message content available in backend within 5s |
| P0-2 | **Receive images** via Green API webhook | Image message → backend downloads media via Green API → image bytes available for Claude Vision |
| P0-3 | **Receive voice notes** via Green API webhook | Voice note → backend downloads .ogg file → sends to Google Cloud STT → Hebrew transcript returned |
| P0-4 | **Route messages by type** to correct processing pipeline | Text → Claude directly. Image → Claude Vision. Voice → STT then Claude. Each path produces the same structured JSON output |
| P0-5 | **Claude extracts structured task data** from any message type | Claude returns JSON with `tasks[]` (each: `title`, `description`, `suggested_owner`, `due_date`, `due_time`, `category`, `icon`, `needs_calendar_event`, `confidence`), `not_a_task` flag, and `reply_suggestion`. Invalid JSON or API timeout → retry once, then save raw message with `ai_confidence: 0` for manual triage |
| P0-6 | **Multi-task extraction** from a single message | A message like "צריך לקבוע רופא וגם לשלם ארנונה" → 2 separate tasks created |
| P0-7 | **Non-task detection** | Memes, jokes, casual chat → `not_a_task: true` → no task created, no notification |
| P0-8a | **Manual task via WhatsApp keyword** | Message starting with "משימה:" → treated as explicit task creation. Claude extracts task from the text after the keyword. Same pending flow applies |
| P0-8b | **Error handling across intake pipeline** | Green API webhook failure → log + retry 3x with backoff. Media download failure → save message metadata, notify user "couldn't process media." STT failure → fall back to saving voice note URL with manual transcription prompt. Claude API timeout/error → retry once, then create task with `ai_confidence: 0` and raw source for manual review |

#### PWA Core

| # | Requirement | Acceptance Criteria |
|---|---|---|
| P0-9 | **PWA installable on iOS and Android home screen** | Visit URL in Safari/Chrome → Add to Home Screen → launches standalone (no browser chrome), app name "בית", proper icons, splash screen. Badge count on app icon for pending tasks |
| P0-10 | **Full RTL layout** with correct BiDi text handling | `<html lang="he" dir="rtl">` base. `dir="auto"` on all user-generated content and input fields. CSS logical properties (margin-inline-start, etc.), `unicode-bidi: plaintext` on task content. Tailwind RTL plugin for directional icons and swipe. All BiDi test scenarios pass (see Appendix A) |
| P0-11 | **Pending inbox** showing AI-suggested task cards | Each card: emoji icon (inline-end), Hebrew title (`dir="auto"`), suggested owner avatar (inline-start), due date, source preview, AI reply suggestion (if present). Swipe right to approve, tap to edit, swipe left to reject |
| P0-12 | **Active board** with owner filter | Toggle: שלי / שלה / הכל. Sorted by due date. Tap to mark done, long press to edit |
| P0-13 | **Done archive** | Completed tasks grouped by week. Searchable by title text |
| P0-14 | **Edit task before approval** | Can change: title, owner, due date, due time, category, icon. All fields editable. Date picker uses dd/mm/yyyy (Israeli standard) |
| P0-15 | **Auth flow** | Invite code or magic link. Hard limit: 2 members per household enforced at DB level |
| P0-16 | **Supabase Realtime** | When partner approves/adds/completes a task, it appears on my screen within 2s without refresh. Reconnects automatically on network loss |

#### Push Notifications

| # | Requirement | Acceptance Criteria |
|---|---|---|
| P0-17 | **Web Push notifications** for new pending tasks | AI creates a pending task → both phones receive push with task icon + title (`dir="auto"`) within 10s. VAPID key setup. Fallback for iOS <16.4: in-app Realtime updates only (no push) |
| P0-18 | **Notifications for partner actions** | Partner approves or completes a task → I receive a push notification |

#### Google Calendar Integration

| # | Requirement | Acceptance Criteria |
|---|---|---|
| P0-19 | **Google OAuth flow** in PWA | Tap "Connect Google" → OAuth consent → Calendar scope granted → refresh token stored securely in members table |
| P0-20 | **Calendar event creation on task approval** | Approve a task where `needs_calendar_event: true` (has `due_date` + `due_time`) → Google Calendar event created for the task owner → `calendar_event_id` stored on task |

### P1 — Nice-to-Have

Ship V1 without these if they threaten the timeline, but they make it meaningfully better.

| # | Requirement | Acceptance Criteria |
|---|---|---|
| P1-1 | **WhatsApp confirmation reply** on task approval | Approve a task → WhatsApp message sent back to the Bayit chat: "✅ [task title] — [owner]" |
| P1-2 | **Gmail forwarding → task** | Forward email to dedicated address → Gmail Pub/Sub triggers backend → Claude parses → same pending flow |
| P1-3 | **Settings screen** | Google account status, WhatsApp bot status, category management, default owner rules, notification preferences |
| P1-4 | **Offline support** | Service worker caches app shell. Tasks created offline sync when back online |
| P1-5 | **Due date reminders** | Push notification sent X hours before a task's due date/time |
| P1-6 | **Reply suggestion** | Claude suggests a WhatsApp reply to the original sender (e.g., "אשר את התור ליום חמישי"). Shown in pending card, user can send with one tap |

### P2 — Future Considerations

Not in scope for V1. Listed here to prevent scope creep and inform architecture decisions.

- Recurring tasks with cron-like scheduling
- Receipt → expense tracking with category totals
- Shared shopping list mode with real-time collaboration
- AI owner assignment learning from approval history
- Voice command intake ("תזכיר לי לקנות חלב" as a voice note → task)
- Multi-household support

---

## Data Model

### households
`id` (UUID, PK), `name` (text), `created_at` (timestamp)

### members
`id` (UUID, PK), `household_id` (FK → households), `name` (text), `phone` (text), `email` (text), `google_refresh_token` (text, encrypted), `avatar_url` (text), `role` (text)

### tasks
| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `household_id` | FK → households | |
| `status` | enum | `pending` · `active` · `done` · `rejected` |
| `title` | text | Hebrew, AI-generated |
| `description` | text | Context from original message |
| `owner_id` | FK → members | AI-suggested, user-confirmed |
| `icon` | text | Single emoji |
| `category` | enum | בית · ילדים · כספים · בריאות · קניות · רכב · כללי |
| `due_date` | date | Extracted from message |
| `due_time` | time | Extracted from message |
| `calendar_event_id` | text | Google Calendar event ID |
| `source_type` | enum | `whatsapp_text` · `whatsapp_image` · `whatsapp_voice` · `gmail` · `manual` |
| `source_raw` | text | Original message content or media URL |
| `needs_calendar_event` | boolean | AI-suggested; true if task has a specific time |
| `ai_confidence` | float | 0.0–1.0. Tasks at 0 need manual review |
| `reply_suggestion` | text | AI-suggested WhatsApp reply to original sender (nullable) |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

---

## Architecture Summary

```
WhatsApp Message
    ↓
Green API Webhook → Node.js Backend (Hetzner VPS)
    ↓                     ↓                    ↓
  [text]              [image]             [voice]
    ↓              download → Claude    download → Google STT
  Claude            Vision                  ↓ transcript
    ↓                  ↓                  Claude
    └──────── Structured Task JSON ────────┘
                      ↓
              Supabase (pending task)
                ↓              ↓
         Realtime push    Web Push notification
                ↓
         PWA (approve/edit/reject)
                ↓
         Google Calendar event (if time-bound)
                ↓
         WhatsApp confirmation (P1)
```

**Stack:** Node.js backend · Next.js 14 PWA · Supabase (Postgres + Realtime + Auth) · Claude Sonnet API · Google Cloud STT · Green API · Hetzner VPS (CAX11, ~$5/mo)

---

## Success Metrics

### Leading indicators (first 2 weeks of use)

| Metric | Target | How to measure |
|---|---|---|
| Messages forwarded per day | ≥ 2/day average | Count webhook events per day |
| Task approval rate | ≥ 70% of pending tasks approved (not rejected) | `approved / (approved + rejected)` |
| AI extraction accuracy | ≥ 80% of approved tasks require no edits | `approved_without_edit / total_approved` |
| Time from forward to approval | < 2 minutes median | `task.approved_at - task.created_at` |

### Lagging indicators (after 1 month)

| Metric | Target | How to measure |
|---|---|---|
| Weekly active usage | Both partners use the app every week | At least 1 action (approve/complete) per partner per week |
| Task completion rate | ≥ 60% of active tasks marked done | `done / (active + done)` over rolling 30 days |
| Capture channel adoption | WhatsApp remains primary capture method | `source_type` distribution — WhatsApp should be ≥ 80% |
| Calendar sync usage | ≥ 50% of time-bound tasks create calendar events | Tasks with `due_time` that also have `calendar_event_id` |

---

## Open Questions

| Question | Who answers | Impact |
|---|---|---|
| Green API's 3 chats/month free limit — does "chat" mean 3 unique phone numbers, or 3 message threads? If the couple + bot = 3 chats, is there room for growth? | Ido (test with Green API) | Could need paid tier sooner than expected |
| iOS 16.4+ Web Push — what % of target users (Israeli couples, likely iPhone) are on 16.4+? Is the fallback (no push, just Realtime in-app) acceptable? | Ido (check iOS version stats for Israel) | May need a different notification strategy |
| Google OAuth scopes — will Calendar + Gmail combined scopes trigger a more aggressive Google review? Should Gmail be a separate, later consent? | Ido (check Google OAuth docs) | Could delay Gmail integration to avoid review friction |
| Supabase free tier row limits — at ~15 tasks/week, how long before hitting limits? | Ido (check Supabase pricing) | May need paid tier within 6-12 months |
| Voice note transcription — is Google Cloud STT's Hebrew accuracy good enough for colloquial Israeli Hebrew with slang? | Ido (test with real voice notes) | May need to try Whisper as fallback |

---

## Timeline (3–4 Weeks)

| Week | Focus | Milestone |
|---|---|---|
| **Week 1** | Backend + AI Pipeline | Green API webhook receiving messages → Claude extracting tasks → tasks landing in Supabase. End-to-end text pipeline working. Voice + image pipelines functional. |
| **Week 2** | PWA Core | Next.js PWA installable on home screen. Pending inbox, active board, done archive. RTL layout correct. Supabase Realtime syncing between 2 phones. Auth flow working. |
| **Week 3** | Integrations | Google OAuth → Calendar event creation. Web Push notifications. WhatsApp reply-back (P1). Gmail forwarding (P1, stretch). |
| **Week 4** | Polish & Ship | AI prompt tuning with real Hebrew messages. Offline support. Due date reminders. Edge case handling. Real-world testing on both phones. |

**Hard deadline:** None — personal project. But momentum matters. Ship a usable V1 within 4 weeks or scope down.

**Key dependency:** Green API account setup and webhook verification must happen before anything else works.

---

## Monthly Cost Breakdown

| Component | Cost |
|---|---|
| Green API (Developer/Free tier) | $0 |
| Claude Sonnet API (~500 requests/mo) | $1–3 |
| Google Cloud STT (free 60 min/mo) | $0 |
| Supabase (free tier) | $0 |
| Google APIs (Calendar + Gmail) | $0 |
| Hetzner VPS (CAX11 ARM, 4GB) | ~$5 |
| Domain name | ~$1 (amortized) |
| **Total** | **~$7–8/month** |

---

## Appendix A: BiDi Testing Checklist

Every screen and component must pass with these content patterns before launch:

| # | Test Content | Expected Behavior |
|---|---|---|
| 1 | Pure Hebrew sentence | Flows RTL, aligned right |
| 2 | Hebrew + embedded English brand name ("תאם פגישה ב-Zoom בשעה 3") | "Zoom" and "3" render inline without jumping. Sentence reads naturally RTL |
| 3 | Hebrew + numbers and currency ("לשלם 350₪ לועד בית") | ₪ and number stay together, correct side per Hebrew convention |
| 4 | Hebrew + email address ("שלח מייל ל-david@gmail.com") | Email stays LTR as single unit, positioned correctly in RTL flow |
| 5 | Hebrew + URL ("check https://example.com") | URL renders as single LTR unit. Surrounding Hebrew maintains RTL |
| 6 | Hebrew + date/time ("15/03/2026 בשעה 14:30") | Slash separators don't flip. Colon position preserved |
| 7 | Hebrew + parentheses ("השרברב (יוסי) אמר...") | Opening/closing parens mirror correctly in RTL context |
| 8 | Hebrew + phone number ("+972-50-123-4567") | Number renders as LTR unit within RTL flow |
| 9 | Pure English sentence | Auto-detects and aligns LTR |
| 10 | Long mixed-content title that wraps to multiple lines | Each line maintains correct directional flow |
| 11 | Emoji + Hebrew content | Emoji doesn't break text direction |

**Implementation rules:**
- `<html lang="he" dir="rtl">` on document root
- `dir="auto"` on all task titles, descriptions, input fields, and notification bodies
- CSS logical properties only (margin-inline-start, padding-inline-end, inset-inline-start) — no margin-left/right
- `unicode-bidi: plaintext` on all rendered task content
- Tailwind RTL plugin (`tailwindcss-rtl`) for directional icons and swipe gestures
- Date pickers: dd/mm/yyyy format (Israeli standard)
- WhatsApp reply messages: use RLM (`\u200F`) before numbers that should associate with Hebrew side

---

## Appendix B: Claude AI Response Schema

```json
{
  "tasks": [
    {
      "title": "string — Hebrew, concise, actionable",
      "description": "string — context from original message",
      "suggested_owner": "string — member name, or 'either' if unclear",
      "due_date": "string — YYYY-MM-DD or null",
      "due_time": "string — HH:MM or null",
      "category": "enum — בית|ילדים|כספים|בריאות|קניות|רכב|כללי",
      "icon": "string — single specific emoji (🔧 not 📋)",
      "needs_calendar_event": "boolean",
      "confidence": "float — 0.0 to 1.0"
    }
  ],
  "not_a_task": "boolean — true for memes, jokes, casual chat",
  "reply_suggestion": "string — suggested WhatsApp reply to original sender, or null"
}
```

**AI rules:** One message may contain multiple tasks (extract all). Owner defaults to "either" if unclear. Icons should be specific to the task type. Dates/times extracted when mentioned or implied from Israeli context (e.g., "יום חמישי" → next Thursday).
