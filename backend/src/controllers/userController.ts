import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';
import { getChannelByUserId } from '../services/channelService';
import { getVideosByChannel } from '../services/videoService';
import { toSessionUser } from '../services/authService';
import { HttpError } from '../utils/http';

export async function getMyProfile(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required.');
  }

  const channel = await getChannelByUserId(req.user.id);
  const uploads = channel ? await getVideosByChannel(channel.id, req.user.id) : [];

  res.json({
    user: toSessionUser(req.user),
    channel: channel ?? null,
    uploads,
  });
}
