import type { NextFunction, Request, Response } from 'express';
import { AppError } from './AppError.js';
import { verifyToken } from '../utils/jwt.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError(401, 'Missing or invalid authorization header');
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = verifyToken(token);
    req.userId = payload.sub;
    next();
  } catch {
    throw new AppError(401, 'Invalid or expired token');
  }
}
