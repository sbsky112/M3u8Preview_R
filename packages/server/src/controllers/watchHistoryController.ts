import { Request, Response, NextFunction } from 'express';
import { watchHistoryService } from '../services/watchHistoryService.js';
import { AppError } from '../middleware/errorHandler.js';

type MediaIdParams = { mediaId: string };
type IdParams = { id: string };

export const watchHistoryController = {
  async updateProgress(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }
      const { mediaId, progress, duration } = req.body;
      const history = await watchHistoryService.updateProgress(
        req.user.userId,
        mediaId,
        progress,
        duration,
      );
      res.json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  },

  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await watchHistoryService.getHistory(req.user.userId, page, limit);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getContinueWatching(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }
      const limit = parseInt(req.query.limit as string) || 10;
      const items = await watchHistoryService.getContinueWatching(req.user.userId, limit);
      res.json({ success: true, data: items });
    } catch (error) {
      next(error);
    }
  },

  async getProgress(req: Request<MediaIdParams>, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }
      const progress = await watchHistoryService.getProgress(req.user.userId, req.params.mediaId);
      res.json({ success: true, data: progress });
    } catch (error) {
      next(error);
    }
  },

  async deleteHistory(req: Request<IdParams>, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }
      await watchHistoryService.deleteHistory(req.user.userId, req.params.id);
      res.json({ success: true, message: 'History deleted successfully' });
    } catch (error) {
      next(error);
    }
  },

  async clearHistory(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }
      await watchHistoryService.clearHistory(req.user.userId);
      res.json({ success: true, message: 'History cleared successfully' });
    } catch (error) {
      next(error);
    }
  },

  async getProgressMap(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }
      const map = await watchHistoryService.getProgressMap(req.user.userId);
      res.json({ success: true, data: map });
    } catch (error) {
      next(error);
    }
  },
};
