import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { AppError } from '../middleware/errorHandler.js';

// H5: 使用绝对路径，避免依赖 CWD
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, '../../../uploads');

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, uploadsDir);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) {
  if (!file.mimetype.startsWith('image/')) {
    cb(new AppError('Only image files are allowed', 400));
    return;
  }
  if (!config.upload.allowedMimeTypes.includes(file.mimetype)) {
    cb(new AppError(`File type ${file.mimetype} is not allowed`, 400));
    return;
  }
  cb(null, true);
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
});

export const uploadService = {
  getUploadUrl(filename: string): string {
    return `/uploads/${filename}`;
  },
};
