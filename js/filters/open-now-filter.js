/**
 * OpenNowFilter - Filter Places by "Open Now" Status
 *
 * Filters places that are currently open based on their opening hours.
 *
 * Dependencies: EventBus, StateManager, OpeningHoursParser
 */

import { eventBus } from '../core/event-bus.js';
import { state } from '../core/state-manager.js';
import { openingHoursParser } from '../utils/opening-hours-parser.js';

export class OpenNowFilter {
  constructor(eventBusInstance, stateManager, hoursParser) {
    this.eventBus = eventBusInstance;
    this.state = stateManager;
    this.openingHoursParser = hoursParser;
  }

  /**
   * Initialize open now filter
   */
  initialize() {
    this.state.set('openNowFilterActive', false);
    console.log('✅ OpenNowFilter initialized');
  }

  /**
   * Toggle open now filter
   */
  toggle() {
    const currentState = this.state.get('openNowFilterActive');
    const newState = !currentState;

    this.state.set('openNowFilterActive', newState);

    // Update UI
    this._updateUI(newState);

    this.eventBus.emit('openNow:toggled', { active: newState });
    this.eventBus.emit('filter:applied');

    console.log('🕐 Open now filter:', newState ? 'ACTIVE' : 'INACTIVE');
  }

  /**
   * Set open now filter state
   * @param {boolean} active - Active state
   */
  setActive(active) {
    this.state.set('openNowFilterActive', active);
    this._updateUI(active);

    this.eventBus.emit('openNow:toggled', { active });
    this.eventBus.emit('filter:applied');
  }

  /**
   * Filter places by open now status
   * @param {Array} places - Places to filter
   * @returns {Array} Filtered places
   */
  filterPlaces(places) {
    const filterActive = this.state.get('openNowFilterActive');

    if (!filterActive) {
      return places;
    }

    return places.filter(place => {
      return this.openingHoursParser.isOpenNow(place);
    });
  }

  /**
   * Check if filter is active
   * @returns {boolean} True if filter is active
   */
  isActive() {
    return this.state.get('openNowFilterActive');
  }

  /**
   * Reset filter
   */
  reset() {
    this.setActive(false);
  }

  /**
   * Update UI checkbox state
   * @param {boolean} active - Active state
   */
  _updateUI(active) {
    const checkbox = document.getElementById('openNowFilter');
    if (checkbox) {
      checkbox.checked = active;
    }
  }

  /**
   * Get count of currently open places
   * @param {Array} places - All places
   * @returns {number} Count of open places
   */
  getOpenPlacesCount(places) {
    return places.filter(place => {
      return this.openingHoursParser.isOpenNow(place);
    }).length;
  }
}

// Export singleton instance
export const openNowFilter = new OpenNowFilter(eventBus, state, openingHoursParser);
