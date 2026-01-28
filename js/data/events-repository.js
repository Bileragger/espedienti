/**
 * EventsRepository - Events Data Management from Firebase
 *
 * Load strategy: Firebase Firestore only
 * If Firebase fails or has no data, returns empty array
 *
 * Dependencies: FirebaseService, EventBus, StateManager
 */

import { firebaseService } from './firebase-service.js';
import { eventBus } from '../core/event-bus.js';
import { state } from '../core/state-manager.js';

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
   * Load events from Firebase only
   * @returns {Promise<Array>} Loaded events (empty if Firebase fails)
   */
  async load() {
    console.log('📥 Loading events from Firebase...');

    try {
      const events = await this._loadFromFirebase();
      this.loadedFromFirebase = true;
      this._updateState(events);
      this._setupRealtimeListener();
      return events;
    } catch (firebaseError) {
      console.error('❌ Firebase load failed:', firebaseError);

      // Return empty array if Firebase fails
      this.loadedFromFirebase = false;
      this._updateState([]);
      return [];
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
    console.log('✅ Events loaded from Firebase:', events.length);
    return events;
  }

  /**
   * Update state and emit event
   * @param {Array} events - Loaded events
   */
  _updateState(events) {
    this.state.set('events', events);
    this.state.set('filteredEvents', [...events]);

    this.eventBus.emit('events:loaded', {
      events,
      source: this.loadedFromFirebase ? 'firebase' : 'empty',
      count: events.length
    });
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
