import { Request, Response, NextFunction } from 'express';
import { upload, uploadService } from '../services/uploadService.js';
import { AppError } from '../middleware/errorHandler.js';

export const uploadMiddleware = upload.single('poster');

export const uploadController = {
  async uploadPoster(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }
      const url = uploadService.getUploadUrl(req.file.filename);
      res.status(201).json({ success: true, data: { url } });
    } catch (error) {
      next(error);
    }
  },
};
