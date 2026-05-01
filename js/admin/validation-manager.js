/**
 * ValidationManager - Revisione e approvazione eventi da eventi_raw
 *
 * Carica gli eventi grezzi con status "pending", permette di editare i campi
 * e approvarli (trasferimento in "events") o rifiutarli.
 */

import { firebaseService } from '../data/firebase-service.js';
import { geocodingService } from './geocoding-service.js';
import { placeFormManager } from './place-form-manager.js';
import { EVENT_CATEGORIES } from '../config/constants.js';

const MESI_IT = {
  gennaio: '01', febbraio: '02', marzo: '03', aprile: '04',
  maggio: '05', giugno: '06', luglio: '07', agosto: '08',
  settembre: '09', ottobre: '10', novembre: '11', dicembre: '12'
};

function parseDataItaliana(str) {
  if (!str) return '';
  const s = String(str).toLowerCase().trim();
  const m = s.match(/(\d{1,2})\s+(\w+)(?:\s+(\d{4}))?/);
  if (!m) return '';
  const day = m[1].padStart(2, '0');
  const month = MESI_IT[m[2]];
  if (!month) return '';
  const year = m[3] || String(new Date().getFullYear());
  return `${year}-${month}-${day}`;
}

function parseOra(str) {
  if (!str) return '';
  const s = String(str).trim();
  const m = s.match(/^(\d{1,2})[.,:h]?(\d{2})?$/);
  if (!m) return '';
  return `${m[1].padStart(2, '0')}:${(m[2] || '00')}`;
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

export class ValidationManager {
  constructor() {
    this._items = [];       // eventi_raw pending
    this._editing = null;   // firebaseId in editing
    this._geoResults = [];
  }

  get _places() {
    return placeFormManager.places || [];
  }

  async initialize() {
    const formPanel = document.getElementById('validazioneFormPanel');
    if (formPanel) formPanel.style.display = 'none';

    await this._load();

    const search = document.getElementById('validazioneSearch');
    if (search) search.addEventListener('input', () => this._renderList(search.value));

    window.validazioneReload      = () => this._load();
    window.validazioneBackToList  = () => this._closeForm();
    window.validazioneRevisiona   = (id) => this._openForm(id);
    window.validazioneRifiuta     = (id) => this._reject(id);
    window.validazioneApprova     = ()   => this._approve();
    window.validazioneAnnulla     = ()   => this._closeForm();
    window.validazioneGeoSearch   = ()   => this._geoSearch();
    window.validazioneSelectGeo   = (i)  => this._selectGeo(i);
    window.validazioneAddTag      = ()   => this._addTagFromInput();
    window.validazioneSelectPlace = (i)  => this._selectPlace(i);

    console.log('✅ ValidationManager initialized');
  }

  // ── Data ──────────────────────────────────────────────────────────────────

  async _load() {
    const container = document.getElementById('validazioneList');
    if (container) container.innerHTML = '<p class="list-empty">Caricamento...</p>';
    try {
      const all = await firebaseService.getAll('eventi_raw');
      console.log(`📥 eventi_raw totali: ${all.length}, pending: ${all.filter(e => e.status === 'pending').length}`);
      this._items = all.filter(e => e.status === 'pending');
      this._renderList();
    } catch (err) {
      console.error('❌ ValidationManager load error:', err);
      if (container) {
        container.innerHTML = `<p class="list-empty" style="color:#dc2626;">Errore caricamento: ${esc(err.message || String(err))}<br><button type="button" class="btn btn-secondary" style="margin-top:8px;" onclick="validazioneReload()">🔄 Riprova</button></p>`;
      }
    }
  }

  _updateCount() {
    const el = document.getElementById('pendingCount');
    if (el) el.textContent = this._items.length;
  }

  // ── List rendering ────────────────────────────────────────────────────────

  _renderList(query = '') {
    this._updateCount();
    const container = document.getElementById('validazioneList');
    if (!container) return;

    const q = query.toLowerCase();
    const filtered = q
      ? this._items.filter(e =>
          (e.titolo || '').toLowerCase().includes(q) ||
          (e.luogo  || '').toLowerCase().includes(q) ||
          (e.data   || '').toLowerCase().includes(q))
      : this._items;

    if (!filtered.length) {
      container.innerHTML = `<li class="list-empty">${q ? 'Nessun risultato' : 'Nessun evento in attesa di validazione.'}</li>`;
      return;
    }

    container.innerHTML = `<ul class="events-list">${filtered.map(e => this._cardHTML(e)).join('')}</ul>`;
  }

  _cardHTML(e) {
    // Submission date: prefer submittedAt, fall back to createdAt
    const submittedRaw = e.submittedAt || e.createdAt || null;
    const submittedLabel = submittedRaw ? formatDate(submittedRaw) : null;

    // Event date from raw data field
    const eventDateParsed = parseDataItaliana(e.data);
    const eventDateLabel = eventDateParsed
      ? new Date(eventDateParsed).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
      : e.data || null;

    const dateMeta = [
      submittedLabel ? `📨 Ricevuto: ${esc(submittedLabel)}` : null,
      eventDateLabel ? `📅 Evento: ${esc(eventDateLabel)}` : null,
      e.ora   ? `⏰ ${esc(e.ora)}`   : null,
      e.luogo ? `📍 ${esc(e.luogo)}` : null,
    ].filter(Boolean).join(' &nbsp;&nbsp;');

    const prezzoChip = e.prezzo
      ? `<span class="item-cat-chip">${e.prezzo.toLowerCase().includes('gratuit') || e.prezzo === '0' ? '🎟 Gratuito' : `💰 ${esc(e.prezzo)}`}</span>`
      : '';

    const thumb = e.imageUrl
      ? `<img src="${esc(e.imageUrl)}" alt="poster" class="val-thumb" onclick="showPoster('${esc(e.imageUrl)}')">`
      : `<div class="val-thumb val-thumb--empty">📄</div>`;

    return `
      <li class="event-item place-item--compact val-card" id="valCard_${esc(e.firebaseId)}">
        ${thumb}
        <div class="val-card-body">
          <span class="place-item-name">${esc(e.titolo || '—')}</span>
          ${dateMeta ? `<div class="val-card-meta">${dateMeta}</div>` : ''}
          ${prezzoChip ? `<div class="item-cats">${prezzoChip}</div>` : ''}
          ${e.descrizione_breve ? `<div class="val-card-desc">${esc(e.descrizione_breve)}</div>` : ''}
        </div>
        <div class="place-item-actions">
          <button type="button" class="btn btn-small" onclick="validazioneRevisiona('${esc(e.firebaseId)}')">✏️ Revisiona</button>
          <button type="button" class="btn btn-danger btn-small" onclick="validazioneRifiuta('${esc(e.firebaseId)}')">🗑 Rifiuta</button>
        </div>
      </li>`;
  }

  // ── Form ──────────────────────────────────────────────────────────────────

  _openForm(id) {
    const raw = this._items.find(e => e.firebaseId === id);
    if (!raw) return;
    this._editing = id;
    this._geoResults = [];

    if (window.switchSubTab) window.switchSubTab('events', 'validazione');

    const dateVal = parseDataItaliana(raw.data);
    const timeVal = parseOra(raw.ora);

    const catOptions = Object.values(EVENT_CATEGORIES).map(c =>
      `<option value="${c.id}">${c.icon} ${c.name}</option>`
    ).join('');

    const initialTags = [];
    if (raw.prezzo) {
      const p = String(raw.prezzo).toLowerCase();
      if (p.includes('gratuito') || p.includes('gratis') || p === '0' || p === 'free') {
        initialTags.push('gratuito');
      } else {
        initialTags.push('a pagamento');
      }
    }

    // Submission date info line
    const submittedRaw = raw.submittedAt || raw.createdAt || null;
    const submittedInfo = submittedRaw
      ? `<p style="font-size:0.8rem;color:var(--text-tertiary);margin-bottom:18px;">📨 Ricevuto: ${esc(formatDate(submittedRaw))}</p>`
      : '';

    // Places select options
    const placesOptions = this._places.length
      ? `<option value="">— Nessun luogo registrato selezionato —</option>` +
        [...this._places]
          .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'it'))
          .map((p, i) => `<option value="${i}">${esc(p.name)}${p.address ? ` — ${esc(p.address)}` : ''}</option>`)
          .join('')
      : `<option value="">Nessun luogo registrato disponibile</option>`;

    const formPanel = document.getElementById('validazioneFormPanel');
    if (!formPanel) return;

    const listView = document.getElementById('validazioneListView');
    if (listView) listView.style.display = 'none';
    formPanel.style.display = '';

    formPanel.innerHTML = `
      <div class="section" style="max-width:680px;">
        <h2 style="margin-bottom:6px;">✏️ Revisiona evento</h2>
        ${submittedInfo}

        ${raw.imageUrl ? `<div style="margin-bottom:16px;"><img src="${esc(raw.imageUrl)}" alt="Locandina" style="max-height:180px;border-radius:8px;cursor:pointer;" onclick="showPoster('${esc(raw.imageUrl)}')"></div>` : ''}

        <div class="form-group">
          <label class="form-label">Titolo *</label>
          <input id="valTitle" class="form-input" type="text" value="${esc(raw.titolo || '')}" required>
        </div>

        <div class="form-group">
          <label class="form-label">Categoria *</label>
          <select id="valCategory" class="form-select">
            <option value="">Seleziona categoria...</option>
            ${catOptions}
          </select>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label class="form-label">Data *</label>
            <input id="valDate" class="form-input" type="date" value="${esc(dateVal)}">
            ${raw.data ? `<small style="color:var(--text-secondary);">Grezzo: "${esc(raw.data)}"</small>` : ''}
          </div>
          <div class="form-group">
            <label class="form-label">Ora inizio</label>
            <input id="valTime" class="form-input" type="time" value="${esc(timeVal)}">
            ${raw.ora ? `<small style="color:var(--text-secondary);">Grezzo: "${esc(raw.ora)}"</small>` : ''}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Seleziona da luoghi registrati <span style="font-weight:400;color:var(--text-tertiary);">(opzionale)</span></label>
          <select id="valPlaceSelect" class="form-select" onchange="validazioneSelectPlace(this.value)">
            ${placesOptions}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Luogo / Indirizzo</label>
          <div style="display:flex;gap:8px;">
            <input id="valLocation" class="form-input" type="text" value="${esc(raw.luogo || '')}" style="flex:1;" placeholder="Via/Piazza, Napoli">
            <button type="button" class="btn btn-secondary" onclick="validazioneGeoSearch()">🔍 Cerca</button>
          </div>
          <div id="valGeoResults" style="margin-top:6px;"></div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label class="form-label">Latitudine *</label>
            <input id="valLat" class="form-input" type="number" step="any" placeholder="40.8518">
          </div>
          <div class="form-group">
            <label class="form-label">Longitudine *</label>
            <input id="valLng" class="form-input" type="number" step="any" placeholder="14.2681">
          </div>
        </div>
        <p id="valCoordsError" style="color:#dc2626;font-size:0.82rem;display:none;margin-top:-8px;margin-bottom:8px;">⚠️ Le coordinate sono obbligatorie per pubblicare l'evento. Usa la ricerca o seleziona un luogo registrato.</p>

        <div class="form-group">
          <label class="form-label">Descrizione</label>
          <textarea id="valDescription" class="form-textarea" rows="3">${esc(raw.descrizione_breve || '')}</textarea>
        </div>

        <div class="form-group">
          <label class="form-label">URL Immagine (poster)</label>
          <input id="valImageUrl" class="form-input" type="url" value="${esc(raw.imageUrl || '')}" placeholder="https://...">
        </div>

        <div class="form-group">
          <label class="form-label">Tags</label>
          <div id="valTagsContainer" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;">
            ${initialTags.map(t => this._tagChipHTML(t)).join('')}
          </div>
          <div style="display:flex;gap:8px;">
            <input id="valTagInput" class="form-input" type="text" placeholder="Aggiungi tag..." style="flex:1;" onkeydown="if(event.key==='Enter'){event.preventDefault();validazioneAddTag();}">
            <button type="button" class="btn btn-secondary" onclick="validazioneAddTag()">+ Aggiungi</button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Link WhatsApp</label>
          <input id="valWhatsapp" class="form-input" type="url" placeholder="https://wa.me/...">
        </div>

        <div style="display:flex;gap:10px;margin-top:24px;">
          <button type="button" class="btn btn-primary" onclick="validazioneApprova()">✅ Approva e pubblica</button>
          <button type="button" class="btn btn-secondary" onclick="validazioneBackToList()">← Torna alla lista</button>
        </div>
      </div>`;

    this._showSubTab('form');
  }

  _tagChipHTML(tag) {
    return `<span class="tag-chip" style="background:var(--accent-primary);color:#fff;padding:3px 10px;border-radius:20px;font-size:12px;display:inline-flex;align-items:center;gap:6px;">${esc(tag)}<button type="button" onclick="this.parentElement.remove()" style="background:none;border:none;color:#fff;cursor:pointer;padding:0;font-size:14px;line-height:1;">×</button></span>`;
  }

  _closeForm() {
    this._editing = null;
    const formPanel = document.getElementById('validazioneFormPanel');
    if (formPanel) { formPanel.innerHTML = ''; formPanel.style.display = 'none'; }
    const listView = document.getElementById('validazioneListView');
    if (listView) listView.style.display = '';
  }

  // ── Place selection ───────────────────────────────────────────────────────

  _selectPlace(indexStr) {
    const index = parseInt(indexStr, 10);
    if (isNaN(index) || index < 0) return;

    // Rebuild sorted list the same way as in _openForm
    const sorted = [...this._places].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'it'));
    const place = sorted[index];
    if (!place) return;

    document.getElementById('valLocation').value = place.address || place.name || '';
    if (place.coordinates?.lat != null && place.coordinates?.lng != null) {
      document.getElementById('valLat').value = place.coordinates.lat;
      document.getElementById('valLng').value = place.coordinates.lng;
      const err = document.getElementById('valCoordsError');
      if (err) err.style.display = 'none';
    }
  }

  // ── Geocoding ─────────────────────────────────────────────────────────────

  async _geoSearch() {
    const q = document.getElementById('valLocation')?.value?.trim();
    if (!q) return;
    const resultsEl = document.getElementById('valGeoResults');
    if (resultsEl) resultsEl.innerHTML = '<small>Ricerca in corso...</small>';
    try {
      this._geoResults = await geocodingService.search(q);
      if (!this._geoResults.length) {
        if (resultsEl) resultsEl.innerHTML = '<small style="color:var(--text-secondary);">Nessun risultato.</small>';
        return;
      }
      if (resultsEl) {
        resultsEl.innerHTML = this._geoResults.map((r, i) =>
          `<div class="geo-result-item" onclick="validazioneSelectGeo(${i})" style="padding:6px 10px;cursor:pointer;border-radius:6px;font-size:13px;margin-bottom:3px;background:var(--bg-secondary);">
            📍 ${esc(r.display_name)}
          </div>`
        ).join('');
      }
    } catch (err) {
      if (resultsEl) resultsEl.innerHTML = '<small style="color:red;">Errore nella ricerca.</small>';
    }
  }

  _selectGeo(index) {
    const r = this._geoResults[index];
    if (!r) return;
    document.getElementById('valLocation').value = r.display_name;
    document.getElementById('valLat').value = parseFloat(r.lat).toFixed(6);
    document.getElementById('valLng').value = parseFloat(r.lon).toFixed(6);
    document.getElementById('valGeoResults').innerHTML = '';
    const err = document.getElementById('valCoordsError');
    if (err) err.style.display = 'none';
    this._geoResults = [];
  }

  // ── Tags ──────────────────────────────────────────────────────────────────

  _addTagFromInput() {
    const input = document.getElementById('valTagInput');
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;
    const container = document.getElementById('valTagsContainer');
    if (container) container.insertAdjacentHTML('beforeend', this._tagChipHTML(val));
    input.value = '';
  }

  _collectTags() {
    const chips = document.querySelectorAll('#valTagsContainer .tag-chip');
    return Array.from(chips).map(c => c.childNodes[0]?.textContent?.trim()).filter(Boolean);
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async _approve() {
    if (!this._editing) return;

    const title    = document.getElementById('valTitle')?.value?.trim();
    const category = document.getElementById('valCategory')?.value;
    const date     = document.getElementById('valDate')?.value;
    const time     = document.getElementById('valTime')?.value;
    const location = document.getElementById('valLocation')?.value?.trim();
    const latVal   = document.getElementById('valLat')?.value;
    const lngVal   = document.getElementById('valLng')?.value;
    const lat      = latVal !== '' ? parseFloat(latVal) : NaN;
    const lng      = lngVal !== '' ? parseFloat(lngVal) : NaN;
    const desc     = document.getElementById('valDescription')?.value?.trim();
    const imageUrl = document.getElementById('valImageUrl')?.value?.trim();
    const whatsapp = document.getElementById('valWhatsapp')?.value?.trim();
    const tags     = this._collectTags();

    if (!title) { alert('Il titolo è obbligatorio.'); return; }
    if (!date)  { alert('La data è obbligatoria.'); return; }

    if (isNaN(lat) || isNaN(lng) || !lat || !lng) {
      const err = document.getElementById('valCoordsError');
      if (err) { err.style.display = ''; err.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      alert('Le coordinate sono obbligatorie. Usa la ricerca geocoding o seleziona un luogo registrato.');
      return;
    }

    const eventData = {
      title,
      category: category || 'altro',
      date,
      time: { start: time || '' },
      location: location || '',
      description: desc || '',
      poster: imageUrl || '',
      tags,
      whatsappLink: whatsapp || '',
      coordinates: { lat, lng },
      status: 'active',
      createdAt: new Date().toISOString(),
      source: 'validation'
    };

    try {
      await firebaseService.add('events', eventData);
      await firebaseService.update('eventi_raw', this._editing, { status: 'approved' });

      this._items = this._items.filter(e => e.firebaseId !== this._editing);
      this._closeForm();
      this._renderList(document.getElementById('validazioneSearch')?.value || '');
      console.log('✅ Evento approvato e pubblicato');
    } catch (err) {
      console.error('❌ Errore approvazione:', err);
      alert('Errore durante la pubblicazione. Riprova.');
    }
  }

  async _reject(id) {
    if (!confirm('Rifiutare questo evento?')) return;
    try {
      await firebaseService.update('eventi_raw', id, { status: 'rejected' });
      this._items = this._items.filter(e => e.firebaseId !== id);
      this._renderList(document.getElementById('validazioneSearch')?.value || '');
      if (this._editing === id) this._closeForm();
    } catch (err) {
      console.error('❌ Errore rifiuto:', err);
      alert('Errore durante il rifiuto. Riprova.');
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  _showSubTab(name) {
    // no-op placeholder — switchSubTab handles actual DOM switching
  }
}

export const validationManager = new ValidationManager();
