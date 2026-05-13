import { useState } from 'react';
import { addToCalendar, openDirections } from '../utils/eventActions.js';

export function EventCard({ event, categoryInfo, selectedLocation, selectedTag, onFilterByTag, onShowPoster }) {
  const [showDescription, setShowDescription] = useState(false);

  const coords      = event.coordinates;
  const isHighlight = selectedLocation === event.location;

  return (
    <div className={`event-item${isHighlight ? ' highlighted' : ''}`} id={`event-${event.id}`}>
      <div className="event-info">
        <div className="event-title">{categoryInfo.icon} {event.title}</div>
        <div className="event-detail">📅 {event.formattedDate}</div>
        <div className="event-detail">📍 {event.location}</div>

        {event.tags?.length > 0 && (
          <div className="event-tags">
            {event.tags.map(tag => (
              <span key={tag}
                className={`tag${selectedTag === tag ? ' selected' : ''}`}
                onClick={() => onFilterByTag?.(tag)}>
                {tag}
              </span>
            ))}
          </div>
        )}

        <div style={{ marginTop: 8 }}>
          {event.poster && (
            <span className="poster-btn" onClick={() => onShowPoster?.(event.poster)}>
              🖼️ Vedi locandina
            </span>
          )}

          {event.description && (
            <>
              <span className="poster-btn" onClick={() => setShowDescription(v => !v)}>
                📄 Maggiori dettagli
              </span>
              {showDescription && (
                <div style={{ marginTop: 10, padding: 10, background: '#f9f9f9', borderRadius: 6, fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {event.description}
                </div>
              )}
            </>
          )}

          {coords && (
            <a href="#" className="directions-btn"
              onClick={e => { e.preventDefault(); openDirections(coords.lat, coords.lng, event.location, event.location); }}>
              🧭 Indicazioni
            </a>
          )}
        </div>
      </div>

      <div className="event-actions">
        <button className="btn btn-small" onClick={() => addToCalendar(event)}>
          ➕ Aggiungi
        </button>
        <button className="btn btn-small btn-outline"
          onClick={() => window.open(categoryInfo.whatsappLink, '_blank')}>
          {categoryInfo.icon} Chat
        </button>
      </div>
    </div>
  );
}
