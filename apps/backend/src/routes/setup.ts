import { Router, Request, Response } from 'express';
import { getState, getSettings, setSettings, getQR } from '../services/greenapi';

const router = Router();

// GET /api/setup/status — instance state + current settings
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const [state, settings] = await Promise.all([getState(), getSettings()]);
    res.json({ state: state.stateInstance, settings });
  } catch (error) {
    console.error('[Setup] Status check failed:', error);
    res.status(500).json({ error: 'Failed to fetch Green API status' });
  }
});

// POST /api/setup/webhook — configure Green API webhook URL
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const { webhookUrl } = req.body;
    if (!webhookUrl || typeof webhookUrl !== 'string') {
      res.status(400).json({ error: 'webhookUrl is required' });
      return;
    }

    const result = await setSettings({
      webhookUrl,
      incomingWebhook: 'yes',
      outgoingMessageWebhook: 'no',
      outgoingAPIMessageWebhook: 'no',
      stateWebhook: 'yes',
      pollMessageWebhook: 'yes',
      markIncomingMessagesReaded: 'yes',
      markIncomingMessagesReadedOnReply: 'yes',
      keepOnlineStatus: 'yes',
      delaySendMessagesMilliseconds: 5000,
    });

    const settings = await getSettings();
    res.json({ saved: result.saveSettings, settings });
  } catch (error) {
    console.error('[Setup] Webhook config failed:', error);
    res.status(500).json({ error: 'Failed to configure webhook' });
  }
});

// GET /api/setup/qr — get QR code for WhatsApp linking
router.get('/qr', async (_req: Request, res: Response) => {
  try {
    const qr = await getQR();
    res.json(qr);
  } catch (error) {
    console.error('[Setup] QR fetch failed:', error);
    res.status(500).json({ error: 'Failed to get QR code' });
  }
});

export default router;
