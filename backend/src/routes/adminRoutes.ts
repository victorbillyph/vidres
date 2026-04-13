import { Router } from 'express';
import { adminDeleteVideo, adminDismissReport, getDashboard } from '../controllers/adminController';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(requireAuth, requireRole('superadmin'));
router.get('/dashboard', asyncHandler(getDashboard));
router.delete('/videos/:videoId', asyncHandler(adminDeleteVideo));
router.delete('/reports/:reportId', asyncHandler(adminDismissReport));

export default router;
