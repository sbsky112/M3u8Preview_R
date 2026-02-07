import { Router } from 'express';
import { uploadController, uploadMiddleware } from '../controllers/uploadController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Admin routes
router.post('/poster', authenticate, requireRole('ADMIN'), uploadMiddleware, uploadController.uploadPoster);

export default router;
