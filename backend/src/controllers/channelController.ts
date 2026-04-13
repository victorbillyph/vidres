import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';
import {
  createChannelForUser,
  getChannelById,
  getChannelByUserId,
  saveChannelImage,
  updateUserChannel,
} from '../services/channelService';
import { findUserById, toAuthorProfile } from '../services/authService';
import { getVideosByChannel } from '../services/videoService';
import { HttpError } from '../utils/http';

export async function getMyChannel(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required.');
  }

  const channel = await getChannelByUserId(req.user.id);
  res.json({ channel: channel ?? null });
}

export async function createChannel(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required.');
  }

  const { name, description } = req.body as {
    name?: string;
    description?: string;
  };

  if (!name || !description) {
    throw new HttpError(400, 'Name and description are required.');
  }

  const imageFile = (req.files as { image?: Express.Multer.File[] } | undefined)?.image?.[0];
  const imageUrl = await saveChannelImage(imageFile);
  const channel = await createChannelForUser(req.user, { name, description, imageUrl });

  res.status(201).json({
    message: 'Channel created successfully.',
    channel,
  });
}

export async function updateChannel(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required.');
  }

  const { name, description } = req.body as {
    name?: string;
    description?: string;
  };

  if (!name || !description) {
    throw new HttpError(400, 'Name and description are required.');
  }

  const imageFile = (req.files as { image?: Express.Multer.File[] } | undefined)?.image?.[0];
  const imageUrl = imageFile ? await saveChannelImage(imageFile) : undefined;
  const channel = await updateUserChannel(req.user, { name, description, imageUrl });

  res.json({
    message: 'Channel updated successfully.',
    channel,
  });
}

export async function getChannel(req: AuthenticatedRequest, res: Response) {
  const channel = await getChannelById(String(req.params.channelId));

  if (!channel) {
    throw new HttpError(404, 'Channel not found.');
  }

  const owner = await findUserById(channel.userId);

  if (!owner) {
    throw new HttpError(500, 'Channel owner data is inconsistent.');
  }

  const videos = await getVideosByChannel(channel.id, req.user?.id);

  res.json({
    channel: {
      ...channel,
      owner: toAuthorProfile(owner),
    },
    videos,
  });
}
