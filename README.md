# בית (Bayit) — Household Task Manager for Israeli Couples

A Hebrew-native PWA that turns WhatsApp messages into structured household tasks using AI.

**Forward a WhatsApp message → AI extracts the task → Approve in the app → Done.**

## Architecture

```
WhatsApp → Green API Webhook → Node.js Backend → Claude AI → Supabase → PWA
                                    ↓
                              Google Cloud STT (voice notes)
                                    ↓
                              Google Calendar (time-bound tasks)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, PWA |
| Backend | Node.js, Express, TypeScript |
| Database | Supabase (Postgres + Realtime + Auth) |
| AI | Claude Sonnet (task extraction + Hebrew NLP) |
| WhatsApp | Green API |
| Voice | Google Cloud Speech-to-Text |
| Calendar | Google Calendar API |

## Project Structure

```
PerlHouse/
├── apps/
│   ├── web/                    # Next.js 14 PWA
│   │   ├── src/
│   │   │   ├── app/            # App Router pages
│   │   │   ├── components/     # React components
│   │   │   ├── hooks/          # Custom hooks
│   │   │   ├── lib/            # Supabase clients
│   │   │   └── types/          # TypeScript types
│   │   └── public/             # PWA manifest, icons
│   └── backend/                # Node.js webhook server
│       └── src/
│           ├── routes/         # Express routes
│           └── services/       # AI, STT, WhatsApp, Supabase, Push
├── supabase/
│   └── migrations/             # Database schema
├── docs/                       # PRD and product docs
└── package.json                # Monorepo root
```

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/ido-cryptoson/PerlHouse.git
cd PerlHouse
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env
# Fill in all required values
```

### 3. Database Setup

Run the migration in `supabase/migrations/001_create_bayit_schema.sql` against your Supabase project.

### 4. Run Development

```bash
npm run dev
```

This starts both the web app (port 3000) and backend (port 3001).

## Key Features

- **Zero-friction capture**: Forward any WhatsApp message (text, image, voice) to create a task
- **Hebrew-native AI**: Claude understands Israeli context (קופת חולים, ועד בית, ארנונה)
- **Two-person clarity**: Real-time sync between both partners via Supabase Realtime
- **Full RTL support**: Proper BiDi handling for mixed Hebrew/English content
- **Google Calendar**: Time-bound tasks auto-create calendar events
- **Web Push**: Notifications for new tasks, approvals, and completions

## Monthly Cost: ~$7-8

| Component | Cost |
|-----------|------|
| Green API | $0 |
| Claude API (~500 req/mo) | $1-3 |
| Google Cloud STT | $0 |
| Supabase (free tier) | $0 |
| Hetzner VPS | ~$5 |

---

Built with ❤️ for Israeli households.
