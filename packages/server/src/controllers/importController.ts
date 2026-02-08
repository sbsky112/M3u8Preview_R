import { Request, Response } from 'express';
import multer from 'multer';
import { importService } from '../services/importService.js';
import { AppError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Configure multer for import file uploads (memory storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = ['.csv', '.xlsx', '.json', '.txt'];
    const ext = '.' + file.originalname.split('.').pop()?.toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new AppError('Unsupported file format. Allowed: csv, xlsx, json, txt', 400) as any);
    }
  },
});

export const importUpload = upload.single('file');

export const importController = {
  preview: asyncHandler(async (req: Request, res: Response) => {
    const { items, format, fileName } = importService.detectFormatAndParse(req.file, req.body);
    const preview = importService.preview(items);

    res.json({
      success: true,
      data: {
        ...preview,
        format,
        fileName,
      },
    });
  }),

  execute: asyncHandler(async (req: Request, res: Response) => {
    const { items, format, fileName } = req.body;
    if (!items || !Array.isArray(items)) {
      throw new AppError('Items array is required', 400);
    }
    // H7: 限制单次导入数据量，防止 DoS
    if (items.length > 1000) {
      throw new AppError('Maximum 1000 items per import', 400);
    }

    const result = await importService.execute(
      req.user!.userId,
      items,
      format || 'TEXT',
      fileName,
    );
    res.json({ success: true, data: result });
  }),

  getTemplates: asyncHandler(async (req: Request, res: Response) => {
    const { format } = req.params;

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="import-template.csv"');
      // Add BOM for Excel UTF-8 compatibility
      res.send('\ufeff' + importService.generateCsvTemplate());
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="import-template.json"');
      res.send(importService.generateJsonTemplate());
    } else {
      throw new AppError('Unsupported template format. Use csv or json.', 400);
    }
  }),

  getLogs: asyncHandler(async (_req: Request, res: Response) => {
    const serialized = await importService.getLogs();
    res.json({ success: true, data: serialized });
  }),
};
