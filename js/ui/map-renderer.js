/**
 * MapRenderer - Leaflet Map Rendering and Management
 *
 * Manages the Leaflet map with event and place markers, popups, and geolocation.
 *
 * Dependencies: EventBus, StateManager, DateFormatter, CategoriesLoader,
 *               PlaceCategoryIcons, GeolocationService, CalendarExport, DateFilter
 */

import { eventBus } from '../core/event-bus.js';
import { state } from '../core/state-manager.js';
import { dateFormatter } from '../utils/date-formatter.js';
import { categoriesLoader } from '../data/categories-loader.js';
import { geolocationService } from '../utils/geolocation-service.js';
import { calendarExport } from '../utils/calendar-export.js';
import { dateFilter } from '../filters/date-filter.js';
import { PLACE_CATEGORY_ICONS, MAP_CONFIG, MARKER_STYLES, EVENT_CATEGORY_COLORS, PLACE_CATEGORY_COLORS, EVENT_CATEGORIES, PLACE_CATEGORIES } from '../config/constants.js';
import { openingHoursParser } from '../utils/opening-hours-parser.js';

export class MapRenderer {
  constructor(
    eventBusInstance,
    stateManager,
    formatter,
    categories,
    geoService,
    calExport,
    dateFilterInstance
  ) {
    this.eventBus = eventBusInstance;
    this.state = stateManager;
    this.dateFormatter = formatter;
    this.categoriesLoader = categories;
    this.geolocationService = geoService;
    this.calendarExport = calExport;
    this.dateFilter = dateFilterInstance;
    this.placeCategoryIcons = PLACE_CATEGORY_ICONS;
    this.mapConfig = MAP_CONFIG;
    this.markerStyles = MARKER_STYLES;
    this.map = null;
  }

  /**
   * Initialize map renderer
   */
  initialize() {
    // Subscribe to filter events
    this.eventBus.on('filters:applied', () => {
      this.render();
    });

    // Subscribe to toggle view events
    this.eventBus.on('view:toggled', () => {
      this.render();
    });

    // Subscribe to center on place
    this.eventBus.on('map:centerOn', (data) => {
      this.centerOn(data.lat, data.lng);
    });

    // Expose locateUser to window for onclick handlers
    window.locateUser = () => this.locateUser();

    console.log('✅ MapRenderer initialized');
  }

  /**
   * Initialize Leaflet map
   */
  initializeMap() {
    if (this.map) {
      return; // Already initialized
    }

    const mapEl = document.getElementById('map');
    if (!mapEl) {
      console.warn('⚠️ Map element not found');
      return;
    }

    this.map = L.map('map').setView(
      [this.mapConfig.defaultCenter.lat, this.mapConfig.defaultCenter.lng],
      this.mapConfig.defaultZoom
    );

    L.tileLayer(this.mapConfig.tileLayerUrl, {
      attribution: this.mapConfig.tileLayerAttribution,
      maxZoom: this.mapConfig.maxZoom,
      minZoom: this.mapConfig.minZoom
    }).addTo(this.map);

    // Store map in state
    this.state.set('map', this.map);

    this.eventBus.emit('map:initialized');
    console.log('✅ Leaflet map initialized');
  }

  /**
   * Tell Leaflet to recalculate its container size (e.g. after fullscreen toggle)
   */
  invalidateSize() {
    if (this.map) {
      this.map.invalidateSize();
    }
  }

  /**
   * Render map with markers
   */
  render() {
    // Initialize map if not done yet
    if (!this.map) {
      this.initializeMap();
    }

    if (!this.map) {
      return;
    }

    // Clear existing markers
    this._clearMarkers();

    const showEvents = this.state.get('showEvents');
    const showPlaces = this.state.get('showPlaces');
    const filteredEvents = this.state.get('filteredEvents');
    const filteredPlaces = this.state.get('filteredPlaces');

    // Render event markers
    if (showEvents && filteredEvents.length > 0) {
      this._renderEventMarkers(filteredEvents);
    }

    // Render place markers
    if (showPlaces && filteredPlaces.length > 0) {
      this._renderPlaceMarkers(filteredPlaces);
    }

    // Fit bounds to show all markers
    this._fitBounds();

    // Update legend
    this._updateLegend(
      showEvents ? filteredEvents : [],
      showPlaces ? filteredPlaces : []
    );
  }

  /**
   * Update map legend with visible categories
   */
  _updateLegend(events, places) {
    const legend = document.getElementById('mapLegend');
    if (!legend) return;

    const eventCats = [...new Set(events.map(e => e.category))];
    const placeCats = [...new Set(places.map(p => p.category))];

    const rows = [];

    if (eventCats.length > 0) {
      rows.push('<div style="font-weight:600; margin-bottom:4px; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.05em; color:#555;">Eventi</div>');
      eventCats.forEach(cat => {
        const color = EVENT_CATEGORY_COLORS[cat] || EVENT_CATEGORY_COLORS['altro'];
        const name = EVENT_CATEGORIES[cat]?.name || cat;
        rows.push(`<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0;"></span>
          <span style="font-size:0.72rem;white-space:nowrap;">${name}</span>
        </div>`);
      });
    }

    if (placeCats.length > 0) {
      if (eventCats.length > 0) rows.push('<div style="height:6px;"></div>');
      rows.push('<div style="font-weight:600; margin-bottom:4px; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.05em; color:#555;">Luoghi</div>');
      placeCats.forEach(cat => {
        const color = PLACE_CATEGORY_COLORS[cat] || PLACE_CATEGORY_COLORS['altro'];
        const name = PLACE_CATEGORIES[cat]?.name || cat;
        rows.push(`<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0;"></span>
          <span style="font-size:0.72rem;white-space:nowrap;">${name}</span>
        </div>`);
      });
    }

    legend.innerHTML = rows.join('');
    legend.style.display = rows.length > 0 ? 'block' : 'none';
  }

  /**
   * Clear all markers from map
   */
  _clearMarkers() {
    // Clear event markers
    const markers = this.state.get('markers');
    markers.forEach(marker => this.map.removeLayer(marker));
    this.state.set('markers', []);

    // Clear place markers
    const placeMarkers = this.state.get('placeMarkers');
    placeMarkers.forEach(marker => this.map.removeLayer(marker));
    this.state.set('placeMarkers', []);
  }

  /**
   * Render event markers
   * @param {Array} events - Events to render
   */
  _renderEventMarkers(events) {
    const markers = [];
    const selectedLocation = this.state.get('selectedLocation');

    events.forEach(event => {
      const isSelected = selectedLocation === event.location;
      const icon = this._createEventIcon(event.category, isSelected);

      const marker = L.marker(
        [event.coordinates.lat, event.coordinates.lng],
        { icon }
      ).addTo(this.map);

      // Create popup content
      const popupContent = this._createEventPopup(event);
      marker.bindPopup(popupContent);

      // Click handler
      marker.on('click', () => {
        this._handleEventMarkerClick(event);
      });

      markers.push(marker);
    });

    this.state.set('markers', markers);
  }

  /**
   * Render place markers
   * @param {Array} places - Places to render
   */
  _renderPlaceMarkers(places) {
    const placeMarkers = [];

    places.forEach(place => {
      const icon = this._createPlaceIcon(place);

      const marker = L.marker(
        [place.coordinates.lat, place.coordinates.lng],
        { icon }
      ).addTo(this.map);

      // Create popup content with offset
      const popupContent = this._createPlacePopup(place);
      marker.bindPopup(popupContent, {
        offset: [0, -20] // Offset in alto di 20px
      });

      // Click handler
      marker.on('click', () => {
        this._handlePlaceMarkerClick(place);
      });

      placeMarkers.push(marker);
    });

    this.state.set('placeMarkers', placeMarkers);
  }

  /**
   * Create event marker icon
   * @param {boolean} isSelected - Is marker selected
   * @returns {L.DivIcon} Leaflet icon
   */
  _createEventIcon(category, isSelected) {
    const size = isSelected ? 14 : 10;
    const color = EVENT_CATEGORY_COLORS[category] || EVENT_CATEGORY_COLORS['altro'];
    const shadow = isSelected ? '0 0 0 3px rgba(255,255,255,0.8), 0 3px 10px rgba(0,0,0,0.4)' : '0 1px 4px rgba(0,0,0,0.35)';

    const html = `<div style="
      background: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      box-shadow: ${shadow};
    "></div>`;

    return L.divIcon({
      className: 'custom-marker',
      html,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  }

  /**
   * Create place marker icon
   * @param {Object} place - Place object
   * @returns {L.DivIcon} Leaflet icon
   */
  _createPlaceIcon(place) {
    const size = 10;
    const color = PLACE_CATEGORY_COLORS[place.category] || PLACE_CATEGORY_COLORS['altro'];

    const html = `<div style="
      background: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      box-shadow: 0 1px 4px rgba(0,0,0,0.35);
    "></div>`;

    return L.divIcon({
      className: 'custom-marker',
      html,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  }

  /**
   * Create event popup content
   * @param {Object} event - Event object
   * @returns {string} HTML content
   */
  _createEventPopup(event) {
    const categoryInfo = this.categoriesLoader.getCategoryInfo(event.category);
    const tagsHtml = event.tags
      ? event.tags.map(tag => `<span style="background: #fef3c7; color: #78350f; padding: 2px 8px; border-radius: 8px; font-size: 0.75rem; margin-right: 3px;">${tag}</span>`).join('')
      : '';

    const posterBtn = event.poster
      ? `<button onclick="showPoster('${event.poster}')" style="width: 100%; padding: 8px; margin-top: 5px; background: #c9a200; color: #1a1410; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">🖼️ Locandina</button>`
      : '';

    return `
      <div style="min-width: 200px; font-family: 'JetBrains Mono', 'Courier New', monospace;">
        <h4 style="margin-bottom: 8px;">${categoryInfo.icon} ${event.title}</h4>
        <p style="font-size: 0.875rem; margin-bottom: 5px;">📅 ${this.dateFormatter.formatEventDate(event)}</p>
        <p style="font-size: 0.875rem; margin-bottom: 8px;">📍 ${event.location}</p>
        <div style="margin-bottom: 8px;">${tagsHtml}</div>
        ${posterBtn}
        <button onclick='addToCalendar(${JSON.stringify(event).replace(/'/g, "&#39;")})' style="width: 100%; padding: 8px; margin-top: 5px; background: #c9a200; color: #1a1410; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">➕ Aggiungi</button>
        <button onclick="openDirections(${event.coordinates.lat}, ${event.coordinates.lng}, '${event.location.replace(/'/g, "\\'")}', '${event.location.replace(/'/g, "\\'")}') " style="width: 100%; padding: 8px; margin-top: 5px; background: #34a853; color: white; border: none; border-radius: 6px; cursor: pointer;">🧭 Indicazioni</button>
        <button onclick="window.open('${categoryInfo.whatsappLink}', '_blank')" style="width: 100%; padding: 8px; margin-top: 5px; background: #c9a200; color: #1a1410; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">${categoryInfo.icon} Chat</button>
      </div>
    `;
  }

  /**
   * Create place popup content
   * @param {Object} place - Place object
   * @returns {string} HTML content
   */
  _createPlacePopup(place) {
    const icon = this.placeCategoryIcons[place.category] || '📍';

    const websiteBtn = place.website
      ? `<a href="${place.website}" target="_blank" rel="noopener noreferrer" style="display: block; width: 100%; padding: 8px; margin-top: 5px; background: var(--accent-primary); color: white; border: none; border-radius: 6px; cursor: pointer; text-align: center; text-decoration: none;">🌐 Sito Web</a>`
      : '';

    let hoursHtml = '';
    if (place.openingHours) {
      const status = openingHoursParser.getStatusMessage(place);
      const isOpen = openingHoursParser.isOpenNow(place);
      const nextInfo = openingHoursParser.getNextOpeningTime(place);
      const statusColor = isOpen ? '#16a34a' : '#dc2626';
      const now = new Date();
      const currentDay = openingHoursParser.daysOfWeek[now.getDay()];
      const todayHours = place.openingHours[currentDay];
      hoursHtml = `
        <div style="margin-bottom: 8px; padding: 6px 8px; background: #f5f0e0; border-radius: 6px; font-size: 0.8rem;">
          <span style="color: ${statusColor}; font-weight: 600;">🕐 ${status}</span>
          ${todayHours && todayHours.toLowerCase() !== 'su appuntamento' ? `<span style="color: #555; margin-left: 6px;">${todayHours}</span>` : ''}
          ${nextInfo ? `<div style="color: #888; margin-top: 2px;">${nextInfo}</div>` : ''}
        </div>`;
    }

    const imageBtn = place.image
      ? `<button onclick="showPoster('${place.image}')" style="width: 100%; padding: 8px; margin-top: 5px; background: #92400e; color: white; border: none; border-radius: 6px; cursor: pointer;">🖼️ Immagine</button>`
      : '';

    return `
      <div style="min-width: 200px; font-family: 'JetBrains Mono', 'Courier New', monospace;">
        <h4 style="margin-bottom: 8px; color: #92400e;">${icon} ${place.name}</h4>
        <p style="font-size: 0.875rem; margin-bottom: 8px;">📍 ${place.address}</p>
        ${place.description ? `<p style="font-size: 0.8rem; color: #666; margin-bottom: 8px;">${place.description.substring(0, 100)}${place.description.length > 100 ? '...' : ''}</p>` : ''}
        ${hoursHtml}
        ${websiteBtn}
        ${imageBtn}
        <button onclick="openDirections(${place.coordinates.lat}, ${place.coordinates.lng}, '${place.name.replace(/'/g, "\\'")}', '${place.address.replace(/'/g, "\\'")}') " style="width: 100%; padding: 8px; margin-top: 5px; background: #34a853; color: white; border: none; border-radius: 6px; cursor: pointer;">🧭 Indicazioni</button>
      </div>
    `;
  }

  /**
   * Handle event marker click
   * @param {Object} event - Event object
   */
  _handleEventMarkerClick(event) {
    const selectedLocation = this.state.get('selectedLocation');

    if (selectedLocation === event.location) {
      // Deselect location
      this.dateFilter.clearLocation();
    } else {
      // Select location
      this.dateFilter.selectLocation(event.location);
    }

    // Scroll to event in list
    this.eventBus.emit('event:scrollTo', { eventId: event.id });
  }

  /**
   * Handle place marker click
   * @param {Object} place - Place object
   */
  _handlePlaceMarkerClick(place) {
    // Scroll to place in list
    this.eventBus.emit('place:scrollTo', { placeId: place.id });
  }

  /**
   * Fit map bounds to show all markers
   */
  _fitBounds() {
    const markers = this.state.get('markers');
    const placeMarkers = this.state.get('placeMarkers');
    const allMarkers = [...markers, ...placeMarkers];

    if (allMarkers.length > 0) {
      const group = L.featureGroup(allMarkers);
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  /**
   * Center map on specific coordinates
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} zoom - Zoom level (optional)
   */
  centerOn(lat, lng, zoom = 16) {
    if (this.map) {
      this.map.setView([lat, lng], zoom);

      // Scroll map into view
      const mapEl = document.getElementById('map');
      if (mapEl) {
        mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  /**
   * Locate user and center map on user position
   */
  async locateUser() {
    const locateBtn = document.getElementById('locateBtnNew') || document.getElementById('locateBtn');

    if (locateBtn) {
      locateBtn.classList.add('loading');
    }

    try {
      const position = await this.geolocationService.getCurrentPosition();

      // Center map on user location with higher zoom
      this.centerOn(position.lat, position.lng, 16);

      // Add or update user marker
      this._updateUserMarker(position.lat, position.lng);

      if (locateBtn) {
        locateBtn.classList.remove('loading');
      }

      console.log('📍 User located:', position.lat, position.lng);
    } catch (error) {
      alert('Impossibile ottenere la tua posizione. Assicurati di aver concesso i permessi di geolocalizzazione.');

      if (locateBtn) {
        locateBtn.classList.remove('loading');
      }

      console.error('❌ Geolocation error:', error);
    }
  }

  /**
   * Update user marker on map
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   */
  _updateUserMarker(lat, lng) {
    // Remove existing user marker
    const existingMarker = this.state.get('userMarker');
    if (existingMarker) {
      this.map.removeLayer(existingMarker);
    }

    // Create user icon
    const userIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div style="background: #4285f4; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    // Add new user marker
    const userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(this.map);
    userMarker.bindPopup('<div style="text-align: center;"><strong>Dove sono</strong></div>');

    this.state.set('userMarker', userMarker);
  }

  /**
   * Get map instance
   * @returns {L.Map|null} Leaflet map instance
   */
  getMap() {
    return this.map;
  }
}

// Export singleton instance
export const mapRenderer = new MapRenderer(
  eventBus,
  state,
  dateFormatter,
  categoriesLoader,
  geolocationService,
  calendarExport,
  dateFilter
);
