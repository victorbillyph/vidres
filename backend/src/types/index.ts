export type Role = 'user' | 'superadmin';
export type VideoType = 'normal' | 'short';
export type ReactionType = 'like' | 'dislike' | 'none';
export type ReportReason = 'spam' | 'inappropriate' | 'violence' | 'other';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  profileImage?: string;
  channelId?: string;
  createdAt: string;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  profileImage?: string;
  channelId?: string;
  createdAt: string;
}

export interface AuthorProfile {
  id: string;
  name: string;
  role: Role;
  profileImage?: string;
  channelId?: string;
}

export interface Channel {
  id: string;
  userId: string;
  name: string;
  description: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Video {
  id: string;
  userId: string;
  channelId: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  videoUrl: string;
  type: VideoType;
  likes: number;
  dislikes: number;
  views: number;
  createdAt: string;
  updatedAt: string;
  reactions: Record<string, 'like' | 'dislike'>;
  viewUserIds: string[];
}

export interface VideoSummary extends Omit<Video, 'reactions' | 'viewUserIds'> {
  channel: Channel;
  owner: AuthorProfile;
  commentsCount: number;
  currentUserReaction: ReactionType;
}

export interface Comment {
  id: string;
  userId: string;
  videoId: string;
  content: string;
  createdAt: string;
}

export interface CommentView extends Comment {
  user: AuthorProfile;
}

export interface Report {
  id: string;
  userId: string;
  videoId: string;
  reason: ReportReason;
  notes?: string;
  createdAt: string;
}

export interface ReportView extends Report {
  user: AuthorProfile;
  video: Pick<VideoSummary, 'id' | 'title' | 'type' | 'channel' | 'owner'> | null;
}

export interface DatabaseSchema {
  users: User[];
  channels: Channel[];
  videos: Video[];
  comments: Comment[];
  reports: Report[];
}

export interface JwtPayload {
  userId: string;
  role: Role;
}
