import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export function Home({ hidden }) {
  const initialized   = useRef(false);
  const [tickerEvents, setTickerEvents] = useState([]);

  useLayoutEffect(() => {
    if (!hidden) {
      window.i18n?.applyToDOM();
      window.lucide?.createIcons();
    }
  });

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    import('../../js/i18n/i18n-service.js').then(({ i18n }) => {
      window.i18n = i18n;
      i18n.initialize();
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
    switchMobileTab('calendar');
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const today = new Date().toISOString().slice(0, 10);
      const allEvents = e.detail?.events ?? [];

      const upcoming = allEvents
        .filter(ev => ev.date && ev.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 30);
      setTickerEvents(upcoming);

      // Deep-link: ?event=FIREBASE_ID → auto-open modal
      const eventId = new URLSearchParams(window.location.search).get('event');
      if (eventId) {
        const ev = allEvents.find(ev => (ev.firebaseId || String(ev.id)) === eventId);
        if (ev) window.openDetailModal?.(ev, 'event');
      }
    };
    window.addEventListener('espedienti:eventsLoaded', handler);
    return () => window.removeEventListener('espedienti:eventsLoaded', handler);
  }, []);

  useEffect(() => {
    if (!hidden) setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
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
  window.switchMobileTab = switchMobileTab;

  const makeTickerItems = () => {
    const today = new Date().toISOString().slice(0, 10);
    return tickerEvents.map((ev, i) => {
      const d = new Date(ev.date + 'T00:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
      const time = ev.time?.start ? ` ${ev.time.start}` : '';
      const venue = ev.placeName || ev.location || '';
      const isToday = ev.date === today;
      const happeningLabel = window.t?.('event.happeningToday') ?? 'happening today';
      return (
        <span key={i} className="ticker-item">
          {isToday && <span className="ticker-today-tag">{happeningLabel}</span>}
          <span className="ticker-meta">{d}{time}: </span>
          <button
            type="button"
            className="ticker-btn"
            onClick={() => window.openDetailModal?.(ev, 'event')}
          >
            {ev.title}
          </button>
          {venue && <span className="ticker-meta"> @ {venue}</span>}
          {i < tickerEvents.length - 1 && <span className="ticker-sep">   •   </span>}
        </span>
      );
    });
  };

  return (
    <div style={hidden ? { display: 'none' } : undefined}>

      {/* ── Home header ───────────────────────────────────────── */}
      <header className="home-header">
        <div className="ticker-wrap" aria-live="off">
          {tickerEvents.length > 0 ? (
            <div className="ticker-track">
              <span className="ticker-segment">{makeTickerItems()}</span>
              <span className="ticker-segment" aria-hidden="true">{makeTickerItems()}</span>
            </div>
          ) : (
            <div className="ticker-track ticker-loading">
              <span className="ticker-segment">Caricamento eventi in corso…</span>
            </div>
          )}
        </div>
      </header>

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
