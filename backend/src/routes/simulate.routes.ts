import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { simulateTrigger } from '../services/simulate.service.js';

export const simulateRouter = Router();

simulateRouter.use(requireAuth);

simulateRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const result = await simulateTrigger(req.userId!, req.body);
    res.status(200).json(result);
  })
);
