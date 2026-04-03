/**
 * InviteManager - Gestione Inviti
 *
 * Crea inviti per ruoli privilegiati (admin, manager, artist).
 * Ogni invito genera un token univoco salvato in Firestore `invites`.
 * L'admin riceve un link da inviare all'utente via mail (mailto:).
 *
 * Struttura documento Firestore `invites`:
 *   { token, role, email, used, createdAt, usedAt? }
 */

import { firebaseService } from '../data/firebase-service.js';

const COLLECTION = 'invites';

const ROLE_LABELS = {
  admin:   'Admin',
  manager: 'Manager',
  artist:  'Artista',
};

function generateToken() {
  const arr = new Uint8Array(18);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

export class InviteManager {
  constructor(firebase) {
    this.firebase = firebase;
    this.invites = [];
  }

  async initialize() {
    await this.load();
    this.render();

    window.createInvite = () => this.createInvite();
    window.deleteInvite = (id) => this.deleteInvite(id);
    window.copyInviteLink = (token) => this.copyInviteLink(token);
    window.sendInviteMail = (token, email, role) => this.sendInviteMail(token, email, role);

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

  async createInvite() {
    const emailInput = document.getElementById('inviteEmail');
    const roleInput  = document.getElementById('inviteRole');
    const errEl      = document.getElementById('inviteError');
    const btn        = document.getElementById('inviteCreateBtn');

    const email = emailInput?.value.trim();
    const role  = roleInput?.value;

    if (!email || !role) {
      if (errEl) errEl.textContent = 'Inserisci email e ruolo.';
      return;
    }

    if (errEl) errEl.textContent = '';
    if (btn) { btn.disabled = true; btn.textContent = 'Creazione...'; }

    try {
      const token = generateToken();
      const data = {
        token,
        role,
        email,
        used: false,
        createdAt: new Date().toISOString(),
      };

      const added = await this.firebase.add(COLLECTION, data);
      this.invites.unshift(added);

      if (emailInput) emailInput.value = '';
      this.render();

      // Proponi subito l'invio email
      this.sendInviteMail(token, email, role);
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

  sendInviteMail(token, email, role) {
    const url     = this._registerUrl(token);
    const roleLabel = ROLE_LABELS[role] || role;
    const subject = encodeURIComponent(`Invito Espedienti – Profilo ${roleLabel}`);
    const body    = encodeURIComponent(
      `Ciao,\n\nsei stato invitato a unirti a Espedienti come ${roleLabel}.\n\nClicca il link qui sotto per completare la registrazione:\n\n${url}\n\nIl link è valido per una sola registrazione.\n\nA presto,\nTeam Espedienti`
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
      const date     = inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('it-IT') : '—';
      const roleLabel = ROLE_LABELS[inv.role] || inv.role;
      const statusClass = inv.used ? 'invite-used' : 'invite-active';
      const statusText  = inv.used ? 'Utilizzato' : 'Attivo';

      const actionsHtml = !inv.used
        ? `<button class="btn btn-small" onclick="copyInviteLink('${inv.token}')">Copia link</button>
           <button class="btn btn-small" onclick="sendInviteMail('${inv.token}','${this._esc(inv.email)}','${inv.role}')">Invia mail</button>`
        : '';

      return `
        <li class="invite-item">
          <div class="invite-info">
            <span class="invite-email">${this._esc(inv.email)}</span>
            <span class="invite-role-badge invite-role-${inv.role}">${roleLabel}</span>
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

  _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

export const inviteManager = new InviteManager(firebaseService);
