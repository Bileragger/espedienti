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
import { PLACE_CATEGORY_ICONS, MAP_CONFIG, MARKER_STYLES } from '../config/constants.js';

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
      const icon = this._createEventIcon(isSelected);

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
  _createEventIcon(isSelected) {
    const style = isSelected
      ? this.markerStyles.event.selected
      : this.markerStyles.event.default;

    const html = `
      <div style="
        background: ${style.background};
        width: ${style.width}px;
        height: ${style.height}px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 ${isSelected ? '4px 16px' : '2px 8px'} rgba(0,0,0,0.3);
      ">
        <div style="
          position: absolute;
          width: ${Math.floor(style.width / 2)}px;
          height: ${Math.floor(style.height / 2)}px;
          background: white;
          border-radius: 50%;
          top: ${Math.floor(style.width / 4)}px;
          left: ${Math.floor(style.height / 4)}px;
        "></div>
      </div>
    `;

    return L.divIcon({
      className: 'custom-marker',
      html,
      iconSize: [style.width, style.height],
      iconAnchor: [style.width / 2, style.height]
    });
  }

  /**
   * Create place marker icon
   * @param {Object} place - Place object
   * @returns {L.DivIcon} Leaflet icon
   */
  _createPlaceIcon(place) {
    const icon = this.placeCategoryIcons[place.category] || '📍';
    const style = this.markerStyles.place;

    const html = `
      <div style="
        background: ${style.background};
        width: ${style.width}px;
        height: ${style.height}px;
        border-radius: ${style.borderRadius}px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${style.fontSize}px;
      ">${icon}</div>
    `;

    return L.divIcon({
      className: 'custom-marker',
      html,
      iconSize: [style.width, style.height],
      iconAnchor: [style.width / 2, style.height]
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
      ? `<button onclick="showPoster('${event.poster}')" style="width: 100%; padding: 8px; margin-top: 5px; background: #f59e0b; color: white; border: none; border-radius: 6px; cursor: pointer;">🖼️ Locandina</button>`
      : '';

    return `
      <div style="min-width: 200px;">
        <h4 style="margin-bottom: 8px;">${categoryInfo.icon} ${event.title}</h4>
        <p style="font-size: 0.875rem; margin-bottom: 5px;">📅 ${this.dateFormatter.formatEventDate(event)}</p>
        <p style="font-size: 0.875rem; margin-bottom: 8px;">📍 ${event.location}</p>
        <div style="margin-bottom: 8px;">${tagsHtml}</div>
        ${posterBtn}
        <button onclick='addToCalendar(${JSON.stringify(event).replace(/'/g, "&#39;")})' style="width: 100%; padding: 8px; margin-top: 5px; background: #f59e0b; color: white; border: none; border-radius: 6px; cursor: pointer;">➕ Aggiungi</button>
        <button onclick="openDirections(${event.coordinates.lat}, ${event.coordinates.lng}, '${event.location.replace(/'/g, "\\'")}', '${event.location.replace(/'/g, "\\'")}') " style="width: 100%; padding: 8px; margin-top: 5px; background: #34a853; color: white; border: none; border-radius: 6px; cursor: pointer;">🧭 Indicazioni</button>
        <button onclick="window.open('${categoryInfo.whatsappLink}', '_blank')" style="width: 100%; padding: 8px; margin-top: 5px; background: white; color: #f59e0b; border: 2px solid #f59e0b; border-radius: 6px; cursor: pointer;">${categoryInfo.icon} Chat</button>
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

    const imageBtn = place.image
      ? `<button onclick="showPoster('${place.image}')" style="width: 100%; padding: 8px; margin-top: 5px; background: #92400e; color: white; border: none; border-radius: 6px; cursor: pointer;">🖼️ Immagine</button>`
      : '';

    return `
      <div style="min-width: 200px;">
        <h4 style="margin-bottom: 8px; color: #92400e;">${icon} ${place.name}</h4>
        <p style="font-size: 0.875rem; margin-bottom: 8px;">📍 ${place.address}</p>
        ${place.description ? `<p style="font-size: 0.8rem; color: #666; margin-bottom: 8px;">${place.description.substring(0, 100)}${place.description.length > 100 ? '...' : ''}</p>` : ''}
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
