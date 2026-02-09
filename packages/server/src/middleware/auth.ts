import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { AppError } from './errorHandler.js';
import type { TokenPayload } from '@m3u8-preview/shared';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      throw new AppError('Authentication required', 401);
    }

    const decoded = jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] });
    if (typeof decoded !== 'object' || decoded === null || !('userId' in decoded) || !('role' in decoded)) {
      throw new AppError('Invalid token payload', 401);
    }
    req.user = decoded as TokenPayload;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError('Invalid or expired token', 401));
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] });
      if (typeof decoded !== 'object' || decoded === null || !('userId' in decoded) || !('role' in decoded)) {
        throw new AppError('Invalid token payload', 401);
      }
      req.user = decoded as TokenPayload;
    }
    next();
  } catch {
    // Token invalid, but this is optional auth, so continue without user
    next();
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
}
