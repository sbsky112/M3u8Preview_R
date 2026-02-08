import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { idParamSchema, updateUserSchema, updateSettingSchema } from '@m3u8-preview/shared';

const router = Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate, requireRole('ADMIN'));

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// User management
router.get('/users', adminController.getUsers);
router.put('/users/:id', validate(idParamSchema, 'params'), validate(updateUserSchema), adminController.updateUser);
router.delete('/users/:id', validate(idParamSchema, 'params'), adminController.deleteUser);

// System settings
router.get('/settings', adminController.getSettings);
router.put('/settings', validate(updateSettingSchema), adminController.updateSetting);

// Media management (admin view with additional filters)
router.get('/media', adminController.getMedia);

export default router;
