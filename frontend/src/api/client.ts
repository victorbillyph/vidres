import type {
  Channel,
  CommentItem,
  DashboardData,
  ProfileResponse,
  ReactionType,
  ReportItem,
  ReportReason,
  SessionUser,
  ShortsResponse,
  Video,
} from '../types';

type JsonBody = Record<string, unknown>;

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const isFormData = init.body instanceof FormData;

  if (!isFormData && init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`/api${path}`, {
    credentials: 'include',
    ...init,
    headers,
  });

  const payload = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message ?? 'Unexpected request error.');
  }

  return payload as T;
}

function withJson(body: JsonBody): RequestInit {
  return {
    method: 'POST',
    body: JSON.stringify(body),
  };
}

export const api = {
  getSetupStatus: () => request<{ needsSetup: boolean }>('/setup/status'),
  createSuperadmin: (body: { name: string; email: string; password: string }) =>
    request<{ message: string; user: SessionUser }>('/setup/superadmin', withJson(body)),
  register: (body: { name: string; email: string; password: string }) =>
    request<{ message: string; user: SessionUser }>('/auth/register', withJson(body)),
  login: (body: { email: string; password: string }) =>
    request<{ message: string; user: SessionUser }>('/auth/login', withJson(body)),
  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
  me: () => request<{ user: SessionUser }>('/auth/me'),
  getProfile: () => request<ProfileResponse>('/users/me/profile'),
  getMyChannel: () => request<{ channel: Channel | null }>('/channels/me'),
  createChannel: (formData: FormData) =>
    request<{ message: string; channel: Channel }>('/channels', {
      method: 'POST',
      body: formData,
    }),
  updateChannel: (formData: FormData) =>
    request<{ message: string; channel: Channel }>('/channels/me', {
      method: 'PUT',
      body: formData,
    }),
  getChannel: (channelId: string) =>
    request<{ channel: Channel; videos: Video[] }>(`/channels/${channelId}`),
  getFeed: () => request<{ videos: Video[] }>('/videos/feed'),
  getShorts: (page: number, limit = 5) =>
    request<ShortsResponse>(`/videos/shorts?page=${page}&limit=${limit}`),
  getVideo: (videoId: string) =>
    request<{ video: Video; related: Video[] }>(`/videos/${videoId}`),
  uploadVideo: (formData: FormData) =>
    request<{ message: string; video: Video }>('/videos', {
      method: 'POST',
      body: formData,
    }),
  deleteOwnVideo: (videoId: string) => request<{ message: string }>(`/videos/${videoId}`, { method: 'DELETE' }),
  reactVideo: (videoId: string, type: ReactionType) =>
    request<{ video: Video }>(`/videos/${videoId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ type }),
      headers: { 'Content-Type': 'application/json' },
    }),
  recordView: (videoId: string) =>
    request<{ views: number }>(`/videos/${videoId}/view`, { method: 'POST' }),
  getComments: (videoId: string) =>
    request<{ comments: CommentItem[] }>(`/comments/video/${videoId}`),
  createComment: (videoId: string, content: string) =>
    request<{ message: string; comment: CommentItem }>('/comments', withJson({ videoId, content })),
  deleteComment: (commentId: string) =>
    request<{ message: string }>(`/comments/${commentId}`, { method: 'DELETE' }),
  reportVideo: (body: { videoId: string; reason: ReportReason; notes?: string }) =>
    request<{ message: string; report: ReportItem }>('/reports', withJson(body)),
  getAdminDashboard: () => request<DashboardData>('/admin/dashboard'),
  deleteAdminVideo: (videoId: string) =>
    request<{ message: string }>(`/admin/videos/${videoId}`, { method: 'DELETE' }),
  dismissReport: (reportId: string) =>
    request<{ message: string }>(`/admin/reports/${reportId}`, { method: 'DELETE' }),
};
