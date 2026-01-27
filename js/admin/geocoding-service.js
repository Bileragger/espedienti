/**
 * GeocodingService - Nominatim API Integration
 *
 * Handles location search using OpenStreetMap Nominatim API.
 * Provides search results with coordinates and address details.
 *
 * Dependencies: EventBus
 */

import { eventBus } from '../core/event-bus.js';

export class GeocodingService {
  constructor(eventBusInstance) {
    this.eventBus = eventBusInstance;
    this.baseUrl = 'https://nominatim.openstreetmap.org';
    this.searchTimeout = null;
    this.lastResults = [];
  }

  /**
   * Initialize geocoding service
   */
  initialize() {
    console.log('✅ GeocodingService initialized');
  }

  /**
   * Search for a location
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Array of results
   */
  async search(query, options = {}) {
    const defaultOptions = {
      limit: 5,
      addressdetails: 1,
      countrycodes: 'it', // Limit to Italy for better results
      ...options
    };

    try {
      const params = new URLSearchParams({
        format: 'json',
        q: query,
        ...defaultOptions
      });

      const response = await fetch(`${this.baseUrl}/search?${params.toString()}`, {
        headers: {
          'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const results = await response.json();
      this.lastResults = results;

      this.eventBus.emit('geocoding:searchComplete', { query, results });
      console.log(`🔍 Geocoding search for "${query}":`, results.length, 'results');

      return results;
    } catch (error) {
      console.error('❌ Geocoding search error:', error);
      this.eventBus.emit('geocoding:error', { error, query });
      throw error;
    }
  }

  /**
   * Search with debouncing (for input fields)
   * @param {string} query - Search query
   * @param {number} delay - Debounce delay in ms
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Array of results
   */
  searchDebounced(query, delay = 500, options = {}) {
    return new Promise((resolve, reject) => {
      // Clear existing timeout
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }

      // Set new timeout
      this.searchTimeout = setTimeout(async () => {
        try {
          const results = await this.search(query, options);
          resolve(results);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  }

  /**
   * Get last search results
   * @returns {Array} Last search results
   */
  getLastResults() {
    return this.lastResults;
  }

  /**
   * Format result as address string
   * @param {Object} result - Nominatim result object
   * @returns {string} Formatted address
   */
  formatAddress(result) {
    let address = '';

    if (result.address) {
      const addr = result.address;

      // Build address with house number if available
      if (addr.house_number && addr.road) {
        address = `${addr.road}, ${addr.house_number}`;
      } else if (addr.road) {
        address = addr.road;
      }

      // Add additional details
      if (addr.suburb) address += `, ${addr.suburb}`;
      if (addr.city) address += `, ${addr.city}`;
      else if (addr.town) address += `, ${addr.town}`;
      else if (addr.village) address += `, ${addr.village}`;
    }

    // Fallback to display_name if address construction failed
    if (!address) {
      address = result.display_name;
    }

    return address;
  }

  /**
   * Extract coordinates from result
   * @param {Object} result - Nominatim result object
   * @returns {Object} { lat, lng }
   */
  extractCoordinates(result) {
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon)
    };
  }

  /**
   * Reverse geocode (coordinates to address)
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<Object>} Result object
   */
  async reverse(lat, lng) {
    try {
      const params = new URLSearchParams({
        format: 'json',
        lat: lat.toString(),
        lon: lng.toString(),
        addressdetails: '1'
      });

      const response = await fetch(`${this.baseUrl}/reverse?${params.toString()}`, {
        headers: {
          'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      this.eventBus.emit('geocoding:reverseComplete', { lat, lng, result });
      console.log(`🔍 Reverse geocoding for (${lat}, ${lng})`);

      return result;
    } catch (error) {
      console.error('❌ Reverse geocoding error:', error);
      this.eventBus.emit('geocoding:error', { error, lat, lng });
      throw error;
    }
  }

  /**
   * Validate coordinates
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {boolean} True if valid
   */
  validateCoordinates(lat, lng) {
    return (
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  }

  /**
   * Parse coordinate string (e.g., "40.8536, 14.2503")
   * @param {string} coordStr - Coordinate string
   * @returns {Object|null} { lat, lng } or null if invalid
   */
  parseCoordinateString(coordStr) {
    const parts = coordStr.split(',').map(s => s.trim());

    if (parts.length !== 2) {
      return null;
    }

    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);

    if (!this.validateCoordinates(lat, lng)) {
      return null;
    }

    return { lat, lng };
  }

  /**
   * Format coordinates as string
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {string} Formatted string "lat, lng"
   */
  formatCoordinates(lat, lng) {
    return `${lat}, ${lng}`;
  }
}

// Export singleton instance
export const geocodingService = new GeocodingService(eventBus);
