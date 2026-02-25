/**
 * App Entry Point - Index.html Module Initialization
 *
 * Initializes all modules in the correct order and sets up the application.
 */

// Core modules
import { state } from './core/state-manager.js';
import { eventBus } from './core/event-bus.js';

// Data modules
import { firebaseService } from './data/firebase-service.js';
import { eventsRepository } from './data/events-repository.js';
import { placesRepository } from './data/places-repository.js';
import { categoriesLoader } from './data/categories-loader.js';

// Filter modules
import { searchFilter } from './filters/search-filter.js';
import { categoryFilter } from './filters/category-filter.js';
import { dateFilter } from './filters/date-filter.js';
import { openNowFilter } from './filters/open-now-filter.js';
import { filterCoordinator } from './filters/filter-coordinator.js';

// UI modules
import { calendarRenderer } from './ui/calendar-renderer.js';
import { eventListRenderer } from './ui/event-list-renderer.js';
import { placeListRenderer } from './ui/place-list-renderer.js';
import { mapRenderer } from './ui/map-renderer.js';
import { communityRenderer } from './ui/community-renderer.js';
import { modalManager } from './ui/modal-manager.js';

// Utility modules
import { geolocationService } from './utils/geolocation-service.js';

/**
 * Initialize all modules
 */
async function initializeModules() {
  console.log('🚀 Initializing Espedienti modules...');

  // Initialize utilities
  geolocationService.initialize();

  // Initialize filters
  searchFilter.initialize();
  categoryFilter.initialize();
  dateFilter.initialize();
  openNowFilter.initialize();
  filterCoordinator.initialize();

  // Initialize UI renderers
  calendarRenderer.initialize();
  eventListRenderer.initialize();
  placeListRenderer.initialize();
  mapRenderer.initialize();
  communityRenderer.initialize();
  modalManager.initialize();

  console.log('✅ All modules initialized');
}

/**
 * Load application data
 */
async function loadData() {
  console.log('📥 Loading application data...');

  try {
    // Initialize Firebase
    await firebaseService.initialize();

    // Load categories first
    await categoriesLoader.load();

    // Load events and places in parallel
    await Promise.all([
      eventsRepository.load(),
      placesRepository.load()
    ]);

    console.log('✅ All data loaded');
  } catch (error) {
    console.error('❌ Error loading data:', error);
  }
}

/**
 * Set up toggle view handlers
 */
function setupToggleView() {
  window.toggleView = (type) => {
    if (type === 'events') {
      const current = state.get('showEvents');
      state.set('showEvents', !current);

      // Update UI
      const btn = document.getElementById('toggleEvents');
      const card = document.getElementById('eventsCard');
      const filters = document.getElementById('eventCategoryFilters');

      if (btn) btn.classList.toggle('active');
      if (card) card.style.display = !current ? 'block' : 'none';
      if (filters) filters.classList.toggle('show', !current);

      // Emit event for map re-render
      eventBus.emit('view:toggled', { type: 'events', visible: !current });
    } else if (type === 'places') {
      const current = state.get('showPlaces');
      state.set('showPlaces', !current);

      // Update UI
      const btn = document.getElementById('togglePlaces');
      const card = document.getElementById('placesCard');
      const filters = document.getElementById('placeCategoryFilters');

      if (btn) btn.classList.toggle('active');
      if (card) card.style.display = !current ? 'block' : 'none';
      if (filters) filters.classList.toggle('show', !current);

      // Emit event for map re-render
      eventBus.emit('view:toggled', { type: 'places', visible: !current });
    }
  };

  console.log('✅ Toggle view handlers set up');
}

/**
 * Set up toggle event category handler (exposed to window)
 */
function setupToggleEventCategory() {
  window.toggleEventCategory = (category) => {
    categoryFilter.toggleEventCategory(category);
  };
}

/**
 * Set up toggle place category handler (exposed to window)
 */
function setupTogglePlaceCategory() {
  window.togglePlaceCategory = (category) => {
    categoryFilter.togglePlaceCategory(category);
  };
}

/**
 * Set up filter today handler
 */
function setupFilterToday() {
  window.filterToday = () => {
    const todayBtn = document.getElementById('todayBtn');

    if (!todayBtn) return;

    const currentDate = state.get('selectedDate');
    const todayStr = new Date().toISOString().split('T')[0];

    if (currentDate === todayStr) {
      // Deactivate filter
      todayBtn.classList.remove('active');
      dateFilter.clearDate();
    } else {
      // Activate filter
      todayBtn.classList.add('active');
      dateFilter.filterToday();

      // Check if any events today
      const filteredEvents = state.get('filteredEvents');
      if (filteredEvents.length === 0) {
        alert('Nessun evento in programma oggi 😔\nProva a guardare i prossimi giorni!');
        todayBtn.classList.remove('active');
        dateFilter.clearDate();
      }
    }
  };

  console.log('✅ Filter today handler set up');
}

/**
 * Set up open now filter handler
 */
function setupFilterOpenNow() {
  window.filterOpenNow = () => {
    const openNowBtn = document.getElementById('openNowBtn');

    if (!openNowBtn) return;

    const isActive = openNowFilter.isActive();

    if (isActive) {
      // Deactivate
      openNowBtn.classList.remove('active');
      openNowFilter.setActive(false);
    } else {
      // Activate
      openNowBtn.classList.add('active');
      openNowFilter.setActive(true);

      // Check if any places open now
      const filteredPlaces = state.get('filteredPlaces');
      if (filteredPlaces.length === 0) {
        alert('Nessun luogo aperto in questo momento.');
        openNowBtn.classList.remove('active');
        openNowFilter.setActive(false);
      }
    }
  };

  console.log('✅ Filter open now handler set up');
}

/**
 * Set up reset filters handler
 */
function setupResetFilters() {
  window.resetFilters = () => {
    // Clear search input
    const searchInput = document.getElementById('searchBar');
    if (searchInput) {
      searchInput.value = '';
    }

    // Clear today button
    const todayBtn = document.getElementById('todayBtn');
    if (todayBtn) {
      todayBtn.classList.remove('active');
    }

    // Clear open now button
    const openNowBtn = document.getElementById('openNowBtn');
    if (openNowBtn) {
      openNowBtn.classList.remove('active');
    }

    // Reset all filters
    filterCoordinator.resetAll();

    // Update reset button visibility
    updateResetButton();

    console.log('🔄 All filters reset');
  };

  console.log('✅ Reset filters handler set up');
}

/**
 * Update reset button visibility
 */
function updateResetButton() {
  const resetBtn = document.getElementById('resetBtn');
  if (!resetBtn) return;

  const hasActiveFilters = filterCoordinator.hasActiveFilters();

  if (hasActiveFilters) {
    resetBtn.style.display = 'block';
  } else {
    resetBtn.style.display = 'none';
  }
}

// Expose to window for filter changes
window.updateResetButton = updateResetButton;

/**
 * Set up smooth scroll for anchor links
 */
function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  console.log('✅ Smooth scroll set up');
}

/**
 * Set up map fullscreen toggle (native Fullscreen API)
 */
function setupMapFullscreen() {
  const updateBtn = (isFs) => {
    const btn = document.getElementById('fullscreenMapBtn');
    if (btn) btn.textContent = isFs ? '✕' : '⛶';
  };

  window.toggleMapFullscreen = () => {
    const mapContainer = document.querySelector('.map-container');
    if (!mapContainer) return;

    if (!document.fullscreenElement) {
      mapContainer.requestFullscreen().catch(() => {
        // Safari / older Android fallback: not needed, they support it now
        console.warn('⚠️ Fullscreen API not available');
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Sync button icon and resize Leaflet whenever fullscreen state changes
  document.addEventListener('fullscreenchange', () => {
    const isFs = !!document.fullscreenElement;
    updateBtn(isFs);
    setTimeout(() => mapRenderer.invalidateSize(), 100);
  });

  // webkit prefix (older Safari / some Android WebView)
  document.addEventListener('webkitfullscreenchange', () => {
    const isFs = !!document.webkitFullscreenElement;
    updateBtn(isFs);
    setTimeout(() => mapRenderer.invalidateSize(), 100);
  });

  // Disable browser pinch-zoom on the page; allow it only on the map
  document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1 && !e.target.closest('#map')) {
      e.preventDefault();
    }
  }, { passive: false });

  console.log('✅ Map fullscreen set up');
}

/**
 * Set up search bar filter
 */
function setupSearchBar() {
  const searchBar = document.getElementById('searchBar');
  if (searchBar) {
    // On Enter: scroll to the map/calendar section
    searchBar.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const target = document.getElementById('events');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });

    console.log('✅ Search bar connected to filters');
  }
}

/**
 * Subscribe to filter changes to update reset button
 */
function subscribeToFilterChanges() {
  eventBus.on('filter:applied', () => {
    updateResetButton();
  });

  eventBus.on('filters:reset', () => {
    updateResetButton();
  });
}

/**
 * Main initialization function
 */
async function initializeApp() {
  console.log('🎨 Espedienti - Inizializzazione...');

  try {
    // Initialize all modules
    await initializeModules();

    // Set up window handlers
    setupToggleView();
    setupToggleEventCategory();
    setupTogglePlaceCategory();
    setupFilterToday();
    setupFilterOpenNow();
    setupResetFilters();
    setupMapFullscreen();

    // Set up UI enhancements
    setupSmoothScroll();
    setupSearchBar();
    subscribeToFilterChanges();

    // Load data
    await loadData();

    // Initial render (map will be initialized on first render)
    // The map initialization is delayed slightly to ensure DOM is ready
    setTimeout(() => {
      mapRenderer.initializeMap();
      mapRenderer.render();
    }, 100);

    console.log('✅ Espedienti initialized successfully!');
  } catch (error) {
    console.error('❌ Initialization error:', error);
  }
}

// Register service worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('⚠️ Service worker registration failed:', err);
    });
  });
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM already loaded
  initializeApp();
}
