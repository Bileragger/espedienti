/**
 * UserManager - Gestione Utenti
 *
 * Struttura documento Firestore `users/{uid}`:
 *   { uid, email, displayName, roles: string[], locationId?, createdAt, disabled? }
 *
 * Backward compat: old docs with `role: string` are read and displayed correctly;
 * saving always writes the new `roles: string[]` field.
 */

import { firebaseService } from '../data/firebase-service.js';
import { esc } from '../utils/string-utils.js';
import { ROLE_KEYS, ROLE_META, ROLE_LABELS, ROLE_COLORS, normalizeRoles } from '../config/permissions.js';

const COLLECTION = 'users';

export class UserManager {
  constructor(firebase) {
    this.firebase = firebase;
    this.users = [];
    this._query = '';
  }

  async initialize() {
    await this.load();
    this.render();

    window.deleteUser             = (uid) => this.deleteUser(uid);
    window.saveUserRoles          = (uid) => this.saveUserRoles(uid);
    window.filterUsers            = ()    => this.filterAndRender();
    window._toggleHostAdminField  = (uid) => {
      const checked = [...document.querySelectorAll(`input[name="roles-${uid}"]:checked`)];
      const lf = document.getElementById(`location-field-${uid}`);
      if (lf) lf.style.display = checked.some(cb => cb.value === 'host_admin') ? '' : 'none';
    };

    const search = document.getElementById('userSearch');
    if (search) search.addEventListener('input', () => this.filterAndRender());

    console.log('✅ UserManager initialized');
  }

  async load() {
    try {
      this.users = await this.firebase.getAll(COLLECTION);
      this.users.sort((a, b) => (a.email || '').localeCompare(b.email || ''));
    } catch {
      this.users = [];
    }
  }

  filterAndRender() {
    const q = document.getElementById('userSearch')?.value.trim().toLowerCase() || '';
    this._query = q;
    this.render();
  }

  render() {
    const countEl = document.getElementById('userCount');
    const list    = document.getElementById('userList');
    if (!list) return;

    const filtered = this._query
      ? this.users.filter(u => {
          const rolesStr = normalizeRoles(u).join(' ');
          return (u.email || '').toLowerCase().includes(this._query)
              || (u.displayName || '').toLowerCase().includes(this._query)
              || rolesStr.toLowerCase().includes(this._query);
        })
      : this.users;

    if (countEl) countEl.textContent = filtered.length;

    if (filtered.length === 0) {
      list.innerHTML = '<li class="list-empty">Nessun utente trovato.</li>';
      return;
    }

    list.innerHTML = filtered.map(user => {
      const date     = user.createdAt ? new Date(user.createdAt).toLocaleDateString('it-IT') : '—';
      const roles    = normalizeRoles(user);
      const disabled = user.disabled ? '<span class="user-disabled-badge">Disabilitato</span>' : '';

      const roleBadges = roles.map(r =>
        `<span class="invite-role-badge" style="background:${ROLE_COLORS[r] ?? '#666'}">${ROLE_LABELS[r] ?? r}</span>`
      ).join('');

      const roleCheckboxes = ROLE_KEYS.map(r => `
        <label class="role-checkbox-label" title="${ROLE_META[r].description}">
          <input type="checkbox" name="roles-${user.uid}" value="${r}" ${roles.includes(r) ? 'checked' : ''}>
          <span class="role-label-text" data-role="${r}">${ROLE_LABELS[r]}</span>
        </label>`
      ).join('');

      const locationField = roles.includes('host_admin') ? `
        <div class="role-location-field" id="location-field-${user.uid}">
          <input type="text" class="form-input" id="locationId-${user.uid}"
            placeholder="locationId del luogo gestito"
            value="${esc(user.locationId || '')}">
        </div>` : `<div class="role-location-field" id="location-field-${user.uid}" style="display:none;">
          <input type="text" class="form-input" id="locationId-${user.uid}"
            placeholder="locationId del luogo gestito"
            value="${esc(user.locationId || '')}">
        </div>`;

      return `
        <li class="user-item ${user.disabled ? 'user-item--disabled' : ''}">
          <div class="user-info">
            <div class="user-name">${esc(user.displayName || '—')}</div>
            <div class="user-email">${esc(user.email || '—')}</div>
            <div class="user-role-badges">${roleBadges}</div>
            ${disabled}
            <span class="invite-date">${date}</span>
          </div>
          <div class="user-role-controls">
            <div class="role-checkboxes" id="roles-${user.uid}"
              onchange="window._toggleHostAdminField('${user.uid}')">
              ${roleCheckboxes}
            </div>
            ${locationField}
            <button class="btn btn-small" onclick="saveUserRoles('${user.uid}')">Salva</button>
            <button class="btn btn-danger btn-small" onclick="deleteUser('${user.uid}')">Elimina</button>
          </div>
        </li>`;
    }).join('');
  }

  async saveUserRoles(uid) {
    const checked = [...document.querySelectorAll(`input[name="roles-${uid}"]:checked`)];
    const roles = checked.map(cb => cb.value);

    if (!roles.length) {
      alert('Seleziona almeno un ruolo.');
      return;
    }

    const locationId = document.getElementById(`locationId-${uid}`)?.value.trim() || null;
    const update = { roles };
    if (locationId) update.locationId = locationId;
    else update.locationId = null;

    try {
      await this.firebase.update(COLLECTION, uid, update);
      const user = this.users.find(u => u.uid === uid);
      if (user) { user.roles = roles; user.locationId = locationId; }
      this.render();
    } catch (err) {
      alert('Errore durante il salvataggio dei ruoli.');
      console.error(err);
    }
  }

  async deleteUser(uid) {
    const user = this.users.find(u => u.uid === uid);
    const name = user?.displayName || user?.email || uid;

    if (!confirm(`Eliminare il profilo di "${name}"?\n\nL'account di autenticazione rimarrà ma l'utente non potrà accedere alla piattaforma.`)) return;

    try {
      await this.firebase.delete(COLLECTION, uid);
      this.users = this.users.filter(u => u.uid !== uid);
      this.render();
    } catch (err) {
      alert('Errore durante l\'eliminazione.');
      console.error(err);
    }
  }
}

export const userManager = new UserManager(firebaseService);
