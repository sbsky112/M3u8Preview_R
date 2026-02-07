import { config as dotenvConfig } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenvConfig({ path: path.resolve(__dirname, '../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';

// 生产环境强制校验 JWT 密钥配置
if (nodeEnv === 'production') {
  if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
    console.error('FATAL: JWT_SECRET and JWT_REFRESH_SECRET must be set in production environment');
    process.exit(1);
  }
}

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv,
  database: {
    url: process.env.DATABASE_URL || 'file:./data/m3u8preview.db',
  },
  jwt: {
    secret: process.env.JWT_SECRET || (nodeEnv === 'production' ? '' : 'dev-jwt-secret'),
    refreshSecret: process.env.JWT_REFRESH_SECRET || (nodeEnv === 'production' ? '' : 'dev-jwt-refresh-secret'),
    accessExpiresIn: '15m' as const,
    refreshExpiresIn: '7d' as const,
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
  bcrypt: {
    saltRounds: 12,
  },
};
