/**
 * DateFilter - Date-based Event Filtering
 *
 * Filters events by selected date from calendar or "today" quick filter.
 * Also handles location and tag filters.
 *
 * Dependencies: EventBus, StateManager, DateFormatter
 */

import { eventBus } from '../core/event-bus.js';
import { state } from '../core/state-manager.js';
import { dateFormatter } from '../utils/date-formatter.js';

export class DateFilter {
  constructor(eventBusInstance, stateManager, formatter) {
    this.eventBus = eventBusInstance;
    this.state = stateManager;
    this.dateFormatter = formatter;
  }

  /**
   * Initialize date filter
   */
  initialize() {
    console.log('✅ DateFilter initialized');
  }

  /**
   * Select a date from calendar
   * @param {Date} date - Selected date
   */
  selectDate(date) {
    const dateStr = this.dateFormatter.formatYYYYMMDD(date);
    this.state.set('selectedDate', dateStr);

    this.eventBus.emit('calendar:dateSelected', { date, dateStr });
    this.eventBus.emit('filter:applied');

    console.log('📅 Date selected:', dateStr);
  }

  /**
   * Clear date selection
   */
  clearDate() {
    this.state.set('selectedDate', null);

    this.eventBus.emit('calendar:dateSelected', { date: null, dateStr: null });
    this.eventBus.emit('filter:applied');

    console.log('📅 Date cleared');
  }

  /**
   * Select today's date
   */
  filterToday() {
    const today = this.dateFormatter.getToday();
    this.selectDate(today);
  }

  /**
   * Select a location filter
   * @param {string} location - Location name
   */
  selectLocation(location) {
    const currentLocation = this.state.get('selectedLocation');

    // Toggle: if same location, clear it
    if (currentLocation === location) {
      this.clearLocation();
    } else {
      this.state.set('selectedLocation', location);
      this.eventBus.emit('location:selected', { location });
      this.eventBus.emit('filter:applied');

      console.log('📍 Location selected:', location);
    }
  }

  /**
   * Clear location selection
   */
  clearLocation() {
    this.state.set('selectedLocation', null);

    this.eventBus.emit('location:selected', { location: null });
    this.eventBus.emit('filter:applied');

    console.log('📍 Location cleared');
  }

  /**
   * Select a tag filter
   * @param {string} tag - Tag name
   */
  selectTag(tag) {
    const currentTag = this.state.get('selectedTag');

    // Toggle: if same tag, clear it
    if (currentTag === tag) {
      this.clearTag();
    } else {
      this.state.set('selectedTag', tag);
      this.eventBus.emit('tag:selected', { tag });
      this.eventBus.emit('filter:applied');

      console.log('🏷️ Tag selected:', tag);
    }
  }

  /**
   * Clear tag selection
   */
  clearTag() {
    this.state.set('selectedTag', null);

    this.eventBus.emit('tag:selected', { tag: null });
    this.eventBus.emit('filter:applied');

    console.log('🏷️ Tag cleared');
  }

  /**
   * Filter events by selected date
   * @param {Array} events - Events to filter
   * @returns {Array} Filtered events
   */
  filterByDate(events) {
    const selectedDateStr = this.state.get('selectedDate');

    if (!selectedDateStr) {
      return events;
    }

    const selectedDate = this.dateFormatter.parseYYYYMMDD(selectedDateStr);

    return events.filter(event => {
      return this.dateFormatter.isEventOnDate(event, selectedDate);
    });
  }

  /**
   * Filter events by location
   * @param {Array} events - Events to filter
   * @returns {Array} Filtered events
   */
  filterByLocation(events) {
    const selectedLocation = this.state.get('selectedLocation');

    if (!selectedLocation) {
      return events;
    }

    return events.filter(event => {
      return event.location === selectedLocation;
    });
  }

  /**
   * Filter events by tag
   * @param {Array} events - Events to filter
   * @returns {Array} Filtered events
   */
  filterByTag(events) {
    const selectedTag = this.state.get('selectedTag');

    if (!selectedTag) {
      return events;
    }

    return events.filter(event => {
      return event.tags && event.tags.includes(selectedTag);
    });
  }

  /**
   * Filter events by all date-related filters (date, location, tag)
   * @param {Array} events - Events to filter
   * @returns {Array} Filtered events
   */
  filterEvents(events) {
    let filtered = events;

    // Apply date filter
    filtered = this.filterByDate(filtered);

    // Apply location filter
    filtered = this.filterByLocation(filtered);

    // Apply tag filter
    filtered = this.filterByTag(filtered);

    return filtered;
  }

  /**
   * Get selected date
   * @returns {string|null} Selected date (YYYY-MM-DD) or null
   */
  getSelectedDate() {
    return this.state.get('selectedDate');
  }

  /**
   * Get selected location
   * @returns {string|null} Selected location or null
   */
  getSelectedLocation() {
    return this.state.get('selectedLocation');
  }

  /**
   * Get selected tag
   * @returns {string|null} Selected tag or null
   */
  getSelectedTag() {
    return this.state.get('selectedTag');
  }

  /**
   * Check if any date filter is active
   * @returns {boolean} True if any date filter is active
   */
  hasActiveFilters() {
    return !!(
      this.state.get('selectedDate') ||
      this.state.get('selectedLocation') ||
      this.state.get('selectedTag')
    );
  }

  /**
   * Reset all date-related filters
   */
  reset() {
    this.clearDate();
    this.clearLocation();
    this.clearTag();
  }
}

// Export singleton instance
export const dateFilter = new DateFilter(eventBus, state, dateFormatter);
