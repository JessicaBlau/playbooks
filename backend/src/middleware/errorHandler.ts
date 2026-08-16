import type { NextFunction, Request, Response } from 'express';
import { AppError } from './AppError.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // express.json() throws a SyntaxError (status 400) for unparseable JSON bodies.
  const maybeBodyParserError = err as { type?: string; status?: number };
  if (maybeBodyParserError.type === 'entity.parse.failed' || maybeBodyParserError.status === 400) {
    res.status(400).json({ error: 'Malformed JSON body' });
    return;
  }

  console.error('Unexpected error:', err);
  res.status(500).json({ error: 'Internal server error' });
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
