import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { Video } from '../types';
import { formatCount, formatDate, mediaUrl } from '../utils/format';

interface VideoCardProps {
  video: Video;
  action?: ReactNode;
}

export default function VideoCard({ video, action }: VideoCardProps) {
  return (
    <article className={`video-card${video.type === 'short' ? ' is-short' : ''}`}>
      <Link to={`/watch/${video.id}`} className="video-card__media">
        {video.thumbnailUrl ? (
          <img src={mediaUrl(video.thumbnailUrl)} alt={video.title} className="video-card__image" />
        ) : (
          <div className="video-card__fallback">
            <span>{video.type === 'short' ? 'Short' : 'Video'}</span>
            <strong>{video.title}</strong>
          </div>
        )}
        <span className="video-card__badge">{video.type === 'short' ? 'Short' : 'Video'}</span>
      </Link>

      <div className="video-card__body">
        <div className="video-card__meta">
          <Link to={`/watch/${video.id}`} className="video-card__title">
            {video.title}
          </Link>
          <Link to={`/channel/${video.channel.id}`} className="video-card__channel">
            {video.channel.name}
          </Link>
          <p className="video-card__stats">
            {formatCount(video.views)} views · {formatCount(video.likes)} likes · {formatDate(video.createdAt)}
          </p>
        </div>

        {action ? <div className="card-actions">{action}</div> : null}
      </div>
    </article>
  );
}
