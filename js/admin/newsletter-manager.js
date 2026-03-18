/**
 * NewsletterManager - Newsletter Subscribers Management
 *
 * Loads, displays, edits and deletes newsletter subscribers from Firestore.
 *
 * Dependencies: FirebaseService, EventBus
 */

import { eventBus } from '../core/event-bus.js';
import { firebaseService } from '../data/firebase-service.js';

export class NewsletterManager {
  constructor(eventBusInstance, firebase) {
    this.eventBus = eventBusInstance;
    this.firebase = firebase;
    this.subscribers = [];
    this.loaded = false;
  }

  initialize() {
    this.eventBus.on('admin:tabChanged', (data) => {
      if (data.tab === 'newsletter' && !this.loaded) {
        this.loadSubscribers();
      }
    });

    window.deleteSubscriber = (firebaseId) => this.deleteSubscriber(firebaseId);
    window.editSubscriber = (firebaseId) => this.editSubscriber(firebaseId);
    window.saveSubscriber = (firebaseId) => this.saveSubscriber(firebaseId);
    window.cancelEditSubscriber = () => this.render(this.subscribers);

    console.log('✅ NewsletterManager initialized');
  }

  async loadSubscribers() {
    try {
      this.subscribers = await this.firebase.getAll('newsletter');
      this.loaded = true;
      this.render(this.subscribers);
    } catch (error) {
      console.error('Errore caricamento newsletter:', error);
      this.renderError();
    }
  }

  async deleteSubscriber(firebaseId) {
    if (!confirm('Eliminare questo iscritto?')) return;
    try {
      await this.firebase.delete('newsletter', firebaseId);
      this.subscribers = this.subscribers.filter(s => s.firebaseId !== firebaseId);
      this.render(this.subscribers);
    } catch (error) {
      console.error('Errore eliminazione:', error);
      alert('❌ Errore nell\'eliminazione.');
    }
  }

  editSubscriber(firebaseId) {
    const sub = this.subscribers.find(s => s.firebaseId === firebaseId);
    if (!sub) return;

    const list = document.getElementById('newsletterList');
    const count = document.getElementById('newsletterCount');
    if (!list) return;

    count.textContent = this.subscribers.length;

    const sorted = [...this.subscribers].sort((a, b) =>
      (b.subscribedAt || '').localeCompare(a.subscribedAt || '')
    );

    list.innerHTML = sorted.map(s => {
      const date = s.subscribedAt
        ? new Date(s.subscribedAt).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '—';

      if (s.firebaseId === firebaseId) {
        return `
          <li class="event-item place-item place-item--compact newsletter-item">
            <input type="email" id="editEmailInput" value="${s.email}" style="flex:1; margin-right:8px;">
            <span class="newsletter-item-date">${date}</span>
            <div class="place-item-actions">
              <button type="button" class="btn btn-small" onclick="saveSubscriber('${s.firebaseId}')">Salva</button>
              <button type="button" class="btn btn-secondary btn-small" onclick="cancelEditSubscriber()">Annulla</button>
            </div>
          </li>
        `;
      }

      return this._renderItem(s, date);
    }).join('');
  }

  async saveSubscriber(firebaseId) {
    const newEmail = document.getElementById('editEmailInput')?.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!newEmail || !emailRegex.test(newEmail)) {
      alert('⚠️ Email non valida.');
      return;
    }

    try {
      await this.firebase.update('newsletter', firebaseId, { email: newEmail });
      const sub = this.subscribers.find(s => s.firebaseId === firebaseId);
      if (sub) sub.email = newEmail;
      this.render(this.subscribers);
    } catch (error) {
      console.error('Errore aggiornamento:', error);
      alert('❌ Errore nel salvataggio.');
    }
  }

  _renderItem(sub, date) {
    return `
      <li class="event-item place-item place-item--compact newsletter-item">
        <span class="newsletter-item-email">${sub.email}</span>
        <span class="newsletter-item-date">${date}</span>
        <div class="place-item-actions">
          <button type="button" class="btn btn-small" onclick="editSubscriber('${sub.firebaseId}')">Modifica</button>
          <button type="button" class="btn btn-danger btn-small" onclick="deleteSubscriber('${sub.firebaseId}')">Elimina</button>
        </div>
      </li>
    `;
  }

  render(subscribers) {
    const list = document.getElementById('newsletterList');
    const count = document.getElementById('newsletterCount');
    if (!list) return;

    count.textContent = subscribers.length;

    if (subscribers.length === 0) {
      list.innerHTML = '<li class="list-empty">Nessun iscritto ancora</li>';
      return;
    }

    const sorted = [...subscribers].sort((a, b) =>
      (b.subscribedAt || '').localeCompare(a.subscribedAt || '')
    );

    list.innerHTML = sorted.map(sub => {
      const date = sub.subscribedAt
        ? new Date(sub.subscribedAt).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '—';
      return this._renderItem(sub, date);
    }).join('');
  }

  renderError() {
    const list = document.getElementById('newsletterList');
    if (list) {
      list.innerHTML = '<li class="list-empty">Errore nel caricamento</li>';
    }
  }
}

export const newsletterManager = new NewsletterManager(eventBus, firebaseService);
