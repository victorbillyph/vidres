import { Router } from 'express';
import {
  destroyVideo,
  getFeed,
  getShorts,
  getVideo,
  react,
  registerView,
  uploadVideo,
} from '../controllers/videoController';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/feed', optionalAuth, asyncHandler(getFeed));
router.get('/shorts', optionalAuth, asyncHandler(getShorts));
router.get('/:videoId', optionalAuth, asyncHandler(getVideo));
router.post(
  '/',
  requireAuth,
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  asyncHandler(uploadVideo),
);
router.post('/:videoId/reactions', requireAuth, asyncHandler(react));
router.post('/:videoId/view', optionalAuth, asyncHandler(registerView));
router.delete('/:videoId', requireAuth, asyncHandler(destroyVideo));

export default router;
