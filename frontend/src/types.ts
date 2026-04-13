export type Role = 'user' | 'superadmin';
export type VideoType = 'normal' | 'short';
export type ReactionType = 'like' | 'dislike' | 'none';
export type ReportReason = 'spam' | 'inappropriate' | 'violence' | 'other';

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
  owner?: AuthorProfile | SessionUser | null;
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
  channel: Channel;
  owner: AuthorProfile;
  commentsCount: number;
  currentUserReaction: ReactionType;
}

export interface CommentItem {
  id: string;
  userId: string;
  videoId: string;
  content: string;
  createdAt: string;
  user: AuthorProfile;
}

export interface ReportItem {
  id: string;
  userId: string;
  videoId: string;
  reason: ReportReason;
  notes?: string;
  createdAt: string;
  user: AuthorProfile;
  video: {
    id: string;
    title: string;
    type: VideoType;
    channel: Channel;
    owner: AuthorProfile;
  } | null;
}

export interface ProfileResponse {
  user: SessionUser;
  channel: Channel | null;
  uploads: Video[];
}

export interface DashboardData {
  stats: {
    users: number;
    channels: number;
    videos: number;
    reports: number;
  };
  users: SessionUser[];
  channels: Array<Channel & { owner: SessionUser | null }>;
  videos: Video[];
  reports: ReportItem[];
}

export interface ShortsResponse {
  items: Video[];
  page: number;
  hasMore: boolean;
}
