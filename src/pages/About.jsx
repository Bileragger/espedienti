import { useLayoutEffect } from 'react';
import { useInSPA } from '../contexts/SPAContext.jsx';
import { useTranslation } from '../utils/useTranslation.js';
import { Link } from 'react-router-dom';
import {
  Camera, Cpu, ShieldCheck, Heart, Coins, Handshake, MapPin,
  ArrowRight, Sparkles, Users, Star,
} from 'lucide-react';

export function About() {
  const inSPA = useInSPA();
  const { t } = useTranslation();

  useLayoutEffect(() => {
    document.title = t('about.pageTitle');
  });

  const HomeLink = ({ children, className }) =>
    inSPA
      ? <Link to="/" className={className}>{children}</Link>
      : <a href="/" className={className}>{children}</a>;

  const ContattiLink = ({ children, className }) =>
    inSPA
      ? <Link to="/contatti" className={className}>{children}</Link>
      : <a href="./#/contatti" className={className}>{children}</a>;

  return (
    <>
      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="about-hero">
        <div className="about-hero-content">
          <span className="about-hero-eyebrow">{t('about.hero.eyebrow')}</span>
          <h1 className="about-hero-title">
            {t('about.hero.title1')}<br />
            {t('about.hero.title2')}
          </h1>
          <p className="about-hero-sub">{t('about.hero.sub')}</p>
          <div className="about-hero-actions">
            <HomeLink className="btn">{t('about.hero.btn.explore')}</HomeLink>
            <ContattiLink className="btn btn-outline">{t('about.hero.btn.collaborate')}</ContattiLink>
          </div>
        </div>
      </section>

      {/* ── MANIFESTO ─────────────────────────────────────────────────── */}
      <section className="about-section">
        <div className="container">
          <div className="about-section-header">
            <h2 className="about-section-title">{t('about.manifesto.title')}</h2>
            <p className="about-section-sub">{t('about.manifesto.sub')}</p>
          </div>

          <div className="manifesto-grid">
            <div className="manifesto-card">
              <div className="manifesto-icon manifesto-icon--gold">
                <Coins size={26} />
              </div>
              <h3>{t('about.manifesto.card1.title')}</h3>
              <p>{t('about.manifesto.card1.body')}</p>
            </div>

            <div className="manifesto-card">
              <div className="manifesto-icon manifesto-icon--amber">
                <Cpu size={26} />
              </div>
              <h3>{t('about.manifesto.card2.title')}</h3>
              <p>{t('about.manifesto.card2.body')}</p>
            </div>

            <div className="manifesto-card">
              <div className="manifesto-icon manifesto-icon--green">
                <Handshake size={26} />
              </div>
              <h3>{t('about.manifesto.card3.title')}</h3>
              <p>{t('about.manifesto.card3.body')}</p>
            </div>

            <div className="manifesto-card">
              <div className="manifesto-icon manifesto-icon--orange">
                <MapPin size={26} />
              </div>
              <h3>{t('about.manifesto.card4.title')}</h3>
              <p>{t('about.manifesto.card4.body')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PIPELINE ──────────────────────────────────────────────────── */}
      <section className="about-section about-section--alt">
        <div className="container">
          <div className="about-section-header">
            <h2 className="about-section-title">{t('about.pipeline.title')}</h2>
            <p className="about-section-sub">{t('about.pipeline.sub')}</p>
          </div>

          <div className="pipeline">
            <div className="pipeline-step">
              <div className="pipeline-step-num">01</div>
              <div className="pipeline-step-icon">
                <Camera size={32} />
              </div>
              <h3>{t('about.pipeline.step1.title')}</h3>
              <p dangerouslySetInnerHTML={{ __html: t('about.pipeline.step1.body') }} />
              <span className="pipeline-tag">{t('about.pipeline.step1.tag')}</span>
            </div>

            <div className="pipeline-arrow"><ArrowRight size={22} /></div>

            <div className="pipeline-step">
              <div className="pipeline-step-num">02</div>
              <div className="pipeline-step-icon">
                <Cpu size={32} />
              </div>
              <h3>{t('about.pipeline.step2.title')}</h3>
              <p dangerouslySetInnerHTML={{ __html: t('about.pipeline.step2.body') }} />
              <span className="pipeline-tag">{t('about.pipeline.step2.tag')}</span>
            </div>

            <div className="pipeline-arrow"><ArrowRight size={22} /></div>

            <div className="pipeline-step">
              <div className="pipeline-step-num">03</div>
              <div className="pipeline-step-icon">
                <ShieldCheck size={32} />
              </div>
              <h3>{t('about.pipeline.step3.title')}</h3>
              <p dangerouslySetInnerHTML={{ __html: t('about.pipeline.step3.body') }} />
              <span className="pipeline-tag">{t('about.pipeline.step3.tag')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── MEET HUB TEASER ───────────────────────────────────────────── */}
      <section className="meet-hub-teaser">
        <div className="container">
          <div className="meet-hub-inner">
            <div className="meet-hub-badge">
              <Sparkles size={13} /> {t('about.meethub.badge')}
            </div>
            <h2 className="meet-hub-title">Espedienti Meet Hub</h2>
            <p className="meet-hub-tagline">
              {t('about.meethub.tagline1')}<br />
              {t('about.meethub.tagline2')}
            </p>
            <p className="meet-hub-desc"
              dangerouslySetInnerHTML={{ __html: t('about.meethub.desc1') }} />
            <p className="meet-hub-desc"
              dangerouslySetInnerHTML={{ __html: t('about.meethub.desc2') }} />
            <div className="meet-hub-pillars">
              <div className="meet-hub-pillar">
                <Users size={18} />
                <span>{t('about.meethub.pillar1')}</span>
              </div>
              <div className="meet-hub-pillar">
                <Star size={18} />
                <span>{t('about.meethub.pillar2')}</span>
              </div>
              <div className="meet-hub-pillar">
                <Heart size={18} />
                <span>{t('about.meethub.pillar3')}</span>
              </div>
            </div>
            <ContattiLink className="btn meet-hub-cta">
              {t('about.meethub.cta')}
            </ContattiLink>
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
