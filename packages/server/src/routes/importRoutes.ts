import { Router } from 'express';
import { importController, importUpload } from '../controllers/importController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Public route - download templates
router.get('/template/:format', importController.getTemplates);

// Admin routes
router.post('/preview', authenticate, requireRole('ADMIN'), importUpload, importController.preview);
router.post('/execute', authenticate, requireRole('ADMIN'), importController.execute);
router.get('/logs', authenticate, requireRole('ADMIN'), importController.getLogs);

export default router;
