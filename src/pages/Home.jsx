import { useEffect, useLayoutEffect, useRef } from 'react';

export function Home({ hidden }) {
  const initialized = useRef(false);

  // Apply i18n + lucide after every render (keeps translations in sync with language switches)
  useLayoutEffect(() => {
    if (!hidden) {
      window.i18n?.applyToDOM();
      window.lucide?.createIcons();
    }
  });

  // One-time initialisation: i18n → app.js
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    import('../../js/i18n/i18n-service.js').then(({ i18n }) => {
      window.i18n = i18n;
      i18n.initialize();
      // Pick a random rotating subtitle
      const el = document.getElementById('heroSubtitle');
      if (el) {
        const subs = window.t ? window.t('hero.subtitles') : [
          "Cosa c'è da fare stanotte?",
          'Napoli non smette mai di sorprenderti.',
          'Scegli come vivere la città.',
          'Ogni angolo ha qualcosa da raccontare.',
          'Dai un senso alla serata.',
          'Un posto per ogni umore.',
          'Lasciati trascinare dalla città.',
          "C'è sempre qualcosa che non sapevi.",
          'La città è tua — esplorala.',
          'Partenope ti aspetta fuori.',
        ];
        el.textContent = subs[Math.floor(Math.random() * subs.length)];
        window.addEventListener('languageChanged', () => {
          const s = window.t('hero.subtitles');
          el.textContent = s[Math.floor(Math.random() * s.length)];
        });
      }
    });

    import('../../js/app.js');

    // Activate first mobile tab
    switchMobileTab('calendar');
  }, []);

  // When home becomes visible again, tell Leaflet to resize
  useEffect(() => {
    if (!hidden) {
      setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
    }
  }, [hidden]);

  function switchMobileTab(tab) {
    const calendarCol = document.getElementById('calendarCol');
    const mapCol      = document.getElementById('mapCol');
    const tabs        = document.querySelectorAll('.mobile-view-tab');
    if (tab === 'calendar') {
      calendarCol?.classList.remove('mobile-hidden');
      mapCol?.classList.add('mobile-hidden');
      tabs[0]?.classList.add('active');
      tabs[1]?.classList.remove('active');
    } else {
      mapCol?.classList.remove('mobile-hidden');
      calendarCol?.classList.add('mobile-hidden');
      tabs[1]?.classList.add('active');
      tabs[0]?.classList.remove('active');
      setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
    }
  }
  // Expose for onclick attributes in the rendered HTML
  window.switchMobileTab = switchMobileTab;

  return (
    <div style={hidden ? { display: 'none' } : undefined}>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-content">
          <h1 data-i18n="hero.title">Cosa facciamo oggi a Napoli?</h1>
          <p id="heroSubtitle" data-i18n="hero.subtitle.default">Events, luoghi e persone</p>
          <div className="hero-buttons">
            <button className="btn btn-white"
              onClick={() => document.getElementById('map')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
              <i data-lucide="map"></i><span data-i18n="hero.btn.map">Esplora la mappa</span>
            </button>
            <button className="btn btn-white"
              onClick={() => document.getElementById('calendar')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
              <i data-lucide="calendar"></i><span data-i18n="hero.btn.calendar">Vedi calendario</span>
            </button>
            <button className="btn btn-outline"
              onClick={() => document.getElementById('community')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
              <i data-lucide="message-circle"></i><span data-i18n="hero.btn.community">Community</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Main content ──────────────────────────────────────── */}
      <div className="container" id="events">
        <div id="localWarning" style={{ display: 'none', background: '#fff3cd', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '2px solid #ffeaa7' }}>
          <strong><i data-lucide="alert-triangle" style={{ width: 14, height: 14, strokeWidth: 2, verticalAlign: 'middle', marginRight: 4 }}></i>Modalità Locale Rilevata</strong>
          <p style={{ margin: '10px 0 0 0', fontSize: '0.9rem' }}>
            Stai visualizzando il sito dal file system. Gli eventi mostrati sono di esempio.
            Per vedere i tuoi eventi, usa un server locale: <code>python -m http.server 8000</code>
          </p>
        </div>

        <div className="search-wrapper">
          <i data-lucide="search"></i>
          <input
            type="text"
            className="search-bar"
            id="searchBar"
            data-i18n-placeholder="search.placeholder"
            placeholder="Cerca per nome evento, data (YYYY-MM-DD), nome luogo o #tag"
          />
        </div>

        <div className="mobile-view-tabs" id="mobileViewTabs">
          <button type="button" className="mobile-view-tab active" onClick={() => switchMobileTab('calendar')}>
            <i data-lucide="calendar"></i><span data-i18n="tabs.calendar">Calendario</span>
          </button>
          <button type="button" className="mobile-view-tab" onClick={() => switchMobileTab('map')}>
            <i data-lucide="map"></i><span data-i18n="tabs.map">Mappa</span>
          </button>
        </div>

        <div className="grid">
          {/* Calendar column */}
          <div className="grid-col" id="calendarCol">
            <div className="category-filters show" id="eventCategoryFilters">
              <div className="filters-title" data-i18n="filters.events.title">Che tipo di eventi cerchi?</div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2><i data-lucide="calendar"></i><span data-i18n="calendar.title">Calendario Eventi</span></h2>
                <div className="calendar-nav">
                  <button type="button" onClick={() => window.changeMonth?.(-1)}>←</button>
                  <span id="monthYear"></span>
                  <button type="button" onClick={() => window.changeMonth?.(1)}>→</button>
                </div>
              </div>
              <div className="card-content card-content--flush">
                <div className="calendar-grid" id="calendar"></div>
              </div>
            </div>

            <div className="search-info-text" data-i18n="quickfilter.hint">
              <i data-lucide="lightbulb" className="lucide-hint"></i> <strong>Suggerimento:</strong> Clicca su un giorno del calendario o su un marker nella mappa per filtrare gli eventi.
            </div>
          </div>

          {/* Map column */}
          <div className="grid-col" id="mapCol">
            <div className="category-filters places-filters show" id="placeCategoryFilters">
              <div className="filters-title" data-i18n="filters.places.title">Che tipo di location cerchi?</div>
            </div>

            <div className="card">
              <div className="card-header card-header--places">
                <h2><i data-lucide="map"></i><span data-i18n="map.title">Mappa Luoghi ed Eventi</span></h2>
              </div>
              <div className="card-content">
                <div className="map-container">
                  <div id="map"></div>
                  <div id="mapLegend" className="map-legend"></div>
                  <div className="map-controls">
                    <button type="button" className="map-control-btn wide" id="locateBtnNew"
                      onClick={() => window.locateUser?.()}
                      data-i18n-title="map.locate.title" title="Trova la mia posizione">
                      <i data-lucide="navigation"></i><span data-i18n="map.locate">Dove sono</span>
                    </button>
                    <button type="button" className="map-control-btn wide" id="openNowBtn"
                      onClick={() => window.filterOpenNow?.()}
                      data-i18n-title="map.openNow.title" title="Mostra solo luoghi aperti ora">
                      <i data-lucide="clock"></i><span data-i18n="map.openNow">Aperti ora</span>
                    </button>
                    <button type="button" className="map-control-btn" id="fullscreenMapBtn"
                      onClick={() => window.toggleMapFullscreen?.()}
                      data-i18n-title="map.fullscreen.title" title="Schermo intero">
                      <i data-lucide="maximize-2"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Unified search results list */}
        <div className="card" id="unifiedCard">
          <div className="card-header card-header--search">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <i data-lucide="search"></i><span id="unifiedTitle" data-i18n="list.title">La Tua Ricerca</span>
            </h2>
          </div>
          <div className="card-content">
            <div className="event-list" id="unifiedList"></div>
          </div>
        </div>

        <div className="search-info" id="searchInfo">
          <div className="quick-filters">
            <button className="reset-filters" onClick={() => window.resetFilters?.()} style={{ display: 'none' }} id="resetBtn">
              <i data-lucide="rotate-ccw"></i><span data-i18n="quickfilter.reset">Reset filtri</span>
            </button>
          </div>
        </div>
      </div>

{/* ── Footer ────────────────────────────────────────────── */}
      <footer>
        <div className="footer-content">
          <p><strong>Espedienti a Napoli</strong></p>
          <p data-i18n="footer.tagline">Una piattaforma per scoprire eventi e conoscere persone nuove</p>
          <p style={{ marginTop: '20px', opacity: 0.7 }} data-i18n="footer.copy">© 2026 - Fatto per la community</p>
        </div>
      </footer>
    </div>
  );
}
