import { Request, Response, NextFunction } from 'express';
import { favoriteService } from '../services/favoriteService.js';
import { AppError } from '../middleware/errorHandler.js';

type MediaIdParams = { mediaId: string };

export const favoriteController = {
  async toggle(req: Request<MediaIdParams>, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }
      const result = await favoriteService.toggle(req.user.userId, req.params.mediaId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async check(req: Request<MediaIdParams>, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }
      const isFavorited = await favoriteService.isFavorited(req.user.userId, req.params.mediaId);
      res.json({ success: true, data: { isFavorited } });
    } catch (error) {
      next(error);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await favoriteService.getFavorites(req.user.userId, page, limit);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
