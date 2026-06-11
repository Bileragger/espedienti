import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Clock, ExternalLink, Navigation, Calendar, MessageCircle, Building2 } from 'lucide-react';
import { dateFormatter } from '../../js/utils/date-formatter.js';
import { openingHoursParser } from '../../js/utils/opening-hours-parser.js';
import { categoriesLoader } from '../../js/data/categories-loader.js';
import { PLACE_CATEGORY_NAMES } from '../../js/config/constants.js';

export function DetailModal() {
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState(null);
  const [type, setType] = useState('event');

  useEffect(() => {
    window.openDetailModal  = (data, t) => { setItem(data); setType(t); setOpen(true); };
    window.closeDetailModal = () => setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  if (!open || !item) return null;

  return createPortal(
    <div className="modal detail-modal show" onClick={() => setOpen(false)}>
      <div className="detail-modal-content" onClick={e => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={() => setOpen(false)}>&times;</button>
        {type === 'event'
          ? <EventDetail item={item} />
          : <PlaceDetail item={item} />
        }
      </div>
    </div>,
    document.body
  );
}

// ── Event ────────────────────────────────────────────────────────────────────

function EventDetail({ item }) {
  const catColor = window.categoryColors?.eventColors?.[item.category] ?? '#c9a200';
  const categoryInfo = categoriesLoader.getCategoryInfo(item.category);
  const coords = item.coordinates;

  return (
    <>
      {item.poster && (
        <img className="detail-modal-poster" src={item.poster} alt={item.title} />
      )}
      <div className="detail-modal-body">
        <div className="detail-modal-title">
          <span className="cat-dot" style={{ background: catColor }} />
          {item.title}
        </div>

        <div className="detail-modal-meta">
          <div className="detail-modal-meta-row">
            <Calendar size={14} />
            <span>{dateFormatter.formatEventDate(item)}</span>
          </div>
          <div className="detail-modal-meta-row">
            <MapPin size={14} />
            <span>{item.location}</span>
          </div>
          {item.placeName && (
            <div className="detail-modal-meta-row">
              <Building2 size={14} />
              <button type="button" className="place-link-btn"
                onClick={() => window.openPlaceFromEvent?.(item.placeId)}>
                {item.placeName}
              </button>
            </div>
          )}
        </div>

        {item.tags?.length > 0 && (
          <div className="detail-modal-tags">
            {item.tags.map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        )}

        {item.description && (
          <div className="detail-modal-desc">{item.description}</div>
        )}

        <div className="detail-modal-actions">
          <button type="button" className="btn btn-small"
            onClick={() => window.addToCalendar?.(item)}>
            <Calendar size={14} /> Aggiungi al Calendario
          </button>
          {coords && (
            <button type="button" className="btn btn-small btn-outline"
              onClick={() => window.openDirections?.(coords.lat, coords.lng, item.location, item.location)}>
              <Navigation size={14} /> Indicazioni
            </button>
          )}
          {categoryInfo?.whatsappLink && (
            <a className="btn btn-small btn-outline"
              href={categoryInfo.whatsappLink} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={14} /> {categoryInfo.icon} Chat
            </a>
          )}
        </div>
      </div>
    </>
  );
}

// ── Place ────────────────────────────────────────────────────────────────────

function PlaceDetail({ item }) {
  const coords = item.coordinates;
  const catName = PLACE_CATEGORY_NAMES[item.primaryCategory || item.category] ?? 'Altro';
  const catColor = window.categoryColors?.placeColors?.[item.primaryCategory || item.category] ?? '#92400e';

  const isOpen   = item.openingHours ? openingHoursParser.isOpenNow(item) : null;
  const hoursHtml = item.openingHours
    ? openingHoursParser.formatForDisplay(item.openingHours)
    : null;

  return (
    <>
      {item.image && (
        <img className="detail-modal-poster" src={item.image} alt={item.name} />
      )}
      <div className="detail-modal-body">
        <div className="detail-modal-title">
          <span className="cat-dot" style={{ background: catColor }} />
          {item.name}
          {isOpen !== null && (
            <span style={{
              fontSize: '0.65rem', fontWeight: 700,
              padding: '1px 6px', borderRadius: 10,
              background: isOpen ? '#16a34a' : '#dc2626',
              color: '#fff', marginLeft: 8, verticalAlign: 'middle',
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              {isOpen ? 'Aperto' : 'Chiuso'}
            </span>
          )}
        </div>

        <div className="detail-modal-meta">
          <div className="detail-modal-meta-row">
            <span className="place-category">{catName}</span>
          </div>
          <div className="detail-modal-meta-row">
            <MapPin size={14} />
            <span>{item.address}</span>
          </div>
        </div>

        {hoursHtml && (
          <div className="opening-hours" style={{ marginBottom: 12 }}>
            <div className="opening-hours-title">
              <Clock size={13} /> Orari
            </div>
            <div className="hours-grid"
              dangerouslySetInnerHTML={{ __html: hoursHtml }} />
          </div>
        )}

        {item.description && (
          <div className="detail-modal-desc">{item.description}</div>
        )}

        <div className="detail-modal-actions">
          {coords && (
            <button type="button" className="btn btn-small btn-outline"
              onClick={() => window.openDirections?.(coords.lat, coords.lng, item.name, item.address)}>
              <Navigation size={14} /> Indicazioni
            </button>
          )}
          {item.website && (
            <a className="btn btn-small btn-outline"
              href={item.website} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={14} /> Sito Web
            </a>
          )}
          {coords && (
            <button type="button" className="btn btn-small"
              onClick={() => { window.closeDetailModal?.(); window.centerMapOnPlace?.(coords.lat, coords.lng); }}>
              <MapPin size={14} /> Mostra sulla Mappa
            </button>
          )}
        </div>
      </div>
    </>
  );
}
