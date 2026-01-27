/**
 * SearchFilter - Text Search Filter
 *
 * Filters events and places by search term matching title, location, tags, description.
 * Implements debouncing for performance.
 *
 * Dependencies: EventBus, StateManager
 */

import { eventBus } from '../core/event-bus.js';
import { state } from '../core/state-manager.js';
import { DEBOUNCE_DELAYS } from '../config/constants.js';

export class SearchFilter {
  constructor(eventBusInstance, stateManager) {
    this.eventBus = eventBusInstance;
    this.state = stateManager;
    this.debounceTimer = null;
  }

  /**
   * Initialize search filter
   * Sets up event listeners for search input
   */
  initialize() {
    const searchInput = document.getElementById('searchInput');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this._handleSearchInput(e.target.value);
      });

      console.log('✅ SearchFilter initialized');
    } else {
      console.warn('⚠️ Search input not found');
    }
  }

  /**
   * Handle search input with debouncing
   * @param {string} term - Search term
   */
  _handleSearchInput(term) {
    // Clear existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Debounce search
    this.debounceTimer = setTimeout(() => {
      this.setSearchTerm(term);
    }, DEBOUNCE_DELAYS.search);
  }

  /**
   * Set search term and trigger filtering
   * @param {string} term - Search term
   */
  setSearchTerm(term) {
    const normalizedTerm = term.trim().toLowerCase();
    this.state.set('searchTerm', normalizedTerm);

    this.eventBus.emit('search:changed', { term: normalizedTerm });
    this.eventBus.emit('filter:applied');

    console.log('🔍 Search term:', normalizedTerm || '(empty)');
  }

  /**
   * Filter events by search term
   * @param {Array} events - Events to filter
   * @param {string} term - Search term (optional, uses state if not provided)
   * @returns {Array} Filtered events
   */
  filterEvents(events, term = null) {
    const searchTerm = term !== null ? term : this.state.get('searchTerm');

    if (!searchTerm) {
      return events;
    }

    return events.filter(event => {
      // Search in title
      if (event.title && event.title.toLowerCase().includes(searchTerm)) {
        return true;
      }

      // Search in location
      if (event.location && event.location.toLowerCase().includes(searchTerm)) {
        return true;
      }

      // Search in tags
      if (event.tags && event.tags.some(tag => tag.toLowerCase().includes(searchTerm))) {
        return true;
      }

      // Search in description
      if (event.description && event.description.toLowerCase().includes(searchTerm)) {
        return true;
      }

      return false;
    });
  }

  /**
   * Filter places by search term
   * @param {Array} places - Places to filter
   * @param {string} term - Search term (optional, uses state if not provided)
   * @returns {Array} Filtered places
   */
  filterPlaces(places, term = null) {
    const searchTerm = term !== null ? term : this.state.get('searchTerm');

    if (!searchTerm) {
      return places;
    }

    return places.filter(place => {
      // Search in name
      if (place.name && place.name.toLowerCase().includes(searchTerm)) {
        return true;
      }

      // Search in address
      if (place.address && place.address.toLowerCase().includes(searchTerm)) {
        return true;
      }

      // Search in description
      if (place.description && place.description.toLowerCase().includes(searchTerm)) {
        return true;
      }

      // Search in category
      if (place.category && place.category.toLowerCase().includes(searchTerm)) {
        return true;
      }

      return false;
    });
  }

  /**
   * Clear search term
   */
  clear() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.value = '';
    }

    this.state.set('searchTerm', '');
    this.eventBus.emit('search:changed', { term: '' });
    this.eventBus.emit('filter:applied');
  }

  /**
   * Get current search term
   * @returns {string} Current search term
   */
  getSearchTerm() {
    return this.state.get('searchTerm');
  }

  /**
   * Highlight search term in text (for UI)
   * @param {string} text - Text to highlight
   * @param {string} term - Term to highlight (optional, uses state if not provided)
   * @returns {string} HTML with highlighted term
   */
  highlightTerm(text, term = null) {
    const searchTerm = term !== null ? term : this.state.get('searchTerm');

    if (!searchTerm || !text) {
      return text;
    }

    const regex = new RegExp(`(${this._escapeRegex(searchTerm)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Escape special regex characters
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  _escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// Export singleton instance
export const searchFilter = new SearchFilter(eventBus, state);
