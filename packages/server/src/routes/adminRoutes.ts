import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate, requireRole('ADMIN'));

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// User management
router.get('/users', adminController.getUsers);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// System settings
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSetting);

// Media management (admin view with additional filters)
router.get('/media', adminController.getMedia);

export default router;
