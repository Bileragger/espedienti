/**
 * EventBus - Publish/Subscribe Pattern for Module Communication
 *
 * Enables loosely-coupled communication between modules without direct dependencies.
 * Modules can emit events and subscribe to events from other modules.
 *
 * Standard Events:
 * - 'events:loaded' - Events loaded from Firebase/fallback
 * - 'places:loaded' - Places loaded from Firebase/fallback
 * - 'categories:loaded' - Categories loaded from Firebase/fallback
 * - 'filter:applied' - Filters applied to events/places
 * - 'calendar:dateSelected' - Date selected in calendar
 * - 'calendar:monthChanged' - Month changed in calendar
 * - 'map:markerClicked' - Marker clicked on map
 * - 'map:initialized' - Map initialized and ready
 * - 'firebase:ready' - Firebase initialized successfully
 * - 'firebase:error' - Firebase initialization error
 * - 'modal:showPoster' - Show event poster modal
 * - 'search:changed' - Search term changed
 * - 'location:selected' - Location filter selected
 * - 'tag:selected' - Tag filter selected
 * - 'category:toggled' - Category filter toggled
 * - 'openNow:toggled' - Open now filter toggled
 * - 'view:toggled' - Events/places view toggled
 *
 * Usage:
 *   eventBus.emit('events:loaded', { events: [...] });
 *   eventBus.on('events:loaded', (data) => console.log(data.events));
 *   const unsubscribe = eventBus.on('filter:applied', handleFilter);
 *   unsubscribe(); // Remove listener
 */

export class EventBus {
  constructor() {
    // Event storage: Map<eventName, Set<callback>>
    this.events = new Map();

    // Debug mode
    this.debug = false;
  }

  /**
   * Subscribe to an event
   * @param {string} eventName - Event name to subscribe to
   * @param {Function} callback - Callback function (data) => void
   * @param {Object} options - Optional configuration
   * @param {boolean} options.once - Auto-unsubscribe after first trigger
   * @returns {Function} Unsubscribe function
   */
  on(eventName, callback, options = {}) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, new Set());
    }

    // Wrap callback if 'once' option is set
    const wrappedCallback = options.once
      ? (data) => {
          callback(data);
          this.off(eventName, wrappedCallback);
        }
      : callback;

    this.events.get(eventName).add(wrappedCallback);

    if (this.debug) {
      console.log(`[EventBus] Subscribed to "${eventName}"`);
    }

    // Return unsubscribe function
    return () => this.off(eventName, wrappedCallback);
  }

  /**
   * Subscribe to an event (fires only once)
   * @param {string} eventName - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  once(eventName, callback) {
    return this.on(eventName, callback, { once: true });
  }

  /**
   * Unsubscribe from an event
   * @param {string} eventName - Event name
   * @param {Function} callback - Callback to remove
   */
  off(eventName, callback) {
    const eventCallbacks = this.events.get(eventName);

    if (eventCallbacks) {
      eventCallbacks.delete(callback);

      // Clean up empty sets
      if (eventCallbacks.size === 0) {
        this.events.delete(eventName);
      }

      if (this.debug) {
        console.log(`[EventBus] Unsubscribed from "${eventName}"`);
      }
    }
  }

  /**
   * Emit an event
   * @param {string} eventName - Event name to emit
   * @param {*} data - Data to pass to subscribers
   */
  emit(eventName, data) {
    const eventCallbacks = this.events.get(eventName);

    if (this.debug) {
      console.log(`[EventBus] Emitting "${eventName}"`, data);
    }

    if (eventCallbacks && eventCallbacks.size > 0) {
      eventCallbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[EventBus] Error in callback for "${eventName}":`, error);
        }
      });
    }
  }

  /**
   * Remove all subscribers for an event
   * @param {string} eventName - Event name to clear
   */
  clear(eventName) {
    if (eventName) {
      this.events.delete(eventName);
      if (this.debug) {
        console.log(`[EventBus] Cleared all subscribers for "${eventName}"`);
      }
    } else {
      // Clear all events
      this.events.clear();
      if (this.debug) {
        console.log('[EventBus] Cleared all subscribers');
      }
    }
  }

  /**
   * Get list of all event names with subscribers
   * @returns {string[]} Array of event names
   */
  getEventNames() {
    return Array.from(this.events.keys());
  }

  /**
   * Get subscriber count for an event
   * @param {string} eventName - Event name
   * @returns {number} Number of subscribers
   */
  getSubscriberCount(eventName) {
    const eventCallbacks = this.events.get(eventName);
    return eventCallbacks ? eventCallbacks.size : 0;
  }

  /**
   * Enable/disable debug mode
   * @param {boolean} enabled - Debug mode enabled
   */
  setDebug(enabled) {
    this.debug = enabled;
    console.log(`[EventBus] Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Wait for an event (Promise-based)
   * @param {string} eventName - Event name to wait for
   * @param {number} timeout - Optional timeout in ms
   * @returns {Promise} Promise that resolves with event data
   */
  waitFor(eventName, timeout) {
    return new Promise((resolve, reject) => {
      let timeoutId;

      const unsubscribe = this.once(eventName, (data) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        resolve(data);
      });

      if (timeout) {
        timeoutId = setTimeout(() => {
          unsubscribe();
          reject(new Error(`Timeout waiting for event "${eventName}"`));
        }, timeout);
      }
    });
  }
}

// Export singleton instance
export const eventBus = new EventBus();
