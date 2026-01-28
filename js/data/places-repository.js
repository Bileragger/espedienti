/**
 * PlacesRepository - Places Data Management from Firebase
 *
 * Load strategy: Firebase Firestore only
 * If Firebase fails or has no data, returns empty array
 *
 * Dependencies: FirebaseService, EventBus, StateManager
 */

import { firebaseService } from './firebase-service.js';
import { eventBus } from '../core/event-bus.js';
import { state } from '../core/state-manager.js';

export class PlacesRepository {
  constructor(firebase, eventBusInstance, stateManager) {
    this.firebase = firebase;
    this.eventBus = eventBusInstance;
    this.state = stateManager;
    this.loadedFromFirebase = false;
    this.realtimeListenerActive = false;
    this.unsubscribeRealtime = null;
  }

  /**
   * Load places from Firebase only
   * @returns {Promise<Array>} Loaded places (empty if Firebase fails)
   */
  async load() {
    console.log('📥 Loading places from Firebase...');

    try {
      const places = await this._loadFromFirebase();
      this.loadedFromFirebase = true;
      this._updateState(places);
      this._setupRealtimeListener();
      return places;
    } catch (firebaseError) {
      console.error('❌ Firebase load failed:', firebaseError);

      // Return empty array if Firebase fails
      this.loadedFromFirebase = false;
      this._updateState([]);
      return [];
    }
  }

  /**
   * Load places from Firebase
   * @returns {Promise<Array>} Places from Firebase
   */
  async _loadFromFirebase() {
    if (!this.firebase.isReady()) {
      await this.firebase.initialize();
    }

    const places = await this.firebase.getPlaces();
    console.log('✅ Places loaded from Firebase:', places.length);
    return places;
  }

  /**
   * Update state and emit event
   * @param {Array} places - Loaded places
   */
  _updateState(places) {
    this.state.set('places', places);
    this.state.set('filteredPlaces', [...places]);

    this.eventBus.emit('places:loaded', {
      places,
      source: this.loadedFromFirebase ? 'firebase' : 'empty',
      count: places.length
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
      this.unsubscribeRealtime = this.firebase.onPlacesSnapshot((snapshot) => {
        const changes = snapshot.docChanges();

        if (changes.length > 0) {
          console.log('🔄 Real-time places update detected');

          // Reload places
          const places = [];
          snapshot.forEach((doc) => {
            places.push({
              firebaseId: doc.id,
              ...doc.data()
            });
          });

          this.state.set('places', places);
          this.eventBus.emit('places:updated', { places, changes });
        }
      });

      this.realtimeListenerActive = true;
      console.log('✅ Real-time listener active for places');
    } catch (error) {
      console.error('❌ Failed to set up real-time listener:', error);
    }
  }

  /**
   * Add a new place
   * @param {Object} placeData - Place data
   * @returns {Promise<Object>} Added place with firebaseId
   */
  async add(placeData) {
    if (!this.loadedFromFirebase) {
      throw new Error('Cannot add place: not connected to Firebase');
    }

    const addedPlace = await this.firebase.addPlace(placeData);

    // Update local state
    const places = this.state.get('places');
    places.push(addedPlace);
    this.state.set('places', [...places]);

    this.eventBus.emit('place:added', { place: addedPlace });
    console.log('✅ Place added:', addedPlace.firebaseId);

    return addedPlace;
  }

  /**
   * Update an existing place
   * @param {number} localId - Local place ID
   * @param {string} firebaseId - Firebase document ID
   * @param {Object} placeData - Updated data
   * @returns {Promise<void>}
   */
  async update(localId, firebaseId, placeData) {
    if (!this.loadedFromFirebase) {
      throw new Error('Cannot update place: not connected to Firebase');
    }

    await this.firebase.updatePlace(firebaseId, placeData);

    // Update local state
    const places = this.state.get('places');
    const placeIndex = places.findIndex(p => p.id === localId);

    if (placeIndex !== -1) {
      places[placeIndex] = { ...places[placeIndex], ...placeData };
      this.state.set('places', [...places]);
    }

    this.eventBus.emit('place:updated', { localId, firebaseId, placeData });
    console.log('✅ Place updated:', firebaseId);
  }

  /**
   * Delete a place
   * @param {number} localId - Local place ID
   * @param {string} firebaseId - Firebase document ID
   * @returns {Promise<void>}
   */
  async delete(localId, firebaseId) {
    if (!this.loadedFromFirebase) {
      throw new Error('Cannot delete place: not connected to Firebase');
    }

    await this.firebase.deletePlace(firebaseId);

    // Update local state
    const places = this.state.get('places');
    const filteredPlaces = places.filter(p => p.id !== localId);
    this.state.set('places', filteredPlaces);

    this.eventBus.emit('place:deleted', { localId, firebaseId });
    console.log('✅ Place deleted:', firebaseId);
  }

  /**
   * Get place by ID
   * @param {number} localId - Local place ID
   * @returns {Object|null} Place or null if not found
   */
  getById(localId) {
    const places = this.state.get('places');
    return places.find(p => p.id === localId) || null;
  }

  /**
   * Get all places
   * @returns {Array} All places
   */
  getAll() {
    return this.state.get('places');
  }

  /**
   * Get filtered places
   * @returns {Array} Filtered places
   */
  getFiltered() {
    return this.state.get('filteredPlaces');
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
      console.log('✅ Places real-time listener cleaned up');
    }
  }
}

// Export factory function (for dependency injection)
export function createPlacesRepository(firebase, eventBusInstance, stateManager) {
  return new PlacesRepository(firebase, eventBusInstance, stateManager);
}

// Export singleton instance (using global instances)
export const placesRepository = new PlacesRepository(firebaseService, eventBus, state);
