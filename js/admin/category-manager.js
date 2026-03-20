/**
 * CategoryManager - Category CRUD Management
 *
 * Manages event and place categories: add, rename, delete, change color.
 * Stores categories in Firestore and publishes colors to window.categoryColors
 * for use by map-renderer.js.
 *
 * Dependencies: FirebaseService, EVENT_CATEGORY_COLORS, PLACE_CATEGORY_COLORS
 */

import { firebaseService } from '../data/firebase-service.js';
import {
  EVENT_CATEGORY_COLORS,
  PLACE_CATEGORY_COLORS,
  EVENT_CATEGORIES,
  PLACE_CATEGORIES
} from '../config/constants.js';

const COLLECTION_EVENT_CATS = 'event_categories';
const COLLECTION_PLACE_CATS = 'place_categories';

export class CategoryManager {
  constructor(firebase) {
    this.firebase = firebase;
    this.eventCategories = []; // [{ firebaseId, key, name, color }]
    this.placeCategories = [];
  }

  async initialize() {
    await this.loadAll();
    this.render();
    this.populateFormSelects();
    this.publishColors();

    // Expose window handlers for inline onclick
    window.saveCategoryEdit = (type, firebaseId) => this.saveCategory(type, firebaseId);
    window.deleteCategory = (type, firebaseId) => this.deleteCategory(type, firebaseId);
    window.addCategory = (type) => this.addCategory(type);

    // Search filtering
    const evtSearch = document.getElementById('eventCatSearch');
    if (evtSearch) evtSearch.addEventListener('input', () => this.render());
    const plcSearch = document.getElementById('placeCatSearch');
    if (plcSearch) plcSearch.addEventListener('input', () => this.render());

    console.log('✅ CategoryManager initialized');
  }

  async loadAll() {
    try {
      this.eventCategories = await this.firebase.getAll(COLLECTION_EVENT_CATS);
    } catch (_) {
      this.eventCategories = [];
    }

    if (this.eventCategories.length === 0) {
      await this.seedEventCategories();
    }

    try {
      this.placeCategories = await this.firebase.getAll(COLLECTION_PLACE_CATS);
    } catch (_) {
      this.placeCategories = [];
    }

    if (this.placeCategories.length === 0) {
      await this.seedPlaceCategories();
    }
  }

  async seedEventCategories() {
    for (const [key, cat] of Object.entries(EVENT_CATEGORIES)) {
      const data = { key, name: cat.name, color: EVENT_CATEGORY_COLORS[key] || '#94a3b8', icon: cat.icon };
      try {
        const added = await this.firebase.add(COLLECTION_EVENT_CATS, data);
        this.eventCategories.push(added);
      } catch (_) {}
    }
  }

  async seedPlaceCategories() {
    for (const [key, cat] of Object.entries(PLACE_CATEGORIES)) {
      const data = { key, name: cat.name, color: PLACE_CATEGORY_COLORS[key] || '#64748b', icon: cat.icon };
      try {
        const added = await this.firebase.add(COLLECTION_PLACE_CATS, data);
        this.placeCategories.push(added);
      } catch (_) {}
    }
  }

  render() {
    const evtQuery = (document.getElementById('eventCatSearch')?.value || '').trim().toLowerCase();
    const plcQuery = (document.getElementById('placeCatSearch')?.value || '').trim().toLowerCase();
    this.renderSection('event', this.eventCategories, evtQuery);
    this.renderSection('place', this.placeCategories, plcQuery);
  }

  renderSection(type, categories, query) {
    const listId = type === 'event' ? 'eventCatList' : 'placeCatList';
    const list = document.getElementById(listId);
    if (!list) return;

    const filtered = query
      ? categories.filter(c => c.name?.toLowerCase().includes(query) || c.key?.toLowerCase().includes(query))
      : categories;

    if (filtered.length === 0) {
      list.innerHTML = '<li class="list-empty">Nessuna categoria</li>';
      return;
    }

    list.innerHTML = filtered.map(cat => `
      <li class="cat-item" data-id="${cat.firebaseId}">
        <input type="color" class="cat-color-picker" value="${cat.color || '#94a3b8'}"
          id="color-${cat.firebaseId}"
          title="Colore legenda">
        <input type="text" class="cat-icon-input" value="${cat.icon || ''}"
          id="icon-${cat.firebaseId}"
          placeholder="Emoji">
        <span class="cat-key">${cat.key}</span>
        <input type="text" class="cat-name-input" value="${cat.name}"
          id="name-${cat.firebaseId}"
          placeholder="Nome categoria">
        <button type="button" class="btn btn-small" onclick="saveCategoryEdit('${type}', '${cat.firebaseId}')">Salva</button>
        <button type="button" class="btn btn-danger btn-small" onclick="deleteCategory('${type}', '${cat.firebaseId}')">Elimina</button>
      </li>
    `).join('');
  }

  async addCategory(type) {
    const keyInput = document.getElementById(type === 'event' ? 'newEventCatKey' : 'newPlaceCatKey');
    const nameInput = document.getElementById(type === 'event' ? 'newEventCatName' : 'newPlaceCatName');
    const colorInput = document.getElementById(type === 'event' ? 'newEventCatColor' : 'newPlaceCatColor');
    const iconInput = document.getElementById(type === 'event' ? 'newEventCatIcon' : 'newPlaceCatIcon');

    const key = keyInput?.value.trim().toLowerCase().replace(/\s+/g, '-');
    const name = nameInput?.value.trim();
    const color = colorInput?.value || '#94a3b8';
    const icon = iconInput?.value.trim() || '📍';

    if (!key || !name) {
      alert('⚠️ Inserisci chiave e nome della categoria.');
      return;
    }

    const collection = type === 'event' ? COLLECTION_EVENT_CATS : COLLECTION_PLACE_CATS;
    const arr = type === 'event' ? this.eventCategories : this.placeCategories;

    if (arr.some(c => c.key === key)) {
      alert(`⚠️ La chiave "${key}" esiste già.`);
      return;
    }

    try {
      const data = { key, name, color, icon };
      const added = await this.firebase.add(collection, data);
      arr.push(added);
      if (keyInput) keyInput.value = '';
      if (nameInput) nameInput.value = '';
      if (iconInput) iconInput.value = '';
      this.render();
      this.populateFormSelects();
      this.publishColors();
    } catch (error) {
      alert('❌ Errore nel salvataggio.');
      console.error(error);
    }
  }

  async saveCategory(type, firebaseId) {
    const nameInput = document.getElementById(`name-${firebaseId}`);
    const colorInput = document.getElementById(`color-${firebaseId}`);
    const iconInput = document.getElementById(`icon-${firebaseId}`);
    if (!nameInput || !colorInput) return;

    const name = nameInput.value.trim();
    const color = colorInput.value;
    const icon = iconInput?.value.trim() || '';

    if (!name) {
      alert('⚠️ Il nome non può essere vuoto.');
      return;
    }

    const collection = type === 'event' ? COLLECTION_EVENT_CATS : COLLECTION_PLACE_CATS;
    const arr = type === 'event' ? this.eventCategories : this.placeCategories;
    const cat = arr.find(c => c.firebaseId === firebaseId);
    if (!cat) return;

    try {
      await this.firebase.update(collection, firebaseId, { name, color, icon });
      cat.name = name;
      cat.color = color;
      cat.icon = icon;
      this.populateFormSelects();
      this.publishColors();
    } catch (error) {
      alert('❌ Errore nel salvataggio.');
      console.error(error);
    }
  }

  async deleteCategory(type, firebaseId) {
    if (!confirm('Eliminare questa categoria?')) return;

    const collection = type === 'event' ? COLLECTION_EVENT_CATS : COLLECTION_PLACE_CATS;

    try {
      await this.firebase.delete(collection, firebaseId);
      if (type === 'event') {
        this.eventCategories = this.eventCategories.filter(c => c.firebaseId !== firebaseId);
      } else {
        this.placeCategories = this.placeCategories.filter(c => c.firebaseId !== firebaseId);
      }
      this.render();
      this.populateFormSelects();
      this.publishColors();
    } catch (error) {
      alert('❌ Errore nell\'eliminazione.');
      console.error(error);
    }
  }

  populateFormSelects() {
    this._populateSelect('eventPrimaryCategory', 'eventCatExtra', this.eventCategories);
    this._populateSelect('placePrimaryCategory', 'placeCatExtra', this.placeCategories);
  }

  _populateSelect(selectId, checkboxName, categories) {
    const select = document.getElementById(selectId);
    if (select) {
      const current = select.value;
      select.innerHTML = '<option value="">Seleziona categoria principale…</option>' +
        categories.map(c => `<option value="${c.key}"${c.key === current ? ' selected' : ''}>${c.name}</option>`).join('');
    }

    // Checkboxes: rebuild the checkbox list inside .category-checkboxes container
    const firstCb = document.querySelector(`input[name="${checkboxName}"]`);
    const cbContainer = firstCb?.closest('.category-checkboxes');
    if (cbContainer) {
      cbContainer.innerHTML = categories.map(c => `
        <label>
          <input type="checkbox" name="${checkboxName}" value="${c.key}">
          ${c.name}
        </label>
      `).join('');
    }
  }

  publishColors() {
    const eventColors = {};
    for (const cat of this.eventCategories) {
      eventColors[cat.key] = cat.color;
    }
    const placeColors = {};
    for (const cat of this.placeCategories) {
      placeColors[cat.key] = cat.color;
    }
    window.categoryColors = { eventColors, placeColors };
  }
}

export const categoryManager = new CategoryManager(firebaseService);
