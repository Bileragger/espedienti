/**
 * CategoriesLoader - Load Event Categories with WhatsApp Links
 *
 * Load strategy (fallback chain):
 * 1. Try local JSON file (categories.json)
 * 2. If JSON fails, use hardcoded fallback data
 *
 * Dependencies: EventBus, StateManager
 */

import { eventBus } from '../core/event-bus.js';
import { state } from '../core/state-manager.js';
import { FALLBACK_CATEGORIES, API_ENDPOINTS } from '../config/constants.js';

export class CategoriesLoader {
  constructor(eventBusInstance, stateManager) {
    this.eventBus = eventBusInstance;
    this.state = stateManager;
    this.loadedFromJSON = false;
  }

  /**
   * Load categories with fallback
   * @returns {Promise<Object>} Categories object with categories array and generalChat
   */
  async load() {
    console.log('📥 Loading categories...');

    try {
      // Try JSON file
      const categories = await this._loadFromJSON();
      this.loadedFromJSON = true;
      this._updateState(categories);
      return categories;
    } catch (jsonError) {
      console.warn('⚠️ JSON file load failed, using fallback data:', jsonError);

      // Use fallback data
      const categories = this._loadFallbackData();
      this.loadedFromJSON = false;
      this._updateState(categories);
      return categories;
    }
  }

  /**
   * Load categories from local JSON file
   * @returns {Promise<Object>} Categories from JSON
   */
  async _loadFromJSON() {
    const response = await fetch(API_ENDPOINTS.categories);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const categories = await response.json();
    console.log('✅ Categories loaded from JSON file');
    return categories;
  }

  /**
   * Load fallback categories
   * @returns {Object} Fallback categories
   */
  _loadFallbackData() {
    console.log('✅ Using fallback categories data');
    return { ...FALLBACK_CATEGORIES };
  }

  /**
   * Update state and emit event
   * @param {Object} categories - Loaded categories
   */
  _updateState(categories) {
    this.state.set('categories', categories);

    this.eventBus.emit('categories:loaded', {
      categories,
      source: this.loadedFromJSON ? 'json' : 'fallback'
    });
  }

  /**
   * Get category by ID
   * @param {string} categoryId - Category ID
   * @returns {Object|null} Category or null if not found
   */
  getCategoryById(categoryId) {
    const categories = this.state.get('categories');

    if (!categories || !categories.categories) {
      return null;
    }

    return categories.categories.find(c => c.id === categoryId) || null;
  }

  /**
   * Get category info (with fallback to default)
   * @param {string} categoryId - Category ID
   * @returns {Object} Category info with id, name, icon, whatsappLink
   */
  getCategoryInfo(categoryId) {
    const category = this.getCategoryById(categoryId);
    return category || {
      id: 'altro',
      name: 'Altro',
      icon: '✨',
      whatsappLink: ''
    };
  }

  /**
   * Get all categories
   * @returns {Array} Array of categories
   */
  getAllCategories() {
    const categories = this.state.get('categories');
    return categories?.categories || [];
  }

  /**
   * Get general chat link
   * @returns {string} General chat WhatsApp link
   */
  getGeneralChatLink() {
    const categories = this.state.get('categories');
    return categories?.generalChat || '';
  }

  /**
   * Get WhatsApp link for category
   * @param {string} categoryId - Category ID
   * @returns {string} WhatsApp link
   */
  getWhatsAppLink(categoryId) {
    const category = this.getCategoryById(categoryId);
    return category?.whatsappLink || this.getGeneralChatLink();
  }

  /**
   * Check if loaded from JSON
   * @returns {boolean} True if from JSON
   */
  isJSONMode() {
    return this.loadedFromJSON;
  }
}

// Export factory function (for dependency injection)
export function createCategoriesLoader(eventBusInstance, stateManager) {
  return new CategoriesLoader(eventBusInstance, stateManager);
}

// Export singleton instance (using global instances)
export const categoriesLoader = new CategoriesLoader(eventBus, state);
