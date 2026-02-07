import { Router } from 'express';
import { playlistController } from '../controllers/playlistController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { playlistCreateSchema, playlistUpdateSchema, idParamSchema } from '@m3u8-preview/shared';
import { z } from 'zod';

const router = Router();

const mediaIdParamSchema = z.object({
  id: z.string().uuid(),
  mediaId: z.string().uuid(),
});

// M12: 添加 addItem body 和 reorder body 的 Zod 验证
const addItemBodySchema = z.object({
  mediaId: z.string().uuid(),
});

const reorderBodySchema = z.object({
  itemIds: z.array(z.string().uuid()).min(1),
});

// Public route
router.get('/public', playlistController.getPublicPlaylists);

// All other routes require authentication
router.get('/', authenticate, playlistController.findAll);
router.get('/:id', authenticate, validate(idParamSchema, 'params'), playlistController.findById);
router.post('/', authenticate, validate(playlistCreateSchema), playlistController.create);
router.put('/:id', authenticate, validate(idParamSchema, 'params'), validate(playlistUpdateSchema), playlistController.update);
router.delete('/:id', authenticate, validate(idParamSchema, 'params'), playlistController.delete);
router.post('/:id/items', authenticate, validate(z.object({ id: z.string().uuid() }), 'params'), validate(addItemBodySchema), playlistController.addItem);
router.delete('/:id/items/:mediaId', authenticate, validate(mediaIdParamSchema, 'params'), playlistController.removeItem);
router.put('/:id/reorder', authenticate, validate(z.object({ id: z.string().uuid() }), 'params'), validate(reorderBodySchema), playlistController.reorderItems);

export default router;
