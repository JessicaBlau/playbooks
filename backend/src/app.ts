import express, { type Express } from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.routes.js';
import { playbooksRouter } from './routes/playbooks.routes.js';
import { simulateRouter } from './routes/simulate.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

  app.use('/auth', authRouter);
  app.use('/playbooks', playbooksRouter);
  app.use('/simulateTrigger', simulateRouter);

  app.use(errorHandler);

  return app;
}
