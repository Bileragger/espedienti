/**
 * TabManager - Admin Tab Switching
 *
 * Manages switching between Events and Places tabs in the admin interface.
 *
 * Dependencies: EventBus
 */

import { eventBus } from '../core/event-bus.js';

export class TabManager {
  constructor(eventBusInstance) {
    this.eventBus = eventBusInstance;
    this.currentTab = 'events';
  }

  /**
   * Initialize tab manager
   */
  initialize() {
    // Expose switchTab to window for onclick handlers
    window.switchTab = (tab) => this.switchTab(tab);

    // Set initial tab
    this.switchTab('events');

    console.log('✅ TabManager initialized');
  }

  /**
   * Switch to a specific tab
   * @param {string} tab - Tab name ('events' or 'places')
   */
  switchTab(tab) {
    if (this.currentTab === tab) {
      return; // Already on this tab
    }

    this.currentTab = tab;

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    const activeBtn = document.querySelector(`[onclick="switchTab('${tab}')"]`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }

    // Show/hide tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });

    const activeContent = document.getElementById(tab + 'Tab');
    if (activeContent) {
      activeContent.classList.add('active');
    }

    // Emit event for tab change
    this.eventBus.emit('admin:tabChanged', { tab });

    console.log('📑 Switched to tab:', tab);
  }

  /**
   * Get current tab
   * @returns {string} Current tab name
   */
  getCurrentTab() {
    return this.currentTab;
  }

  /**
   * Check if on events tab
   * @returns {boolean} True if on events tab
   */
  isEventsTab() {
    return this.currentTab === 'events';
  }

  /**
   * Check if on places tab
   * @returns {boolean} True if on places tab
   */
  isPlacesTab() {
    return this.currentTab === 'places';
  }
}

// Export singleton instance
export const tabManager = new TabManager(eventBus);
