import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Video } from '../types';
import { formatCount, mediaUrl } from '../utils/format';

function ShortCard({ video }: { video: Video }) {
  const cardRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const card = cardRef.current;
    const player = videoRef.current;

    if (!card || !player) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          player.play().catch(() => undefined);
        } else {
          player.pause();
        }
      },
      { threshold: 0.65 },
    );

    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  return (
    <article className="short-card" ref={cardRef}>
      <video ref={videoRef} src={mediaUrl(video.videoUrl)} loop muted playsInline />
      <div className="short-card__overlay">
        <span>{video.channel.name}</span>
        <h2>{video.title}</h2>
        <p>{video.description}</p>
        <div className="short-card__stats">
          <strong>{formatCount(video.likes)} likes</strong>
          <strong>{formatCount(video.views)} views</strong>
          <Link to={`/watch/${video.id}`} className="button">
            Assistir
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function ShortsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Video[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchPage = async (nextPage: number) => {
    if (nextPage === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await api.getShorts(nextPage, 5);
      setItems((current) => (nextPage === 1 ? response.items : [...current, ...response.items]));
      setPage(response.page);
      setHasMore(response.hasMore);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar os shorts.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    void fetchPage(1);
  }, [user?.id]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loadingMore) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void fetchPage(page + 1);
        }
      },
      { rootMargin: '300px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, page]);

  if (loading) {
    return <div className="panel">Carregando shorts...</div>;
  }

  if (error) {
    return <div className="panel panel-error">{error}</div>;
  }

  return (
    <div className="shorts-page">
      <section className="shorts-intro">
        <p className="eyebrow">Shorts</p>
        <h1>Videos curtos para assistir em sequencia.</h1>
      </section>

      {items.length ? (
        <div className="shorts-stack">
          {items.map((video) => (
            <ShortCard key={video.id} video={video} />
          ))}
          <div ref={sentinelRef} className="shorts-sentinel">
            {loadingMore ? 'Carregando mais shorts...' : hasMore ? 'Role para carregar mais' : 'Fim dos shorts'}
          </div>
        </div>
      ) : (
        <div className="panel empty-state">
          <h2>Nenhum short publicado ainda</h2>
          <p>Envie um video como tipo Short na tela de upload.</p>
        </div>
      )}
    </div>
  );
}
