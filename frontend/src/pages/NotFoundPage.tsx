import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="panel empty-state">
      <p className="eyebrow">404</p>
      <h1>Pagina nao encontrada</h1>
      <p>Esse caminho nao existe no Vidres. Volte para a tela inicial.</p>
      <Link to="/" className="button">
        Ir para Home
      </Link>
    </div>
  );
}

