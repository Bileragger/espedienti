/**
 * FirebaseService - Wrapper for Firebase Firestore Operations
 *
 * Provides a clean interface for CRUD operations and real-time listeners.
 * Handles initialization waiting and error management.
 *
 * Dependencies: window.db, window.firestoreModules (set by inline Firebase setup)
 */

import { eventBus } from '../core/event-bus.js';
import { FIREBASE_COLLECTIONS } from '../config/constants.js';

export class FirebaseService {
  constructor() {
    this.db = null;
    this.modules = null;
    this.ready = false;
    this.listeners = new Map(); // Track active listeners for cleanup
  }

  /**
   * Initialize Firebase service
   * Waits for window.firebaseReady and window.db to be available
   * @returns {Promise<boolean>} True if initialized successfully
   */
  async initialize() {
    if (this.ready) {
      return true;
    }

    try {
      // Wait for Firebase to be ready (set by inline script)
      await this._waitForFirebase();

      this.db = window.db;
      this.modules = window.firestoreModules;
      this.ready = true;

      console.log('✅ FirebaseService initialized');
      eventBus.emit('firebase:ready');

      return true;
    } catch (error) {
      console.error('❌ FirebaseService initialization failed:', error);
      eventBus.emit('firebase:error', { error });
      return false;
    }
  }

  /**
   * Wait for Firebase to be initialized by inline script
   * @returns {Promise<void>}
   */
  _waitForFirebase() {
    return new Promise((resolve) => {
      // By the time this is called, firebaseReady is already true
      // (admin-app.js only calls initialize() after the firebaseReady event)
      if (window.firebaseReady && window.db && window.firestoreModules) {
        resolve();
        return;
      }
      // Fallback: wait for the event (should rarely be needed)
      window.addEventListener('firebaseReady', resolve, { once: true });
    });
  }

  /**
   * Get all documents from a collection
   * @param {string} collectionName - Collection name
   * @returns {Promise<Array>} Array of documents with firebaseId
   */
  async getAll(collectionName) {
    if (!this.ready) {
      throw new Error('FirebaseService not initialized');
    }

    try {
      const { collection, getDocs } = this.modules;
      const querySnapshot = await getDocs(collection(this.db, collectionName));

      const documents = [];
      querySnapshot.forEach((doc) => {
        documents.push({
          firebaseId: doc.id,
          ...doc.data()
        });
      });

      console.log(`✅ Loaded ${documents.length} documents from ${collectionName}`);
      return documents;
    } catch (error) {
      console.error(`❌ Error loading ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Add a new document to a collection
   * @param {string} collectionName - Collection name
   * @param {Object} data - Document data
   * @returns {Promise<Object>} Added document with firebaseId
   */
  async add(collectionName, data) {
    if (!this.ready) {
      throw new Error('FirebaseService not initialized');
    }

    try {
      const { collection, addDoc } = this.modules;
      const docRef = await addDoc(collection(this.db, collectionName), data);

      const documentWithId = {
        firebaseId: docRef.id,
        ...data
      };

      console.log(`✅ Added document to ${collectionName}:`, docRef.id);
      return documentWithId;
    } catch (error) {
      console.error(`❌ Error adding document to ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Update an existing document
   * @param {string} collectionName - Collection name
   * @param {string} firebaseId - Document Firebase ID
   * @param {Object} data - Updated data
   * @returns {Promise<void>}
   */
  async update(collectionName, firebaseId, data) {
    if (!this.ready) {
      throw new Error('FirebaseService not initialized');
    }

    try {
      const { doc, updateDoc } = this.modules;
      await updateDoc(doc(this.db, collectionName, firebaseId), data);

      console.log(`✅ Updated document in ${collectionName}:`, firebaseId);
    } catch (error) {
      console.error(`❌ Error updating document in ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Delete a document
   * @param {string} collectionName - Collection name
   * @param {string} firebaseId - Document Firebase ID
   * @returns {Promise<void>}
   */
  async delete(collectionName, firebaseId) {
    if (!this.ready) {
      throw new Error('FirebaseService not initialized');
    }

    try {
      const { doc, deleteDoc } = this.modules;
      await deleteDoc(doc(this.db, collectionName, firebaseId));

      console.log(`✅ Deleted document from ${collectionName}:`, firebaseId);
    } catch (error) {
      console.error(`❌ Error deleting document from ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Set up real-time listener for a collection
   * @param {string} collectionName - Collection name
   * @param {Function} callback - Callback (snapshot) => void
   * @returns {Function} Unsubscribe function
   */
  onSnapshot(collectionName, callback) {
    if (!this.ready) {
      throw new Error('FirebaseService not initialized');
    }

    try {
      const { collection, onSnapshot } = this.modules;

      const unsubscribe = onSnapshot(
        collection(this.db, collectionName),
        (snapshot) => {
          console.log(`🔄 Real-time update for ${collectionName}`);
          callback(snapshot);
        },
        (error) => {
          console.error(`❌ Snapshot error for ${collectionName}:`, error);
          eventBus.emit('firebase:snapshot-error', { collectionName, error });
        }
      );

      // Track listener for cleanup
      if (!this.listeners.has(collectionName)) {
        this.listeners.set(collectionName, new Set());
      }
      this.listeners.get(collectionName).add(unsubscribe);

      console.log(`✅ Real-time listener set up for ${collectionName}`);

      // Return unsubscribe function
      return () => {
        unsubscribe();
        const collectionListeners = this.listeners.get(collectionName);
        if (collectionListeners) {
          collectionListeners.delete(unsubscribe);
        }
      };
    } catch (error) {
      console.error(`❌ Error setting up listener for ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Helper: Get all events
   * @returns {Promise<Array>} Array of events
   */
  async getEvents() {
    return this.getAll(FIREBASE_COLLECTIONS.events);
  }

  /**
   * Helper: Get all places
   * @returns {Promise<Array>} Array of places
   */
  async getPlaces() {
    return this.getAll(FIREBASE_COLLECTIONS.places);
  }

  /**
   * Helper: Get all categories
   * @returns {Promise<Array>} Array of categories
   */
  async getCategories() {
    return this.getAll(FIREBASE_COLLECTIONS.categories);
  }

  /**
   * Helper: Add event
   * @param {Object} eventData - Event data
   * @returns {Promise<Object>} Added event with firebaseId
   */
  async addEvent(eventData) {
    return this.add(FIREBASE_COLLECTIONS.events, eventData);
  }

  /**
   * Helper: Add place
   * @param {Object} placeData - Place data
   * @returns {Promise<Object>} Added place with firebaseId
   */
  async addPlace(placeData) {
    return this.add(FIREBASE_COLLECTIONS.places, placeData);
  }

  /**
   * Helper: Update event
   * @param {string} firebaseId - Firebase ID
   * @param {Object} eventData - Updated data
   * @returns {Promise<void>}
   */
  async updateEvent(firebaseId, eventData) {
    return this.update(FIREBASE_COLLECTIONS.events, firebaseId, eventData);
  }

  /**
   * Helper: Update place
   * @param {string} firebaseId - Firebase ID
   * @param {Object} placeData - Updated data
   * @returns {Promise<void>}
   */
  async updatePlace(firebaseId, placeData) {
    return this.update(FIREBASE_COLLECTIONS.places, firebaseId, placeData);
  }

  /**
   * Helper: Delete event
   * @param {string} firebaseId - Firebase ID
   * @returns {Promise<void>}
   */
  async deleteEvent(firebaseId) {
    return this.delete(FIREBASE_COLLECTIONS.events, firebaseId);
  }

  /**
   * Helper: Delete place
   * @param {string} firebaseId - Firebase ID
   * @returns {Promise<void>}
   */
  async deletePlace(firebaseId) {
    return this.delete(FIREBASE_COLLECTIONS.places, firebaseId);
  }

  /**
   * Helper: Listen to events changes
   * @param {Function} callback - Callback (snapshot) => void
   * @returns {Function} Unsubscribe function
   */
  onEventsSnapshot(callback) {
    return this.onSnapshot(FIREBASE_COLLECTIONS.events, callback);
  }

  /**
   * Helper: Listen to places changes
   * @param {Function} callback - Callback (snapshot) => void
   * @returns {Function} Unsubscribe function
   */
  onPlacesSnapshot(callback) {
    return this.onSnapshot(FIREBASE_COLLECTIONS.places, callback);
  }

  /**
   * Cleanup all listeners
   */
  cleanup() {
    for (const [collectionName, unsubscribers] of this.listeners) {
      unsubscribers.forEach(unsubscribe => unsubscribe());
      console.log(`✅ Cleaned up listeners for ${collectionName}`);
    }
    this.listeners.clear();
  }

  /**
   * Check if service is ready
   * @returns {boolean} True if ready
   */
  isReady() {
    return this.ready;
  }
}

// Export singleton instance
export const firebaseService = new FirebaseService();
