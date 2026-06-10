import { useLayoutEffect, useRef, useState } from 'react';
import { useInSPA } from '../contexts/SPAContext.jsx';
import { Link } from 'react-router-dom';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Contatti() {
  const inSPA = useInSPA();
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const emailRef = useRef(null);

  useLayoutEffect(() => {
    window.i18n?.applyToDOM();
    window.lucide?.createIcons();
    document.title = 'Contatti - Espedienti a Napoli';
  });

  const HomeLink = ({ children, className }) =>
    inSPA
      ? <Link to="/" className={className}>{children}</Link>
      : <a href="/" className={className}>{children}</a>;

  async function handleSubmit(e) {
    e.preventDefault();
    const email = emailRef.current?.value.trim() ?? '';
    if (!emailRegex.test(email)) {
      setStatus('error');
      return;
    }
    setStatus('loading');
    try {
      const { collection, addDoc } = window.firestoreModules;
      await addDoc(collection(window.db, 'newsletter'), {
        email,
        subscribedAt: new Date().toISOString(),
      });
      setStatus('success');
      emailRef.current.value = '';
    } catch {
      setStatus('error');
    }
  }

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <h1 data-i18n="about.contacts.title">Contatti</h1>
          <p data-i18n="about.contacts.p1">Hai una segnalazione di bug, vuoi collaborare al progetto o proporre nuovi eventi?</p>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="about-content">
            <p data-i18n="about.contacts.p2">Scrivici direttamente via email!</p>
            <div className="contact-buttons">
              <a href="mailto:s.esposito.1101@gmail.com?subject=Segnalazione%20Bug%20-%20Espedienti%20a%20Napoli"
                className="btn" data-i18n="about.contacts.bug">
                <i data-lucide="bug" style={{width:'15px',height:'15px',verticalAlign:'-2px',marginRight:'6px'}}></i>Segnala Bug
              </a>
              <a href="mailto:s.esposito.1101@gmail.com?subject=Collaborazione%20-%20Espedienti%20a%20Napoli"
                className="btn btn-outline btn-inline" data-i18n="about.contacts.collab">
                <i data-lucide="mail" style={{width:'15px',height:'15px',verticalAlign:'-2px',marginRight:'6px'}}></i>Collabora
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="newsletter" id="newsletter">
        <div className="newsletter-content">
          <h2 data-i18n="about.newsletter.title">Resta aggiornato</h2>
          <p data-i18n="about.newsletter.desc">Iscriviti alla newsletter per ricevere notifiche sui nuovi eventi e aggiornamenti sulla piattaforma</p>
          <form className="newsletter-form" onSubmit={handleSubmit}>
            <input
              type="email"
              ref={emailRef}
              data-i18n-placeholder="about.newsletter.placeholder"
              placeholder="Il tuo indirizzo email"
              required
            />
            <button type="submit" disabled={status === 'loading'} data-i18n="about.newsletter.btn">
              {status === 'loading' ? 'Iscrizione...' : 'Iscriviti'}
            </button>
          </form>
          {status === 'error' && (
            <div className="newsletter-error" style={{ display: 'block' }} data-i18n="about.newsletter.error">
              Inserisci un indirizzo email valido.
            </div>
          )}
          {status === 'success' && (
            <div className="newsletter-success" style={{ display: 'block' }} data-i18n="about.newsletter.success">
              Grazie per esserti iscritto! Riceverai presto aggiornamenti sui nuovi eventi.
            </div>
          )}
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
