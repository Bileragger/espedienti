/**
 * ModalManager - Modal Dialog Management
 *
 * Manages poster/image modal display and closing.
 *
 * Dependencies: EventBus
 */

import { eventBus } from '../core/event-bus.js';

export class ModalManager {
  constructor(eventBusInstance) {
    this.eventBus = eventBusInstance;
    this.modalElement = null;
    this.imageElement = null;
  }

  /**
   * Initialize modal manager
   */
  initialize() {
    this.modalElement = document.getElementById('posterModal');
    this.imageElement = document.getElementById('posterImage');

    if (!this.modalElement || !this.imageElement) {
      console.warn('⚠️ Modal elements not found');
      return;
    }

    // Subscribe to show poster event
    this.eventBus.on('modal:showPoster', (data) => {
      this.showPoster(data.url);
    });

    // Expose closeModal to window for onclick handlers
    window.closeModal = () => this.closeModal();

    // Click outside modal to close
    this.modalElement.addEventListener('click', (e) => {
      if (e.target === this.modalElement) {
        this.closeModal();
      }
    });

    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.closeModal();
      }
    });

    console.log('✅ ModalManager initialized');
  }

  /**
   * Show poster modal
   * @param {string} imageUrl - Image URL to display
   */
  showPoster(imageUrl) {
    if (!this.modalElement || !this.imageElement) {
      console.warn('⚠️ Modal elements not found');
      return;
    }

    this.imageElement.src = imageUrl;
    this.modalElement.classList.add('show');

    this.eventBus.emit('modal:opened', { type: 'poster', url: imageUrl });
    console.log('🖼️ Showing poster:', imageUrl);
  }

  /**
   * Close modal
   */
  closeModal() {
    if (!this.modalElement) {
      return;
    }

    this.modalElement.classList.remove('show');

    // Clear image src after animation
    setTimeout(() => {
      if (this.imageElement) {
        this.imageElement.src = '';
      }
    }, 300);

    this.eventBus.emit('modal:closed');
    console.log('✖️ Modal closed');
  }

  /**
   * Check if modal is open
   * @returns {boolean} True if modal is open
   */
  isOpen() {
    return this.modalElement && this.modalElement.classList.contains('show');
  }

  /**
   * Show custom modal with content
   * @param {string} title - Modal title
   * @param {string} content - Modal content (HTML)
   */
  showCustom(title, content) {
    // For future expansion - custom modals with dynamic content
    console.log('Custom modal:', title);
  }
}

// Export singleton instance
export const modalManager = new ModalManager(eventBus);
