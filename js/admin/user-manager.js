/**
 * UserManager - Gestione Utenti
 *
 * Lista tutti gli utenti da Firestore `users`.
 * Permette di:
 *   - cambiare il ruolo di un utente
 *   - eliminare il profilo (l'account Firebase Auth rimane ma è inutilizzabile
 *     senza profilo; cancellazione Auth completa richiede Admin SDK/Cloud Function)
 *
 * Struttura documento Firestore `users/{uid}`:
 *   { uid, email, displayName, role, createdAt, disabled? }
 */

import { firebaseService } from '../data/firebase-service.js';

const COLLECTION = 'users';

const ROLES = ['user', 'artist', 'manager', 'admin'];

const ROLE_LABELS = {
  user:    'Utente',
  artist:  'Artista',
  manager: 'Manager',
  admin:   'Admin',
};

export class UserManager {
  constructor(firebase) {
    this.firebase = firebase;
    this.users = [];
    this._query = '';
  }

  async initialize() {
    await this.load();
    this.render();

    window.deleteUser      = (uid) => this.deleteUser(uid);
    window.saveUserRole    = (uid) => this.saveUserRole(uid);
    window.filterUsers     = ()    => this.filterAndRender();

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
      ? this.users.filter(u =>
          (u.email || '').toLowerCase().includes(this._query) ||
          (u.displayName || '').toLowerCase().includes(this._query) ||
          (u.role || '').toLowerCase().includes(this._query)
        )
      : this.users;

    if (countEl) countEl.textContent = filtered.length;

    if (filtered.length === 0) {
      list.innerHTML = '<li class="list-empty">Nessun utente trovato.</li>';
      return;
    }

    list.innerHTML = filtered.map(user => {
      const date      = user.createdAt ? new Date(user.createdAt).toLocaleDateString('it-IT') : '—';
      const roleLabel = ROLE_LABELS[user.role] || user.role || 'user';
      const roleClass = `invite-role-${user.role || 'user'}`;
      const disabled  = user.disabled ? '<span class="user-disabled-badge">Disabilitato</span>' : '';

      const roleOptions = ROLES.map(r =>
        `<option value="${r}" ${r === user.role ? 'selected' : ''}>${ROLE_LABELS[r]}</option>`
      ).join('');

      return `
        <li class="user-item ${user.disabled ? 'user-item--disabled' : ''}">
          <div class="user-info">
            <div class="user-name">${this._esc(user.displayName || '—')}</div>
            <div class="user-email">${this._esc(user.email || '—')}</div>
            <span class="invite-role-badge ${roleClass}">${roleLabel}</span>
            ${disabled}
            <span class="invite-date">${date}</span>
          </div>
          <div class="user-role-controls">
            <select class="user-role-select" id="role-${user.uid}">
              ${roleOptions}
            </select>
            <button class="btn btn-small" onclick="saveUserRole('${user.uid}')">Salva</button>
            <button class="btn btn-danger btn-small" onclick="deleteUser('${user.uid}')">Elimina</button>
          </div>
        </li>`;
    }).join('');
  }

  async saveUserRole(uid) {
    const select = document.getElementById(`role-${uid}`);
    if (!select) return;
    const newRole = select.value;

    try {
      await this.firebase.update(COLLECTION, uid, { role: newRole });
      const user = this.users.find(u => u.uid === uid);
      if (user) user.role = newRole;
      this.render();
    } catch (err) {
      alert('Errore durante il salvataggio del ruolo.');
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

  _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

export const userManager = new UserManager(firebaseService);
