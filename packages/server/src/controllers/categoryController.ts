import { Request, Response, NextFunction } from 'express';
import { categoryService } from '../services/categoryService.js';

type Params = { id: string };

export const categoryController = {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, sortBy, sortOrder } = req.query;
      const categories = await categoryService.findAll({
        search: search as string,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
      });
      res.json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request<Params>, res: Response, next: NextFunction) {
    try {
      const category = await categoryService.findById(req.params.id);
      res.json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await categoryService.create(req.body);
      res.status(201).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request<Params>, res: Response, next: NextFunction) {
    try {
      const category = await categoryService.update(req.params.id, req.body);
      res.json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request<Params>, res: Response, next: NextFunction) {
    try {
      await categoryService.delete(req.params.id);
      res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};
