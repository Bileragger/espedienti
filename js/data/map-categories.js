/**
 * MapCategoriesLoader - Load event/place categories from Firestore
 *
 * Mirrors what admin/category-manager.js does on the admin side, but for
 * the public frontend. Loads from Firestore (same collections) and publishes
 * window.categoryColors so map-renderer.js picks up custom colors and new cats.
 *
 * Falls back to constants if Firestore is unavailable.
 */

import { eventBus } from '../core/event-bus.js';
import { firebaseService } from './firebase-service.js';
import {
  EVENT_CATEGORY_COLORS,
  PLACE_CATEGORY_COLORS,
  EVENT_CATEGORIES,
  PLACE_CATEGORIES,
} from '../config/constants.js';

const COLLECTION_EVENT_CATS = 'event_categories';
const COLLECTION_PLACE_CATS = 'place_categories';

class MapCategoriesLoader {
  constructor() {
    this.eventCategories = [];
    this.placeCategories = [];
  }

  async load() {
    try {
      const rows = await firebaseService.getAll(COLLECTION_EVENT_CATS);
      this.eventCategories = rows.length > 0 ? rows : this._fallbackEventCats();
    } catch (_) {
      this.eventCategories = this._fallbackEventCats();
    }

    try {
      const rows = await firebaseService.getAll(COLLECTION_PLACE_CATS);
      this.placeCategories = rows.length > 0 ? rows : this._fallbackPlaceCats();
    } catch (_) {
      this.placeCategories = this._fallbackPlaceCats();
    }

    this._publishColors();

    eventBus.emit('mapCategories:loaded', {
      eventCategories: this.eventCategories,
      placeCategories: this.placeCategories,
    });

    console.log(`✅ MapCategories loaded: ${this.eventCategories.length} event, ${this.placeCategories.length} place`);
  }

  _fallbackEventCats() {
    return Object.entries(EVENT_CATEGORIES).map(([key, cat]) => ({
      key,
      name: cat.name,
      color: EVENT_CATEGORY_COLORS[key] || '#94a3b8',
      icon: cat.icon,
    }));
  }

  _fallbackPlaceCats() {
    return Object.entries(PLACE_CATEGORIES).map(([key, cat]) => ({
      key,
      name: cat.name,
      color: PLACE_CATEGORY_COLORS[key] || '#64748b',
      icon: cat.icon,
    }));
  }

  _publishColors() {
    const eventColors = {};
    for (const cat of this.eventCategories) eventColors[cat.key] = cat.color;

    const placeColors = {};
    for (const cat of this.placeCategories) placeColors[cat.key] = cat.color;

    window.categoryColors = { eventColors, placeColors };
  }
}

export const mapCategoriesLoader = new MapCategoriesLoader();
