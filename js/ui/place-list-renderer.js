/**
 * PlaceListRenderer - Place List UI Rendering
 *
 * Renders the list of places with interactive elements (description, hours, website, etc.).
 *
 * Dependencies: EventBus, StateManager, OpeningHoursParser, PlaceCategoryIcons
 */

import { eventBus } from '../core/event-bus.js';
import { state } from '../core/state-manager.js';
import { openingHoursParser } from '../utils/opening-hours-parser.js';
import { PLACE_CATEGORY_ICONS, PLACE_CATEGORY_NAMES } from '../config/constants.js';

export class PlaceListRenderer {
  constructor(eventBusInstance, stateManager, hoursParser) {
    this.eventBus = eventBusInstance;
    this.state = stateManager;
    this.openingHoursParser = hoursParser;
    this.categoryIcons = PLACE_CATEGORY_ICONS;
    this.categoryNames = PLACE_CATEGORY_NAMES;
  }

  /**
   * Initialize place list renderer
   */
  initialize() {
    // Subscribe to filter events
    this.eventBus.on('filters:applied', () => {
      this.render();
    });

    // Expose functions to window for onclick handlers
    window.togglePlaceDescription = (placeId) => this.togglePlaceDescription(placeId);
    window.togglePlaceHours = (placeId) => this.togglePlaceHours(placeId);
    window.centerMapOnPlace = (lat, lng) => {
      this.eventBus.emit('map:centerOn', { lat, lng });
    };

    console.log('✅ PlaceListRenderer initialized');
  }

  /**
   * Render place list
   */
  render() {
    const placeList = document.getElementById('placeList');

    if (!placeList) {
      console.warn('⚠️ Place list element not found');
      return;
    }

    const filteredPlaces = this.state.get('filteredPlaces');

    // Clear list
    placeList.innerHTML = '';

    // Show message if no places
    if (filteredPlaces.length === 0) {
      placeList.innerHTML = '<p style="text-align: center; color: #666;">Nessun luogo trovato.</p>';
      return;
    }

    // Render each place
    filteredPlaces.forEach(place => {
      const placeItem = this._createPlaceElement(place);
      placeList.appendChild(placeItem);
    });
  }

  /**
   * Create place element
   * @param {Object} place - Place object
   * @returns {HTMLElement} Place element
   */
  _createPlaceElement(place) {
    const placeItem = document.createElement('div');
    placeItem.className = 'event-item place-item';
    placeItem.id = `place-${place.id}`;

    const icon = this.categoryIcons[place.category] || '📍';
    const catName = this.categoryNames[place.category] || 'Altro';

    // Build description toggle
    const descriptionHtml = place.description
      ? `<span class="poster-btn" onclick="togglePlaceDescription(${place.id})">📄 Dettagli</span>
         <div id="place-desc-${place.id}" style="display: none; margin-top: 10px; padding: 10px; background: #f9f9f9; border-radius: 6px; font-size: 0.9rem; line-height: 1.6;">${place.description}</div>`
      : '';

    // Build opening hours toggle
    const openingHoursHtml = place.openingHours
      ? `<span class="poster-btn" onclick="togglePlaceHours(${place.id})">🕐 Orari</span>
         <div id="place-hours-${place.id}" style="display: none;" class="opening-hours">
           <div class="opening-hours-title">Orari di apertura</div>
           <div class="hours-grid">
             ${this.openingHoursParser.formatForDisplay(place.openingHours)}
           </div>
         </div>`
      : '';

    // Build website link
    const websiteHtml = place.website
      ? `<a href="${place.website}" target="_blank" rel="noopener noreferrer" class="directions-btn" style="background: var(--accent-primary); text-decoration: none;">🌐 Sito Web</a>`
      : '';

    // Build image button
    const imageHtml = place.image
      ? `<span class="poster-btn" onclick="showPoster('${place.image}')">🖼️ Immagine</span>`
      : '';

    // Build directions link
    const directionsHtml = `<a href="#" class="directions-btn" onclick="openDirections(${place.coordinates.lat}, ${place.coordinates.lng}, '${place.name.replace(/'/g, "\\'")}', '${place.address.replace(/'/g, "\\'")}'); return false;">🧭 Indicazioni</a>`;

    // Build inner HTML
    placeItem.innerHTML = `
      <div class="event-info">
        <div class="event-title">${icon} ${place.name}</div>
        <div class="event-detail"><span class="place-category">${catName}</span></div>
        <div class="event-detail">📍 ${place.address}</div>
        <div style="margin-top: 8px;">
          ${descriptionHtml}
          ${openingHoursHtml}
          ${websiteHtml}
          ${imageHtml}
          ${directionsHtml}
        </div>
      </div>
      <div class="event-actions">
        <button class="btn btn-small btn-outline" onclick="centerMapOnPlace(${place.coordinates.lat}, ${place.coordinates.lng})">🗺️ Mostra su mappa</button>
      </div>
    `;

    return placeItem;
  }

  /**
   * Toggle place description visibility
   * @param {number} placeId - Place ID
   */
  togglePlaceDescription(placeId) {
    const descElement = document.getElementById(`place-desc-${placeId}`);
    if (descElement) {
      if (descElement.style.display === 'none') {
        descElement.style.display = 'block';
      } else {
        descElement.style.display = 'none';
      }
    }
  }

  /**
   * Toggle place hours visibility
   * @param {number} placeId - Place ID
   */
  togglePlaceHours(placeId) {
    const hoursElement = document.getElementById(`place-hours-${placeId}`);
    if (hoursElement) {
      if (hoursElement.style.display === 'none') {
        hoursElement.style.display = 'block';
      } else {
        hoursElement.style.display = 'none';
      }
    }
  }

  /**
   * Scroll to place in list
   * @param {number} placeId - Place ID
   */
  scrollToPlace(placeId) {
    const placeElement = document.getElementById(`place-${placeId}`);
    if (placeElement) {
      placeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      placeElement.classList.add('highlighted');

      // Remove highlight after animation
      setTimeout(() => {
        placeElement.classList.remove('highlighted');
      }, 2000);
    }
  }
}

// Export singleton instance
export const placeListRenderer = new PlaceListRenderer(
  eventBus,
  state,
  openingHoursParser
);
