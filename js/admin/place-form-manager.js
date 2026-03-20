/**
 * PlaceFormManager - Place CRUD Management
 *
 * Manages place creation, editing, deletion, and list rendering with opening hours.
 *
 * Dependencies: EventBus, FirebaseService, GeocodingService, ImageUploadService,
 *               MiniMapService, OpeningHoursParser, TabManager
 */

import { eventBus } from '../core/event-bus.js';
import { firebaseService } from '../data/firebase-service.js';
import { geocodingService } from './geocoding-service.js';
import { imageUploadService } from './image-upload-service.js';
import { miniMapService } from './mini-map-service.js';
import { openingHoursParser } from '../utils/opening-hours-parser.js';
import { tabManager } from './tab-manager.js';
import { PLACE_CATEGORY_ICONS, PLACE_CATEGORY_COLORS } from '../config/constants.js';

export class PlaceFormManager {
  constructor(eventBusInstance, firebase, geocoding, imageUpload, miniMap, hoursParser, tabs) {
    this.eventBus = eventBusInstance;
    this.firebase = firebase;
    this.geocoding = geocoding;
    this.imageUpload = imageUpload;
    this.miniMap = miniMap;
    this.hoursParser = hoursParser;
    this.tabManager = tabs;
    this.places = [];
    this.nextPlaceId = 1;
    this.editingPlaceId = null;
    this.categoryIcons = PLACE_CATEGORY_ICONS;
  }

  async initialize() {
    // Subscribe to tab changes to initialize map when needed
    this.eventBus.on('admin:tabChanged', (data) => {
      if (data.tab === 'places' && !this.miniMap.isInitialized('placeMiniMap')) {
        setTimeout(() => {
          this.miniMap.initMap('placeMiniMap');
          this.miniMap.setupInteraction('placeMiniMap', async (lat, lng) => {
            this.miniMap.updateMarker('placeMiniMap', lat, lng);
            document.getElementById('placeCoordinates').value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            try {
              const result = await this.geocoding.reverse(lat, lng);
              if (result) document.getElementById('placeAddress').value = this.geocoding.formatAddress(result);
            } catch (_) {}
          });
        }, 100);
      }
    });

    // Set up form handlers
    this.setupFormSubmit();
    this.setupCategoryDropdown('placePrimaryCategory', 'placeCatExtra', 'placeCatDropdown');
    this.setupLocationSearch();
    this.setupImageUpload();

    // Load places from Firebase
    await this.loadPlaces();

    // Search
    const searchInput = document.getElementById('placesSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.renderPlaces(e.target.value.trim()));
    }

    // Expose functions to window
    window.editPlace = (id) => this.editPlace(id);
    window.deletePlace = (id) => this.deletePlace(id);
    window.selectPlaceLocation = (index) => this.selectPlaceLocation(index);
    window.usePlaceManualAddress = () => this.usePlaceManualAddress();

    console.log('✅ PlaceFormManager initialized');
  }

  setupFormSubmit() {
    const form = document.getElementById('placeForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
  }

  setupCategoryDropdown(selectId, checkboxName, dropdownId) {
    const select = document.getElementById(selectId);
    const dropdown = document.getElementById(dropdownId);
    if (!select || !dropdown) return;

    select.addEventListener('change', () => {
      const primary = select.value;

      if (primary) {
        dropdown.removeAttribute('data-disabled');
        dropdown.querySelector('.cat-dropdown-summary').textContent = 'Seleziona…';
      } else {
        dropdown.setAttribute('data-disabled', 'true');
        dropdown.removeAttribute('open');
        dropdown.querySelector('.cat-dropdown-summary').textContent = 'Seleziona prima la categoria principale';
      }

      dropdown.querySelectorAll(`input[name="${checkboxName}"]`).forEach(cb => {
        const label = cb.closest('label');
        if (cb.value === primary) {
          label.classList.add('hidden-primary');
          cb.checked = false;
        } else {
          label.classList.remove('hidden-primary');
        }
      });
    });
  }

  setupLocationSearch() {
    const searchInput = document.getElementById('placeLocationSearch');
    if (searchInput) {
      searchInput.addEventListener('input', async (e) => {
        const query = e.target.value.trim();
        if (query.length < 3) {
          document.getElementById('placeSearchResults').classList.remove('show');
          return;
        }
        try {
          const results = await this.geocoding.searchDebounced(query);
          this.displaySearchResults(results);
        } catch (error) {
          console.error('Search error:', error);
        }
      });
    }
  }

  displaySearchResults(results) {
    const container = document.getElementById('placeSearchResults');
    if (!container) return;

    if (results.length === 0) {
      container.innerHTML = '<div class="search-result-item">Nessun risultato trovato</div>';
      container.classList.add('show');
      return;
    }

    container.innerHTML = results.map((result, index) => `
      <div class="search-result-item" onclick="selectPlaceLocation(${index})">
        <strong>${result.display_name}</strong>
      </div>
    `).join('');

    container.classList.add('show');
    container.searchResults = results;
  }

  selectPlaceLocation(resultIndex) {
    const container = document.getElementById('placeSearchResults');
    const result = container.searchResults[resultIndex];

    const address = this.geocoding.formatAddress(result);
    const coords = this.geocoding.extractCoordinates(result);

    document.getElementById('placeCoordinates').value = `${coords.lat}, ${coords.lng}`;
    document.getElementById('placeAddress').value = address;
    document.getElementById('placeLocationSearch').value = '';

    this.miniMap.updateMarker('placeMiniMap', coords.lat, coords.lng);
    this.miniMap.setupInteraction('placeMiniMap', async (lat, lng) => {
      this.miniMap.updateMarker('placeMiniMap', lat, lng);
      document.getElementById('placeCoordinates').value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      try {
        const rev = await this.geocoding.reverse(lat, lng);
        if (rev) document.getElementById('placeAddress').value = this.geocoding.formatAddress(rev);
      } catch (_) {}
    });
    container.classList.remove('show');
  }

  setupImageUpload() {
    const dropzone = document.getElementById('placeImageDropzone');
    const fileInput = document.getElementById('placeImageFile');

    if (dropzone && fileInput) {
      this.imageUpload.setupDragAndDrop(dropzone, fileInput, (url) => {
        document.getElementById('placeImage').value = url;
      });
    }
  }

  collectOpeningHours() {
    const days = ['lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato', 'domenica'];
    const dayNames = {
      'lunedi': 'Lunedì',
      'martedi': 'Martedì',
      'mercoledi': 'Mercoledì',
      'giovedi': 'Giovedì',
      'venerdi': 'Venerdì',
      'sabato': 'Sabato',
      'domenica': 'Domenica'
    };
    const hours = {};
    let hasAnyHours = false;

    // Validate all hours first
    for (const day of days) {
      const value = document.getElementById(`hours-${day}`).value.trim();
      if (value) {
        const validation = this.hoursParser.validateFormat(value);
        if (!validation.valid) {
          throw new Error(`⚠️ ${dayNames[day]}: ${validation.error}\nValore inserito: "${value}"`);
        }
        hours[day] = value;
        hasAnyHours = true;
      }
    }

    return hasAnyHours ? hours : null;
  }

  async handleSubmit(e) {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Salvataggio...';

    try {
      const coordsValue = document.getElementById('placeCoordinates').value.trim();
      const coords = this.geocoding.parseCoordinateString(coordsValue);

      if (!coords) {
        alert('⚠️ Seleziona un indirizzo dalla ricerca o clicca sulla mappa per impostare la posizione.');
        return;
      }

      const openingHours = this.collectOpeningHours();

      const primaryCategory = document.getElementById('placePrimaryCategory').value;
      const extraCats = Array.from(document.querySelectorAll('input[name="placeCatExtra"]:checked')).map(cb => cb.value);
      const categories = [primaryCategory, ...extraCats.filter(c => c !== primaryCategory)];

      const placeData = {
        name: document.getElementById('placeName').value,
        primaryCategory,
        categories,
        address: document.getElementById('placeAddress').value,
        coordinates: coords,
        description: document.getElementById('placeDescription').value || null,
        openingHours: openingHours,
        website: document.getElementById('placeWebsite').value || null,
        image: document.getElementById('placeImage').value || null,
        social: {
          facebook: document.getElementById('placeFacebook').value || null,
          instagram: document.getElementById('placeInstagram').value || null,
          tiktok: document.getElementById('placeTiktok').value || null
        }
      };

      if (this.editingPlaceId) {
        await this.updatePlace(this.editingPlaceId, placeData);
      } else {
        await this.createPlace(placeData);
      }

      this.resetForm();
      alert('✅ Luogo salvato!');
    } catch (error) {
      alert(error.message || '❌ Errore nel salvataggio.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = this.editingPlaceId ? '✅ Salva Modifiche' : '✅ Aggiungi Luogo';
    }
  }

  async createPlace(placeData) {
    placeData.id = this.nextPlaceId++;
    const addedPlace = await this.firebase.addPlace(placeData);
    this.places.push(addedPlace);
    this.renderPlaces();
  }

  async updatePlace(localId, placeData) {
    const place = this.places.find(p => p.id === localId);
    if (place && place.firebaseId) {
      await this.firebase.updatePlace(place.firebaseId, placeData);
      Object.assign(place, placeData);
      this.renderPlaces();
    }
  }

  async deletePlace(id) {
    if (!confirm('Sei sicuro di voler eliminare questo luogo?')) return;

    try {
      const place = this.places.find(p => p.id === id);
      if (place && place.firebaseId) {
        await this.firebase.deletePlace(place.firebaseId);
      }
      this.places = this.places.filter(p => p.id !== id);
      this.renderPlaces();
    } catch (error) {
      console.error('Errore eliminazione luogo:', error);
      alert('❌ Errore nell\'eliminazione.');
    }
  }

  editPlace(id) {
    const place = this.places.find(p => p.id === id);
    if (!place) return;

    this.editingPlaceId = id;

    document.getElementById('placeName').value = place.name;
    const primary = place.primaryCategory || place.category || '';
    document.getElementById('placePrimaryCategory').value = primary;
    // Trigger dropdown update
    document.getElementById('placePrimaryCategory').dispatchEvent(new Event('change'));
    const placeCats = place.categories || (place.category ? [place.category] : []);
    document.querySelectorAll('input[name="placeCatExtra"]').forEach(cb => {
      cb.checked = placeCats.includes(cb.value) && cb.value !== primary;
    });
    document.getElementById('placeAddress').value = place.address;
    document.getElementById('placeCoordinates').value = `${place.coordinates.lat}, ${place.coordinates.lng}`;
    document.getElementById('placeDescription').value = place.description || '';
    document.getElementById('placeWebsite').value = place.website || '';
    document.getElementById('placeImage').value = place.image || '';
    document.getElementById('placeFacebook').value = place.social?.facebook || '';
    document.getElementById('placeInstagram').value = place.social?.instagram || '';
    document.getElementById('placeTiktok').value = place.social?.tiktok || '';

    // Populate opening hours
    if (place.openingHours) {
      const days = ['lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato', 'domenica'];
      days.forEach(day => {
        document.getElementById(`hours-${day}`).value = place.openingHours[day] || '';
      });
    }

    this.miniMap.updateMarker('placeMiniMap', place.coordinates.lat, place.coordinates.lng);

    const submitBtn = document.querySelector('#placeForm button[type="submit"]');
    submitBtn.textContent = '💾 Aggiorna Luogo';

    window.switchSubTab('places', 'form');
    document.getElementById('placeForm').scrollIntoView({ behavior: 'smooth' });
  }

  resetForm() {
    document.getElementById('placeForm').reset();
    this.imageUpload.clearSelectedImage();
    this.editingPlaceId = null;

    const dropdown = document.getElementById('placeCatDropdown');
    if (dropdown) {
      dropdown.setAttribute('data-disabled', 'true');
      dropdown.removeAttribute('open');
      dropdown.querySelector('.cat-dropdown-summary').textContent = 'Seleziona prima la categoria principale';
      dropdown.querySelectorAll('label').forEach(l => l.classList.remove('hidden-primary'));
    }
  }

  async loadPlaces() {
    try {
      this.places = await this.firebase.getPlaces();
      this.nextPlaceId = Math.max(...this.places.map(p => p.id || 0), 0) + 1;
      this.renderPlaces();
    } catch (error) {
      console.warn('Errore caricamento luoghi:', error);
      this.places = [];
    }
  }

  renderPlaces(query = '') {
    const list = document.getElementById('placesList');
    const count = document.getElementById('placeCount');

    if (!list) return;

    count.textContent = this.places.length;

    const q = query.toLowerCase();
    const filtered = query
      ? this.places.filter(p =>
          p.name?.toLowerCase().includes(q) ||
          p.address?.toLowerCase().includes(q) ||
          p.primaryCategory?.toLowerCase().includes(q) ||
          p.categories?.some(c => c.toLowerCase().includes(q))
        )
      : this.places;

    if (filtered.length === 0) {
      list.innerHTML = `<li class="list-empty">${query ? 'Nessun risultato' : 'Nessun luogo presente'}</li>`;
      return;
    }

    const sortedPlaces = [...filtered].sort((a, b) => a.name.localeCompare(b.name, 'it'));

    list.innerHTML = sortedPlaces.map(place => {
      const cats = place.categories || (place.primaryCategory ? [place.primaryCategory] : (place.category ? [place.category] : []));
      const primary = place.primaryCategory || place.category || '';
      const chips = cats.map(c => {
        const color = (window.categoryColors?.placeColors?.[c]) || PLACE_CATEGORY_COLORS[c] || '#64748b';
        const style = `background:${color}22;color:${color};border-color:${color}55;`;
        return `<span class="item-cat-chip${c === primary ? ' primary' : ''}" style="${style}">${c}</span>`;
      }).join('');

      return `
        <li class="event-item place-item place-item--compact">
          <span class="place-item-name">${place.name}</span>
          <div class="item-cats">${chips}</div>
          <div class="place-item-actions">
            <button type="button" class="btn btn-small" onclick="editPlace(${place.id})">Modifica</button>
            <button type="button" class="btn btn-danger btn-small" onclick="deletePlace(${place.id})">Elimina</button>
          </div>
        </li>
      `;
    }).join('');
  }
}

export const placeFormManager = new PlaceFormManager(
  eventBus,
  firebaseService,
  geocodingService,
  imageUploadService,
  miniMapService,
  openingHoursParser,
  tabManager
);
