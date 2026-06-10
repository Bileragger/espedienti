import { useState, useEffect } from 'react';
import { Settings, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useInSPA } from '../contexts/SPAContext.jsx';

function activePage() {
  const path  = window.location.pathname;
  const hash  = window.location.hash; // e.g. "#/about" with HashRouter
  if (path.endsWith('about.html') || path === '/about' || hash === '#/about') return 'project';
  if (path.endsWith('contatti.html') || path === '/contatti' || hash === '#/contatti') return 'contacts';
  if (path.endsWith('admin.html')) return 'admin';
  return null;
}

export function Navbar() {
  const { name, isAdmin } = useAuth();
  const inSPA = useInSPA();
  const [menuOpen, setMenuOpen] = useState(false);
  const [lang, setLang] = useState(() => window.i18n?.lang ?? 'it');
  const active = activePage();

  useEffect(() => {
    const handler = (e) => setLang(e.detail?.lang ?? 'it');
    window.addEventListener('languageChanged', handler);
    return () => window.removeEventListener('languageChanged', handler);
  }, []);

  // NavA: SPA-aware link — uses React Router <Link> inside the SPA, plain <a> elsewhere
  const NavA = ({ to, href, children, id, className, style, 'data-nav': dataNav }) => {
    const cls    = className ?? '';
    const shared = { id, style, 'data-nav': dataNav };
    return (inSPA && to)
      ? <Link to={to} className={cls} {...shared}>{children}</Link>
      : <a href={href ?? to} className={cls} {...shared}>{children}</a>;
  };

  const AdminLink = ({ id }) => (
    <a href="admin.html" id={id}
      className={`admin-nav-link${active === 'admin' ? ' active' : ''}`}
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
      onClick={() => window.i18n?.toggle()}>
      {lang === 'it' ? 'EN' : 'IT'}
    </button>
  );

  return (
    <header>
      <div className="header-content">
        <div className="logo">
          <NavA to="/" href="./">Espedienti a Napoli</NavA>
        </div>

        <button type="button" className="hamburger" id="hamburgerBtn"
          aria-label="Menu" onClick={() => setMenuOpen(o => !o)}>
          ☰
        </button>

        <nav className="nav-links">
          <NavA to="/about" href="./#/about" data-nav="project"
            className={active === 'project' ? 'active' : ''}>
            Il Progetto
          </NavA>
          <NavA to="/contatti" href="./#/contatti" data-nav="contacts"
            className={active === 'contacts' ? 'active' : ''}>
            Contatti
          </NavA>
          {(isAdmin || active === 'admin') && <AdminLink id="adminNavLink" />}
          <AuthBtn />
          <LangBtn />
        </nav>

        <nav className={`mobile-menu${menuOpen ? ' open' : ''}`} id="mobileMenu"
          onClick={() => setMenuOpen(false)}>
          <NavA to="/about" href="./#/about">Il Progetto</NavA>
          <NavA to="/contatti" href="./#/contatti">Contatti</NavA>
          {(isAdmin || active === 'admin') && <AdminLink id="adminNavLinkMobile" />}
          <AuthBtn />
          <LangBtn />
        </nav>
      </div>
    </header>
  );
}
