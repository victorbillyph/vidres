import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import VideoCard from '../components/VideoCard';
import type { ProfileResponse, VideoType } from '../types';
import { formatCount } from '../utils/format';

export default function CreatorPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [channelName, setChannelName] = useState('');
  const [channelDescription, setChannelDescription] = useState('');
  const [channelImage, setChannelImage] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<VideoType>('normal');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingChannel, setSavingChannel] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await api.getProfile();
      setProfile(response);
      setChannelName(response.channel?.name ?? '');
      setChannelDescription(response.channel?.description ?? '');
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar o canal.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, []);

  const stats = useMemo(() => {
    const uploads = profile?.uploads ?? [];

    return {
      videos: uploads.length,
      views: uploads.reduce((total, video) => total + video.views, 0),
      likes: uploads.reduce((total, video) => total + video.likes, 0),
      shorts: uploads.filter((video) => video.type === 'short').length,
    };
  }, [profile]);

  const handleChannelSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingChannel(true);

    try {
      const formData = new FormData();
      formData.append('name', channelName);
      formData.append('description', channelDescription);
      if (channelImage) {
        formData.append('image', channelImage);
      }

      if (profile?.channel) {
        await api.updateChannel(formData);
      } else {
        await api.createChannel(formData);
      }

      setChannelImage(null);
      await loadProfile();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Nao foi possivel salvar o canal.');
    } finally {
      setSavingChannel(false);
    }
  };

  const handleUploadSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!videoFile) {
      setError('Selecione um arquivo de video.');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('type', type);
      formData.append('video', videoFile);
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }

      const response = await api.uploadVideo(formData);
      setTitle('');
      setDescription('');
      setType('normal');
      setVideoFile(null);
      setThumbnailFile(null);
      await loadProfile();
      navigate(`/watch/${response.video.id}`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Nao foi possivel publicar o video.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!window.confirm('Remover este video?')) {
      return;
    }

    try {
      await api.deleteOwnVideo(videoId);
      await loadProfile();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Nao foi possivel remover o video.');
    }
  };

  if (loading) {
    return <div className="panel">Carregando seu canal...</div>;
  }

  if (!profile) {
    return <div className="panel panel-error">Nao foi possivel abrir o painel do criador.</div>;
  }

  if (!profile.channel) {
    return (
      <div className="page-stack">
        <section className="hero-card hero-card--minimal">
          <div>
            <p className="eyebrow">Canal</p>
            <h1>Vamos criar o seu canal.</h1>
            <p className="section-copy">Escolha um nome, uma descrição e, se quiser, uma imagem.</p>
          </div>
        </section>

        <section className="panel">
          <p className="eyebrow">Criar canal</p>
          <h2>Seu setup inicial</h2>
          <form className="form-grid" onSubmit={handleChannelSubmit}>
            <label>
              Nome do canal
              <input value={channelName} onChange={(event) => setChannelName(event.target.value)} required />
            </label>
            <label>
              Descrição
              <textarea
                value={channelDescription}
                onChange={(event) => setChannelDescription(event.target.value)}
                rows={4}
                required
              />
            </label>
            <label>
              Imagem do canal
              <input type="file" accept="image/*" onChange={(event) => setChannelImage(event.target.files?.[0] ?? null)} />
            </label>
            {error ? <div className="form-error">{error}</div> : null}
            <button className="button" type="submit" disabled={savingChannel}>
              {savingChannel ? 'Salvando...' : 'Criar canal'}
            </button>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="hero-card hero-card--minimal">
        <div>
          <p className="eyebrow">Painel do criador</p>
          <h1>{profile.channel.name}</h1>
          <p className="section-copy">{profile.channel.description}</p>
        </div>
        <div className="card-actions">
          <Link to={`/channel/${profile.channel.id}`} className="button button-secondary">
            Ver canal publico
          </Link>
        </div>
      </section>

      <div className="stats-grid">
        <div className="metric-card">
          <span>Videos</span>
          <strong>{stats.videos}</strong>
        </div>
        <div className="metric-card">
          <span>Views</span>
          <strong>{formatCount(stats.views)}</strong>
        </div>
        <div className="metric-card">
          <span>Likes</span>
          <strong>{formatCount(stats.likes)}</strong>
        </div>
        <div className="metric-card">
          <span>Shorts</span>
          <strong>{stats.shorts}</strong>
        </div>
      </div>

      <div className="profile-grid">
        <section className="panel">
          <p className="eyebrow">Personalização</p>
          <h2>Editar canal</h2>
          <form className="form-grid" onSubmit={handleChannelSubmit}>
            <label>
              Nome do canal
              <input value={channelName} onChange={(event) => setChannelName(event.target.value)} required />
            </label>
            <label>
              Descrição
              <textarea
                value={channelDescription}
                onChange={(event) => setChannelDescription(event.target.value)}
                rows={4}
                required
              />
            </label>
            <label>
              Nova imagem do canal
              <input type="file" accept="image/*" onChange={(event) => setChannelImage(event.target.files?.[0] ?? null)} />
            </label>
            {error ? <div className="form-error">{error}</div> : null}
            <button className="button" type="submit" disabled={savingChannel}>
              {savingChannel ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </form>
        </section>

        <section className="panel">
          <p className="eyebrow">Novo video</p>
          <h2>Publicar agora</h2>
          <form className="form-grid" onSubmit={handleUploadSubmit}>
            <label>
              Título
              <input value={title} onChange={(event) => setTitle(event.target.value)} required />
            </label>
            <label>
              Descrição
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} required />
            </label>
            <label>
              Tipo
              <select value={type} onChange={(event) => setType(event.target.value as VideoType)}>
                <option value="normal">Normal</option>
                <option value="short">Short</option>
              </select>
            </label>
            <label>
              Arquivo de video
              <input type="file" accept="video/*" onChange={(event) => setVideoFile(event.target.files?.[0] ?? null)} required />
            </label>
            <label>
              Thumbnail opcional
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setThumbnailFile(event.target.files?.[0] ?? null)}
              />
            </label>
            {error ? <div className="form-error">{error}</div> : null}
            <button className="button" type="submit" disabled={uploading}>
              {uploading ? 'Enviando...' : 'Publicar video'}
            </button>
          </form>
        </section>
      </div>

      <section className="section-head">
        <div>
          <p className="eyebrow">Seus videos</p>
          <h2>Biblioteca do criador</h2>
        </div>
      </section>

      {profile.uploads.length ? (
        <div className="video-grid">
          {profile.uploads.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              action={
                <button className="button button-danger" onClick={() => handleDeleteVideo(video.id)}>
                  Excluir
                </button>
              }
            />
          ))}
        </div>
      ) : (
        <div className="panel empty-state">
          <h3>Nenhum video ainda</h3>
          <p>Publique o primeiro video usando o formulário acima.</p>
        </div>
      )}
    </div>
  );
}
