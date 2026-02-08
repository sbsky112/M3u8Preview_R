import { Request, Response } from 'express';
import { adminService } from '../services/adminService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

type Params = { id: string };

export const adminController = {
  /**
   * GET /admin/dashboard - Get dashboard statistics
   */
  getDashboard: asyncHandler(async (_req: Request, res: Response) => {
    const stats = await adminService.getDashboardStats();
    res.json({ success: true, data: stats });
  }),

  /**
   * GET /admin/users - Get paginated user list
   */
  getUsers: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string | undefined;
    const result = await adminService.getAllUsers(page, limit, search);
    res.json({ success: true, data: result });
  }),

  /**
   * PUT /admin/users/:id - Update user role or active status
   * 参数验证已由路由层 validate 中间件处理
   */
  updateUser: asyncHandler(async (req: Request<Params>, res: Response) => {
    const { role, isActive } = req.body;
    const user = await adminService.updateUser(req.params.id, { role, isActive });
    res.json({ success: true, data: user });
  }),

  /**
   * DELETE /admin/users/:id - Delete a user
   */
  deleteUser: asyncHandler(async (req: Request<Params>, res: Response) => {
    await adminService.deleteUser(req.params.id);
    res.json({ success: true, message: 'User deleted successfully' });
  }),

  /**
   * GET /admin/settings - Get all system settings
   */
  getSettings: asyncHandler(async (_req: Request, res: Response) => {
    const settings = await adminService.getSystemSettings();
    res.json({ success: true, data: settings });
  }),

  /**
   * PUT /admin/settings - Update a system setting
   * 参数验证已由路由层 validate 中间件处理
   */
  updateSetting: asyncHandler(async (req: Request, res: Response) => {
    const { key, value } = req.body;
    const setting = await adminService.updateSystemSetting(key, value);
    res.json({ success: true, data: setting });
  }),

  /**
   * GET /admin/media - Get paginated media list with admin filters
   */
  getMedia: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const result = await adminService.getAllMedia(page, limit, search, status);
    res.json({ success: true, data: result });
  }),
};
