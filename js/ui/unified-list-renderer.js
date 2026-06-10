/**
 * UnifiedListRenderer - Combined Events + Places List
 *
 * Renders a single list with events (sorted by date asc) followed by places
 * (sorted by name asc), with section headers and shared pagination.
 *
 * Dependencies: EventBus, StateManager, DateFormatter, CategoriesLoader,
 *               DateFilter, OpeningHoursParser, PlaceCategoryIcons
 */

import { eventBus } from '../core/event-bus.js';
import { state } from '../core/state-manager.js';
import { dateFormatter } from '../utils/date-formatter.js';
import { categoriesLoader } from '../data/categories-loader.js';
import { dateFilter } from '../filters/date-filter.js';
import { openingHoursParser } from '../utils/opening-hours-parser.js';
import { PLACE_CATEGORY_ICONS, PLACE_CATEGORY_NAMES } from '../config/constants.js';

export class UnifiedListRenderer {
  constructor(eventBusInstance, stateManager, formatter, categories, dateFilterInstance, hoursParser) {
    this.eventBus = eventBusInstance;
    this.state = stateManager;
    this.dateFormatter = formatter;
    this.categoriesLoader = categories;
    this.dateFilter = dateFilterInstance;
    this.openingHoursParser = hoursParser;
    this.categoryIcons = PLACE_CATEGORY_ICONS;
    this.categoryNames = PLACE_CATEGORY_NAMES;
    this.currentPage = 1;
    this.itemsPerPage = 8;
  }

  initialize() {
    this.eventBus.on('filters:applied', () => {
      this.currentPage = 1;
      this.render();
    });

    // Map marker clicks → scroll + highlight list card
    this.eventBus.on('event:scrollTo', ({ eventId }) => this.scrollToEvent(eventId));
    this.eventBus.on('place:scrollTo', ({ placeId }) => this.scrollToPlace(placeId));

    // Re-render when language changes so dynamic strings update
    window.addEventListener('languageChanged', () => this.render());

    // Window handlers (used by inline onclick in rendered HTML)
    window.filterByTag = (tag) => this.dateFilter.selectTag(tag);
    window.addToCalendar = (event) => this._addToCalendar(event);
    window.showPoster = () => {}; // no-op — replaced by DetailModal
    window.openDirections = (lat, lng, name, addr) => this._openDirections(lat, lng, name, addr);
    window.centerMapOnPlace = (lat, lng) => this.eventBus.emit('map:centerOn', { lat, lng });

    // Show skeletons while data loads
    this._showSkeletons();

    console.log('✅ UnifiedListRenderer initialized');
  }

  _showSkeletons() {
    const container = document.getElementById('unifiedList');
    if (!container) return;
    container.innerHTML = Array.from({ length: 4 }, () => `
      <div class="event-item skeleton-card">
        <div class="event-info">
          <div class="skeleton-line" style="width:60%;height:1rem;margin-bottom:10px;"></div>
          <div class="skeleton-line" style="width:40%;height:0.8rem;margin-bottom:6px;"></div>
          <div class="skeleton-line" style="width:50%;height:0.8rem;"></div>
        </div>
        <div class="event-actions">
          <div class="skeleton-line" style="width:120px;height:2rem;border-radius:6px;"></div>
        </div>
      </div>
    `).join('');
  }

  _createIcons() {
    if (window.lucide) window.lucide.createIcons();
  }

  render() {
    const container = document.getElementById('unifiedList');
    const title = document.getElementById('unifiedTitle') || document.querySelector('[id="unifiedTitle"]');
    if (!container) return;

    const filteredEvents = this.state.get('filteredEvents') || [];
    const filteredPlaces = this.state.get('filteredPlaces') || [];
    const total = filteredEvents.length + filteredPlaces.length;

    if (title) {
      title.textContent = window.t
        ? window.t('list.title.full', filteredEvents.length, filteredPlaces.length)
        : `La Tua Ricerca (${filteredEvents.length} eventi, ${filteredPlaces.length} luoghi)`;
    }

    container.innerHTML = '';

    if (total === 0) {
      const msg = window.t ? window.t('list.empty') : 'Nessun risultato trovato.';
      container.innerHTML = `<p style="text-align:center;color:#666;padding:20px;">${msg}</p>`;
      return;
    }

    // Sort events by date asc, places by name asc
    const sortedEvents = [...filteredEvents].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const sortedPlaces = [...filteredPlaces].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'it'));

    // Build combined array with type tag
    const items = [
      ...sortedEvents.map(e => ({ _type: 'event', _data: e })),
      ...sortedPlaces.map(p => ({ _type: 'place', _data: p }))
    ];

    // Pagination
    const totalPages = Math.ceil(items.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const pageItems = items.slice(startIndex, startIndex + this.itemsPerPage);

    const selectedLocation = this.state.get('selectedLocation');
    const selectedTag = this.state.get('selectedTag');

    // Section header tracking
    let lastType = null;

    pageItems.forEach(item => {
      // Insert section header when type changes
      if (item._type !== lastType) {
        const header = document.createElement('div');
        header.className = 'unified-section-header';
        header.textContent = window.t
          ? window.t(item._type === 'event' ? 'list.section.events' : 'list.section.places')
          : (item._type === 'event' ? 'Eventi' : 'Luoghi');
        container.appendChild(header);
        lastType = item._type;
      }

      const el = item._type === 'event'
        ? this._createEventElement(item._data, selectedLocation, selectedTag)
        : this._createPlaceElement(item._data);
      container.appendChild(el);
    });

    this._renderPagination(container, totalPages);
    this._createIcons();
  }

  _createEventElement(event, selectedLocation, selectedTag) {
    const el = document.createElement('div');
    el.className = 'event-item';
    el.id = `event-${event.id}`;
    el.style.cursor = 'pointer';
    if (selectedLocation === event.location) el.classList.add('highlighted');

    const categoryInfo = this.categoriesLoader.getCategoryInfo(event.category);
    const tagsHtml = event.tags ? event.tags.map(tag =>
      `<span class="tag ${selectedTag === tag ? 'selected' : ''}">${tag}</span>`
    ).join('') : '';

    const t = window.t || (k => k);
    const catColor = (window.categoryColors?.eventColors?.[event.category]) || '#c9a200';
    const catDot = `<span class="cat-dot" style="background:${catColor};"></span>`;
    const eventJson = JSON.stringify(event).replace(/'/g, '&#39;');

    el.innerHTML = `
      <div class="event-info">
        <div class="event-title">${catDot}${event.title}</div>
        <div class="event-detail"><i data-lucide="calendar" class="lucide-detail"></i>${this.dateFormatter.formatEventDate(event)}</div>
        <div class="event-detail"><i data-lucide="map-pin" class="lucide-detail"></i>${event.location}</div>
        <div class="event-tags">${tagsHtml}</div>
      </div>
      <div class="event-actions">
        <button class="btn btn-small" onclick="event.stopPropagation();addToCalendar(${eventJson})">${t('item.addCalendar')}</button>
        <button class="btn btn-small btn-outline" onclick="event.stopPropagation();window.open('${categoryInfo.whatsappLink}','_blank')">${categoryInfo.icon} ${t('item.chat')}</button>
      </div>
    `;
    el.addEventListener('click', () => window.openDetailModal?.(event, 'event'));
    el.addEventListener('mouseenter', () => window.highlightMarker?.(event.id, 'event', true));
    el.addEventListener('mouseleave', () => window.highlightMarker?.(event.id, 'event', false));
    return el;
  }

  _createPlaceElement(place) {
    const el = document.createElement('div');
    el.className = 'event-item place-item';
    el.id = `place-${place.id}`;
    el.style.cursor = 'pointer';

    const catName = this.categoryNames[place.primaryCategory || place.category] || 'Altro';
    const catColor = (window.categoryColors?.placeColors?.[place.primaryCategory || place.category]) || '#92400e';
    const catDot = `<span class="cat-dot" style="background:${catColor};"></span>`;

    const t = window.t || (k => k);

    let statusBadge = '';
    if (place.openingHours) {
      const isOpen = this.openingHoursParser.isOpenNow(place);
      const label = isOpen ? t('status.open') : t('status.closed');
      const color = isOpen ? '#16a34a' : '#dc2626';
      statusBadge = `<span style="display:inline-block;font-size:0.65rem;font-weight:700;padding:1px 6px;border-radius:10px;background:${color};color:#fff;vertical-align:middle;margin-left:6px;text-transform:uppercase;letter-spacing:0.04em;">${label}</span>`;
    }

    const placeCoords = place.coordinates;

    el.innerHTML = `
      <div class="event-info">
        <div class="event-title">${catDot}${place.name}${statusBadge}</div>
        <div class="event-detail"><span class="place-category">${catName}</span></div>
        <div class="event-detail"><i data-lucide="map-pin" class="lucide-detail"></i>${place.address}</div>
      </div>
      <div class="event-actions">
        ${placeCoords ? `<button class="btn btn-small btn-outline" onclick="event.stopPropagation();centerMapOnPlace(${placeCoords.lat},${placeCoords.lng})">${t('item.showOnMap')}</button>` : ''}
      </div>
    `;
    el.addEventListener('click', () => window.openDetailModal?.(place, 'place'));
    el.addEventListener('mouseenter', () => window.highlightMarker?.(place.id, 'place', true));
    el.addEventListener('mouseleave', () => window.highlightMarker?.(place.id, 'place', false));
    return el;
  }

  _toggle(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
  }

  _addToCalendar(event) {
    const startDate = event.date.replace(/-/g, '');
    const endDate = event.dateEnd ? event.dateEnd.replace(/-/g, '') : startDate;
    let dates = startDate;
    if (event.time?.start) {
      const s = event.time.start.replace(':', '');
      const e = event.time.end ? event.time.end.replace(':', '') : s;
      dates = `${startDate}T${s}00/${event.dateEnd ? endDate : startDate}T${e}00`;
    } else {
      dates = `${startDate}/${endDate}`;
    }
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${dates}&location=${encodeURIComponent(event.location)}&details=${event.description ? encodeURIComponent(event.description) : ''}`;
    window.open(url, '_blank');
  }

  _openDirections(lat, lng, name, addr) {
    const dest = addr?.trim() ? encodeURIComponent(addr) : `${lat},${lng}`;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      window.location.href = `maps://maps.apple.com/?daddr=${dest}&q=${encodeURIComponent(name)}`;
      setTimeout(() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, '_blank'), 500);
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, '_blank');
    }
  }

  _renderPagination(container, totalPages) {
    if (totalPages <= 1) return;

    const div = document.createElement('div');
    div.style.cssText = 'display:flex;justify-content:center;align-items:center;gap:10px;margin-top:20px;padding:15px;';

    const t = window.t || (k => k);
    const prev = document.createElement('button');
    prev.className = 'btn btn-small';
    prev.textContent = t('list.pagination.prev');
    prev.disabled = this.currentPage === 1;
    prev.style.cssText = `opacity:${this.currentPage === 1 ? '0.5' : '1'};min-width:70px;`;
    prev.onclick = () => this._changePage(this.currentPage - 1);

    const info = document.createElement('span');
    info.style.cssText = 'color:var(--text-secondary);font-size:0.9rem;flex:1;text-align:center;';
    info.textContent = t('list.pagination.info', this.currentPage, totalPages);

    const next = document.createElement('button');
    next.className = 'btn btn-small';
    next.textContent = t('list.pagination.next');
    next.disabled = this.currentPage === totalPages;
    next.style.cssText = `opacity:${this.currentPage === totalPages ? '0.5' : '1'};min-width:70px;`;
    next.onclick = () => this._changePage(this.currentPage + 1);

    div.append(prev, info, next);
    container.appendChild(div);
  }

  _changePage(page) {
    const total = (this.state.get('filteredEvents')?.length || 0) + (this.state.get('filteredPlaces')?.length || 0);
    const totalPages = Math.ceil(total / this.itemsPerPage);
    if (page < 1 || page > totalPages) return;
    this.currentPage = page;
    this.render();
    document.getElementById('unifiedList')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  scrollToEvent(eventId) {
    this._scrollToItem(`event-${eventId}`);
  }

  scrollToPlace(placeId) {
    this._scrollToItem(`place-${placeId}`);
  }

  _scrollToItem(id) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('highlighted');
      setTimeout(() => el.classList.remove('highlighted'), 2000);
    }
  }
}

export const unifiedListRenderer = new UnifiedListRenderer(
  eventBus,
  state,
  dateFormatter,
  categoriesLoader,
  dateFilter,
  openingHoursParser
);
