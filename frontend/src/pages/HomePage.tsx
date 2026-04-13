import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import VideoCard from '../components/VideoCard';
import { useAuth } from '../context/AuthContext';
import type { Video } from '../types';

export default function HomePage() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadFeed = async () => {
      setLoading(true);
      try {
        const response = await api.getFeed();
        setVideos(response.videos);
        setError('');
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar o feed.');
      } finally {
        setLoading(false);
      }
    };

    void loadFeed();
  }, [user?.id]);

  return (
    <div className="page-stack">
      <section className="hero-card hero-card--minimal">
        <div>
          <p className="eyebrow">Home</p>
          <h1>Videos para assistir sem complicacao.</h1>
          <p className="section-copy">Escolha um video, abra os shorts ou publique algo novo no seu canal.</p>
        </div>
        <div className="card-actions">
          <Link to="/shorts" className="button button-secondary">
            Ver Shorts
          </Link>
          {user ? (
            <Link to="/channel" className="button">
              Meu canal
            </Link>
          ) : (
            <Link to="/login" className="button">
              Entrar
            </Link>
          )}
        </div>
      </section>

      <section className="section-head">
        <div>
          <p className="eyebrow">Agora</p>
          <h2>Videos</h2>
        </div>
        <span className="section-note">{videos.length} itens</span>
      </section>

      {loading ? <div className="panel">Carregando feed...</div> : null}
      {error ? <div className="panel panel-error">{error}</div> : null}

      {!loading && !error ? (
        videos.length ? (
          <div className="video-grid">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <div className="panel empty-state">
            <h3>Nenhum video ainda</h3>
            <p>Crie um canal e publique o primeiro video.</p>
          </div>
        )
      ) : null}
    </div>
  );
}
