import type { Response } from 'express';
import type { ReactionType, VideoType } from '../types';
import type { AuthenticatedRequest } from '../middleware/auth';
import {
  createVideoRecord,
  deleteVideoById,
  getRecommendedFeed,
  getShortFeed,
  getVideoWithRelated,
  prepareVideoAssets,
  reactToVideo,
  registerVideoView,
} from '../services/videoService';
import { HttpError } from '../utils/http';

export async function getFeed(req: AuthenticatedRequest, res: Response) {
  const videos = await getRecommendedFeed(req.user?.id);
  res.json({ videos });
}

export async function getShorts(req: AuthenticatedRequest, res: Response) {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 5);
  const payload = await getShortFeed(req.user?.id, page, limit);
  res.json(payload);
}

export async function getVideo(req: AuthenticatedRequest, res: Response) {
  const payload = await getVideoWithRelated(String(req.params.videoId), req.user?.id);
  res.json(payload);
}

export async function uploadVideo(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required.');
  }

  const { title, description, type } = req.body as {
    title?: string;
    description?: string;
    type?: VideoType;
  };

  if (!title || !description || !type) {
    throw new HttpError(400, 'Title, description and type are required.');
  }

  const files = req.files as { video?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] } | undefined;
  const videoFile = files?.video?.[0];
  const thumbnailFile = files?.thumbnail?.[0];

  if (!videoFile) {
    throw new HttpError(400, 'A video file is required.');
  }

  const assets = await prepareVideoAssets({ videoFile, thumbnailFile });
  const video = await createVideoRecord(req.user, {
    title,
    description,
    type,
    videoUrl: assets.videoUrl,
    thumbnailUrl: assets.thumbnailUrl,
  });

  res.status(201).json({
    message: 'Video uploaded successfully.',
    video,
  });
}

export async function react(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required.');
  }

  const reactionType = req.body.type as ReactionType | undefined;
  if (!reactionType || !['like', 'dislike', 'none'].includes(reactionType)) {
    throw new HttpError(400, 'Invalid reaction type.');
  }

  const video = await reactToVideo(String(req.params.videoId), req.user, reactionType);
  res.json({ video });
}

export async function registerView(req: AuthenticatedRequest, res: Response) {
  const views = await registerVideoView(String(req.params.videoId), req.user?.id);
  res.json({ views });
}

export async function destroyVideo(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required.');
  }

  await deleteVideoById(String(req.params.videoId), req.user);
  res.json({ message: 'Video deleted successfully.' });
}
