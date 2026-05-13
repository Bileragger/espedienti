import { useState } from 'react';
import { Settings, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';

function activePage() {
  const path = window.location.pathname;
  if (path.endsWith('about.html'))    return 'project';
  if (path.endsWith('contatti.html')) return 'contacts';
  if (path.endsWith('admin.html'))    return 'admin';
  return null;
}

export function Navbar() {
  const { name, isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const active = activePage();

  const AdminLink = ({ id }) => (
    <a href="admin.html" id={id} className={`admin-nav-link${active === 'admin' ? ' active' : ''}`}
      style={{ display: 'flex' }} data-nav="admin">
      <Settings size={16} />
      <span>Admin</span>
    </a>
  );

  const AuthBtn = () => (
    <button type="button"
      className={`auth-nav-btn${name ? ' logged-in' : ''}`}
      title={name ?? ''}
      onClick={() => window.openAuthModal?.()}>
      <User size={16} />
      <span>{name ?? 'Accedi'}</span>
    </button>
  );

  const LangBtn = () => (
    <button type="button" className="lang-toggle-btn"
      onClick={() => window.i18n?.toggle()}>EN</button>
  );

  return (
    <header>
      <div className="header-content">
        <div className="logo">
          <a href="index.html">Espedienti a Napoli</a>
        </div>

        <button type="button" className="hamburger" id="hamburgerBtn"
          aria-label="Menu" onClick={() => setMenuOpen(o => !o)}>
          ☰
        </button>

        <nav className="nav-links">
          <a href="about.html" data-nav="project"
            className={active === 'project' ? 'active' : ''}>Il Progetto</a>
          <a href="contatti.html" data-nav="contacts"
            className={active === 'contacts' ? 'active' : ''}>Contatti</a>
          {(isAdmin || active === 'admin') && <AdminLink id="adminNavLink" />}
          <AuthBtn />
          <LangBtn />
        </nav>

        <nav className={`mobile-menu${menuOpen ? ' open' : ''}`} id="mobileMenu">
          <a href="about.html">Il Progetto</a>
          <a href="contatti.html">Contatti</a>
          {(isAdmin || active === 'admin') && <AdminLink id="adminNavLinkMobile" />}
          <AuthBtn />
          <LangBtn />
        </nav>
      </div>
    </header>
  );
}
