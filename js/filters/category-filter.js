/**
 * CategoryFilter - Category Filtering for Events and Places
 *
 * Manages category selection and filtering for both events and places.
 * Supports "all" selection and multiple category filtering.
 *
 * Dependencies: EventBus, StateManager
 */

import { eventBus } from '../core/event-bus.js';
import { state } from '../core/state-manager.js';

export class CategoryFilter {
  constructor(eventBusInstance, stateManager) {
    this.eventBus = eventBusInstance;
    this.state = stateManager;
  }

  /**
   * Initialize category filter
   * Sets up event listeners for category checkboxes
   */
  initialize() {
    // Initialize with "all" selected
    this.state.set('selectedEventCategories', new Set(['all']));
    this.state.set('selectedPlaceCategories', new Set(['all']));

    console.log('✅ CategoryFilter initialized');
  }

  /**
   * Toggle event category
   * @param {string} categoryId - Category ID to toggle
   */
  toggleEventCategory(categoryId) {
    const selected = this.state.get('selectedEventCategories');

    if (categoryId === 'all') {
      // Select all, deselect everything else
      selected.clear();
      selected.add('all');

      // Update UI
      this._updateEventCategoryUI('all', true);
      this._updateAllEventCategoriesUI(false);
    } else {
      // Deselect "all"
      selected.delete('all');
      this._updateEventCategoryUI('all', false);

      // Toggle specific category
      if (selected.has(categoryId)) {
        selected.delete(categoryId);
        this._updateEventCategoryUI(categoryId, false);
      } else {
        selected.add(categoryId);
        this._updateEventCategoryUI(categoryId, true);
      }

      // If nothing selected, select "all"
      if (selected.size === 0) {
        selected.add('all');
        this._updateEventCategoryUI('all', true);
      }
    }

    this.state.set('selectedEventCategories', new Set(selected));
    this.eventBus.emit('category:toggled', { type: 'event', categoryId, selected: Array.from(selected) });
    this.eventBus.emit('filter:applied');

    console.log('📂 Event categories:', Array.from(selected));
  }

  /**
   * Toggle place category
   * @param {string} categoryId - Category ID to toggle
   */
  togglePlaceCategory(categoryId) {
    const selected = this.state.get('selectedPlaceCategories');

    if (categoryId === 'all') {
      // Select all, deselect everything else
      selected.clear();
      selected.add('all');

      // Update UI
      this._updatePlaceCategoryUI('all', true);
      this._updateAllPlaceCategoriesUI(false);
    } else {
      // Deselect "all"
      selected.delete('all');
      this._updatePlaceCategoryUI('all', false);

      // Toggle specific category
      if (selected.has(categoryId)) {
        selected.delete(categoryId);
        this._updatePlaceCategoryUI(categoryId, false);
      } else {
        selected.add(categoryId);
        this._updatePlaceCategoryUI(categoryId, true);
      }

      // If nothing selected, select "all"
      if (selected.size === 0) {
        selected.add('all');
        this._updatePlaceCategoryUI('all', true);
      }
    }

    this.state.set('selectedPlaceCategories', new Set(selected));
    this.eventBus.emit('category:toggled', { type: 'place', categoryId, selected: Array.from(selected) });
    this.eventBus.emit('filter:applied');

    console.log('📂 Place categories:', Array.from(selected));
  }

  /**
   * Filter events by selected categories
   * @param {Array} events - Events to filter
   * @returns {Array} Filtered events
   */
  filterEvents(events) {
    const selected = this.state.get('selectedEventCategories');

    // If "all" is selected or empty, return all events
    if (selected.has('all') || selected.size === 0) {
      return events;
    }

    return events.filter(event => {
      const cats = event.categories || (event.category ? [event.category] : []);
      return cats.some(cat => selected.has(cat));
    });
  }

  /**
   * Filter places by selected categories
   * @param {Array} places - Places to filter
   * @returns {Array} Filtered places
   */
  filterPlaces(places) {
    const selected = this.state.get('selectedPlaceCategories');

    // If "all" is selected or empty, return all places
    if (selected.has('all') || selected.size === 0) {
      return places;
    }

    return places.filter(place => {
      const cats = place.categories || (place.category ? [place.category] : []);
      return cats.some(cat => selected.has(cat));
    });
  }

  /**
   * Update event category UI
   * @param {string} categoryId - Category ID
   * @param {boolean} checked - Checked state
   */
  _updateEventCategoryUI(categoryId, checked) {
    const filters = document.querySelectorAll('#eventCategoryFilters .filter-checkbox');

    filters.forEach(filter => {
      const onclick = filter.getAttribute('onclick');
      if (onclick && onclick.includes(`'${categoryId}'`)) {
        if (checked) {
          filter.classList.add('checked');
        } else {
          filter.classList.remove('checked');
        }
      }
    });
  }

  /**
   * Update all event categories UI
   * @param {boolean} checked - Checked state
   */
  _updateAllEventCategoriesUI(checked) {
    const filters = document.querySelectorAll('#eventCategoryFilters .filter-checkbox');

    filters.forEach(filter => {
      const onclick = filter.getAttribute('onclick');
      if (onclick && !onclick.includes("'all'")) {
        if (checked) {
          filter.classList.add('checked');
        } else {
          filter.classList.remove('checked');
        }
      }
    });
  }

  /**
   * Update place category UI
   * @param {string} categoryId - Category ID
   * @param {boolean} checked - Checked state
   */
  _updatePlaceCategoryUI(categoryId, checked) {
    const filters = document.querySelectorAll('#placeCategoryFilters .filter-checkbox');

    filters.forEach(filter => {
      const onclick = filter.getAttribute('onclick');
      if (onclick && onclick.includes(`'${categoryId}'`)) {
        if (checked) {
          filter.classList.add('checked');
        } else {
          filter.classList.remove('checked');
        }
      }
    });
  }

  /**
   * Update all place categories UI
   * @param {boolean} checked - Checked state
   */
  _updateAllPlaceCategoriesUI(checked) {
    const filters = document.querySelectorAll('#placeCategoryFilters .filter-checkbox');

    filters.forEach(filter => {
      const onclick = filter.getAttribute('onclick');
      if (onclick && !onclick.includes("'all'")) {
        if (checked) {
          filter.classList.add('checked');
        } else {
          filter.classList.remove('checked');
        }
      }
    });
  }

  /**
   * Reset event categories (select all)
   */
  resetEventCategories() {
    this.toggleEventCategory('all');
  }

  /**
   * Reset place categories (select all)
   */
  resetPlaceCategories() {
    this.togglePlaceCategory('all');
  }

  /**
   * Get selected event categories
   * @returns {Set} Selected event categories
   */
  getSelectedEventCategories() {
    return this.state.get('selectedEventCategories');
  }

  /**
   * Get selected place categories
   * @returns {Set} Selected place categories
   */
  getSelectedPlaceCategories() {
    return this.state.get('selectedPlaceCategories');
  }
}

// Export singleton instance
export const categoryFilter = new CategoryFilter(eventBus, state);
