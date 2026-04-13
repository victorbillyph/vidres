import { Router } from 'express';
import authRoutes from './authRoutes';
import setupRoutes from './setupRoutes';
import userRoutes from './userRoutes';
import channelRoutes from './channelRoutes';
import videoRoutes from './videoRoutes';
import commentRoutes from './commentRoutes';
import reportRoutes from './reportRoutes';
import adminRoutes from './adminRoutes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'Vidres API' });
});

router.use('/setup', setupRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/channels', channelRoutes);
router.use('/videos', videoRoutes);
router.use('/comments', commentRoutes);
router.use('/reports', reportRoutes);
router.use('/admin', adminRoutes);

export default router;

