import { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  console.error('Unexpected error:', err);
  res.status(500).json({
    success: false,
    error: config.nodeEnv === 'production' ? 'Internal server error' : err.message,
    ...(config.nodeEnv !== 'production' && { stack: err.stack }),
  });
}
