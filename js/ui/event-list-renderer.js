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
  }

  /**
   * Initialize event list renderer
   */
  initialize() {
    // Subscribe to filter events
    this.eventBus.on('filters:applied', () => {
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

    console.log('✅ EventListRenderer initialized');
  }

  /**
   * Render event list
   */
  render() {
    const eventList = document.getElementById('eventList');

    if (!eventList) {
      console.warn('⚠️ Event list element not found');
      return;
    }

    const filteredEvents = this.state.get('filteredEvents');
    const selectedLocation = this.state.get('selectedLocation');
    const selectedTag = this.state.get('selectedTag');

    // Clear list
    eventList.innerHTML = '';

    // Show message if no events
    if (filteredEvents.length === 0) {
      eventList.innerHTML = '<p style="text-align: center; color: #666;">Nessun evento trovato.</p>';
      return;
    }

    // Render each event
    filteredEvents.forEach(event => {
      const eventItem = this._createEventElement(event, selectedLocation, selectedTag);
      eventList.appendChild(eventItem);
    });
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
    const directionsHtml = `<a href="#" class="directions-btn" onclick="openDirections(${event.coordinates.lat}, ${event.coordinates.lng}, '${event.location.replace(/'/g, "\\'")}', '${event.location.replace(/'/g, "\\'")}'); return false;">🧭 Indicazioni</a>`;

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
