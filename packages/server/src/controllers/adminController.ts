import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { adminService } from '../services/adminService.js';

type Params = { id: string };

// S4: Zod schema 限制 role 只允许合法值
const updateUserSchema = z.object({
  role: z.enum(['USER', 'ADMIN']).optional(),
  isActive: z.boolean().optional(),
}).refine(data => data.role !== undefined || data.isActive !== undefined, {
  message: 'At least one of role or isActive must be provided',
});

// M12: Zod schema 验证系统设置
const updateSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string(),
});

export const adminController = {
  /**
   * GET /admin/dashboard - Get dashboard statistics
   */
  async getDashboard(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /admin/users - Get paginated user list
   */
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string | undefined;
      const result = await adminService.getAllUsers(page, limit, search);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /admin/users/:id - Update user role or active status
   */
  async updateUser(req: Request<Params>, res: Response, next: NextFunction) {
    try {
      const parsed = updateUserSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: parsed.error.errors.map(e => e.message).join(', ') });
        return;
      }
      const { role, isActive } = parsed.data;
      const user = await adminService.updateUser(req.params.id, { role, isActive });
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /admin/users/:id - Delete a user
   */
  async deleteUser(req: Request<Params>, res: Response, next: NextFunction) {
    try {
      await adminService.deleteUser(req.params.id);
      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /admin/settings - Get all system settings
   */
  async getSettings(_req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await adminService.getSystemSettings();
      res.json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /admin/settings - Update a system setting
   */
  async updateSetting(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = updateSettingSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: parsed.error.errors.map(e => e.message).join(', ') });
        return;
      }
      const { key, value } = parsed.data;
      const setting = await adminService.updateSystemSetting(key, value);
      res.json({ success: true, data: setting });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /admin/media - Get paginated media list with admin filters
   */
  async getMedia(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const result = await adminService.getAllMedia(page, limit, search, status);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
