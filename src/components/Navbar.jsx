import { useState, useEffect, useRef } from 'react';
import { Settings, User, Menu, X, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useInSPA } from '../contexts/SPAContext.jsx';
import { useTranslation } from '../utils/useTranslation.js';

function activePage() {
  const path  = window.location.pathname;
  const hash  = window.location.hash; // e.g. "#/about" with HashRouter
  if (path.endsWith('about.html') || path === '/about' || hash === '#/about') return 'project';
  if (path.endsWith('contatti.html') || path === '/contatti' || hash === '#/contatti') return 'contacts';
  if (path.endsWith('admin.html')) return 'admin';
  return null;
}

export function Navbar() {
  const { name, isAdmin, showAdminLink: showAdmin } = useAuth();
  const inSPA = useInSPA();
  const [menuOpen, setMenuOpen] = useState(false);
  const { t, lang } = useTranslation();
  const active = activePage();
  const menuRef = useRef(null);
  const hamburgerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleOutside(e) {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        hamburgerRef.current && !hamburgerRef.current.contains(e.target)
      ) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [menuOpen]);

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

  const AuthBtn = ({ mobile }) => (
    <button type="button"
      className={`auth-nav-btn${name ? ' logged-in' : ''}${mobile ? ' mobile' : ''}`}
      title={name ?? ''}
      onClick={() => { window.openAuthModal?.(); setMenuOpen(false); }}>
      <User size={mobile ? 18 : 16} />
      <span>{name ?? t('auth.login.btn')}</span>
    </button>
  );

  const LangBtn = ({ mobile }) => (
    <button type="button"
      className={`lang-toggle-btn${mobile ? ' mobile' : ''}`}
      onClick={() => window.i18n?.toggle()}>
      <Globe size={mobile ? 16 : 14} />
      <span>{lang === 'it' ? 'EN' : 'IT'}</span>
    </button>
  );

  return (
    <header>
      <div className="header-content">
        <div className="logo">
          <div className="logo-inner">
            <NavA to="/" href="./">Espedienti a Napoli</NavA>
            <span id="heroSubtitle" className="logo-subtitle"></span>
          </div>
        </div>

        <button type="button" className={`hamburger${menuOpen ? ' is-open' : ''}`}
          id="hamburgerBtn" ref={hamburgerRef}
          aria-label={menuOpen ? 'Chiudi menu' : 'Apri menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(o => !o)}>
          <span className="hamburger-icon">
            <Menu size={20} className="ham-open" />
            <X    size={20} className="ham-close" />
          </span>
        </button>

        <nav className="nav-links">
          <NavA to="/about" href="./#/about" data-nav="project"
            className={active === 'project' ? 'active' : ''}>
            {t('nav.project')}
          </NavA>
          <NavA to="/contatti" href="./#/contatti" data-nav="contacts"
            className={active === 'contacts' ? 'active' : ''}>
            {t('nav.collaborate')}
          </NavA>
          {(showAdmin || active === 'admin') && <AdminLink id="adminNavLink" />}
          <AuthBtn />
          <LangBtn />
        </nav>

        {/* backdrop */}
        {menuOpen && (
          <div className="mobile-menu-backdrop" onClick={() => setMenuOpen(false)} />
        )}

        <nav className={`mobile-menu${menuOpen ? ' open' : ''}`} id="mobileMenu"
          ref={menuRef}>
          <div className="mobile-menu-nav">
            <NavA to="/about" href="./#/about"
              className={active === 'project' ? 'active' : ''}
              onClick={() => setMenuOpen(false)}>
              {t('nav.project')}
            </NavA>
            <NavA to="/contatti" href="./#/contatti"
              className={active === 'contacts' ? 'active' : ''}
              onClick={() => setMenuOpen(false)}>
              {t('nav.collaborate')}
            </NavA>
            {(showAdmin || active === 'admin') && <AdminLink id="adminNavLinkMobile" />}
          </div>
          <div className="mobile-menu-footer">
            <AuthBtn mobile />
            <LangBtn mobile />
          </div>
        </nav>
      </div>
    </header>
  );
}
