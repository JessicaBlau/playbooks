import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { register, login } from '../services/auth.service.js';

export const authRouter = Router();

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const result = await register(req.body);
    res.status(201).json(result);
  })
);

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const result = await login(req.body);
    res.status(200).json(result);
  })
);
