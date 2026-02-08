import { Request, Response, NextFunction } from 'express';
import { mediaService } from '../services/mediaService.js';

type Params = { id: string };

export const mediaController = {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await mediaService.findAll(req.query as any);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request<Params>, res: Response, next: NextFunction) {
    try {
      const media = await mediaService.findById(req.params.id);
      res.json({ success: true, data: media });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const media = await mediaService.create(req.body);
      res.status(201).json({ success: true, data: media });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request<Params>, res: Response, next: NextFunction) {
    try {
      const media = await mediaService.update(req.params.id, req.body);
      res.json({ success: true, data: media });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request<Params>, res: Response, next: NextFunction) {
    try {
      await mediaService.delete(req.params.id);
      res.json({ success: true, message: 'Media deleted successfully' });
    } catch (error) {
      next(error);
    }
  },

  async incrementViews(req: Request<Params>, res: Response, next: NextFunction) {
    try {
      await mediaService.incrementViews(req.params.id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  async getRandom(req: Request, res: Response, next: NextFunction) {
    try {
      const count = Math.min(parseInt(req.query.count as string) || 10, 50);
      const items = await mediaService.getRandom(count);
      res.json({ success: true, data: items });
    } catch (error) {
      next(error);
    }
  },

  async getRecent(req: Request, res: Response, next: NextFunction) {
    try {
      const count = Math.min(parseInt(req.query.count as string) || 10, 50);
      const items = await mediaService.getRecent(count);
      res.json({ success: true, data: items });
    } catch (error) {
      next(error);
    }
  },
};
