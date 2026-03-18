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
import { EVENT_CATEGORY_ICONS } from '../config/constants.js';

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
    // Initialize mini map
    setTimeout(() => {
      this.miniMap.initMap('miniMap');
    }, 100);

    // Set up form handlers
    this.setupFormSubmit();
    this.setupLocationSearch();
    this.setupTagInput();
    this.setupImageUpload();
    this.setupExistingPlaceSelect();

    // Load events from Firebase
    await this.loadEvents();

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
    document.getElementById('location').dataset.originalAddress = address;

    this.miniMap.updateMarker('miniMap', coords.lat, coords.lng);
    container.classList.remove('show');
  }

  useManualAddress() {
    const locationField = document.getElementById('location');
    if (locationField) {
      locationField.removeAttribute('readonly');
      alert('✓ Puoi ora modificare manualmente l\'indirizzo.\n\nSe hai bisogno delle coordinate, cercale su Google Maps:\n1. Cerca il luogo\n2. Click destro sul marker\n3. Copia le coordinate');
    }
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
        alert('⚠️ Formato coordinate non valido. Usa: latitudine, longitudine (es. 40.8536, 14.2503)');
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
    document.getElementById('eventPrimaryCategory').value = event.primaryCategory || event.category || '';
    const eventCats = event.categories || (event.category ? [event.category] : []);
    document.querySelectorAll('input[name="eventCatExtra"]').forEach(cb => {
      cb.checked = eventCats.includes(cb.value) && cb.value !== (event.primaryCategory || event.category);
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

    document.getElementById('eventForm').scrollIntoView({ behavior: 'smooth' });
  }

  resetForm() {
    document.getElementById('eventForm').reset();
    this.currentTags = [];
    this.renderTags();
    this.imageUpload.clearSelectedImage();
    this.editingEventId = null;
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

  renderEvents() {
    const list = document.getElementById('eventsList');
    const count = document.getElementById('eventCount');

    if (!list) return;

    count.textContent = this.events.length;

    if (this.events.length === 0) {
      list.innerHTML = '<li style="color: #666; text-align: center;">Nessun evento presente</li>';
      return;
    }

    list.innerHTML = this.events.map(event => {
      const categoryIcon = event.category ? this.categoryIcons[event.category] || '📍' : '';
      const categoryText = event.category ? `${categoryIcon} ${event.category}` : 'Nessuna categoria';

      return `
        <li class="event-item">
          <h3>${event.title}</h3>
          <p>📂 ${categoryText}</p>
          <p>📅 ${event.date} | 📍 ${event.location}</p>
          <p>🏷️ ${event.tags ? event.tags.join(', ') : 'Nessun tag'}</p>
          ${event.poster ? '<p>🖼️ Ha locandina</p>' : ''}
          ${event.whatsappLink ? '<p>💬 Link WhatsApp configurato</p>' : ''}
          <div class="event-actions">
            <button type="button" class="btn btn-small" onclick="editEvent(${event.id})">✏️ Modifica</button>
            <button type="button" class="btn btn-danger btn-small" onclick="deleteEvent(${event.id})">🗑️ Elimina</button>
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
