/**
 * FilterCoordinator - Coordinates All Filter Modules
 *
 * Central coordinator that applies all filters in the correct order
 * and manages the filtering pipeline for events and places.
 *
 * Filter order:
 * Events: Search → Category → Date/Location/Tag
 * Places: Search → Category → Open Now
 *
 * Dependencies: All filter modules, StateManager, EventBus
 */

import { eventBus } from '../core/event-bus.js';
import { state } from '../core/state-manager.js';
import { searchFilter } from './search-filter.js';
import { categoryFilter } from './category-filter.js';
import { dateFilter } from './date-filter.js';
import { openNowFilter } from './open-now-filter.js';

export class FilterCoordinator {
  constructor(
    eventBusInstance,
    stateManager,
    search,
    category,
    date,
    openNow
  ) {
    this.eventBus = eventBusInstance;
    this.state = stateManager;
    this.searchFilter = search;
    this.categoryFilter = category;
    this.dateFilter = date;
    this.openNowFilter = openNow;
  }

  /**
   * Initialize filter coordinator
   * Sets up subscriptions to filter events
   */
  initialize() {
    // Subscribe to filter:applied event
    this.eventBus.on('filter:applied', () => {
      this.applyAllFilters();
    });

    // Subscribe to data loaded events
    this.eventBus.on('events:loaded', () => {
      this.applyAllFilters();
    });

    this.eventBus.on('places:loaded', () => {
      this.applyAllFilters();
    });

    // Subscribe to real-time updates
    this.eventBus.on('events:updated', () => {
      this.applyAllFilters();
    });

    this.eventBus.on('places:updated', () => {
      this.applyAllFilters();
    });

    console.log('✅ FilterCoordinator initialized');
  }

  /**
   * Apply all filters to events and places
   */
  applyAllFilters() {
    this.filterEvents();
    this.filterPlaces();

    this.eventBus.emit('filters:applied', {
      eventCount: this.state.get('filteredEvents').length,
      placeCount: this.state.get('filteredPlaces').length
    });
  }

  /**
   * Filter events through all active filters
   */
  filterEvents() {
    let events = this.state.get('events');

    // Apply filters in order
    events = this.searchFilter.filterEvents(events);
    events = this.categoryFilter.filterEvents(events);
    events = this.dateFilter.filterEvents(events);

    // Update filtered events in state
    this.state.set('filteredEvents', events);

    console.log(`🔍 Filtered events: ${events.length}`);
  }

  /**
   * Filter places through all active filters
   */
  filterPlaces() {
    let places = this.state.get('places');

    // Apply filters in order
    places = this.searchFilter.filterPlaces(places);
    places = this.categoryFilter.filterPlaces(places);
    places = this.openNowFilter.filterPlaces(places);

    // Update filtered places in state
    this.state.set('filteredPlaces', places);

    console.log(`🔍 Filtered places: ${places.length}`);
  }

  /**
   * Reset all filters
   */
  resetAll() {
    // Clear search
    this.searchFilter.clear();

    // Reset categories
    this.categoryFilter.resetEventCategories();
    this.categoryFilter.resetPlaceCategories();

    // Reset date filters
    this.dateFilter.reset();

    // Reset open now
    this.openNowFilter.reset();

    // Apply filters
    this.applyAllFilters();

    this.eventBus.emit('filters:reset');
    console.log('🔄 All filters reset');
  }

  /**
   * Get filter summary
   * @returns {Object} Filter summary object
   */
  getFilterSummary() {
    return {
      search: {
        active: !!this.searchFilter.getSearchTerm(),
        term: this.searchFilter.getSearchTerm()
      },
      eventCategories: {
        active: !this.categoryFilter.getSelectedEventCategories().has('all'),
        selected: Array.from(this.categoryFilter.getSelectedEventCategories())
      },
      placeCategories: {
        active: !this.categoryFilter.getSelectedPlaceCategories().has('all'),
        selected: Array.from(this.categoryFilter.getSelectedPlaceCategories())
      },
      date: {
        active: !!this.dateFilter.getSelectedDate(),
        value: this.dateFilter.getSelectedDate()
      },
      location: {
        active: !!this.dateFilter.getSelectedLocation(),
        value: this.dateFilter.getSelectedLocation()
      },
      tag: {
        active: !!this.dateFilter.getSelectedTag(),
        value: this.dateFilter.getSelectedTag()
      },
      openNow: {
        active: this.openNowFilter.isActive()
      }
    };
  }

  /**
   * Check if any filter is active
   * @returns {boolean} True if any filter is active
   */
  hasActiveFilters() {
    const summary = this.getFilterSummary();

    return (
      summary.search.active ||
      summary.eventCategories.active ||
      summary.placeCategories.active ||
      summary.date.active ||
      summary.location.active ||
      summary.tag.active ||
      summary.openNow.active
    );
  }

  /**
   * Get active filter count
   * @returns {number} Number of active filters
   */
  getActiveFilterCount() {
    const summary = this.getFilterSummary();
    let count = 0;

    if (summary.search.active) count++;
    if (summary.eventCategories.active) count++;
    if (summary.placeCategories.active) count++;
    if (summary.date.active) count++;
    if (summary.location.active) count++;
    if (summary.tag.active) count++;
    if (summary.openNow.active) count++;

    return count;
  }

  /**
   * Export filter state (for URL params or storage)
   * @returns {Object} Filter state object
   */
  exportState() {
    return {
      searchTerm: this.searchFilter.getSearchTerm(),
      eventCategories: Array.from(this.categoryFilter.getSelectedEventCategories()),
      placeCategories: Array.from(this.categoryFilter.getSelectedPlaceCategories()),
      selectedDate: this.dateFilter.getSelectedDate(),
      selectedLocation: this.dateFilter.getSelectedLocation(),
      selectedTag: this.dateFilter.getSelectedTag(),
      openNowActive: this.openNowFilter.isActive()
    };
  }

  /**
   * Import filter state (from URL params or storage)
   * @param {Object} filterState - Filter state object
   */
  importState(filterState) {
    if (filterState.searchTerm) {
      this.searchFilter.setSearchTerm(filterState.searchTerm);
    }

    if (filterState.selectedDate) {
      const date = new Date(filterState.selectedDate + 'T00:00:00');
      this.dateFilter.selectDate(date);
    }

    if (filterState.selectedLocation) {
      this.dateFilter.selectLocation(filterState.selectedLocation);
    }

    if (filterState.selectedTag) {
      this.dateFilter.selectTag(filterState.selectedTag);
    }

    if (filterState.openNowActive) {
      this.openNowFilter.setActive(true);
    }

    // Apply filters
    this.applyAllFilters();

    console.log('✅ Filter state imported');
  }
}

// Export singleton instance
export const filterCoordinator = new FilterCoordinator(
  eventBus,
  state,
  searchFilter,
  categoryFilter,
  dateFilter,
  openNowFilter
);
