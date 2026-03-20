/**
 * Admin App Entry Point - admin.html Module Initialization
 *
 * Initializes all admin modules in the correct order.
 */

// Core modules
import { eventBus } from '../core/event-bus.js';
import { state } from '../core/state-manager.js';

// Data modules
import { firebaseService } from '../data/firebase-service.js';

// Admin modules
import { tabManager } from './tab-manager.js';
import { geocodingService } from './geocoding-service.js';
import { imageUploadService } from './image-upload-service.js';
import { miniMapService } from './mini-map-service.js';
import { eventFormManager } from './event-form-manager.js';
import { placeFormManager } from './place-form-manager.js';
import { newsletterManager } from './newsletter-manager.js';

/**
 * Initialize all admin modules
 */
async function initializeModules() {
  console.log('🚀 Initializing Admin modules...');

  // Initialize tab manager
  tabManager.initialize();

  // Initialize form managers
  await eventFormManager.initialize();
  await placeFormManager.initialize();
  newsletterManager.initialize();

  console.log('✅ All admin modules initialized');
}

/**
 * Set up window handlers for onclick retrocompatibility
 */
function setupWindowHandlers() {
  // Tab switching (already exposed by tabManager)
  // Event form handlers (already exposed by eventFormManager)
  // Place form handlers (already exposed by placeFormManager)

  // Sub-tab switching
  window.switchSubTab = (tab, subTab) => {
    const prefix = tab === 'events' ? 'events' : 'places';
    const tabEl = document.getElementById(`${prefix}Tab`);
    tabEl.querySelectorAll('.subtab-btn').forEach(btn => btn.classList.remove('active'));
    tabEl.querySelectorAll('.subtab-content').forEach(el => el.classList.remove('active'));
    const subTabId = `${prefix}${subTab.charAt(0).toUpperCase() + subTab.slice(1)}SubTab`;
    document.getElementById(subTabId).classList.add('active');
    const btnIndex = subTab === 'form' ? 0 : 1;
    tabEl.querySelectorAll('.subtab-btn')[btnIndex].classList.add('active');
  };

  // Expose showPoster for modals
  window.showPoster = (posterUrl) => {
    const modal = document.getElementById('posterModal');
    const img = document.getElementById('modalPoster');
    if (modal && img) {
      img.src = posterUrl;
      modal.classList.add('show');
    }
  };

  window.closePosterModal = () => {
    const modal = document.getElementById('posterModal');
    if (modal) {
      modal.classList.remove('show');
    }
  };

  console.log('✅ Window handlers set up');
}

/**
 * Main initialization function
 */
async function initializeAdminApp() {
  console.log('🎨 Espedienti Admin - Inizializzazione...');

  try {
    // Initialize Firebase
    await firebaseService.initialize();

    // Initialize all modules
    await initializeModules();

    // Set up window handlers
    setupWindowHandlers();

    console.log('✅ Espedienti Admin initialized successfully!');
  } catch (error) {
    console.error('❌ Admin initialization error:', error);
  }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAdminApp);
} else {
  // DOM already loaded
  initializeAdminApp();
}
