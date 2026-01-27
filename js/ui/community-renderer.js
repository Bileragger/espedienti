/**
 * CommunityRenderer - Community Section Rendering
 *
 * Renders the community section with WhatsApp group links for each category.
 *
 * Dependencies: EventBus, StateManager, CategoriesLoader
 */

import { eventBus } from '../core/event-bus.js';
import { state } from '../core/state-manager.js';
import { categoriesLoader } from '../data/categories-loader.js';

export class CommunityRenderer {
  constructor(eventBusInstance, stateManager, categories) {
    this.eventBus = eventBusInstance;
    this.state = stateManager;
    this.categoriesLoader = categories;
  }

  /**
   * Initialize community renderer
   */
  initialize() {
    // Subscribe to categories loaded event
    this.eventBus.on('categories:loaded', () => {
      this.render();
    });

    console.log('✅ CommunityRenderer initialized');
  }

  /**
   * Render community category chats
   */
  render() {
    const container = document.getElementById('categoryChats');

    if (!container) {
      console.warn('⚠️ Category chats container not found');
      return;
    }

    const allCategories = this.categoriesLoader.getAllCategories();

    // Build category chat cards
    const categoryCardsHtml = allCategories.map(cat => `
      <div style="border: 2px solid #e0e7ff; border-radius: 8px; padding: 15px; text-align: center; transition: all 0.3s; cursor: pointer;"
           onmouseover="this.style.borderColor='#667eea'; this.style.background='#f0f4ff'"
           onmouseout="this.style.borderColor='#e0e7ff'; this.style.background='white'"
           onclick="window.open('${cat.whatsappLink}', '_blank')">
        <div style="font-size: 2rem; margin-bottom: 10px;">${cat.icon}</div>
        <div style="font-weight: 600; margin-bottom: 5px;">${cat.name}</div>
        <div style="font-size: 0.875rem; color: #666;">Clicca per unirti</div>
      </div>
    `).join('');

    container.innerHTML = categoryCardsHtml;

    // Set up general chat button
    this._setupGeneralChatButton();

    console.log('✅ Community section rendered');
  }

  /**
   * Set up general chat button onclick
   */
  _setupGeneralChatButton() {
    const generalChatLink = this.categoriesLoader.getGeneralChatLink();

    // Main general chat button
    const generalBtn = document.getElementById('generalChatBtn');
    if (generalBtn) {
      generalBtn.onclick = () => window.open(generalChatLink, '_blank');
    }

    // Hero section general chat button (if exists)
    const heroBtn = document.getElementById('heroGeneralChatBtn');
    if (heroBtn) {
      heroBtn.onclick = () => window.open(generalChatLink, '_blank');
    }
  }

  /**
   * Open category chat
   * @param {string} categoryId - Category ID
   */
  openCategoryChat(categoryId) {
    const link = this.categoriesLoader.getWhatsAppLink(categoryId);
    if (link) {
      window.open(link, '_blank');
      console.log('💬 Opening WhatsApp chat:', categoryId);
    }
  }

  /**
   * Open general chat
   */
  openGeneralChat() {
    const link = this.categoriesLoader.getGeneralChatLink();
    if (link) {
      window.open(link, '_blank');
      console.log('💬 Opening general WhatsApp chat');
    }
  }
}

// Export singleton instance
export const communityRenderer = new CommunityRenderer(eventBus, state, categoriesLoader);
