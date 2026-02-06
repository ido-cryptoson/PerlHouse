import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import webhookRouter from './routes/webhook';

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT ?? '3001', 10);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// Green API webhook
app.use('/api/webhook', webhookRouter);

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
});

export default app;
