import { z } from 'zod';

// ========== Auth Validation ==========
export const loginSchema = z.object({
  username: z.string().min(3, '用户名至少3个字符').max(50),
  password: z.string()
    .min(8, '密码至少8个字符')
    .max(100)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, '密码须包含大写字母、小写字母和数字'),
});

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, '用户名至少3个字符')
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string()
    .min(8, '密码至少8个字符')
    .max(100)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, '密码须包含大写字母、小写字母和数字'),
});

// ========== Media Validation ==========
export const mediaCreateSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200),
  m3u8Url: z
    .string()
    .url('请输入有效的URL')
    .regex(/\.m3u8/, 'URL必须包含.m3u8'),
  posterUrl: z.string().url().optional().or(z.literal('')),
  description: z.string().max(5000).optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  rating: z.number().min(0).max(10).optional(),
  duration: z.number().int().min(0).optional(),
  categoryId: z.string().uuid().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
});

export const mediaUpdateSchema = mediaCreateSchema.partial();

export const mediaQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  tagId: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ERROR']).optional(),
  sortBy: z.enum(['title', 'createdAt', 'year', 'rating', 'views']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ========== Category Validation ==========
export const categoryCreateSchema = z.object({
  name: z.string().min(1, '分类名不能为空').max(50),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'slug只能包含小写字母、数字和连字符'),
  posterUrl: z.string().url().optional().or(z.literal('')),
});

export const categoryUpdateSchema = categoryCreateSchema.partial();

// ========== Tag Validation ==========
export const tagCreateSchema = z.object({
  name: z.string().min(1, '标签名不能为空').max(30),
});

// ========== Playlist Validation ==========
export const playlistCreateSchema = z.object({
  name: z.string().min(1, '播放列表名不能为空').max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
});

export const playlistUpdateSchema = playlistCreateSchema.partial();

// ========== Watch Progress Validation ==========
export const watchProgressSchema = z.object({
  mediaId: z.string().uuid(),
  progress: z.number().min(0),
  duration: z.number().min(0),
});

// ========== Import Validation ==========
export const importItemSchema = z.object({
  title: z.string().min(1),
  m3u8Url: z.string().url(),
  posterUrl: z.string().url().optional().or(z.literal('')),
  description: z.string().optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  categoryName: z.string().optional(),
  tagNames: z.array(z.string()).optional(),
});

// ========== System Settings Validation ==========
export const systemSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string(),
});

// ========== ID Param ==========
export const idParamSchema = z.object({
  id: z.string().uuid(),
});

// ========== Common Param/Body Schemas ==========
export const mediaIdParamSchema = z.object({
  mediaId: z.string().uuid(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateUserSchema = z.object({
  role: z.enum(['USER', 'ADMIN']).optional(),
  isActive: z.boolean().optional(),
}).refine(data => data.role !== undefined || data.isActive !== undefined, {
  message: 'At least one of role or isActive must be provided',
});

export const updateSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string(),
});

export const addItemBodySchema = z.object({
  mediaId: z.string().uuid(),
});

export const reorderBodySchema = z.object({
  itemIds: z.array(z.string().uuid()).min(1),
});
