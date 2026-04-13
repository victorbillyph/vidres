import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import VideoCard from '../components/VideoCard';
import type { Channel, Video } from '../types';
import { formatDate, mediaUrl } from '../utils/format';

export default function ChannelPage() {
  const { channelId } = useParams();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!channelId) {
      setLoading(false);
      setError('Canal nao informado.');
      return;
    }

    const loadChannel = async () => {
      setLoading(true);
      try {
        const response = await api.getChannel(channelId);
        setChannel(response.channel);
        setVideos(response.videos);
        setError('');
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar o canal.');
      } finally {
        setLoading(false);
      }
    };

    void loadChannel();
  }, [channelId]);

  if (loading) {
    return <div className="panel">Carregando canal...</div>;
  }

  if (error) {
    return <div className="panel panel-error">{error}</div>;
  }

  if (!channel) {
    return <div className="panel empty-state">Canal nao encontrado.</div>;
  }

  return (
    <div className="page-stack">
      <section className="channel-hero">
        <div className="channel-hero__visual">
          {channel.imageUrl ? (
            <img src={mediaUrl(channel.imageUrl)} alt={channel.name} />
          ) : (
            <div className="avatar-placeholder">{channel.name.slice(0, 2).toUpperCase()}</div>
          )}
        </div>
        <div className="channel-hero__body">
          <p className="eyebrow">Canal</p>
          <h1>{channel.name}</h1>
          <p className="section-copy">{channel.description}</p>
          <div className="feature-video__stats">
            <span>{channel.owner?.name ?? 'Criador'}</span>
            <span>{videos.length} videos</span>
            <span>Atualizado em {formatDate(channel.updatedAt)}</span>
          </div>
        </div>
      </section>

      {videos.length ? (
        <div className="video-grid">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="panel empty-state">
          <h3>Este canal ainda nao publicou videos</h3>
          <p>Assim que novos uploads chegarem, eles aparecem aqui.</p>
        </div>
      )}
    </div>
  );
}
