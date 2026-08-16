import express, { type Express } from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.routes.js';
import { playbooksRouter } from './routes/playbooks.routes.js';
import { simulateRouter } from './routes/simulate.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp(): Express {
  const app = express();
  app.disable('x-powered-by');

  const frontendOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173';
  app.use(cors({ origin: frontendOrigin }));
  app.use(express.json());

  app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

  app.use('/auth', authRouter);
  app.use('/playbooks', playbooksRouter);
  app.use('/simulateTrigger', simulateRouter);

  // Every route above returns JSON; an unmatched path shouldn't fall
  // through to Express's default HTML 404 page and break that contract.
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use(errorHandler);

  return app;
}
