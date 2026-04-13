import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import VideoCard from '../components/VideoCard';
import type { DashboardData } from '../types';
import { formatDate } from '../utils/format';

export default function AdminPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const response = await api.getAdminDashboard();
      setDashboard(response);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar o painel.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const handleVideoDelete = async (videoId: string) => {
    if (!window.confirm('Remover este video?')) {
      return;
    }

    await api.deleteAdminVideo(videoId);
    await loadDashboard();
  };

  const handleDismissReport = async (reportId: string) => {
    await api.dismissReport(reportId);
    await loadDashboard();
  };

  if (loading) {
    return <div className="panel">Carregando painel...</div>;
  }

  if (error) {
    return <div className="panel panel-error">{error}</div>;
  }

  if (!dashboard) {
    return <div className="panel empty-state">Painel indisponivel.</div>;
  }

  return (
    <div className="page-stack">
      <section className="hero-card admin-hero">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Painel de controle.</h1>
          <p className="section-copy">Veja usuarios, canais, videos e denuncias em um so lugar.</p>
        </div>
      </section>

      <div className="stats-grid">
        {Object.entries(dashboard.stats).map(([key, value]) => (
          <div className="metric-card" key={key}>
            <span>{key}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <section className="panel">
        <div className="section-head section-head--compact">
          <div>
            <p className="eyebrow">Usuarios</p>
            <h2>Todos os usuarios</h2>
          </div>
        </div>
        <div className="admin-list">
          {dashboard.users.map((item) => (
            <article className="admin-row" key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <span>{item.email}</span>
              </div>
              <span>{item.role}</span>
              <span>{formatDate(item.createdAt)}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-head section-head--compact">
          <div>
            <p className="eyebrow">Canais</p>
            <h2>Todos os canais</h2>
          </div>
        </div>
        <div className="admin-list">
          {dashboard.channels.map((channel) => (
            <article className="admin-row" key={channel.id}>
              <div>
                <strong>{channel.name}</strong>
                <span>{channel.description}</span>
              </div>
              <span>{channel.owner?.name ?? 'sem dono'}</span>
              <Link to={`/channel/${channel.id}`} className="text-button">
                Abrir canal
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="section-head">
          <div>
            <p className="eyebrow">Videos</p>
            <h2>Todos os videos</h2>
          </div>
        </div>
        {dashboard.videos.length ? (
          <div className="video-grid">
            {dashboard.videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                action={
                  <button className="button button-danger" onClick={() => handleVideoDelete(video.id)}>
                    Deletar
                  </button>
                }
              />
            ))}
          </div>
        ) : (
          <div className="panel empty-state">Nenhum video no sistema.</div>
        )}
      </section>

      <section className="panel">
        <div className="section-head section-head--compact">
          <div>
            <p className="eyebrow">Denuncias</p>
            <h2>Fila de moderacao</h2>
          </div>
        </div>
        <div className="report-grid">
          {dashboard.reports.length ? (
            dashboard.reports.map((report) => (
              <article className="report-card" key={report.id}>
                <div>
                  <span>{report.reason}</span>
                  <strong>{report.video?.title ?? 'Video removido'}</strong>
                  <p>{report.notes || 'Sem observacao.'}</p>
                </div>
                <small>
                  Enviado por {report.user.name} em {formatDate(report.createdAt)}
                </small>
                <div className="card-actions">
                  {report.video ? (
                    <Link to={`/watch/${report.video.id}`} className="button button-secondary">
                      Ver video
                    </Link>
                  ) : null}
                  <button className="button" onClick={() => handleDismissReport(report.id)}>
                    Resolver
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">Nenhuma denuncia pendente.</div>
          )}
        </div>
      </section>
    </div>
  );
}
