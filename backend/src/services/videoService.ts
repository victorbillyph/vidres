import fs from 'fs/promises';
import path from 'path';
import type { DatabaseSchema, ReactionType, User, Video, VideoSummary, VideoType } from '../types';
import { uploadPaths } from '../config';
import { readCollection, readDatabase, withDatabaseLock, writeCollection } from './dbService';
import { HttpError } from '../utils/http';
import { generateId } from '../utils/id';
import { compressVideo } from '../utils/media';
import { moveUploadedFile, safeDeletePublicFile, toPublicPath } from '../utils/files';
import { toAuthorProfile } from './authService';

function getCurrentReaction(video: Video, userId?: string): ReactionType {
  if (!userId) {
    return 'none';
  }

  return video.reactions[userId] ?? 'none';
}

function getInteractedChannels(database: DatabaseSchema, userId?: string): Set<string> {
  if (!userId) {
    return new Set<string>();
  }

  const commentVideoIds = new Set(
    database.comments.filter((comment) => comment.userId === userId).map((comment) => comment.videoId),
  );

  const channels = new Set<string>();

  database.videos.forEach((video) => {
    if (video.reactions[userId] || video.viewUserIds.includes(userId) || commentVideoIds.has(video.id)) {
      channels.add(video.channelId);
    }
  });

  return channels;
}

function scoreVideo(video: Video, interactedChannels: Set<string>): number {
  const ageInHours = (Date.now() - Date.parse(video.createdAt)) / (1000 * 60 * 60);
  const freshnessScore = Math.max(0, 168 - ageInHours) * 1.4;
  const engagementScore = video.views * 1.2 + video.likes * 18 - video.dislikes * 6;
  const affinityScore = interactedChannels.has(video.channelId) ? 120 : 0;
  const diversitySeed = (video.title.length + video.id.length * 7) % 19;

  return engagementScore + freshnessScore + affinityScore + diversitySeed;
}

function mapVideoSummary(database: DatabaseSchema, video: Video, currentUserId?: string): VideoSummary | null {
  const channel = database.channels.find((item) => item.id === video.channelId);
  const owner = database.users.find((item) => item.id === video.userId);

  if (!channel || !owner) {
    return null;
  }

  return {
    id: video.id,
    userId: video.userId,
    channelId: video.channelId,
    title: video.title,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl,
    videoUrl: video.videoUrl,
    type: video.type,
    likes: video.likes,
    dislikes: video.dislikes,
    views: video.views,
    createdAt: video.createdAt,
    updatedAt: video.updatedAt,
    channel,
    owner: toAuthorProfile(owner),
    commentsCount: database.comments.filter((comment) => comment.videoId === video.id).length,
    currentUserReaction: getCurrentReaction(video, currentUserId),
  };
}

export async function buildVideoSummary(
  videoId: string,
  currentUserId?: string,
): Promise<VideoSummary | undefined> {
  const database = await readDatabase();
  const video = database.videos.find((item) => item.id === videoId);

  if (!video) {
    return undefined;
  }

  return mapVideoSummary(database, video, currentUserId) ?? undefined;
}

export async function getRecommendedFeed(currentUserId?: string): Promise<VideoSummary[]> {
  const database = await readDatabase();
  const interactedChannels = getInteractedChannels(database, currentUserId);

  return database.videos
    .slice()
    .sort((left, right) => scoreVideo(right, interactedChannels) - scoreVideo(left, interactedChannels))
    .map((video) => mapVideoSummary(database, video, currentUserId))
    .filter((video): video is VideoSummary => Boolean(video));
}

export async function getShortFeed(
  currentUserId?: string,
  page = 1,
  limit = 5,
): Promise<{ items: VideoSummary[]; page: number; hasMore: boolean }> {
  const feed = (await getRecommendedFeed(currentUserId)).filter((video) => video.type === 'short');
  const start = (page - 1) * limit;
  const items = feed.slice(start, start + limit);
  return {
    items,
    page,
    hasMore: start + limit < feed.length,
  };
}

export async function getVideosByChannel(channelId: string, currentUserId?: string): Promise<VideoSummary[]> {
  const database = await readDatabase();
  return database.videos
    .filter((video) => video.channelId === channelId)
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .map((video) => mapVideoSummary(database, video, currentUserId))
    .filter((video): video is VideoSummary => Boolean(video));
}

export async function getVideoWithRelated(
  videoId: string,
  currentUserId?: string,
): Promise<{ video: VideoSummary; related: VideoSummary[] }> {
  const currentVideo = await buildVideoSummary(videoId, currentUserId);

  if (!currentVideo) {
    throw new HttpError(404, 'Video not found.');
  }

  const related = (await getRecommendedFeed(currentUserId)).filter((video) => video.id !== videoId).slice(0, 8);
  return { video: currentVideo, related };
}

export async function prepareVideoAssets(input: {
  videoFile: Express.Multer.File;
  thumbnailFile?: Express.Multer.File;
}): Promise<{ videoUrl: string; thumbnailUrl?: string }> {
  const targetVideoPath = path.join(uploadPaths.videos, `${Date.now()}-${generateId('media')}.mp4`);

  await fs.mkdir(path.dirname(targetVideoPath), { recursive: true });
  await compressVideo(input.videoFile.path, targetVideoPath);
  await fs.unlink(input.videoFile.path).catch(() => undefined);

  let thumbnailUrl: string | undefined;
  if (input.thumbnailFile) {
    const thumbnailExtension = path.extname(input.thumbnailFile.originalname || input.thumbnailFile.filename) || '.png';
    const targetThumbnailPath = path.join(
      uploadPaths.thumbnails,
      `${Date.now()}-${generateId('thumb')}${thumbnailExtension}`,
    );
    thumbnailUrl = await moveUploadedFile(input.thumbnailFile.path, targetThumbnailPath);
  }

  return {
    videoUrl: toPublicPath(targetVideoPath),
    thumbnailUrl,
  };
}

export async function createVideoRecord(
  user: User,
  input: {
    title: string;
    description: string;
    type: VideoType;
    videoUrl: string;
    thumbnailUrl?: string;
  },
): Promise<VideoSummary> {
  return withDatabaseLock(async () => {
    const users = await readCollection('users');
    const videos = await readCollection('videos');

    const currentUser = users.find((item) => item.id === user.id);
    if (!currentUser || !currentUser.channelId) {
      throw new HttpError(400, 'Create a channel before uploading videos.');
    }

    const now = new Date().toISOString();
    const newVideo: Video = {
      id: generateId('vid'),
      userId: user.id,
      channelId: currentUser.channelId,
      title: input.title.trim(),
      description: input.description.trim(),
      thumbnailUrl: input.thumbnailUrl,
      videoUrl: input.videoUrl,
      type: input.type,
      likes: 0,
      dislikes: 0,
      views: 0,
      createdAt: now,
      updatedAt: now,
      reactions: {},
      viewUserIds: [],
    };

    videos.push(newVideo);
    await writeCollection('videos', videos);

    const summary = await buildVideoSummary(newVideo.id, user.id);
    if (!summary) {
      throw new HttpError(500, 'Unable to build the uploaded video payload.');
    }

    return summary;
  });
}

export async function registerVideoView(videoId: string, userId?: string): Promise<number> {
  return withDatabaseLock(async () => {
    const videos = await readCollection('videos');
    const targetVideo = videos.find((video) => video.id === videoId);

    if (!targetVideo) {
      throw new HttpError(404, 'Video not found.');
    }

    const canCountView = !userId || !targetVideo.viewUserIds.includes(userId);

    if (canCountView) {
      targetVideo.views += 1;
      targetVideo.updatedAt = new Date().toISOString();
      if (userId) {
        targetVideo.viewUserIds.push(userId);
      }
      await writeCollection('videos', videos);
    }

    return targetVideo.views;
  });
}

export async function reactToVideo(
  videoId: string,
  user: User,
  reactionType: ReactionType,
): Promise<VideoSummary> {
  return withDatabaseLock(async () => {
    const videos = await readCollection('videos');
    const targetVideo = videos.find((video) => video.id === videoId);

    if (!targetVideo) {
      throw new HttpError(404, 'Video not found.');
    }

    const previousReaction = targetVideo.reactions[user.id];

    if (previousReaction === 'like') {
      targetVideo.likes = Math.max(0, targetVideo.likes - 1);
    }

    if (previousReaction === 'dislike') {
      targetVideo.dislikes = Math.max(0, targetVideo.dislikes - 1);
    }

    if (reactionType === 'none') {
      delete targetVideo.reactions[user.id];
    } else {
      targetVideo.reactions[user.id] = reactionType;
      if (reactionType === 'like') {
        targetVideo.likes += 1;
      }
      if (reactionType === 'dislike') {
        targetVideo.dislikes += 1;
      }
    }

    targetVideo.updatedAt = new Date().toISOString();
    await writeCollection('videos', videos);

    const summary = await buildVideoSummary(videoId, user.id);
    if (!summary) {
      throw new HttpError(500, 'Unable to build updated reaction payload.');
    }

    return summary;
  });
}

export async function deleteVideoById(videoId: string, user: User): Promise<void> {
  await withDatabaseLock(async () => {
    const videos = await readCollection('videos');
    const comments = await readCollection('comments');
    const reports = await readCollection('reports');
    const videoIndex = videos.findIndex((video) => video.id === videoId);

    if (videoIndex === -1) {
      throw new HttpError(404, 'Video not found.');
    }

    const video = videos[videoIndex];
    const canDelete = video.userId === user.id || user.role === 'superadmin';
    if (!canDelete) {
      throw new HttpError(403, 'You cannot delete this video.');
    }

    videos.splice(videoIndex, 1);

    await Promise.all([
      writeCollection('videos', videos),
      writeCollection(
        'comments',
        comments.filter((comment) => comment.videoId !== videoId),
      ),
      writeCollection(
        'reports',
        reports.filter((report) => report.videoId !== videoId),
      ),
      safeDeletePublicFile(video.videoUrl),
      safeDeletePublicFile(video.thumbnailUrl),
    ]);
  });
}
