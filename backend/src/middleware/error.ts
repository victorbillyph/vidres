import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/http';

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof HttpError) {
    res.status(error.status).json({ message: error.message });
    return;
  }

  res.status(500).json({
    message: error.message || 'Unexpected server error.',
  });
}
