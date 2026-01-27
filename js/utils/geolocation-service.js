/**
 * GeolocationService - User Geolocation
 *
 * Handles browser geolocation API for getting user's current position.
 *
 * Dependencies: EventBus
 */

import { eventBus } from '../core/event-bus.js';

export class GeolocationService {
  constructor(eventBusInstance) {
    this.eventBus = eventBusInstance;
    this.supported = false;
    this.currentPosition = null;
  }

  /**
   * Initialize geolocation service
   */
  initialize() {
    this.supported = 'geolocation' in navigator;

    if (!this.supported) {
      console.warn('⚠️ Geolocation not supported by browser');
    } else {
      console.log('✅ GeolocationService initialized');
    }
  }

  /**
   * Check if geolocation is supported
   * @returns {boolean} True if supported
   */
  isSupported() {
    return this.supported;
  }

  /**
   * Get user's current position
   * @param {Object} options - Geolocation options
   * @returns {Promise<Object>} Promise with {lat, lng, accuracy} or error
   */
  getCurrentPosition(options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.supported) {
        const error = new Error('Geolocation not supported');
        this.eventBus.emit('geolocation:error', { error });
        reject(error);
        return;
      }

      const defaultOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      };

      const finalOptions = { ...defaultOptions, ...options };

      this.eventBus.emit('geolocation:requesting');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const result = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            timestamp: position.timestamp
          };

          this.currentPosition = result;
          this.eventBus.emit('geolocation:success', result);

          console.log('📍 User position:', result.lat, result.lng);
          resolve(result);
        },
        (error) => {
          const errorMsg = this._getErrorMessage(error);
          this.eventBus.emit('geolocation:error', { error: errorMsg, code: error.code });

          console.error('❌ Geolocation error:', errorMsg);
          reject(new Error(errorMsg));
        },
        finalOptions
      );
    });
  }

  /**
   * Watch user's position (continuous tracking)
   * @param {Function} callback - Callback (position) => void
   * @param {Object} options - Geolocation options
   * @returns {number|null} Watch ID for clearing, or null if not supported
   */
  watchPosition(callback, options = {}) {
    if (!this.supported) {
      console.warn('⚠️ Geolocation not supported');
      return null;
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    };

    const finalOptions = { ...defaultOptions, ...options };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const result = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };

        this.currentPosition = result;
        this.eventBus.emit('geolocation:updated', result);
        callback(result);
      },
      (error) => {
        const errorMsg = this._getErrorMessage(error);
        this.eventBus.emit('geolocation:error', { error: errorMsg, code: error.code });
        console.error('❌ Geolocation watch error:', errorMsg);
      },
      finalOptions
    );

    console.log('✅ Watching user position:', watchId);
    return watchId;
  }

  /**
   * Clear position watch
   * @param {number} watchId - Watch ID from watchPosition
   */
  clearWatch(watchId) {
    if (this.supported && watchId) {
      navigator.geolocation.clearWatch(watchId);
      console.log('✅ Position watch cleared:', watchId);
    }
  }

  /**
   * Get last known position
   * @returns {Object|null} Last position or null
   */
  getLastPosition() {
    return this.currentPosition;
  }

  /**
   * Calculate distance between two points (Haversine formula)
   * @param {number} lat1 - Latitude 1
   * @param {number} lng1 - Longitude 1
   * @param {number} lat2 - Latitude 2
   * @param {number} lng2 - Longitude 2
   * @returns {number} Distance in meters
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Format distance for display
   * @param {number} meters - Distance in meters
   * @returns {string} Formatted distance
   */
  formatDistance(meters) {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  }

  /**
   * Get human-readable error message
   * @param {GeolocationPositionError} error - Geolocation error
   * @returns {string} Error message
   */
  _getErrorMessage(error) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Autorizzazione geolocalizzazione negata';
      case error.POSITION_UNAVAILABLE:
        return 'Posizione non disponibile';
      case error.TIMEOUT:
        return 'Timeout nella richiesta di geolocalizzazione';
      default:
        return 'Errore geolocalizzazione sconosciuto';
    }
  }
}

// Export singleton instance
export const geolocationService = new GeolocationService(eventBus);
