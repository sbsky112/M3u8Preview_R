import { Router } from 'express';
import { categoryController } from '../controllers/categoryController.js';
import { validate } from '../middleware/validate.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { categoryCreateSchema, categoryUpdateSchema, idParamSchema } from '@m3u8-preview/shared';

const router = Router();

// Public routes
router.get('/', categoryController.findAll);
router.get('/:id', validate(idParamSchema, 'params'), categoryController.findById);

// Admin routes
router.post('/', authenticate, requireRole('ADMIN'), validate(categoryCreateSchema), categoryController.create);
router.put('/:id', authenticate, requireRole('ADMIN'), validate(idParamSchema, 'params'), validate(categoryUpdateSchema), categoryController.update);
router.delete('/:id', authenticate, requireRole('ADMIN'), validate(idParamSchema, 'params'), categoryController.delete);

export default router;
