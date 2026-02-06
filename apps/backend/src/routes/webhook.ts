import { Router, Request, Response } from 'express';
import { GreenAPIWebhookPayload, TaskInsert, TaskCategory } from '../types';
import { extractTasks } from '../services/ai';
import { downloadMedia, sendMessage } from '../services/greenapi';
import { transcribeVoiceNote } from '../services/stt';
import { createTask, getMemberByPhone, getHouseholdMembers } from '../services/supabase';
import { notifyHouseholdMembers } from '../services/notifications';

const router = Router();
const MANUAL_PREFIX = 'משימה:';

router.post('/greenapi', async (req: Request, res: Response) => {
  // Return 200 immediately so Green API doesn't retry
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

    console.log(`[Webhook] Processing ${typeMessage} from ${senderData.senderName} (${chatId})`);

    const member = await getMemberByPhone(senderPhone);
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
        const imgData = messageData.imageMessageData;
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
        const audioData = messageData.audioMessageData;
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

    // Manual task prefix
    let isManualTask = false;
    if (textContent.startsWith(MANUAL_PREFIX)) {
      isManualTask = true;
      textContent = textContent.slice(MANUAL_PREFIX.length).trim();
    }

    // AI extraction
    const extraction = await extractTasks(textContent, contentType, imageBase64);

    if (extraction.not_a_task && !isManualTask) {
      console.log('[Webhook] Not a task — skipping');
      return;
    }

    // Store tasks
    const createdTaskIds: string[] = [];
    for (const task of extraction.tasks) {
      const taskInsert: TaskInsert = {
        household_id: member.household_id,
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
        source_raw: textContent,
        needs_calendar_event: task.needs_calendar_event,
        ai_confidence: task.confidence,
        reply_suggestion: extraction.reply_suggestion,
        approved_at: null,
        completed_at: null,
      };
      try {
        const result = await createTask(taskInsert);
        if (result) createdTaskIds.push(result.id);
      } catch (err) { console.error('[Webhook] Task creation failed:', err); }
    }

    // WhatsApp reply
    if (extraction.reply_suggestion && createdTaskIds.length > 0) {
      try { await sendMessage(chatId, extraction.reply_suggestion); }
      catch (err) { console.error('[Webhook] Reply failed:', err); }
    }

    // Push notifications
    if (createdTaskIds.length > 0) {
      try {
        const members = await getHouseholdMembers(member.household_id);
        const titles = extraction.tasks.map((t) => `${t.icon} ${t.title}`).join('\n');
        await notifyHouseholdMembers(members, {
          title: 'משימה חדשה בבית 🏠',
          body: titles,
          icon: '/icons/icon-192x192.png',
          data: { type: 'new_tasks', taskIds: createdTaskIds },
        });
      } catch (err) { console.error('[Webhook] Push notification failed:', err); }
    }

    console.log(`[Webhook] Processed ${idMessage}: ${createdTaskIds.length} task(s) created`);
  } catch (error) {
    console.error('[Webhook] Error:', error);
  }
}

export default router;
