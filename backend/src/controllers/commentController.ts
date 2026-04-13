import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';
import { createCommentForVideo, deleteCommentById, getCommentsByVideo } from '../services/commentService';
import { HttpError } from '../utils/http';

export async function getVideoComments(req: AuthenticatedRequest, res: Response) {
  const comments = await getCommentsByVideo(String(req.params.videoId));
  res.json({ comments });
}

export async function createComment(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required.');
  }

  const { videoId, content } = req.body as {
    videoId?: string;
    content?: string;
  };

  if (!videoId || !content) {
    throw new HttpError(400, 'Video and content are required.');
  }

  const comment = await createCommentForVideo(req.user, { videoId, content });
  res.status(201).json({
    message: 'Comment published successfully.',
    comment,
  });
}

export async function destroyComment(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required.');
  }

  await deleteCommentById(String(req.params.commentId), req.user);
  res.json({ message: 'Comment deleted successfully.' });
}
