import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await register({ name, email, password });
      navigate('/profile');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Nao foi possivel criar a conta.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">Criar conta</p>
        <h1>Crie sua conta e comece do seu jeito.</h1>
        <p className="section-copy">Depois do cadastro, voce ja pode criar um canal, enviar videos e comentar.</p>

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
            {submitting ? 'Criando conta...' : 'Registrar'}
          </button>
        </form>

        <p className="auth-footer">
          Ja possui acesso? <Link to="/login">Fazer login</Link>
        </p>
      </section>
    </div>
  );
}
