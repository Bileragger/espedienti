import { useState } from 'react';

export function PlaceCard({ place, categoryIcons, categoryNames, formatOpeningHours }) {
  const [showDescription, setShowDescription] = useState(false);
  const [showHours, setShowHours] = useState(false);

  const icon = categoryIcons?.[place.category] ?? '📍';
  const catName = categoryNames?.[place.category] ?? 'Altro';
  const coords = place.coordinates;

  return (
    <div className="event-item place-item" id={`place-${place.id}`}>
      <div className="event-info">
        <div className="event-title">{icon} {place.name}</div>
        <div className="event-detail">
          <span className="place-category">{catName}</span>
        </div>
        <div className="event-detail">📍 {place.address}</div>

        <div style={{ marginTop: 8 }}>
          {place.description && (
            <>
              <span className="poster-btn" onClick={() => setShowDescription(v => !v)}>
                📄 Dettagli
              </span>
              {showDescription && (
                <div style={{ marginTop: 10, padding: 10, background: '#f9f9f9', borderRadius: 6, fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {place.description}
                </div>
              )}
            </>
          )}

          {place.openingHours && (
            <>
              <span className="poster-btn" onClick={() => setShowHours(v => !v)}>
                🕐 Orari
              </span>
              {showHours && (
                <div className="opening-hours">
                  <div className="opening-hours-title">Orari di apertura</div>
                  <div
                    className="hours-grid"
                    dangerouslySetInnerHTML={{ __html: formatOpeningHours?.(place.openingHours) ?? '' }}
                  />
                </div>
              )}
            </>
          )}

          {place.image && (
            <span className="poster-btn" onClick={() => window.showPoster?.(place.image)}>
              🖼️ Immagine
            </span>
          )}

          {place.website && (
            <a href={place.website} target="_blank" rel="noopener noreferrer"
              className="directions-btn" style={{ background: 'var(--accent-primary)', textDecoration: 'none' }}>
              🌐 Sito Web
            </a>
          )}

          {coords && (
            <a href="#" className="directions-btn"
              onClick={e => { e.preventDefault(); window.openDirections?.(coords.lat, coords.lng, place.name, place.address); }}>
              🧭 Indicazioni
            </a>
          )}
        </div>
      </div>

      <div className="event-actions">
        {coords && (
          <button className="btn btn-small btn-outline"
            onClick={() => window.centerMapOnPlace?.(coords.lat, coords.lng)}>
            🗺️ Mostra su mappa
          </button>
        )}
      </div>
    </div>
  );
}
