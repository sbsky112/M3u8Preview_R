import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import tagRoutes from './routes/tagRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import playlistRoutes from './routes/playlistRoutes.js';
import importRoutes from './routes/importRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, '../../uploads');

const app = express();

// Rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later' },
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// H5: 使用绝对路径提供静态文件
app.use('/uploads', express.static(uploadsDir));

// API routes
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/media', mediaRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/tags', tagRoutes);
app.use('/api/v1/history', historyRoutes);
app.use('/api/v1/favorites', favoriteRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/playlists', playlistRoutes);
app.use('/api/v1/import', importRoutes);
app.use('/api/v1/admin', adminRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
