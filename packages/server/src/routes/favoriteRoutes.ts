import { Router } from 'express';
import { favoriteController } from '../controllers/favoriteController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';

const mediaIdParamSchema = z.object({
  mediaId: z.string().uuid(),
});

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/:mediaId', validate(mediaIdParamSchema, 'params'), favoriteController.toggle);
router.get('/:mediaId/check', validate(mediaIdParamSchema, 'params'), favoriteController.check);
router.get('/', favoriteController.list);

export default router;
