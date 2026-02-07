import { Router } from 'express';
import { mediaController } from '../controllers/mediaController.js';
import { validate } from '../middleware/validate.js';
import { authenticate, optionalAuth, requireRole } from '../middleware/auth.js';
import { mediaCreateSchema, mediaUpdateSchema, mediaQuerySchema, idParamSchema } from '@m3u8-preview/shared';

const router = Router();

// Public routes (with optional auth for user-specific data)
router.get('/', validate(mediaQuerySchema, 'query'), mediaController.findAll);
router.get('/recent', mediaController.getRecent);
router.get('/random', mediaController.getRandom);
router.get('/:id', validate(idParamSchema, 'params'), mediaController.findById);

// Authenticated routes
router.post('/:id/views', validate(idParamSchema, 'params'), mediaController.incrementViews);

// Admin routes
router.post('/', authenticate, requireRole('ADMIN'), validate(mediaCreateSchema), mediaController.create);
router.put('/:id', authenticate, requireRole('ADMIN'), validate(idParamSchema, 'params'), validate(mediaUpdateSchema), mediaController.update);
router.delete('/:id', authenticate, requireRole('ADMIN'), validate(idParamSchema, 'params'), mediaController.delete);

export default router;
