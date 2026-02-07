import { Router } from 'express';
import { tagController } from '../controllers/tagController.js';
import { validate } from '../middleware/validate.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { tagCreateSchema, idParamSchema } from '@m3u8-preview/shared';

const router = Router();

// Public routes
router.get('/', tagController.findAll);
router.get('/:id', validate(idParamSchema, 'params'), tagController.findById);

// Admin routes
router.post('/', authenticate, requireRole('ADMIN'), validate(tagCreateSchema), tagController.create);
router.put('/:id', authenticate, requireRole('ADMIN'), validate(idParamSchema, 'params'), validate(tagCreateSchema), tagController.update);
router.delete('/:id', authenticate, requireRole('ADMIN'), validate(idParamSchema, 'params'), tagController.delete);

export default router;
