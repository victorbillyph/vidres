import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import VideoCard from '../components/VideoCard';
import { useAuth } from '../context/AuthContext';
import type { CommentItem, ReactionType, ReportReason, Video } from '../types';
import { formatCount, formatDate, mediaUrl } from '../utils/format';

const reportReasons: Array<{ value: ReportReason; label: string }> = [
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate', label: 'Conteudo improprio' },
  { value: 'violence', label: 'Violencia' },
  { value: 'other', label: 'Outro' },
];

export default function WatchPage() {
  const { videoId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Video | null>(null);
  const [related, setRelated] = useState<Video[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentDraft, setCommentDraft] = useState('');
  const [reportReason, setReportReason] = useState<ReportReason>('spam');
  const [reportNotes, setReportNotes] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!videoId) {
      return;
    }

    const loadWatch = async () => {
      setLoading(true);
      try {
        const [videoResponse, commentResponse] = await Promise.all([api.getVideo(videoId), api.getComments(videoId)]);
        setVideo(videoResponse.video);
        setRelated(videoResponse.related);
        setComments(commentResponse.comments);
        setError('');

        api
          .recordView(videoId)
          .then(({ views }) => setVideo((current) => (current ? { ...current, views } : current)))
          .catch(() => undefined);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar o video.');
      } finally {
        setLoading(false);
      }
    };

    void loadWatch();
  }, [videoId, user?.id]);

  const handleReaction = async (type: Exclude<ReactionType, 'none'>) => {
    if (!video) {
      return;
    }

    if (!user) {
      navigate('/login');
      return;
    }

    const nextReaction: ReactionType = video.currentUserReaction === type ? 'none' : type;
    const response = await api.reactVideo(video.id, nextReaction);
    setVideo(response.video);
  };

  const handleCommentSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!video) {
      return;
    }

    if (!user) {
      navigate('/login');
      return;
    }

    const response = await api.createComment(video.id, commentDraft);
    setCommentDraft('');
    setComments((current) => [response.comment, ...current]);
    setVideo((current) => (current ? { ...current, commentsCount: current.commentsCount + 1 } : current));
  };

  const handleCommentDelete = async (commentId: string) => {
    await api.deleteComment(commentId);
    setComments((current) => current.filter((comment) => comment.id !== commentId));
    setVideo((current) =>
      current ? { ...current, commentsCount: Math.max(0, current.commentsCount - 1) } : current,
    );
  };

  const handleReport = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!video) {
      return;
    }

    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await api.reportVideo({ videoId: video.id, reason: reportReason, notes: reportNotes });
      setReportNotes('');
      setReportMessage('Denuncia enviada.');
    } catch (reportError) {
      setReportMessage(reportError instanceof Error ? reportError.message : 'Nao foi possivel denunciar.');
    }
  };

  if (loading) {
    return <div className="panel">Carregando video...</div>;
  }

  if (error) {
    return <div className="panel panel-error">{error}</div>;
  }

  if (!video) {
    return <div className="panel empty-state">Video nao encontrado.</div>;
  }

  return (
    <div className="watch-layout">
      <section className="watch-main">
        <div className="player-frame">
          <video src={mediaUrl(video.videoUrl)} poster={mediaUrl(video.thumbnailUrl)} controls playsInline />
        </div>

        <div className="watch-title-row">
          <div>
            <p className="eyebrow">{video.type === 'short' ? 'Short' : 'Video'}</p>
            <h1>{video.title}</h1>
            <p className="section-copy">
              {formatCount(video.views)} views · publicado em {formatDate(video.createdAt)}
            </p>
          </div>
          <div className="reaction-row">
            <button
              className={`button button-secondary${video.currentUserReaction === 'like' ? ' is-active' : ''}`}
              onClick={() => handleReaction('like')}
            >
              Like {formatCount(video.likes)}
            </button>
            <button
              className={`button button-secondary${video.currentUserReaction === 'dislike' ? ' is-active' : ''}`}
              onClick={() => handleReaction('dislike')}
            >
              Dislike {formatCount(video.dislikes)}
            </button>
          </div>
        </div>

        <section className="panel">
          <Link to={`/channel/${video.channel.id}`} className="channel-inline">
            <span>{video.channel.name}</span>
            <strong>{video.owner.name}</strong>
          </Link>
          <p>{video.description}</p>
        </section>

        <section className="panel">
          <div className="section-head section-head--compact">
            <div>
              <p className="eyebrow">Comentarios</p>
              <h2>{formatCount(video.commentsCount)} comentarios</h2>
            </div>
          </div>

          <form className="comment-form" onSubmit={handleCommentSubmit}>
            <input
              value={commentDraft}
              onChange={(event) => setCommentDraft(event.target.value)}
              placeholder={user ? 'Escreva um comentario...' : 'Entre para comentar'}
              disabled={!user}
              required
            />
            <button className="button" type="submit" disabled={!user}>
              Comentar
            </button>
          </form>

          <div className="comment-list">
            {comments.map((comment) => (
              <article key={comment.id} className="comment-card">
                <div>
                  <strong>{comment.user.name}</strong>
                  <span>{formatDate(comment.createdAt)}</span>
                </div>
                <p>{comment.content}</p>
                {user && (comment.userId === user.id || user.role === 'superadmin') ? (
                  <button className="text-button" onClick={() => handleCommentDelete(comment.id)}>
                    Excluir comentario
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      </section>

      <aside className="watch-side">
        <section className="panel">
          <p className="eyebrow">Denuncia</p>
          <h3>Algo errado com este video?</h3>
          <form className="form-grid" onSubmit={handleReport}>
            <label>
              Motivo
              <select value={reportReason} onChange={(event) => setReportReason(event.target.value as ReportReason)}>
                {reportReasons.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Observacao opcional
              <textarea value={reportNotes} onChange={(event) => setReportNotes(event.target.value)} rows={3} />
            </label>
            <button className="button button-secondary" type="submit" disabled={!user}>
              Denunciar
            </button>
          </form>
          {reportMessage ? <p className="status-message">{reportMessage}</p> : null}
        </section>

        <section className="related-list">
          <p className="eyebrow">Proximos videos</p>
          {related.length ? (
            related.map((item) => <VideoCard key={item.id} video={item} />)
          ) : (
            <div className="panel empty-state">Sem recomendacoes ainda.</div>
          )}
        </section>
      </aside>
    </div>
  );
}
