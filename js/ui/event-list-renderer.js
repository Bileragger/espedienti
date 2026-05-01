/**
 * EventListRenderer - Event List UI Rendering
 *
 * Renders the list of events with interactive elements (tags, location, poster, etc.).
 *
 * Dependencies: EventBus, StateManager, DateFormatter, CategoriesLoader, DateFilter
 */

import { eventBus } from '../core/event-bus.js';
import { state } from '../core/state-manager.js';
import { dateFormatter } from '../utils/date-formatter.js';
import { categoriesLoader } from '../data/categories-loader.js';
import { dateFilter } from '../filters/date-filter.js';

export class EventListRenderer {
  constructor(eventBusInstance, stateManager, formatter, categories, dateFilterInstance) {
    this.eventBus = eventBusInstance;
    this.state = stateManager;
    this.dateFormatter = formatter;
    this.categoriesLoader = categories;
    this.dateFilter = dateFilterInstance;
    this.currentPage = 1;
    this.itemsPerPage = 5;
  }

  /**
   * Initialize event list renderer
   */
  initialize() {
    // Subscribe to filter events
    this.eventBus.on('filters:applied', () => {
      this.currentPage = 1; // Reset to first page on filter change
      this.render();
    });

    // Expose functions to window for onclick handlers
    window.filterByTag = (tag) => this.filterByTag(tag);
    window.toggleDescription = (eventId) => this.toggleDescription(eventId);
    window.addToCalendar = (event) => this.addToCalendar(event);
    window.showPoster = (posterUrl) => {
      this.eventBus.emit('modal:showPoster', { url: posterUrl });
    };
    window.openDirections = (lat, lng, locationName, fullAddress) => {
      this.openDirections(lat, lng, locationName, fullAddress);
    };
    window.changeEventPage = (page) => this.changePage(page);

    console.log('✅ EventListRenderer initialized');
  }

  /**
   * Render event list with pagination
   */
  render() {
    const eventList = document.getElementById('eventList');
    const eventsTitle = document.getElementById('eventsTitle');

    if (!eventList) {
      console.warn('⚠️ Event list element not found');
      return;
    }

    const filteredEvents = this.state.get('filteredEvents');
    const selectedLocation = this.state.get('selectedLocation');
    const selectedTag = this.state.get('selectedTag');

    // Update title with count
    if (eventsTitle) {
      eventsTitle.textContent = `📋 Lista Eventi (${filteredEvents.length})`;
    }

    // Clear list
    eventList.innerHTML = '';

    // Show message if no events
    if (filteredEvents.length === 0) {
      eventList.innerHTML = '<p style="text-align: center; color: #666;">Nessun evento trovato.</p>';
      return;
    }

    // Calculate pagination
    const totalPages = Math.ceil(filteredEvents.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const eventsToShow = filteredEvents.slice(startIndex, endIndex);

    // Render events for current page
    eventsToShow.forEach(event => {
      const eventItem = this._createEventElement(event, selectedLocation, selectedTag);
      eventList.appendChild(eventItem);
    });

    // Render pagination controls
    this._renderPaginationControls(eventList, totalPages, filteredEvents.length);
  }

  /**
   * Create event element
   * @param {Object} event - Event object
   * @param {string|null} selectedLocation - Selected location
   * @param {string|null} selectedTag - Selected tag
   * @returns {HTMLElement} Event element
   */
  _createEventElement(event, selectedLocation, selectedTag) {
    const eventItem = document.createElement('div');
    eventItem.className = 'event-item';
    eventItem.id = `event-${event.id}`;

    // Highlight if location matches
    if (selectedLocation === event.location) {
      eventItem.classList.add('highlighted');
    }

    // Get category info
    const categoryInfo = this.categoriesLoader.getCategoryInfo(event.category);

    // Build tags HTML
    const tagsHtml = event.tags ? event.tags.map(tag => {
      const isSelected = selectedTag === tag;
      return `<span class="tag ${isSelected ? 'selected' : ''}" onclick="filterByTag('${tag}')">${tag}</span>`;
    }).join('') : '';

    // Build poster button
    const posterHtml = event.poster
      ? `<span class="poster-btn" onclick="showPoster('${event.poster}')">🖼️ Vedi locandina</span>`
      : '';

    // Build description toggle
    const descriptionHtml = event.description
      ? `<span class="poster-btn" onclick="toggleDescription(${event.id})">📄 Maggiori dettagli</span>
         <div id="desc-${event.id}" style="display: none; margin-top: 10px; padding: 10px; background: #f9f9f9; border-radius: 6px; font-size: 0.9rem; line-height: 1.6;">${event.description}</div>`
      : '';

    // Build directions link
    const _ec = event.coordinates;
    const directionsHtml = _ec
      ? `<a href="#" class="directions-btn" onclick="openDirections(${_ec.lat}, ${_ec.lng}, '${event.location.replace(/'/g, "\\'")}', '${event.location.replace(/'/g, "\\'")}'); return false;">🧭 Indicazioni</a>`
      : '';

    // Build inner HTML
    eventItem.innerHTML = `
      <div class="event-info">
        <div class="event-title">${categoryInfo.icon} ${event.title}</div>
        <div class="event-detail">📅 ${this.dateFormatter.formatEventDate(event)}</div>
        <div class="event-detail">📍 ${event.location}</div>
        <div class="event-tags">${tagsHtml}</div>
        <div style="margin-top: 8px;">
          ${posterHtml}
          ${descriptionHtml}
          ${directionsHtml}
        </div>
      </div>
      <div class="event-actions">
        <button class="btn btn-small" onclick='addToCalendar(${JSON.stringify(event).replace(/'/g, "&#39;")})'>➕ Aggiungi</button>
        <button class="btn btn-small btn-outline" onclick="window.open('${categoryInfo.whatsappLink}', '_blank')">${categoryInfo.icon} Chat</button>
      </div>
    `;

    return eventItem;
  }

  /**
   * Filter by tag
   * @param {string} tag - Tag to filter
   */
  filterByTag(tag) {
    this.dateFilter.selectTag(tag);
  }

  /**
   * Toggle event description visibility
   * @param {number} eventId - Event ID
   */
  toggleDescription(eventId) {
    const descElement = document.getElementById(`desc-${eventId}`);
    if (descElement) {
      if (descElement.style.display === 'none') {
        descElement.style.display = 'block';
      } else {
        descElement.style.display = 'none';
      }
    }
  }

  /**
   * Add event to Google Calendar
   * @param {Object} event - Event object
   */
  addToCalendar(event) {
    const startDate = event.date.replace(/-/g, '');
    const endDate = event.dateEnd ? event.dateEnd.replace(/-/g, '') : startDate;

    let dates = startDate;
    if (event.time && event.time.start) {
      const startTime = event.time.start.replace(':', '');
      const endTime = event.time.end ? event.time.end.replace(':', '') : startTime;
      dates = `${startDate}T${startTime}00/${event.dateEnd ? endDate : startDate}T${endTime}00`;
    } else {
      dates = `${startDate}/${endDate}`;
    }

    const title = encodeURIComponent(event.title);
    const location = encodeURIComponent(event.location);
    const description = event.description ? encodeURIComponent(event.description) : '';

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&location=${location}&details=${description}`;

    window.open(googleCalendarUrl, '_blank');
    console.log('📅 Adding to Google Calendar:', event.title);
  }

  /**
   * Open directions to event location
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {string} locationName - Location name
   * @param {string|null} fullAddress - Full address (optional)
   */
  openDirections(lat, lng, locationName, fullAddress = null) {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Use full address if provided, otherwise use coordinates
    const destination = fullAddress && fullAddress.trim() !== ''
      ? encodeURIComponent(fullAddress)
      : `${lat},${lng}`;

    if (isIOS) {
      // Try Apple Maps first on iOS
      const appleMapsUrl = `maps://maps.apple.com/?daddr=${destination}&q=${encodeURIComponent(locationName)}`;
      window.location.href = appleMapsUrl;

      // Fallback to Google Maps if Apple Maps is not available
      setTimeout(() => {
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
        window.open(googleMapsUrl, '_blank');
      }, 500);
    } else {
      // Use Google Maps for Android and Desktop
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
      window.open(googleMapsUrl, '_blank');
    }

    console.log('🧭 Opening directions to:', locationName);
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
    const filteredEvents = this.state.get('filteredEvents');
    const totalPages = Math.ceil(filteredEvents.length / this.itemsPerPage);

    if (page < 1 || page > totalPages) return;

    this.currentPage = page;
    this.render();

    // Scroll to top of event list
    const eventList = document.getElementById('eventList');
    if (eventList) {
      eventList.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * Scroll to event in list
   * @param {number} eventId - Event ID
   */
  scrollToEvent(eventId) {
    const eventElement = document.getElementById(`event-${eventId}`);
    if (eventElement) {
      eventElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      eventElement.classList.add('highlighted');

      // Remove highlight after animation
      setTimeout(() => {
        eventElement.classList.remove('highlighted');
      }, 2000);
    }
  }
}

// Export singleton instance
export const eventListRenderer = new EventListRenderer(
  eventBus,
  state,
  dateFormatter,
  categoriesLoader,
  dateFilter
);
