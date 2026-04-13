import type { Comment, CommentView, User } from '../types';
import { readCollection, withDatabaseLock, writeCollection } from './dbService';
import { generateId } from '../utils/id';
import { HttpError } from '../utils/http';
import { toAuthorProfile } from './authService';

export async function getCommentsByVideo(videoId: string): Promise<CommentView[]> {
  const [comments, users] = await Promise.all([readCollection('comments'), readCollection('users')]);

  return comments
    .filter((comment) => comment.videoId === videoId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map((comment) => {
      const user = users.find((item) => item.id === comment.userId);
      if (!user) {
        throw new HttpError(500, 'Comment author data is inconsistent.');
      }

      return {
        ...comment,
        user: toAuthorProfile(user),
      };
    });
}

export async function createCommentForVideo(
  user: User,
  input: { videoId: string; content: string },
): Promise<CommentView> {
  return withDatabaseLock(async () => {
    const comments = await readCollection('comments');
    const videos = await readCollection('videos');

    const videoExists = videos.some((video) => video.id === input.videoId);
    if (!videoExists) {
      throw new HttpError(404, 'Video not found.');
    }

    const content = input.content.trim();
    if (!content) {
      throw new HttpError(400, 'Comment content is required.');
    }

    const newComment: Comment = {
      id: generateId('cmt'),
      userId: user.id,
      videoId: input.videoId,
      content,
      createdAt: new Date().toISOString(),
    };

    comments.push(newComment);
    await writeCollection('comments', comments);

    return {
      ...newComment,
      user: toAuthorProfile(user),
    };
  });
}

export async function deleteCommentById(commentId: string, user: User): Promise<void> {
  await withDatabaseLock(async () => {
    const comments = await readCollection('comments');
    const commentIndex = comments.findIndex((comment) => comment.id === commentId);

    if (commentIndex === -1) {
      throw new HttpError(404, 'Comment not found.');
    }

    const comment = comments[commentIndex];
    const canDelete = comment.userId === user.id || user.role === 'superadmin';

    if (!canDelete) {
      throw new HttpError(403, 'You cannot delete this comment.');
    }

    comments.splice(commentIndex, 1);
    await writeCollection('comments', comments);
  });
}
