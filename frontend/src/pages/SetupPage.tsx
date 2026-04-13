import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SetupPage() {
  const { completeSetup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await completeSetup({ name, email, password });
      navigate('/admin');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Nao foi possivel concluir essa etapa.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page auth-page--setup">
      <section className="auth-card">
        <p className="eyebrow">Primeiro acesso</p>
        <h1>Crie a primeira conta do Vidres.</h1>
        <p className="section-copy">Depois disso, o restante do app fica liberado para uso.</p>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Nome
            <input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </label>
          <label>
            Senha
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              minLength={6}
              required
            />
          </label>
          {error ? <div className="form-error">{error}</div> : null}
          <button className="button" type="submit" disabled={submitting}>
            {submitting ? 'Salvando...' : 'Criar conta'}
          </button>
        </form>
      </section>
    </div>
  );
}

