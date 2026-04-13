import { Router } from 'express';
import { createChannel, getChannel, getMyChannel, updateChannel } from '../controllers/channelController';
import { requireAuth } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/me', requireAuth, asyncHandler(getMyChannel));
router.post('/', requireAuth, upload.fields([{ name: 'image', maxCount: 1 }]), asyncHandler(createChannel));
router.put('/me', requireAuth, upload.fields([{ name: 'image', maxCount: 1 }]), asyncHandler(updateChannel));
router.get('/:channelId', asyncHandler(getChannel));

export default router;
