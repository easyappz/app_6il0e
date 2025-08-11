import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Avatar from './Avatar';
import '../styles/layout.css';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const username = typeof window !== 'undefined' ? localStorage.getItem('username') || 'User' : 'User';
  const avatarUrl = typeof window !== 'undefined' ? localStorage.getItem('avatarUrl') || '' : '';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('avatarUrl');
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand" onClick={() => navigate(token ? '/feed' : '/login')} role="button">
          <span className="logo-dot">●</span>
          <span className="brand-text">Easyappz Social</span>
        </div>
        <div className="header-right">
          {!isAuthPage && token ? (
            <div className="search-box">
              <input placeholder="Поиск..." aria-label="Поиск" />
            </div>
          ) : null}
          <div className="header-user">
            <Avatar username={username} avatarUrl={avatarUrl} size={34} />
          </div>
        </div>
      </header>

      <div className="app-body">
        {!isAuthPage && token ? (
          <aside className="sidebar">
            <nav className="menu">
              <NavLink className={({ isActive }) => 'menu-link' + (isActive ? ' active' : '')} to="/feed">Лента</NavLink>
              <NavLink className={({ isActive }) => 'menu-link' + (isActive ? ' active' : '')} to="/profile">Профиль</NavLink>
              <button className="menu-link danger" onClick={handleLogout}>Выход</button>
            </nav>
          </aside>
        ) : null}

        <main className={!isAuthPage ? 'content' : 'content full'}>
          <Outlet />
        </main>
      </div>

      <footer className="app-footer">© {new Date().getFullYear()} Easyappz</footer>
    </div>
  );
}
