import { Router } from 'express';
import { createComment, destroyComment, getVideoComments } from '../controllers/commentController';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/video/:videoId', asyncHandler(getVideoComments));
router.post('/', requireAuth, asyncHandler(createComment));
router.delete('/:commentId', requireAuth, asyncHandler(destroyComment));

export default router;
