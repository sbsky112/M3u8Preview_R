import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { parseText, parseCsv, parseJson, parseExcel } from '../parsers/index.js';
import { importService } from '../services/importService.js';
import { AppError } from '../middleware/errorHandler.js';
import { prisma } from '../lib/prisma.js';

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

function detectFormatAndParse(file?: Express.Multer.File, body?: any): { items: any[]; format: string; fileName?: string } {
  // If file is provided, parse based on file extension
  if (file) {
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    const fileName = file.originalname;

    switch (ext) {
      case 'csv':
        return { items: parseCsv(file.buffer.toString('utf-8')), format: 'CSV', fileName };
      case 'xlsx':
        return { items: parseExcel(file.buffer), format: 'EXCEL', fileName };
      case 'json':
        return { items: parseJson(file.buffer.toString('utf-8')), format: 'JSON', fileName };
      case 'txt':
        return { items: parseText(file.buffer.toString('utf-8')), format: 'TEXT', fileName };
      default:
        throw new AppError(`Unsupported file format: ${ext}`, 400);
    }
  }

  // If no file, parse from body content
  if (body?.content) {
    const format = body.format?.toUpperCase() || 'TEXT';
    switch (format) {
      case 'TEXT':
        return { items: parseText(body.content), format: 'TEXT' };
      case 'CSV':
        return { items: parseCsv(body.content), format: 'CSV' };
      case 'JSON':
        return { items: parseJson(body.content), format: 'JSON' };
      default:
        return { items: parseText(body.content), format: 'TEXT' };
    }
  }

  throw new AppError('No file or content provided', 400);
}

export const importController = {
  async preview(req: Request, res: Response, next: NextFunction) {
    try {
      const { items, format, fileName } = detectFormatAndParse(req.file, req.body);
      const preview = importService.preview(items);

      // Attach format and fileName for potential execute call
      res.json({
        success: true,
        data: {
          ...preview,
          format,
          fileName,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async execute(req: Request, res: Response, next: NextFunction) {
    try {
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
    } catch (error) {
      next(error);
    }
  },

  async getTemplates(req: Request, res: Response, next: NextFunction) {
    try {
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
    } catch (error) {
      next(error);
    }
  },

  async getLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await prisma.importLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      const serialized = logs.map(log => ({
        ...log,
        createdAt: log.createdAt instanceof Date ? log.createdAt.toISOString() : log.createdAt,
      }));

      res.json({ success: true, data: serialized });
    } catch (error) {
      next(error);
    }
  },
};
