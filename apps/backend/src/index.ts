import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import webhookRouter from './routes/webhook';
import setupRouter from './routes/setup';
import { startDailySummaryCron, sendDailySummary } from './services/dailySummary';
import { warmupSupabase } from './services/supabase';
import { warmupAI } from './services/ai';

const app = express();
const PORT = parseInt(process.env.PORT ?? process.env.BACKEND_PORT ?? '3001', 10);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// Manual trigger for daily summary (dev/testing)
app.post('/api/daily-summary', async (_req: Request, res: Response) => {
  res.json({ ok: true, message: 'Sending daily summary...' });
  sendDailySummary().catch((err) => console.error('[API] Daily summary error:', err));
});

// Green API webhook
app.use('/api/webhook', webhookRouter);

// Green API setup/admin
app.use('/api/setup', setupRouter);

// 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`[Bayit Backend] Running on port ${PORT}`);
  console.log(`[Bayit Backend] Health: http://localhost:${PORT}/api/health`);
  console.log(`[Bayit Backend] Webhook: http://localhost:${PORT}/api/webhook/greenapi`);
  console.log(`[Bayit Backend] Setup:   http://localhost:${PORT}/api/setup/status`);

  startDailySummaryCron();

  // Warm up external connections so first webhook is fast
  Promise.all([warmupSupabase(), warmupAI()]).then(() => {
    console.log('[Bayit Backend] Warmup complete');
  });
});

export default app;
