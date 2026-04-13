import type { Report, ReportReason, ReportView, User } from '../types';
import { readCollection, withDatabaseLock, writeCollection } from './dbService';
import { generateId } from '../utils/id';
import { HttpError } from '../utils/http';
import { toAuthorProfile } from './authService';
import { buildVideoSummary } from './videoService';

export async function createVideoReport(
  user: User,
  input: { videoId: string; reason: ReportReason; notes?: string },
): Promise<Report> {
  return withDatabaseLock(async () => {
    const reports = await readCollection('reports');
    const videos = await readCollection('videos');

    const targetVideo = videos.find((video) => video.id === input.videoId);
    if (!targetVideo) {
      throw new HttpError(404, 'Video not found.');
    }

    const duplicate = reports.find(
      (report) => report.userId === user.id && report.videoId === input.videoId && report.reason === input.reason,
    );

    if (duplicate) {
      throw new HttpError(409, 'You already reported this video for the same reason.');
    }

    const report: Report = {
      id: generateId('rpt'),
      userId: user.id,
      videoId: input.videoId,
      reason: input.reason,
      notes: input.notes?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    reports.push(report);
    await writeCollection('reports', reports);
    return report;
  });
}

export async function getReportViews(): Promise<ReportView[]> {
  const [reports, users] = await Promise.all([readCollection('reports'), readCollection('users')]);

  const reportViews = await Promise.all(
    reports
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .map(async (report) => {
        const user = users.find((item) => item.id === report.userId);
        if (!user) {
          throw new HttpError(500, 'Report user data is inconsistent.');
        }

        const video = await buildVideoSummary(report.videoId);

        return {
          ...report,
          user: toAuthorProfile(user),
          video: video
            ? {
                id: video.id,
                title: video.title,
                type: video.type,
                channel: video.channel,
                owner: video.owner,
              }
            : null,
        };
      }),
  );

  return reportViews;
}

export async function dismissReport(reportId: string): Promise<void> {
  await withDatabaseLock(async () => {
    const reports = await readCollection('reports');
    const reportIndex = reports.findIndex((report) => report.id === reportId);

    if (reportIndex === -1) {
      throw new HttpError(404, 'Report not found.');
    }

    reports.splice(reportIndex, 1);
    await writeCollection('reports', reports);
  });
}
