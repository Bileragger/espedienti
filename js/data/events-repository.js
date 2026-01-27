/**
 * EventsRepository - Events Data Management with Fallback Chain
 *
 * Load strategy (fallback chain):
 * 1. Try Firebase Firestore
 * 2. If Firebase fails, try local JSON file (events.json)
 * 3. If JSON fails, use hardcoded fallback data
 *
 * Dependencies: FirebaseService, EventBus, StateManager
 */

import { firebaseService } from './firebase-service.js';
import { eventBus } from '../core/event-bus.js';
import { state } from '../core/state-manager.js';
import { FALLBACK_EVENTS, API_ENDPOINTS } from '../config/constants.js';

export class EventsRepository {
  constructor(firebase, eventBusInstance, stateManager) {
    this.firebase = firebase;
    this.eventBus = eventBusInstance;
    this.state = stateManager;
    this.loadedFromFirebase = false;
    this.realtimeListenerActive = false;
    this.unsubscribeRealtime = null;
  }

  /**
   * Load events with fallback chain
   * @returns {Promise<Array>} Loaded events
   */
  async load() {
    console.log('📥 Loading events...');

    try {
      // Try Firebase first
      const events = await this._loadFromFirebase();
      this.loadedFromFirebase = true;
      this._updateState(events, false);
      this._setupRealtimeListener();
      return events;
    } catch (firebaseError) {
      console.warn('⚠️ Firebase load failed, trying JSON file:', firebaseError);

      try {
        // Try JSON file
        const events = await this._loadFromJSON();
        this.loadedFromFirebase = false;
        this._updateState(events, true);
        return events;
      } catch (jsonError) {
        console.warn('⚠️ JSON file load failed, using fallback data:', jsonError);

        // Use fallback data
        const events = this._loadFallbackData();
        this.loadedFromFirebase = false;
        this._updateState(events, true);
        return events;
      }
    }
  }

  /**
   * Load events from Firebase
   * @returns {Promise<Array>} Events from Firebase
   */
  async _loadFromFirebase() {
    if (!this.firebase.isReady()) {
      await this.firebase.initialize();
    }

    const events = await this.firebase.getEvents();

    if (events.length === 0) {
      throw new Error('No events in Firebase');
    }

    console.log('✅ Events loaded from Firebase:', events.length);
    return events;
  }

  /**
   * Load events from local JSON file
   * @returns {Promise<Array>} Events from JSON
   */
  async _loadFromJSON() {
    const response = await fetch(API_ENDPOINTS.events);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const events = await response.json();
    console.log('✅ Events loaded from JSON file:', events.length);
    return events;
  }

  /**
   * Load fallback events
   * @returns {Array} Fallback events
   */
  _loadFallbackData() {
    console.log('✅ Using fallback events data:', FALLBACK_EVENTS.length);
    return [...FALLBACK_EVENTS];
  }

  /**
   * Update state and emit event
   * @param {Array} events - Loaded events
   * @param {boolean} isLocalMode - True if not from Firebase
   */
  _updateState(events, isLocalMode) {
    this.state.set('events', events);
    this.state.set('filteredEvents', [...events]);

    this.eventBus.emit('events:loaded', {
      events,
      source: this.loadedFromFirebase ? 'firebase' : (isLocalMode ? 'local' : 'fallback'),
      count: events.length
    });

    // Show/hide warning banner
    const warningEl = document.getElementById('localWarning');
    if (warningEl) {
      warningEl.style.display = isLocalMode ? 'block' : 'none';
    }
  }

  /**
   * Set up real-time listener for Firebase updates
   */
  _setupRealtimeListener() {
    if (!this.loadedFromFirebase || this.realtimeListenerActive) {
      return;
    }

    try {
      this.unsubscribeRealtime = this.firebase.onEventsSnapshot((snapshot) => {
        const changes = snapshot.docChanges();

        if (changes.length > 0) {
          console.log('🔄 Real-time events update detected');

          // Reload events
          const events = [];
          snapshot.forEach((doc) => {
            events.push({
              firebaseId: doc.id,
              ...doc.data()
            });
          });

          this.state.set('events', events);
          this.eventBus.emit('events:updated', { events, changes });
        }
      });

      this.realtimeListenerActive = true;
      console.log('✅ Real-time listener active for events');
    } catch (error) {
      console.error('❌ Failed to set up real-time listener:', error);
    }
  }

  /**
   * Add a new event
   * @param {Object} eventData - Event data
   * @returns {Promise<Object>} Added event with firebaseId
   */
  async add(eventData) {
    if (!this.loadedFromFirebase) {
      throw new Error('Cannot add event: not connected to Firebase');
    }

    const addedEvent = await this.firebase.addEvent(eventData);

    // Update local state
    const events = this.state.get('events');
    events.push(addedEvent);
    this.state.set('events', [...events]);

    this.eventBus.emit('event:added', { event: addedEvent });
    console.log('✅ Event added:', addedEvent.firebaseId);

    return addedEvent;
  }

  /**
   * Update an existing event
   * @param {number} localId - Local event ID
   * @param {string} firebaseId - Firebase document ID
   * @param {Object} eventData - Updated data
   * @returns {Promise<void>}
   */
  async update(localId, firebaseId, eventData) {
    if (!this.loadedFromFirebase) {
      throw new Error('Cannot update event: not connected to Firebase');
    }

    await this.firebase.updateEvent(firebaseId, eventData);

    // Update local state
    const events = this.state.get('events');
    const eventIndex = events.findIndex(e => e.id === localId);

    if (eventIndex !== -1) {
      events[eventIndex] = { ...events[eventIndex], ...eventData };
      this.state.set('events', [...events]);
    }

    this.eventBus.emit('event:updated', { localId, firebaseId, eventData });
    console.log('✅ Event updated:', firebaseId);
  }

  /**
   * Delete an event
   * @param {number} localId - Local event ID
   * @param {string} firebaseId - Firebase document ID
   * @returns {Promise<void>}
   */
  async delete(localId, firebaseId) {
    if (!this.loadedFromFirebase) {
      throw new Error('Cannot delete event: not connected to Firebase');
    }

    await this.firebase.deleteEvent(firebaseId);

    // Update local state
    const events = this.state.get('events');
    const filteredEvents = events.filter(e => e.id !== localId);
    this.state.set('events', filteredEvents);

    this.eventBus.emit('event:deleted', { localId, firebaseId });
    console.log('✅ Event deleted:', firebaseId);
  }

  /**
   * Get event by ID
   * @param {number} localId - Local event ID
   * @returns {Object|null} Event or null if not found
   */
  getById(localId) {
    const events = this.state.get('events');
    return events.find(e => e.id === localId) || null;
  }

  /**
   * Get all events
   * @returns {Array} All events
   */
  getAll() {
    return this.state.get('events');
  }

  /**
   * Get filtered events
   * @returns {Array} Filtered events
   */
  getFiltered() {
    return this.state.get('filteredEvents');
  }

  /**
   * Check if loaded from Firebase
   * @returns {boolean} True if from Firebase
   */
  isFirebaseMode() {
    return this.loadedFromFirebase;
  }

  /**
   * Cleanup listeners
   */
  cleanup() {
    if (this.unsubscribeRealtime) {
      this.unsubscribeRealtime();
      this.realtimeListenerActive = false;
      console.log('✅ Events real-time listener cleaned up');
    }
  }
}

// Export factory function (for dependency injection)
export function createEventsRepository(firebase, eventBusInstance, stateManager) {
  return new EventsRepository(firebase, eventBusInstance, stateManager);
}

// Export singleton instance (using global instances)
export const eventsRepository = new EventsRepository(firebaseService, eventBus, state);
