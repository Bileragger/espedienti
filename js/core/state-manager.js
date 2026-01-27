/**
 * StateManager - Centralized State Management with Reactive Proxy
 *
 * Eliminates all global variables and provides reactive state updates
 * through a Proxy-based subscription system.
 *
 * Usage:
 *   const state = new StateManager();
 *   state.subscribe('events', (newEvents) => renderEvents(newEvents));
 *   state.set('events', [...newEvents]);
 */

export class StateManager {
  constructor() {
    // Initialize all application state
    this.state = {
      // Events data
      events: [],
      filteredEvents: [],

      // Places data
      places: [],
      filteredPlaces: [],

      // Filter state
      selectedDate: null,
      selectedLocation: null,
      selectedTag: null,
      selectedEventCategories: new Set(['all']),
      selectedPlaceCategories: new Set(['all']),
      openNowFilterActive: false,
      searchTerm: '',

      // Calendar state
      currentMonth: new Date(),

      // Toggle state
      showEvents: true,
      showPlaces: true,

      // Map state
      map: null,
      markers: [],
      placeMarkers: [],
      userMarker: null,

      // Categories data
      categories: {},

      // Firebase state
      firebaseReady: false
    };

    // Subscriber storage: Map<stateKey, Set<callback>>
    this.subscribers = new Map();

    // Create reactive proxy
    this.proxyState = new Proxy(this.state, {
      set: (target, property, value) => {
        const oldValue = target[property];
        target[property] = value;

        // Notify subscribers only if value changed
        if (oldValue !== value) {
          this.notify(property, value, oldValue);
        }

        return true;
      }
    });
  }

  /**
   * Get a state value
   * @param {string} key - State key
   * @returns {*} State value
   */
  get(key) {
    return this.proxyState[key];
  }

  /**
   * Set a state value (triggers subscribers)
   * @param {string} key - State key
   * @param {*} value - New value
   */
  set(key, value) {
    this.proxyState[key] = value;
  }

  /**
   * Subscribe to state changes
   * @param {string} key - State key to watch
   * @param {Function} callback - Callback function (newValue, oldValue) => void
   * @returns {Function} Unsubscribe function
   */
  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }

    this.subscribers.get(key).add(callback);

    // Return unsubscribe function
    return () => {
      const keySubscribers = this.subscribers.get(key);
      if (keySubscribers) {
        keySubscribers.delete(callback);

        // Clean up empty sets
        if (keySubscribers.size === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }

  /**
   * Notify all subscribers of a state change
   * @param {string} key - State key that changed
   * @param {*} newValue - New value
   * @param {*} oldValue - Previous value
   */
  notify(key, newValue, oldValue) {
    const keySubscribers = this.subscribers.get(key);

    if (keySubscribers && keySubscribers.size > 0) {
      keySubscribers.forEach(callback => {
        try {
          callback(newValue, oldValue);
        } catch (error) {
          console.error(`Error in subscriber for "${key}":`, error);
        }
      });
    }
  }

  /**
   * Get all state (for debugging)
   * @returns {Object} Complete state object
   */
  getAll() {
    return { ...this.state };
  }

  /**
   * Reset specific state keys to initial values
   * @param {string[]} keys - Keys to reset
   */
  reset(keys) {
    const initialState = {
      events: [],
      filteredEvents: [],
      places: [],
      filteredPlaces: [],
      selectedDate: null,
      selectedLocation: null,
      selectedTag: null,
      selectedEventCategories: new Set(['all']),
      selectedPlaceCategories: new Set(['all']),
      openNowFilterActive: false,
      searchTerm: '',
      currentMonth: new Date(),
      showEvents: true,
      showPlaces: true,
      map: null,
      markers: [],
      placeMarkers: [],
      userMarker: null,
      categories: {},
      firebaseReady: false
    };

    keys.forEach(key => {
      if (key in initialState) {
        this.set(key, initialState[key]);
      }
    });
  }

  /**
   * Batch update multiple state keys without triggering notifications
   * until all updates are complete
   * @param {Object} updates - Object with key-value pairs to update
   */
  batchUpdate(updates) {
    // Temporarily disable notifications
    const originalProxy = this.proxyState;
    this.proxyState = this.state;

    // Apply all updates
    Object.entries(updates).forEach(([key, value]) => {
      this.state[key] = value;
    });

    // Re-enable notifications and notify for each changed key
    this.proxyState = originalProxy;
    Object.entries(updates).forEach(([key, value]) => {
      this.notify(key, value, this.state[key]);
    });
  }
}

// Export singleton instance
export const state = new StateManager();
