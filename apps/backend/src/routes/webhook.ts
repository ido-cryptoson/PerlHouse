import { Router, Request, Response } from 'express';
import { GreenAPIWebhookPayload, TaskInsert, TaskCategory, TaskExtractionItem } from '../types';
import { extractTasks, resolveMissingDateTime, PendingTaskContext } from '../services/ai';
import { downloadMedia, sendMessage, sendPoll, readChat } from '../services/greenapi';
import { transcribeVoiceNote } from '../services/stt';
import { createTask, getMemberByPhone, getHouseholdMembers, updateTaskCalendarEventId } from '../services/supabase';
import { notifyHouseholdMembers } from '../services/notifications';
import { createCalendarEvent } from '../services/calendar';

const router = Router();
const MANUAL_PREFIX = 'משימה:';

// In-memory store for conversations awaiting date/time info.
// Key = chatId, auto-expires after 10 minutes.
const pendingContexts = new Map<string, { ctx: PendingTaskContext; memberId: string; householdId: string; timer: ReturnType<typeof setTimeout> }>();
const PENDING_TTL = 10 * 60 * 1000;

function clearPending(chatId: string) {
  const entry = pendingContexts.get(chatId);
  if (entry) { clearTimeout(entry.timer); pendingContexts.delete(chatId); }
}

// In-memory store for calendar poll responses.
// Key = poll stanzaId (idMessage returned by sendPoll).
const WIFE_EMAIL = 'litalbenn1@gmail.com';
const CALENDAR_POLL_TTL = 30 * 60 * 1000;
const POLL_YES_ME = 'כן, רק לי';
const POLL_YES_WIFE = 'כן, גם לאשתי';
const POLL_NO = 'לא, תודה';

interface PendingCalendarPoll {
  taskIds: string[];
  tasks: Array<{ title: string; description: string | null; due_date: string; due_time: string }>;
  chatId: string;
  timer: ReturnType<typeof setTimeout>;
}

const pendingCalendarPolls = new Map<string, PendingCalendarPoll>();

function clearCalendarPoll(stanzaId: string) {
  const entry = pendingCalendarPolls.get(stanzaId);
  if (entry) { clearTimeout(entry.timer); pendingCalendarPolls.delete(stanzaId); }
}

router.post('/greenapi', async (req: Request, res: Response) => {
  res.status(200).json({ ok: true });

  const payload = req.body as GreenAPIWebhookPayload;
  processWebhook(payload).catch((error) => {
    console.error('[Webhook] Unhandled error in async processing:', error);
  });
});

async function processWebhook(payload: GreenAPIWebhookPayload): Promise<void> {
  try {
    if (payload.typeWebhook !== 'incomingMessageReceived') return;

    const { messageData, senderData, idMessage } = payload;
    const { typeMessage } = messageData;
    const chatId = senderData.chatId;
    const senderPhone = senderData.sender.replace('@c.us', '');

    const t0 = Date.now();
    console.log(`[Webhook] Processing ${typeMessage} from ${senderData.senderName} (${chatId})`);

    // Mark message as read
    try { await readChat(chatId, idMessage); } catch { /* ignore */ }
    console.log(`[Webhook] [${Date.now() - t0}ms] readChat done`);

    // Handle poll vote responses (calendar polls)
    if (typeMessage === 'pollUpdateMessage') {
      const pollData = messageData.pollMessageData;
      if (!pollData) return;

      const pending = pendingCalendarPolls.get(pollData.stanzaId);
      if (!pending) {
        console.log(`[Webhook] Poll update for unknown stanzaId: ${pollData.stanzaId}`);
        return;
      }

      const selectedVote = pollData.votes.find(
        (v) => v.optionVoters.length > 0 && v.optionVoters.includes(senderData.sender),
      );
      if (!selectedVote) return;

      const selectedOption = selectedVote.optionName;
      console.log(`[Webhook] Calendar poll response: "${selectedOption}" from ${senderData.senderName}`);
      clearCalendarPoll(pollData.stanzaId);

      if (selectedOption === POLL_YES_ME || selectedOption === POLL_YES_WIFE) {
        const attendeeEmails = selectedOption === POLL_YES_WIFE ? [WIFE_EMAIL] : [];

        for (let i = 0; i < pending.tasks.length; i++) {
          const task = pending.tasks[i];
          const taskId = pending.taskIds[i];
          try {
            const eventId = await createCalendarEvent({
              title: task.title,
              description: task.description,
              date: task.due_date,
              time: task.due_time,
              attendeeEmails,
            });
            if (eventId && taskId) {
              await updateTaskCalendarEventId(taskId, eventId);
            }
          } catch (err) {
            console.error(`[Webhook] Calendar event creation failed for task ${taskId}:`, err);
          }
        }

        const calMsg = pending.tasks.length === 1
          ? `📅 האירוע נוסף ליומן: ${pending.tasks[0].title}`
          : `📅 ${pending.tasks.length} אירועים נוספו ליומן`;
        const fullMsg = attendeeEmails.length > 0 ? `${calMsg}\n📧 הזמנה נשלחה גם ל-${WIFE_EMAIL}` : calMsg;
        try { await sendMessage(pending.chatId, fullMsg); }
        catch (err) { console.error('[Webhook] Calendar confirmation failed:', err); }
      } else {
        try { await sendMessage(pending.chatId, '👍 בסדר, לא נוסף ליומן.'); }
        catch (err) { console.error('[Webhook] Calendar decline msg failed:', err); }
      }
      return;
    }

    const member = await getMemberByPhone(senderPhone);
    console.log(`[Webhook] [${Date.now() - t0}ms] getMemberByPhone done`);
    if (!member) {
      console.warn(`[Webhook] Unknown sender: ${senderPhone}`);
      return;
    }

    let textContent = '';
    let imageBase64: string | undefined;
    let sourceType: 'whatsapp_text' | 'whatsapp_image' | 'whatsapp_voice' = 'whatsapp_text';
    let contentType: 'text' | 'image' | 'voice' = 'text';

    switch (typeMessage) {
      case 'textMessage':
        textContent = messageData.textMessageData?.textMessage ?? '';
        break;
      case 'extendedTextMessage':
        textContent = messageData.extendedTextMessageData?.text ?? '';
        break;
      case 'imageMessage': {
        contentType = 'image';
        sourceType = 'whatsapp_image';
        const imgData = messageData.imageMessageData ?? messageData.fileMessageData;
        if (!imgData?.downloadUrl) { console.warn('[Webhook] Image with no URL'); return; }
        textContent = imgData.caption ?? '';
        try {
          const imageBuffer = await downloadMedia(imgData.downloadUrl);
          imageBase64 = imageBuffer.toString('base64');
        } catch (err) { console.error('[Webhook] Image download failed:', err); return; }
        break;
      }
      case 'audioMessage': {
        contentType = 'voice';
        sourceType = 'whatsapp_voice';
        const audioData = messageData.audioMessageData ?? messageData.fileMessageData;
        if (!audioData?.downloadUrl) { console.warn('[Webhook] Audio with no URL'); return; }
        try {
          const audioBuffer = await downloadMedia(audioData.downloadUrl);
          textContent = await transcribeVoiceNote(audioBuffer);
          if (!textContent) { console.warn('[Webhook] Empty transcription'); return; }
          console.log(`[Webhook] Transcribed: "${textContent.slice(0, 80)}..."`);
        } catch (err) { console.error('[Webhook] Voice processing failed:', err); return; }
        break;
      }
      default:
        console.log(`[Webhook] Unsupported type: ${typeMessage}`);
        return;
    }

    if (!textContent && !imageBase64) return;

    // Check if this is a reply to a pending date/time question
    const pending = pendingContexts.get(chatId);
    if (pending && textContent) {
      console.log(`[Webhook] Resolving pending tasks for ${chatId} with reply: "${textContent.slice(0, 60)}"`);
      clearPending(chatId);

      try {
        const resolved = await resolveMissingDateTime(pending.ctx.tasks, textContent);

        // Check if still missing date or time
        const stillIncomplete = resolved.filter((t) => !t.due_date || !t.due_time);
        if (stillIncomplete.length > 0) {
          const missing = stillIncomplete.map((t) => {
            const parts: string[] = [];
            if (!t.due_date) parts.push('תאריך');
            if (!t.due_time) parts.push('שעה');
            return `${t.icon} ${t.title} — חסר: ${parts.join(' ו')}`;
          }).join('\n');
          try { await sendMessage(chatId, `עדיין חסר מידע:\n${missing}\n\nאנא שלח את הפרטים החסרים.`); }
          catch (err) { console.error('[Webhook] Reply failed:', err); }

          // Re-store pending with updated tasks
          const timer = setTimeout(() => pendingContexts.delete(chatId), PENDING_TTL);
          pendingContexts.set(chatId, {
            ctx: { ...pending.ctx, tasks: resolved },
            memberId: pending.memberId,
            householdId: pending.householdId,
            timer,
          });
          return;
        }

        // All complete — create tasks
        await createAndNotify(resolved, pending.ctx.sourceType, pending.ctx.sourceRaw, pending.householdId, chatId);
      } catch (err) {
        console.error('[Webhook] Error resolving pending tasks:', err);
        try { await sendMessage(chatId, '❌ שגיאה בעיבוד. נסה לשלוח את המשימה שוב.'); } catch { /* ignore */ }
      }
      return;
    }

    // Manual task prefix
    let isManualTask = false;
    if (textContent.startsWith(MANUAL_PREFIX)) {
      isManualTask = true;
      textContent = textContent.slice(MANUAL_PREFIX.length).trim();
    }

    // AI extraction
    console.log(`[Webhook] [${Date.now() - t0}ms] calling AI extractTasks...`);
    const extraction = await extractTasks(textContent, contentType, imageBase64);
    console.log(`[Webhook] [${Date.now() - t0}ms] AI extractTasks done`);

    if (extraction.not_a_task && !isManualTask) {
      console.log('[Webhook] Not a task — skipping');
      return;
    }

    // Split tasks into complete (has date+time) and incomplete
    const completeTasks = extraction.tasks.filter((t) => t.due_date && t.due_time);
    const incompleteTasks = extraction.tasks.filter((t) => !t.due_date || !t.due_time);

    // Create complete tasks immediately
    if (completeTasks.length > 0) {
      await createAndNotify(completeTasks, sourceType, textContent, member.household_id, chatId);
    }

    // Ask for missing date/time on incomplete tasks
    if (incompleteTasks.length > 0) {
      const missing = incompleteTasks.map((t) => {
        const parts: string[] = [];
        if (!t.due_date) parts.push('תאריך');
        if (!t.due_time) parts.push('שעה');
        return `${t.icon} ${t.title} — חסר: ${parts.join(' ו')}`;
      }).join('\n');

      const askMsg = `📋 זיהיתי משימות אבל חסר מידע:\n${missing}\n\nמתי לתזמן? (שלח תאריך ושעה)`;
      console.log(`[Webhook] [${Date.now() - t0}ms] sending WhatsApp reply...`);
      try { await sendMessage(chatId, askMsg); }
      catch (err) { console.error('[Webhook] Reply failed:', err); }
      console.log(`[Webhook] [${Date.now() - t0}ms] WhatsApp reply sent`);

      // Store pending context
      clearPending(chatId);
      const timer = setTimeout(() => pendingContexts.delete(chatId), PENDING_TTL);
      pendingContexts.set(chatId, {
        ctx: { tasks: incompleteTasks, sourceType, sourceRaw: textContent },
        memberId: member.id,
        householdId: member.household_id,
        timer,
      });
    }

    console.log(`[Webhook] Processed ${idMessage}: ${completeTasks.length} created, ${incompleteTasks.length} pending date/time`);
  } catch (error) {
    console.error('[Webhook] Error:', error);
  }
}

async function createAndNotify(
  tasks: TaskExtractionItem[],
  sourceType: 'whatsapp_text' | 'whatsapp_image' | 'whatsapp_voice',
  sourceRaw: string,
  householdId: string,
  chatId: string,
): Promise<void> {
  const createdTaskIds: string[] = [];
  for (const task of tasks) {
    const taskInsert: TaskInsert = {
      household_id: householdId,
      title: task.title,
      description: task.description,
      status: 'pending',
      owner_id: null,
      icon: task.icon,
      category: task.category as TaskCategory,
      due_date: task.due_date,
      due_time: task.due_time,
      calendar_event_id: null,
      source_type: sourceType,
      source_raw: sourceRaw,
      needs_calendar_event: task.needs_calendar_event,
      ai_confidence: task.confidence,
      reply_suggestion: null,
      approved_at: null,
      completed_at: null,
    };
    try {
      const result = await createTask(taskInsert);
      if (result) createdTaskIds.push(result.id);
    } catch (err) { console.error('[Webhook] Task creation failed:', err); }
  }

  // WhatsApp confirmation
  if (createdTaskIds.length > 0) {
    const taskTitles = tasks.map((t) => `${t.icon} ${t.title}`).join('\n');
    const confirmMsg = createdTaskIds.length === 1
      ? `✅ המשימה נוספה:\n${taskTitles}`
      : `✅ ${createdTaskIds.length} משימות נוספו:\n${taskTitles}`;
    try { await sendMessage(chatId, confirmMsg); }
    catch (err) { console.error('[Webhook] Reply failed:', err); }
  }

  // Push notifications
  if (createdTaskIds.length > 0) {
    try {
      const members = await getHouseholdMembers(householdId);
      const titles = tasks.map((t) => `${t.icon} ${t.title}`).join('\n');
      await notifyHouseholdMembers(members, {
        title: 'משימה חדשה בבית 🏠',
        body: titles,
        icon: '/icons/icon-192x192.png',
        data: { type: 'new_tasks', taskIds: createdTaskIds },
      });
    } catch (err) { console.error('[Webhook] Push notification failed:', err); }
  }

  // Send calendar poll for tasks with due_date + due_time
  const calendarTasks = tasks.filter((t, i) => t.due_date && t.due_time && createdTaskIds[i]);
  if (calendarTasks.length > 0) {
    try {
      const taskSummary = calendarTasks.map((t) => `${t.icon} ${t.title}`).join('\n');
      const pollMessage = calendarTasks.length === 1
        ? `📅 להוסיף ליומן Google?\n${taskSummary}`
        : `📅 להוסיף ${calendarTasks.length} אירועים ליומן Google?\n${taskSummary}`;

      const pollResult = await sendPoll(chatId, pollMessage, [
        { optionName: POLL_YES_ME },
        { optionName: POLL_YES_WIFE },
        { optionName: POLL_NO },
      ], false);

      const stanzaId = pollResult.idMessage;
      const calendarTaskDetails = calendarTasks.map((t) => ({
        title: t.title,
        description: t.description,
        due_date: t.due_date!,
        due_time: t.due_time!,
      }));
      const calendarTaskIds = calendarTasks.map((t) => {
        const idx = tasks.indexOf(t);
        return createdTaskIds[idx];
      });

      clearCalendarPoll(stanzaId);
      const timer = setTimeout(() => pendingCalendarPolls.delete(stanzaId), CALENDAR_POLL_TTL);
      pendingCalendarPolls.set(stanzaId, { taskIds: calendarTaskIds, tasks: calendarTaskDetails, chatId, timer });

      console.log(`[Webhook] Calendar poll sent (stanzaId: ${stanzaId}) for ${calendarTasks.length} tasks`);
    } catch (err) {
      console.error('[Webhook] Calendar poll send failed:', err);
    }
  }
}

export default router;
