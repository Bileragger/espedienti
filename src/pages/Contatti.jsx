import { useLayoutEffect, useRef, useState } from 'react';
import { useInSPA } from '../contexts/SPAContext.jsx';
import { useTranslation } from '../utils/useTranslation.js';
import { Link } from 'react-router-dom';
import {
  Palette, TrendingUp, Code2, Binoculars, CheckCircle2,
  Mail, Bug, Handshake, Send, ChevronRight,
} from 'lucide-react';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function saveToFirestore(collection, data) {
  const { collection: col, addDoc } = window.firestoreModules;
  await addDoc(col(window.db, collection), {
    ...data,
    createdAt: new Date().toISOString(),
  });
}

export function Contatti() {
  const inSPA = useInSPA();
  const { t } = useTranslation();
  const formRef = useRef(null);

  const [selectedRole, setSelectedRole] = useState('');
  const [appStatus,    setAppStatus]    = useState('idle');  // idle | loading | success | error
  const [nlStatus,     setNlStatus]     = useState('idle');
  const [bugStatus,    setBugStatus]    = useState('idle');

  const [appForm, setAppForm] = useState({ nome: '', email: '', portfolio: '', lettera: '' });
  const [nlEmail, setNlEmail] = useState('');
  const [bugForm, setBugForm] = useState({ titolo: '', device: '', desc: '' });

  const ROLES = [
    {
      id: 'designer',
      label: 'UI/UX Designer',
      icon: Palette,
      color: '#0284c7',
      benefit: t('collab.role.designer.benefit'),
      desc: t('collab.role.designer.desc'),
    },
    {
      id: 'marketing',
      label: 'Social & Marketing',
      icon: TrendingUp,
      color: '#d97706',
      benefit: t('collab.role.marketing.benefit'),
      desc: t('collab.role.marketing.desc'),
    },
    {
      id: 'developer',
      label: 'Developer React / Flutter',
      icon: Code2,
      color: '#7c3aed',
      benefit: t('collab.role.developer.benefit'),
      desc: t('collab.role.developer.desc'),
    },
    {
      id: 'hunter',
      label: 'PR & Event Hunter',
      icon: Binoculars,
      color: '#16a34a',
      benefit: t('collab.role.hunter.benefit'),
      desc: t('collab.role.hunter.desc'),
    },
  ];

  useLayoutEffect(() => {
    document.title = t('collab.pageTitle');
  });

  const HomeLink = ({ children, className }) =>
    inSPA
      ? <Link to="/" className={className}>{children}</Link>
      : <a href="/" className={className}>{children}</a>;

  function selectRole(id) {
    setSelectedRole(id);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  async function handleApplication(e) {
    e.preventDefault();
    if (!emailRegex.test(appForm.email)) { setAppStatus('error'); return; }
    setAppStatus('loading');
    try {
      await saveToFirestore('applications', {
        ...appForm,
        ruolo: selectedRole || 'non specificato',
      });
      setAppStatus('success');
      setAppForm({ nome: '', email: '', portfolio: '', lettera: '' });
      setSelectedRole('');
    } catch { setAppStatus('error'); }
  }

  async function handleNewsletter(e) {
    e.preventDefault();
    if (!emailRegex.test(nlEmail)) { setNlStatus('error'); return; }
    setNlStatus('loading');
    try {
      await saveToFirestore('newsletter_subscribers', { email: nlEmail });
      setNlStatus('success');
      setNlEmail('');
    } catch { setNlStatus('error'); }
  }

  async function handleBug(e) {
    e.preventDefault();
    setBugStatus('loading');
    try {
      await saveToFirestore('bug_reports', bugForm);
      setBugStatus('success');
      setBugForm({ titolo: '', device: '', desc: '' });
    } catch { setBugStatus('error'); }
  }

  const selectedRoleMeta = ROLES.find(r => r.id === selectedRole);

  return (
    <>
      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="about-hero">
        <div className="about-hero-content">
          <span className="about-hero-eyebrow">{t('collab.hero.eyebrow')}</span>
          <h1 className="about-hero-title">
            {t('collab.hero.title1')}<br />
            {t('collab.hero.title2')}
          </h1>
          <p className="about-hero-sub">{t('collab.hero.sub')}</p>
        </div>
      </section>

      {/* ── ROLE CARDS ────────────────────────────────────────────────── */}
      <section className="about-section">
        <div className="container">
          <div className="about-section-header">
            <h2 className="about-section-title">{t('collab.roles.title')}</h2>
            <p className="about-section-sub">{t('collab.roles.sub')}</p>
          </div>

          <div className="role-cards">
            {ROLES.map(role => {
              const Icon = role.icon;
              const active = selectedRole === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  className={`role-card${active ? ' role-card--active' : ''}`}
                  style={{ '--role-color': role.color }}
                  onClick={() => selectRole(role.id)}
                >
                  <div className="role-card-icon">
                    <Icon size={28} />
                  </div>
                  <div className="role-card-body">
                    <h3 className="role-card-title">{role.label}</h3>
                    <p className="role-card-desc">{role.desc}</p>
                    <div className="role-card-benefit">
                      <CheckCircle2 size={13} />
                      <span>{role.benefit}</span>
                    </div>
                  </div>
                  <div className="role-card-arrow">
                    <ChevronRight size={18} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── APPLICATION FORM ──────────────────────────────────────────── */}
      <section className="about-section about-section--alt" ref={formRef}>
        <div className="container">
          <div className="about-section-header">
            <h2 className="about-section-title">
              {selectedRoleMeta
                ? t('collab.form.titleWithRole', selectedRoleMeta.label)
                : t('collab.form.title')}
            </h2>
            <p className="about-section-sub">{t('collab.form.sub')}</p>
          </div>

          {appStatus === 'success' ? (
            <div className="form-success-box">
              <CheckCircle2 size={36} />
              <h3>{t('collab.form.success.title')}</h3>
              <p>
                {t('collab.form.success.textBefore', appForm.nome.split(' ')[0])}
                <HomeLink>{t('collab.form.success.exploreLink')}</HomeLink>
                {t('collab.form.success.textAfter')}
              </p>
              <button className="btn" onClick={() => setAppStatus('idle')}>
                {t('collab.form.success.btn')}
              </button>
            </div>
          ) : (
            <form className="collab-form" onSubmit={handleApplication}>
              <div className="collab-form-row">
                <div className="collab-form-group">
                  <label htmlFor="appNome">{t('collab.form.nome.label')}</label>
                  <input
                    id="appNome" type="text" required
                    placeholder={t('collab.form.nome.placeholder')}
                    value={appForm.nome}
                    onChange={e => setAppForm(p => ({ ...p, nome: e.target.value }))}
                  />
                </div>
                <div className="collab-form-group">
                  <label htmlFor="appEmail">{t('collab.form.email.label')}</label>
                  <input
                    id="appEmail" type="email" required
                    placeholder="la@tua.email"
                    value={appForm.email}
                    onChange={e => setAppForm(p => ({ ...p, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="collab-form-group">
                <label htmlFor="appRuolo">{t('collab.form.role.label')}</label>
                <select
                  id="appRuolo" required
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value)}
                >
                  <option value="">{t('collab.form.role.placeholder')}</option>
                  {ROLES.map(r => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                  <option value="altro">{t('collab.form.role.other')}</option>
                </select>
              </div>

              <div className="collab-form-group">
                <label htmlFor="appPortfolio">
                  {t('collab.form.portfolio.label')}
                  <span className="form-optional">{t('collab.form.portfolio.optional')}</span>
                </label>
                <input
                  id="appPortfolio" type="url"
                  placeholder="https://..."
                  value={appForm.portfolio}
                  onChange={e => setAppForm(p => ({ ...p, portfolio: e.target.value }))}
                />
              </div>

              <div className="collab-form-group">
                <label htmlFor="appLettera">{t('collab.form.lettera.label')}</label>
                <textarea
                  id="appLettera" required rows={5}
                  placeholder={t('collab.form.lettera.placeholder')}
                  value={appForm.lettera}
                  onChange={e => setAppForm(p => ({ ...p, lettera: e.target.value }))}
                />
              </div>

              {appStatus === 'error' && (
                <p className="form-error-msg">{t('collab.form.error')}</p>
              )}

              <button type="submit" className="btn collab-submit" disabled={appStatus === 'loading'}>
                {appStatus === 'loading' ? t('collab.form.submitting') : (
                  <><Send size={15} /> {t('collab.form.submit')}</>
                )}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── SECONDARY GRID ────────────────────────────────────────────── */}
      <section className="about-section">
        <div className="container">
          <div className="secondary-grid">

            {/* Newsletter */}
            <div className="secondary-card">
              <div className="secondary-card-header">
                <Mail size={20} />
                <h3>{t('collab.newsletter.title')}</h3>
              </div>
              <p>{t('collab.newsletter.desc')}</p>
              {nlStatus === 'success' ? (
                <div className="mini-success">
                  <CheckCircle2 size={16} /> {t('collab.newsletter.success')}
                </div>
              ) : (
                <form className="mini-form" onSubmit={handleNewsletter}>
                  <input
                    type="email" required
                    placeholder={t('collab.newsletter.placeholder')}
                    value={nlEmail}
                    onChange={e => setNlEmail(e.target.value)}
                  />
                  <button type="submit" className="btn btn-small" disabled={nlStatus === 'loading'}>
                    {nlStatus === 'loading' ? t('collab.newsletter.loading') : t('collab.newsletter.btn')}
                  </button>
                  {nlStatus === 'error' && <p className="form-error-msg">{t('collab.newsletter.error')}</p>}
                </form>
              )}
            </div>

            {/* Bug Report */}
            <div className="secondary-card">
              <div className="secondary-card-header">
                <Bug size={20} />
                <h3>{t('collab.bug.title')}</h3>
              </div>
              <p>{t('collab.bug.desc')}</p>
              {bugStatus === 'success' ? (
                <div className="mini-success">
                  <CheckCircle2 size={16} /> {t('collab.bug.success')}
                </div>
              ) : (
                <form className="mini-form mini-form--col" onSubmit={handleBug}>
                  <input
                    type="text" required
                    placeholder={t('collab.bug.titlePlaceholder')}
                    value={bugForm.titolo}
                    onChange={e => setBugForm(p => ({ ...p, titolo: e.target.value }))}
                  />
                  <input
                    type="text"
                    placeholder={t('collab.bug.devicePlaceholder')}
                    value={bugForm.device}
                    onChange={e => setBugForm(p => ({ ...p, device: e.target.value }))}
                  />
                  <textarea
                    rows={3} required
                    placeholder={t('collab.bug.descPlaceholder')}
                    value={bugForm.desc}
                    onChange={e => setBugForm(p => ({ ...p, desc: e.target.value }))}
                  />
                  <button type="submit" className="btn btn-small" disabled={bugStatus === 'loading'}>
                    {bugStatus === 'loading' ? t('collab.bug.loading') : t('collab.bug.btn')}
                  </button>
                  {bugStatus === 'error' && <p className="form-error-msg">{t('collab.bug.error')}</p>}
                </form>
              )}
            </div>

            {/* Host & Artist */}
            <div className="secondary-card secondary-card--info">
              <div className="secondary-card-header">
                <Handshake size={20} />
                <h3>{t('collab.hostartist.title')}</h3>
              </div>
              <p dangerouslySetInnerHTML={{ __html: t('collab.hostartist.p1') }} />
              <p dangerouslySetInnerHTML={{ __html: t('collab.hostartist.p2') }} />
              <p className="secondary-card-note">{t('collab.hostartist.note')}</p>
            </div>

          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer>
        <div className="footer-content">
          <p><strong>Espedienti a Napoli</strong></p>
          <p>{t('about.footer.coop')}</p>
          <p className="footer-links">
            <HomeLink>Home</HomeLink> •{' '}
            <a href="./#/about">{t('about.footer.about')}</a> •{' '}
            <a href="./#/contatti">{t('about.footer.collab')}</a> •{' '}
            <a href="/admin.html">Admin</a>
          </p>
        </div>
      </footer>
    </>
  );
}
