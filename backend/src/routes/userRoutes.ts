import { Router } from 'express';
import { getMyProfile } from '../controllers/userController';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/me/profile', requireAuth, asyncHandler(getMyProfile));

export default router;
