import { Router } from 'express';
import { reportVideo } from '../controllers/reportController';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/', requireAuth, asyncHandler(reportVideo));

export default router;
