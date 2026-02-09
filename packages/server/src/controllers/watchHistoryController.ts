import { Request, Response } from 'express';
import { watchHistoryService } from '../services/watchHistoryService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { safePagination } from '../utils/pagination.js';

type MediaIdParams = { mediaId: string };
type IdParams = { id: string };

export const watchHistoryController = {
  updateProgress: asyncHandler(async (req: Request, res: Response) => {
    const { mediaId, progress, duration } = req.body;
    const history = await watchHistoryService.updateProgress(
      req.user!.userId,
      mediaId,
      progress,
      duration,
    );
    res.json({ success: true, data: history });
  }),

  getHistory: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = safePagination(
      parseInt(req.query.page as string) || 1,
      parseInt(req.query.limit as string) || 20,
    );
    const result = await watchHistoryService.getHistory(req.user!.userId, page, limit);
    res.json({ success: true, data: result });
  }),

  getContinueWatching: asyncHandler(async (req: Request, res: Response) => {
    const { limit } = safePagination(1, parseInt(req.query.limit as string) || 10);
    const items = await watchHistoryService.getContinueWatching(req.user!.userId, limit);
    res.json({ success: true, data: items });
  }),

  getProgress: asyncHandler(async (req: Request<MediaIdParams>, res: Response) => {
    const progress = await watchHistoryService.getProgress(req.user!.userId, req.params.mediaId);
    res.json({ success: true, data: progress });
  }),

  deleteHistory: asyncHandler(async (req: Request<IdParams>, res: Response) => {
    await watchHistoryService.deleteHistory(req.user!.userId, req.params.id);
    res.json({ success: true, message: 'History deleted successfully' });
  }),

  clearHistory: asyncHandler(async (req: Request, res: Response) => {
    await watchHistoryService.clearHistory(req.user!.userId);
    res.json({ success: true, message: 'History cleared successfully' });
  }),

  getProgressMap: asyncHandler(async (req: Request, res: Response) => {
    const map = await watchHistoryService.getProgressMap(req.user!.userId);
    res.json({ success: true, data: map });
  }),
};
