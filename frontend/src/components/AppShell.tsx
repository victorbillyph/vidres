import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const baseLinks = [
  { to: '/', label: 'Home' },
  { to: '/shorts', label: 'Shorts' },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = [
    ...baseLinks,
    ...(user ? [{ to: '/channel', label: 'Canal' }] : []),
    ...(user?.role === 'superadmin' ? [{ to: '/admin', label: 'Admin' }] : []),
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand-block">
          <img src="/vidreo-logo.png" alt="Vidres" className="brand-mark" />
          <div>
            <p className="eyebrow">Videos</p>
            <h1>Vidres</h1>
          </div>
        </div>

        <p className="sidebar-copy">Assista, publique e acompanhe seu canal.</p>

        <nav className="nav-list">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) => `nav-pill${isActive ? ' is-active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-panel">
          {user ? (
            <>
              <p className="panel-label">Sua conta</p>
              <strong>{user.name}</strong>
              <span>{user.role === 'superadmin' ? 'Administrador' : 'Conta ativa'}</span>
              <button className="button button-secondary" onClick={handleLogout}>
                Sair
              </button>
            </>
          ) : (
            <>
              <p className="panel-label">Entre para usar</p>
              <button className="button" onClick={() => navigate('/login')}>
                Login
              </button>
              <button className="button button-secondary" onClick={() => navigate('/register')}>
                Criar conta
              </button>
            </>
          )}
        </div>
      </aside>

      <div className="shell-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Inicio</p>
            <h2>Veja o que tem para assistir</h2>
          </div>

          <div className="topbar-actions">
            {user ? (
              <button className="button button-ghost" onClick={() => navigate('/channel')}>
                {user.name}
              </button>
            ) : (
              <button className="button" onClick={() => navigate('/login')}>
                Entrar
              </button>
            )}
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}




