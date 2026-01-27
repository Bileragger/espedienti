/**
 * MiniMapService - Mini Leaflet Maps for Location Verification
 *
 * Manages small verification maps in the admin forms to show selected locations.
 *
 * Dependencies: EventBus
 */

import { eventBus } from '../core/event-bus.js';
import { MAP_CONFIG } from '../config/constants.js';

export class MiniMapService {
  constructor(eventBusInstance) {
    this.eventBus = eventBusInstance;
    this.maps = new Map(); // Store multiple maps by ID
    this.markers = new Map(); // Store markers by map ID
    this.mapConfig = MAP_CONFIG;
  }

  /**
   * Initialize mini map service
   */
  initialize() {
    console.log('✅ MiniMapService initialized');
  }

  /**
   * Initialize a mini map
   * @param {string} elementId - Map container element ID
   * @param {Object} options - Map options
   * @returns {L.Map} Leaflet map instance
   */
  initMap(elementId, options = {}) {
    // Check if map already exists
    if (this.maps.has(elementId)) {
      console.log(`ℹ️ Map "${elementId}" already initialized`);
      return this.maps.get(elementId);
    }

    const element = document.getElementById(elementId);

    if (!element) {
      console.error(`❌ Map element "${elementId}" not found`);
      return null;
    }

    const defaultOptions = {
      center: [this.mapConfig.defaultCenter.lat, this.mapConfig.defaultCenter.lng],
      zoom: 12,
      zoomControl: true,
      ...options
    };

    // Create map
    const map = L.map(elementId).setView(defaultOptions.center, defaultOptions.zoom);

    // Add tile layer
    L.tileLayer(this.mapConfig.tileLayerUrl, {
      attribution: this.mapConfig.tileLayerAttribution,
      maxZoom: this.mapConfig.maxZoom
    }).addTo(map);

    // Store map
    this.maps.set(elementId, map);

    // Emit event
    this.eventBus.emit('miniMap:initialized', { elementId, map });
    console.log(`✅ Mini map initialized: ${elementId}`);

    return map;
  }

  /**
   * Update marker on map
   * @param {string} elementId - Map element ID
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   */
  updateMarker(elementId, lat, lng) {
    const map = this.maps.get(elementId);

    if (!map) {
      console.warn(`⚠️ Map "${elementId}" not initialized`);
      return;
    }

    // Remove existing marker
    const existingMarker = this.markers.get(elementId);
    if (existingMarker) {
      map.removeLayer(existingMarker);
    }

    // Add new marker
    const marker = L.marker([lat, lng]).addTo(map);
    this.markers.set(elementId, marker);

    // Center map on marker
    map.setView([lat, lng], 15);

    // Emit event
    this.eventBus.emit('miniMap:markerUpdated', { elementId, lat, lng });
    console.log(`📍 Marker updated on ${elementId}:`, lat, lng);
  }

  /**
   * Get map instance
   * @param {string} elementId - Map element ID
   * @returns {L.Map|null} Leaflet map instance or null
   */
  getMap(elementId) {
    return this.maps.get(elementId) || null;
  }

  /**
   * Get marker instance
   * @param {string} elementId - Map element ID
   * @returns {L.Marker|null} Leaflet marker instance or null
   */
  getMarker(elementId) {
    return this.markers.get(elementId) || null;
  }

  /**
   * Remove map
   * @param {string} elementId - Map element ID
   */
  removeMap(elementId) {
    const map = this.maps.get(elementId);

    if (map) {
      map.remove();
      this.maps.delete(elementId);
      this.markers.delete(elementId);

      this.eventBus.emit('miniMap:removed', { elementId });
      console.log(`✅ Mini map removed: ${elementId}`);
    }
  }

  /**
   * Clear marker from map
   * @param {string} elementId - Map element ID
   */
  clearMarker(elementId) {
    const map = this.maps.get(elementId);
    const marker = this.markers.get(elementId);

    if (map && marker) {
      map.removeLayer(marker);
      this.markers.delete(elementId);

      console.log(`✅ Marker cleared from ${elementId}`);
    }
  }

  /**
   * Center map on coordinates
   * @param {string} elementId - Map element ID
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} zoom - Zoom level (optional)
   */
  centerOn(elementId, lat, lng, zoom = null) {
    const map = this.maps.get(elementId);

    if (map) {
      if (zoom !== null) {
        map.setView([lat, lng], zoom);
      } else {
        map.setView([lat, lng]);
      }

      console.log(`🗺️ Map ${elementId} centered on:`, lat, lng);
    }
  }

  /**
   * Fit map bounds to marker
   * @param {string} elementId - Map element ID
   */
  fitBounds(elementId) {
    const map = this.maps.get(elementId);
    const marker = this.markers.get(elementId);

    if (map && marker) {
      const bounds = L.latLngBounds([marker.getLatLng()]);
      map.fitBounds(bounds.pad(0.5));
    }
  }

  /**
   * Invalidate map size (call after showing hidden map)
   * @param {string} elementId - Map element ID
   */
  invalidateSize(elementId) {
    const map = this.maps.get(elementId);

    if (map) {
      setTimeout(() => {
        map.invalidateSize();
      }, 100);

      console.log(`🔄 Map size invalidated: ${elementId}`);
    }
  }

  /**
   * Check if map is initialized
   * @param {string} elementId - Map element ID
   * @returns {boolean} True if initialized
   */
  isInitialized(elementId) {
    return this.maps.has(elementId);
  }

  /**
   * Get all map IDs
   * @returns {string[]} Array of map element IDs
   */
  getAllMapIds() {
    return Array.from(this.maps.keys());
  }

  /**
   * Remove all maps
   */
  removeAll() {
    this.maps.forEach((map, elementId) => {
      map.remove();
    });

    this.maps.clear();
    this.markers.clear();

    console.log('✅ All mini maps removed');
  }
}

// Export singleton instance
export const miniMapService = new MiniMapService(eventBus);
