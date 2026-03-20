/**
 * EventFormManager - Event CRUD Management
 *
 * Manages event creation, editing, deletion, and list rendering.
 *
 * Dependencies: EventBus, FirebaseService, GeocodingService, ImageUploadService, MiniMapService
 */

import { eventBus } from '../core/event-bus.js';
import { firebaseService } from '../data/firebase-service.js';
import { geocodingService } from './geocoding-service.js';
import { imageUploadService } from './image-upload-service.js';
import { miniMapService } from './mini-map-service.js';
import { EVENT_CATEGORY_ICONS, EVENT_CATEGORY_COLORS } from '../config/constants.js';

export class EventFormManager {
  constructor(eventBusInstance, firebase, geocoding, imageUpload, miniMap) {
    this.eventBus = eventBusInstance;
    this.firebase = firebase;
    this.geocoding = geocoding;
    this.imageUpload = imageUpload;
    this.miniMap = miniMap;
    this.events = [];
    this.currentTags = [];
    this.nextId = 1;
    this.editingEventId = null;
    this.categoryIcons = EVENT_CATEGORY_ICONS;
  }

  async initialize() {
    // Initialize mini map and set up interaction
    setTimeout(() => {
      this.miniMap.initMap('miniMap');
      this.miniMap.setupInteraction('miniMap', async (lat, lng) => {
        this.miniMap.updateMarker('miniMap', lat, lng);
        document.getElementById('coordinates').value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        try {
          const result = await this.geocoding.reverse(lat, lng);
          if (result) {
            document.getElementById('location').value = this.geocoding.formatAddress(result);
          }
        } catch (_) {}
      });
    }, 100);

    // Set up form handlers
    this.setupFormSubmit();
    this.setupCategoryDropdown('eventPrimaryCategory', 'eventCatExtra', 'eventCatDropdown');
    this.setupLocationSearch();
    this.setupTagInput();
    this.setupImageUpload();
    this.setupExistingPlaceSelect();

    // Load events from Firebase
    await this.loadEvents();

    // Search
    const searchInput = document.getElementById('eventsSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.renderEvents(e.target.value.trim()));
    }

    // Expose functions to window
    window.editEvent = (id) => this.editEvent(id);
    window.deleteEvent = (id) => this.deleteEvent(id);
    window.removeTag = (tag) => this.removeTag(tag);
    window.selectLocation = (index) => this.selectLocation(index);
    window.useManualAddress = () => this.useManualAddress();

    console.log('✅ EventFormManager initialized');
  }

  setupFormSubmit() {
    const form = document.getElementById('eventForm');
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

      // Hide the label matching primary, show all others
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
    const searchInput = document.getElementById('locationSearch');
    if (searchInput) {
      searchInput.addEventListener('input', async (e) => {
        const query = e.target.value.trim();
        if (query.length < 3) {
          document.getElementById('searchResults').classList.remove('show');
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
    const container = document.getElementById('searchResults');
    if (!container) return;

    if (results.length === 0) {
      container.innerHTML = '<div class="search-result-item">Nessun risultato trovato</div>';
      container.classList.add('show');
      return;
    }

    container.innerHTML = results.map((result, index) => `
      <div class="search-result-item" onclick="selectLocation(${index})">
        <strong>${result.display_name}</strong>
      </div>
    `).join('');

    container.classList.add('show');
    container.searchResults = results;
  }

  selectLocation(resultIndex) {
    const container = document.getElementById('searchResults');
    const result = container.searchResults[resultIndex];

    const address = this.geocoding.formatAddress(result);
    const coords = this.geocoding.extractCoordinates(result);

    document.getElementById('coordinates').value = `${coords.lat}, ${coords.lng}`;
    document.getElementById('location').value = address;
    document.getElementById('locationSearch').value = '';

    this.miniMap.updateMarker('miniMap', coords.lat, coords.lng);
    this.miniMap.setupInteraction('miniMap', async (lat, lng) => {
      this.miniMap.updateMarker('miniMap', lat, lng);
      document.getElementById('coordinates').value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      try {
        const rev = await this.geocoding.reverse(lat, lng);
        if (rev) document.getElementById('location').value = this.geocoding.formatAddress(rev);
      } catch (_) {}
    });
    container.classList.remove('show');
  }

  setupTagInput() {
    const tagInput = document.getElementById('tagInput');
    if (tagInput) {
      tagInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const tag = e.target.value.trim();
          if (tag && tag.startsWith('#') && !this.currentTags.includes(tag)) {
            this.currentTags.push(tag);
            this.renderTags();
            e.target.value = '';
          } else if (tag && !tag.startsWith('#')) {
            alert('I tag devono iniziare con #');
          }
        }
      });
    }
  }

  renderTags() {
    const container = document.getElementById('tagsContainer');
    if (container) {
      container.innerHTML = this.currentTags.map(tag => `
        <span class="tag-chip">
          ${tag}
          <button type="button" onclick="removeTag('${tag}')">×</button>
        </span>
      `).join('');
    }
  }

  removeTag(tag) {
    this.currentTags = this.currentTags.filter(t => t !== tag);
    this.renderTags();
  }

  setupImageUpload() {
    const dropzone = document.getElementById('imageDropzone');
    const fileInput = document.getElementById('imageFile');

    if (dropzone && fileInput) {
      this.imageUpload.setupDragAndDrop(dropzone, fileInput, (url) => {
        document.getElementById('poster').value = url;
      });
    }
  }

  setupExistingPlaceSelect() {
    const select = document.getElementById('existingPlace');
    if (select) {
      select.addEventListener('change', (e) => {
        // This would load from places repository in full implementation
      });
    }
  }

  async handleSubmit(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Salvataggio...';

    try {
      const coordsValue = document.getElementById('coordinates').value.trim();
      const coords = this.geocoding.parseCoordinateString(coordsValue);

      if (!coords) {
        alert('⚠️ Seleziona un indirizzo dalla ricerca o clicca sulla mappa per impostare la posizione.');
        return;
      }

      const primaryCategory = document.getElementById('eventPrimaryCategory').value;
      const extraCats = Array.from(document.querySelectorAll('input[name="eventCatExtra"]:checked')).map(cb => cb.value);
      const categories = [primaryCategory, ...extraCats.filter(c => c !== primaryCategory)];

      const eventData = {
        title: document.getElementById('title').value,
        primaryCategory,
        categories,
        date: document.getElementById('date').value,
        location: document.getElementById('location').value,
        coordinates: coords,
        tags: [...this.currentTags]
      };

      const whatsappValue = document.getElementById('whatsapp').value.trim();
      if (whatsappValue) eventData.whatsappLink = whatsappValue;

      const posterUrl = this.imageUpload.getSelectedImageUrl() || document.getElementById('poster').value;
      if (posterUrl) eventData.poster = posterUrl;

      if (this.editingEventId) {
        await this.updateEvent(this.editingEventId, eventData);
      } else {
        await this.createEvent(eventData);
      }

      this.resetForm();
      alert('✅ Evento salvato!');
    } catch (error) {
      console.error('Errore salvataggio evento:', error);
      alert('❌ Errore nel salvataggio.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = this.editingEventId ? '✅ Salva Modifiche' : '✅ Aggiungi Evento';
    }
  }

  async createEvent(eventData) {
    eventData.id = this.nextId++;
    const addedEvent = await this.firebase.addEvent(eventData);
    this.events.push(addedEvent);
    this.renderEvents();
  }

  async updateEvent(localId, eventData) {
    const event = this.events.find(e => e.id === localId);
    if (event && event.firebaseId) {
      await this.firebase.updateEvent(event.firebaseId, eventData);
      Object.assign(event, eventData);
      this.renderEvents();
    }
  }

  async deleteEvent(id) {
    if (!confirm('Sei sicuro di voler eliminare questo evento?')) return;

    try {
      const event = this.events.find(e => e.id === id);
      if (event && event.firebaseId) {
        await this.firebase.deleteEvent(event.firebaseId);
      }
      this.events = this.events.filter(e => e.id !== id);
      this.renderEvents();
    } catch (error) {
      console.error('Errore eliminazione evento:', error);
      alert('❌ Errore nell\'eliminazione.');
    }
  }

  editEvent(id) {
    const event = this.events.find(e => e.id === id);
    if (!event) return;

    this.editingEventId = id;

    document.getElementById('title').value = event.title;
    const primary = event.primaryCategory || event.category || '';
    document.getElementById('eventPrimaryCategory').value = primary;
    // Trigger dropdown update
    document.getElementById('eventPrimaryCategory').dispatchEvent(new Event('change'));
    const eventCats = event.categories || (event.category ? [event.category] : []);
    document.querySelectorAll('input[name="eventCatExtra"]').forEach(cb => {
      cb.checked = eventCats.includes(cb.value) && cb.value !== primary;
    });
    document.getElementById('date').value = event.date;
    document.getElementById('whatsapp').value = event.whatsappLink || '';
    document.getElementById('location').value = event.location;
    document.getElementById('coordinates').value = `${event.coordinates.lat}, ${event.coordinates.lng}`;
    document.getElementById('poster').value = event.poster || '';

    this.currentTags = event.tags || [];
    this.renderTags();

    this.miniMap.updateMarker('miniMap', event.coordinates.lat, event.coordinates.lng);

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.textContent = '💾 Aggiorna Evento';

    window.switchSubTab('events', 'form');
    document.getElementById('eventForm').scrollIntoView({ behavior: 'smooth' });
  }

  resetForm() {
    document.getElementById('eventForm').reset();
    this.currentTags = [];
    this.renderTags();
    this.imageUpload.clearSelectedImage();
    this.editingEventId = null;

    const dropdown = document.getElementById('eventCatDropdown');
    if (dropdown) {
      dropdown.setAttribute('data-disabled', 'true');
      dropdown.removeAttribute('open');
      dropdown.querySelector('.cat-dropdown-summary').textContent = 'Seleziona prima la categoria principale';
      dropdown.querySelectorAll('label').forEach(l => l.classList.remove('hidden-primary'));
    }
  }

  async loadEvents() {
    try {
      this.events = await this.firebase.getEvents();
      this.nextId = Math.max(...this.events.map(e => e.id || 0), 0) + 1;
      this.renderEvents();
    } catch (error) {
      console.warn('Errore caricamento eventi:', error);
      this.events = [];
    }
  }

  renderEvents(query = '') {
    const list = document.getElementById('eventsList');
    const count = document.getElementById('eventCount');

    if (!list) return;

    count.textContent = this.events.length;

    const filtered = query
      ? this.events.filter(e =>
          e.title?.toLowerCase().includes(query.toLowerCase()) ||
          e.location?.toLowerCase().includes(query.toLowerCase()) ||
          e.primaryCategory?.toLowerCase().includes(query.toLowerCase()) ||
          e.categories?.some(c => c.toLowerCase().includes(query.toLowerCase()))
        )
      : this.events;

    if (filtered.length === 0) {
      list.innerHTML = `<li class="list-empty">${query ? 'Nessun risultato' : 'Nessun evento presente'}</li>`;
      return;
    }

    list.innerHTML = filtered.map(event => {
      const cats = event.categories || (event.primaryCategory ? [event.primaryCategory] : (event.category ? [event.category] : []));
      const primary = event.primaryCategory || event.category || '';
      const chips = cats.map(c => {
        const color = (window.categoryColors?.eventColors?.[c]) || EVENT_CATEGORY_COLORS[c] || '#94a3b8';
        const style = `background:${color}22;color:${color};border-color:${color}55;`;
        return `<span class="item-cat-chip${c === primary ? ' primary' : ''}" style="${style}">${c}</span>`;
      }).join('');

      return `
        <li class="event-item place-item place-item--compact">
          <span class="place-item-name">${event.title}</span>
          <div class="item-cats">${chips}</div>
          <div class="place-item-actions">
            <button type="button" class="btn btn-small" onclick="editEvent(${event.id})">Modifica</button>
            <button type="button" class="btn btn-danger btn-small" onclick="deleteEvent(${event.id})">Elimina</button>
          </div>
        </li>
      `;
    }).join('');
  }
}

export const eventFormManager = new EventFormManager(
  eventBus,
  firebaseService,
  geocodingService,
  imageUploadService,
  miniMapService
);
