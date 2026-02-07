import { Request, Response, NextFunction } from 'express';
import { tagService } from '../services/tagService.js';

type Params = { id: string };

export const tagController = {
  async findAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const tags = await tagService.findAll();
      res.json({ success: true, data: tags });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request<Params>, res: Response, next: NextFunction) {
    try {
      const tag = await tagService.findById(req.params.id);
      res.json({ success: true, data: tag });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const tag = await tagService.create(req.body);
      res.status(201).json({ success: true, data: tag });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request<Params>, res: Response, next: NextFunction) {
    try {
      const tag = await tagService.update(req.params.id, req.body);
      res.json({ success: true, data: tag });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request<Params>, res: Response, next: NextFunction) {
    try {
      await tagService.delete(req.params.id);
      res.json({ success: true, message: 'Tag deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};
