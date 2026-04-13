import type { Response } from 'express';
import type { ReportReason } from '../types';
import type { AuthenticatedRequest } from '../middleware/auth';
import { createVideoReport } from '../services/reportService';
import { HttpError } from '../utils/http';

export async function reportVideo(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required.');
  }

  const { videoId, reason, notes } = req.body as {
    videoId?: string;
    reason?: ReportReason;
    notes?: string;
  };

  if (!videoId || !reason) {
    throw new HttpError(400, 'Video and reason are required.');
  }

  const report = await createVideoReport(req.user, { videoId, reason, notes });
  res.status(201).json({
    message: 'Report sent successfully.',
    report,
  });
}
