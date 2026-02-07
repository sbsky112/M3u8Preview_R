import { Router } from 'express';
import { watchHistoryController } from '../controllers/watchHistoryController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { watchProgressSchema, idParamSchema } from '@m3u8-preview/shared';
import { z } from 'zod';

const mediaIdParamSchema = z.object({
  mediaId: z.string().uuid(),
});

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/progress', validate(watchProgressSchema), watchHistoryController.updateProgress);
router.get('/', watchHistoryController.getHistory);
router.get('/continue', watchHistoryController.getContinueWatching);
router.get('/progress-map', watchHistoryController.getProgressMap);
router.get('/:mediaId', validate(mediaIdParamSchema, 'params'), watchHistoryController.getProgress);
router.delete('/clear', watchHistoryController.clearHistory);
router.delete('/:id', validate(idParamSchema, 'params'), watchHistoryController.deleteHistory);

export default router;
