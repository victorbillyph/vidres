import { Router } from 'express';
import { completeSetup, getSetupStatus } from '../controllers/setupController';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/status', asyncHandler(getSetupStatus));
router.post('/superadmin', asyncHandler(completeSetup));

export default router;
