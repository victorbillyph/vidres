import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';
import { dismissReport, getReportViews } from '../services/reportService';
import { deleteVideoById, getRecommendedFeed } from '../services/videoService';
import { readCollection } from '../services/dbService';
import { toSessionUser } from '../services/authService';
import { HttpError } from '../utils/http';

export async function getDashboard(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required.');
  }

  const [users, channels, videos, reports] = await Promise.all([
    readCollection('users'),
    readCollection('channels'),
    getRecommendedFeed(req.user.id),
    getReportViews(),
  ]);

  res.json({
    stats: {
      users: users.length,
      channels: channels.length,
      videos: videos.length,
      reports: reports.length,
    },
    users: users.map(toSessionUser),
    channels: channels.map((channel) => {
      const owner = users.find((user) => user.id === channel.userId);
      return {
        ...channel,
        owner: owner ? toSessionUser(owner) : null,
      };
    }),
    videos,
    reports,
  });
}

export async function adminDeleteVideo(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required.');
  }

  await deleteVideoById(String(req.params.videoId), req.user);
  res.json({ message: 'Video removed by superadmin.' });
}

export async function adminDismissReport(req: AuthenticatedRequest, res: Response) {
  await dismissReport(String(req.params.reportId));
  res.json({ message: 'Report dismissed successfully.' });
}
