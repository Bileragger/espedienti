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
    this.currentPage = 1;
    this.itemsPerPage = 5;
  }

  /**
   * Initialize place list renderer
   */
  initialize() {
    // Subscribe to filter events
    this.eventBus.on('filters:applied', () => {
      this.currentPage = 1; // Reset to first page on filter change
      this.render();
    });

    // Expose functions to window for onclick handlers
    window.togglePlaceDescription = (placeId) => this.togglePlaceDescription(placeId);
    window.togglePlaceHours = (placeId) => this.togglePlaceHours(placeId);
    window.centerMapOnPlace = (lat, lng) => {
      this.eventBus.emit('map:centerOn', { lat, lng });
    };
    window.changePlacePage = (page) => this.changePage(page);

    console.log('✅ PlaceListRenderer initialized');
  }

  /**
   * Render place list with pagination
   */
  render() {
    const placeList = document.getElementById('placeList');
    const placesTitle = document.getElementById('placesTitle');

    if (!placeList) {
      console.warn('⚠️ Place list element not found');
      return;
    }

    const filteredPlaces = this.state.get('filteredPlaces');

    // Update title with count
    if (placesTitle) {
      placesTitle.textContent = `🏛️ Lista Luoghi (${filteredPlaces.length})`;
    }

    // Clear list
    placeList.innerHTML = '';

    // Show message if no places
    if (filteredPlaces.length === 0) {
      placeList.innerHTML = '<p style="text-align: center; color: #666;">Nessun luogo trovato.</p>';
      return;
    }

    // Calculate pagination
    const totalPages = Math.ceil(filteredPlaces.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const placesToShow = filteredPlaces.slice(startIndex, endIndex);

    // Render places for current page
    placesToShow.forEach(place => {
      const placeItem = this._createPlaceElement(place);
      placeList.appendChild(placeItem);
    });

    // Render pagination controls
    this._renderPaginationControls(placeList, totalPages, filteredPlaces.length);
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
    const _pc = place.coordinates;
    const directionsHtml = _pc
      ? `<a href="#" class="directions-btn" onclick="openDirections(${_pc.lat}, ${_pc.lng}, '${place.name.replace(/'/g, "\\'")}', '${place.address.replace(/'/g, "\\'")}'); return false;">🧭 Indicazioni</a>`
      : '';

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
        ${_pc ? `<button class="btn btn-small btn-outline" onclick="centerMapOnPlace(${_pc.lat}, ${_pc.lng})">🗺️ Mostra su mappa</button>` : ''}
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
   * Render pagination controls
   * @param {HTMLElement} container - Container element
   * @param {number} totalPages - Total number of pages
   * @param {number} totalItems - Total number of items
   */
  _renderPaginationControls(container, totalPages, totalItems) {
    if (totalPages <= 1) return; // No pagination needed

    const paginationDiv = document.createElement('div');
    paginationDiv.className = 'pagination-controls';
    paginationDiv.style.cssText = 'display: flex; justify-content: center; align-items: center; gap: 10px; margin-top: 20px; padding: 15px;';

    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'btn btn-small';
    prevBtn.textContent = '← Prec';
    prevBtn.disabled = this.currentPage === 1;
    prevBtn.onclick = () => this.changePage(this.currentPage - 1);
    prevBtn.style.cssText = `opacity: ${this.currentPage === 1 ? '0.5' : '1'}; min-width: 70px; padding: 6px 10px;`;
    paginationDiv.appendChild(prevBtn);

    // Page info
    const pageInfo = document.createElement('span');
    pageInfo.style.cssText = 'color: var(--text-secondary); font-size: 0.9rem; flex: 1; text-align: center;';
    pageInfo.textContent = `Pagina ${this.currentPage} di ${totalPages}`;
    paginationDiv.appendChild(pageInfo);

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn btn-small';
    nextBtn.textContent = 'Succ →';
    nextBtn.disabled = this.currentPage === totalPages;
    nextBtn.onclick = () => this.changePage(this.currentPage + 1);
    nextBtn.style.cssText = `opacity: ${this.currentPage === totalPages ? '0.5' : '1'}; min-width: 70px; padding: 6px 10px;`;
    paginationDiv.appendChild(nextBtn);

    container.appendChild(paginationDiv);
  }

  /**
   * Change page
   * @param {number} page - Page number
   */
  changePage(page) {
    const filteredPlaces = this.state.get('filteredPlaces');
    const totalPages = Math.ceil(filteredPlaces.length / this.itemsPerPage);

    if (page < 1 || page > totalPages) return;

    this.currentPage = page;
    this.render();

    // Scroll to top of place list
    const placeList = document.getElementById('placeList');
    if (placeList) {
      placeList.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
