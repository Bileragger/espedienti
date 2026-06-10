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
      this.eventCategories = this._dedupeByKey(await this.firebase.getAll(COLLECTION_EVENT_CATS));
    } catch (_) {
      this.eventCategories = [];
    }

    if (this.eventCategories.length === 0) {
      await this.seedEventCategories();
    }

    try {
      this.placeCategories = this._dedupeByKey(await this.firebase.getAll(COLLECTION_PLACE_CATS));
    } catch (_) {
      this.placeCategories = [];
    }

    if (this.placeCategories.length === 0) {
      await this.seedPlaceCategories();
    }
  }

  _dedupeByKey(categories) {
    const seen = new Set();
    return categories.filter(c => {
      if (seen.has(c.key)) return false;
      seen.add(c.key);
      return true;
    });
  }

  async seedEventCategories() {
    const existingKeys = new Set(this.eventCategories.map(c => c.key));
    for (const [key, cat] of Object.entries(EVENT_CATEGORIES)) {
      if (existingKeys.has(key)) continue;
      const data = { key, name: cat.name, color: EVENT_CATEGORY_COLORS[key] || '#94a3b8', icon: cat.icon };
      try {
        const added = await this.firebase.add(COLLECTION_EVENT_CATS, data);
        this.eventCategories.push(added);
        existingKeys.add(key);
      } catch (_) {}
    }
  }

  async seedPlaceCategories() {
    const existingKeys = new Set(this.placeCategories.map(c => c.key));
    for (const [key, cat] of Object.entries(PLACE_CATEGORIES)) {
      if (existingKeys.has(key)) continue;
      const data = { key, name: cat.name, color: PLACE_CATEGORY_COLORS[key] || '#64748b', icon: cat.icon };
      try {
        const added = await this.firebase.add(COLLECTION_PLACE_CATS, data);
        this.placeCategories.push(added);
        existingKeys.add(key);
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
    const listId   = type === 'event' ? 'eventCatList'  : 'placeCatList';
    const countId  = type === 'event' ? 'eventCatCount' : 'placeCatCount';
    const list     = document.getElementById(listId);
    const countEl  = document.getElementById(countId);
    if (!list) return;

    const filtered = query
      ? categories.filter(c => c.name?.toLowerCase().includes(query) || c.key?.toLowerCase().includes(query))
      : categories;

    if (countEl) countEl.textContent = `${categories.length} categorie`;

    if (filtered.length === 0) {
      list.innerHTML = `<li class="list-empty">${query ? 'Nessun risultato' : 'Nessuna categoria'}</li>`;
      return;
    }

    const sorted = [
      ...filtered.filter(c => c.key !== 'altro').sort((a, b) => a.name.localeCompare(b.name, 'it')),
      ...filtered.filter(c => c.key === 'altro'),
    ];

    list.innerHTML = sorted.map(cat => {
      const color   = cat.color || '#94a3b8';
      const locked  = cat.key === 'altro';
      return `
        <li class="cat-item${locked ? ' is-locked' : ''}" data-id="${cat.firebaseId}" style="--cat-accent:${color}">
          <div class="cat-item-left">
            <input type="color" class="cat-color-picker" value="${color}"
              id="color-${cat.firebaseId}" title="Colore"
              ${locked ? 'disabled' : `onchange="document.querySelector('[data-id=\\'${cat.firebaseId}\\']').style.setProperty('--cat-accent',this.value)"`}>
            <span class="cat-key" title="chiave interna">${cat.key}</span>
          </div>
          <input type="text" class="cat-name-input" value="${cat.name}"
            id="name-${cat.firebaseId}" placeholder="Nome categoria"
            ${locked ? 'disabled' : `onkeydown="if(event.key==='Enter'){event.preventDefault();saveCategoryEdit('${type}','${cat.firebaseId}');}"`}>
          <div class="cat-item-actions">
            ${locked
              ? `<span style="font-size:0.7rem;color:var(--text-tertiary);padding:0 4px;">bloccato</span>`
              : `<button type="button" class="btn btn-small" onclick="saveCategoryEdit('${type}','${cat.firebaseId}')">Salva</button>
                 <button type="button" class="btn btn-danger btn-small" onclick="deleteCategory('${type}','${cat.firebaseId}')">✕</button>`
            }
          </div>
        </li>`;
    }).join('');
  }

  async addCategory(type) {
    const nameInput  = document.getElementById(type === 'event' ? 'newEventCatName' : 'newPlaceCatName');
    const colorInput = document.getElementById(type === 'event' ? 'newEventCatColor' : 'newPlaceCatColor');

    const name  = nameInput?.value.trim();
    const color = colorInput?.value || '#94a3b8';
    const key   = this._nameToKey(name);

    if (!name) {
      alert('⚠️ Inserisci il nome della categoria.');
      return;
    }

    const collection = type === 'event' ? COLLECTION_EVENT_CATS : COLLECTION_PLACE_CATS;
    const arr = type === 'event' ? this.eventCategories : this.placeCategories;

    const normalizedName = name.toLowerCase();
    if (arr.some(c => c.key === key || c.name.toLowerCase() === normalizedName)) {
      alert(`⚠️ La categoria "${name}" esiste già.`);
      return;
    }

    try {
      const data = { key, name, color, icon: '' };
      const added = await this.firebase.add(collection, data);
      arr.push(added);
      if (nameInput) nameInput.value = '';
      if (nameInput) nameInput.focus();
      this.render();
      this.populateFormSelects();
      this.publishColors();
    } catch (error) {
      alert('❌ Errore nel salvataggio.');
      console.error(error);
    }
  }

  _nameToKey(name) {
    return (name || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async saveCategory(type, firebaseId) {
    const nameInput  = document.getElementById(`name-${firebaseId}`);
    const colorInput = document.getElementById(`color-${firebaseId}`);
    if (!nameInput || !colorInput) return;

    const name  = nameInput.value.trim();
    const color = colorInput.value;

    if (!name) {
      alert('⚠️ Il nome non può essere vuoto.');
      return;
    }

    const collection = type === 'event' ? COLLECTION_EVENT_CATS : COLLECTION_PLACE_CATS;
    const arr = type === 'event' ? this.eventCategories : this.placeCategories;
    const cat = arr.find(c => c.firebaseId === firebaseId);
    if (!cat) return;

    const normalizedName = name.toLowerCase();
    if (arr.some(c => c.firebaseId !== firebaseId && c.name.toLowerCase() === normalizedName)) {
      alert(`⚠️ Esiste già una categoria con il nome "${name}".`);
      return;
    }

    try {
      await this.firebase.update(collection, firebaseId, { name, color });
      cat.name = name;
      cat.color = color;
      this.populateFormSelects();
      this.publishColors();
      // Visual feedback — flash green border on the saved row
      const row = document.querySelector(`.cat-item[data-id="${firebaseId}"]`);
      if (row) {
        row.classList.add('save-flash');
        setTimeout(() => row.classList.remove('save-flash'), 1200);
      }
    } catch (error) {
      alert('❌ Errore nel salvataggio.');
      console.error(error);
    }
  }

  async deleteCategory(type, firebaseId) {
    const arr = type === 'event' ? this.eventCategories : this.placeCategories;
    const cat = arr.find(c => c.firebaseId === firebaseId);
    if (!cat || cat.key === 'altro') return;

    if (!confirm(`Eliminare la categoria "${cat.name}"?\nTutti gli elementi associati verranno spostati su "Altro".`)) return;

    const catCollection = type === 'event' ? COLLECTION_EVENT_CATS : COLLECTION_PLACE_CATS;
    const itemCollection = type === 'event' ? 'events' : 'places';

    try {
      // Reassign all items using this category to "altro"
      await this._reassignToAltro(itemCollection, cat.key);

      // Delete the category document
      await this.firebase.delete(catCollection, firebaseId);

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

  async _reassignToAltro(itemCollection, oldKey) {
    const items = await this.firebase.getAll(itemCollection);
    const toUpdate = items.filter(item => {
      const primary = item.primaryCategory || item.category;
      const cats = item.categories || (item.category ? [item.category] : []);
      return primary === oldKey || cats.includes(oldKey);
    });

    await Promise.all(toUpdate.map(item => {
      const newPrimary = (item.primaryCategory || item.category) === oldKey ? 'altro' : (item.primaryCategory || item.category);
      const oldCats = item.categories || (item.category ? [item.category] : []);
      const newCats = oldCats.map(c => c === oldKey ? 'altro' : c);
      // Deduplicate in case "altro" was already present
      const dedupedCats = [...new Set(newCats)];
      return this.firebase.update(itemCollection, item.firebaseId, {
        primaryCategory: newPrimary,
        categories: dedupedCats,
      });
    }));

    if (toUpdate.length > 0) {
      console.log(`✅ Reassigned ${toUpdate.length} ${itemCollection} from "${oldKey}" to "altro"`);
    }
  }

  populateFormSelects() {
    this._populateSelect('eventPrimaryCategory', 'eventCatExtra', this.eventCategories);
    this._populateSelect('placePrimaryCategory', 'placeCatExtra', this.placeCategories);

    // Also refresh the validation form category select if currently open
    const valCat = document.getElementById('valCategory');
    if (valCat) {
      const current = valCat.value;
      valCat.innerHTML = '<option value="">Seleziona categoria...</option>' +
        this.eventCategories.map(c => `<option value="${c.key}"${c.key === current ? ' selected' : ''}>${c.name}</option>`).join('');
    }
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
