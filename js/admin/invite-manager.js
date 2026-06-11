/**
 * InviteManager - Gestione Inviti
 *
 * Struttura documento Firestore `invites`:
 *   { token, roles: string[], email, used, createdAt, usedAt? }
 *
 * Backward compat: old docs with `role: string` are displayed correctly.
 */

import { firebaseService } from '../data/firebase-service.js';
import { esc } from '../utils/string-utils.js';
import { ROLE_KEYS, ROLE_META, ROLE_LABELS, ROLE_COLORS } from '../config/permissions.js';

const COLLECTION = 'invites';

// Roles that require an invite (user self-registers; admin is granted manually)
const INVITE_ROLES = ROLE_KEYS.filter(r => r !== 'user');

function generateToken() {
  const arr = new Uint8Array(18);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

function getRolesFromDoc(inv) {
  if (Array.isArray(inv.roles) && inv.roles.length) return inv.roles;
  if (typeof inv.role === 'string' && inv.role) return [inv.role];
  return ['user'];
}

export class InviteManager {
  constructor(firebase) {
    this.firebase = firebase;
    this.invites = [];
  }

  async initialize() {
    this._renderInviteForm();
    await this.load();
    this.render();

    window.createInvite    = () => this.createInvite();
    window.deleteInvite    = (id) => this.deleteInvite(id);
    window.copyInviteLink  = (token) => this.copyInviteLink(token);
    window.sendInviteMail  = (token, email, rolesJson) => this.sendInviteMail(token, email, JSON.parse(rolesJson));

    console.log('✅ InviteManager initialized');
  }

  async load() {
    try {
      this.invites = await this.firebase.getAll(COLLECTION);
      this.invites.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    } catch {
      this.invites = [];
    }
  }

  _renderInviteForm() {
    const container = document.getElementById('inviteFormFields');
    if (!container) return;

    container.innerHTML = `
      <div class="form-group">
        <label for="inviteEmail">Email invitato *</label>
        <input type="email" id="inviteEmail" class="form-input" placeholder="nome@esempio.it" required>
      </div>
      <div class="form-group">
        <label>Ruoli da assegnare *</label>
        <div class="role-checkboxes" id="inviteRolesCheckboxes">
          ${INVITE_ROLES.map(r => `
            <label class="role-checkbox-label" title="${ROLE_META[r].description}">
              <input type="checkbox" name="inviteRole" value="${r}">
              <span class="role-label-text" data-role="${r}">${ROLE_LABELS[r]}</span>
            </label>
            <small class="form-hint role-desc">${ROLE_META[r].description}</small>`).join('')}
        </div>
      </div>
      <div id="inviteError" class="field-error-msg"></div>
      <button type="button" class="btn" id="inviteCreateBtn" onclick="createInvite()">Crea &amp; Invia</button>`;
  }

  async createInvite() {
    const emailInput = document.getElementById('inviteEmail');
    const errEl      = document.getElementById('inviteError');
    const btn        = document.getElementById('inviteCreateBtn');

    const email = emailInput?.value.trim();
    const roles = [...document.querySelectorAll('input[name="inviteRole"]:checked')].map(cb => cb.value);

    if (!email || !roles.length) {
      if (errEl) errEl.textContent = 'Inserisci email e seleziona almeno un ruolo.';
      return;
    }

    if (errEl) errEl.textContent = '';
    if (btn) { btn.disabled = true; btn.textContent = 'Creazione…'; }

    try {
      const token = generateToken();
      const data = { token, roles, email, used: false, createdAt: new Date().toISOString() };

      const added = await this.firebase.add(COLLECTION, data);
      this.invites.unshift(added);

      if (emailInput) emailInput.value = '';
      document.querySelectorAll('input[name="inviteRole"]').forEach(cb => { cb.checked = false; });
      this.render();

      this.sendInviteMail(token, email, roles);
    } catch (err) {
      if (errEl) errEl.textContent = 'Errore nella creazione. Riprova.';
      console.error(err);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Crea & Invia'; }
    }
  }

  async deleteInvite(firebaseId) {
    if (!confirm('Eliminare questo invito?')) return;
    try {
      await this.firebase.delete(COLLECTION, firebaseId);
      this.invites = this.invites.filter(i => i.firebaseId !== firebaseId);
      this.render();
    } catch (err) {
      alert('Errore durante l\'eliminazione.');
      console.error(err);
    }
  }

  _registerUrl(token) {
    const base = window.location.origin + window.location.pathname.replace('admin.html', '');
    return `${base}register.html?token=${token}`;
  }

  copyInviteLink(token) {
    const url = this._registerUrl(token);
    navigator.clipboard.writeText(url).then(() => {
      alert('Link copiato negli appunti!');
    }).catch(() => {
      prompt('Copia il link:', url);
    });
  }

  sendInviteMail(token, email, roles) {
    const url        = this._registerUrl(token);
    const roleLabels = roles.map(r => ROLE_LABELS[r] ?? r).join(', ');
    const subject    = encodeURIComponent(`Invito Espedienti – ${roleLabels}`);
    const body       = encodeURIComponent(
      `Ciao,\n\nsei stato invitato a unirti a Espedienti con i seguenti ruoli: ${roleLabels}.\n\nClicca il link qui sotto per completare la registrazione:\n\n${url}\n\nIl link è valido per una sola registrazione.\n\nA presto,\nTeam Espedienti`
    );
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
  }

  render() {
    const list = document.getElementById('inviteList');
    if (!list) return;

    if (this.invites.length === 0) {
      list.innerHTML = '<li class="list-empty">Nessun invito creato.</li>';
      return;
    }

    list.innerHTML = this.invites.map(inv => {
      const date        = inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('it-IT') : '—';
      const roles       = getRolesFromDoc(inv);
      const statusClass = inv.used ? 'invite-used' : 'invite-active';
      const statusText  = inv.used ? 'Utilizzato' : 'Attivo';

      const roleBadges = roles.map(r =>
        `<span class="invite-role-badge" style="background:${ROLE_COLORS[r] ?? '#666'}">${ROLE_LABELS[r] ?? r}</span>`
      ).join('');

      const rolesJson = esc(JSON.stringify(roles));
      const actionsHtml = !inv.used
        ? `<button class="btn btn-small" onclick="copyInviteLink('${inv.token}')">Copia link</button>
           <button class="btn btn-small" onclick="sendInviteMail('${inv.token}','${esc(inv.email)}','${rolesJson}')">Invia mail</button>`
        : '';

      return `
        <li class="invite-item">
          <div class="invite-info">
            <span class="invite-email">${esc(inv.email)}</span>
            <div class="user-role-badges">${roleBadges}</div>
            <span class="invite-status ${statusClass}">${statusText}</span>
            <span class="invite-date">${date}</span>
          </div>
          <div class="invite-actions">
            ${actionsHtml}
            <button class="btn btn-danger btn-small" onclick="deleteInvite('${inv.firebaseId}')">Elimina</button>
          </div>
        </li>`;
    }).join('');
  }
}

export const inviteManager = new InviteManager(firebaseService);
