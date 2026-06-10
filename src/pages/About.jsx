import { useLayoutEffect } from 'react';
import { useInSPA } from '../contexts/SPAContext.jsx';
import { Link } from 'react-router-dom';

export function About() {
  const inSPA = useInSPA();

  useLayoutEffect(() => {
    window.i18n?.applyToDOM();
    window.lucide?.createIcons();
    document.title = 'Chi Siamo - Espedienti a Napoli';
  });

  const HomeLink = ({ children, className }) =>
    inSPA
      ? <Link to="/" className={className}>{children}</Link>
      : <a href="/" className={className}>{children}</a>;

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <h1 data-i18n="about.title">Chi Siamo</h1>
          <p data-i18n="about.hero.desc">Espedienti a Napoli nasce con l'obiettivo di abbattere le barriere culturali e tecnologiche, rendendo semplice scoprire cosa succede nella tua città e trovare compagni di avventure</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="about-content">
            <h2 data-i18n="about.mission.title">La Nostra Mission</h2>
            <p data-i18n="about.mission.p1">In un'epoca dove la tecnologia può allontanare le persone, crediamo che possa anche avvicinarle. Espedienti è la piattaforma che trasforma la scoperta di eventi culturali in un'esperienza sociale.</p>
            <p data-i18n="about.mission.p2">Che tu sia appena arrivato in città o viva qui da sempre, vogliamo aiutarti a scoprire nuove esperienze e incontrare persone con interessi simili ai tuoi.</p>
          </div>

          <h2 className="section-title" data-i18n="about.howItWorks">Come Funziona</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"><i data-lucide="calendar"></i></div>
              <h3 data-i18n="about.feature1.title">Calendario Condiviso</h3>
              <p data-i18n="about.feature1.desc">Visualizza tutti gli eventi della tua città in un unico calendario. Mai più occasioni perse!</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><i data-lucide="map"></i></div>
              <h3 data-i18n="about.feature2.title">Mappa Interattiva</h3>
              <p data-i18n="about.feature2.desc">Scopri eventi vicino a te con la nostra mappa. Clicca sui marker per vedere i dettagli.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><i data-lucide="users"></i></div>
              <h3 data-i18n="about.feature3.title">Trova Compagni</h3>
              <p data-i18n="about.feature3.desc">Usa le chat per organizzarti con altre persone e partecipare insieme agli eventi.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><i data-lucide="calendar-plus"></i></div>
              <h3 data-i18n="about.feature4.title">Aggiungi al Tuo Calendario</h3>
              <p data-i18n="about.feature4.desc">Con un click aggiungi gli eventi che ti interessano al tuo Google Calendar personale.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><i data-lucide="message-circle"></i></div>
              <h3 data-i18n="about.feature5.title">Chat per Interessi</h3>
              <p data-i18n="about.feature5.desc">Community organizzate per tema: musica, teatro, mostre e altro ancora.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><i data-lucide="bell"></i></div>
              <h3 data-i18n="about.feature6.title">Sempre Aggiornato</h3>
              <p data-i18n="about.feature6.desc">Iscriviti alla newsletter per ricevere aggiornamenti su nuovi eventi e funzionalità.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="about-content">
            <h2 data-i18n="about.cta.title">Inizia Subito</h2>
            <p data-i18n="about.cta.desc">Scopri cosa succede oggi a Napoli e trova nuovi compagni di avventure!</p>
            <HomeLink className="btn" data-i18n="about.cta.btn">Esplora Gli Eventi</HomeLink>
          </div>
        </div>
      </section>

      <footer>
        <div className="footer-content">
          <p><strong>Espedienti a Napoli</strong></p>
          <p data-i18n="about.footer.tagline">Una piattaforma per scoprire eventi e incontrare persone</p>
          <p className="footer-links">
            <HomeLink>Home</HomeLink> •{' '}
            <a href="/about" data-i18n="about.footer.chiSiamo">Chi Siamo</a> •{' '}
            <a href="/admin.html">Admin</a>
          </p>
        </div>
      </footer>
    </>
  );
}
