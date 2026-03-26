/**
 * I18nService - Language Detection, Switching, and DOM Translation
 *
 * Supports Italian (it) and English (en).
 * Auto-detects from navigator.language on first visit.
 * Persists user choice in localStorage('espedienti-lang').
 *
 * Usage:
 *   import { i18n } from './i18n/i18n-service.js';
 *   i18n.initialize();
 *
 *   // In JS: window.t('key') or window.t('list.title.full', count, places)
 *   // In HTML: <span data-i18n="key"></span>
 *   //          <input data-i18n-placeholder="key">
 *   //          <button data-i18n-title="key">
 */

import { translations } from './translations.js';

const STORAGE_KEY = 'espedienti-lang';
const SUPPORTED = ['it', 'en'];

class I18nService {
  constructor() {
    this.lang = 'it';
  }

  /**
   * Detect language from storage → navigator.language → fallback 'it'
   */
  _detectLanguage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored)) return stored;

    const nav = (navigator.language || navigator.userLanguage || 'it').slice(0, 2).toLowerCase();
    return SUPPORTED.includes(nav) ? nav : 'it';
  }

  /**
   * Translate a key. For function-valued keys, passes extra args.
   */
  t(key, ...args) {
    const dict = translations[this.lang] || translations['it'];
    const val = dict[key] ?? translations['it'][key] ?? key;
    return typeof val === 'function' ? val(...args) : val;
  }

  /**
   * Apply translations to all elements with data-i18n* attributes.
   * Also updates <html lang>, document.title, and placeholders.
   */
  applyToDOM() {
    document.documentElement.lang = this.lang;

    // Text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translated = this.t(key);
      // Use innerHTML only for keys that contain HTML (hint text)
      if (key === 'quickfilter.hint') {
        el.innerHTML = translated;
      } else {
        el.textContent = translated;
      }
    });

    // Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = this.t(el.getAttribute('data-i18n-placeholder'));
    });

    // Title attributes (tooltips)
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      el.title = this.t(el.getAttribute('data-i18n-title'));
    });

    // Update lang toggle button label
    const toggleBtn = document.getElementById('langToggleBtn');
    if (toggleBtn) toggleBtn.textContent = this.t('lang.toggle');
  }

  /**
   * Switch to a specific language and re-apply DOM.
   */
  setLanguage(lang) {
    if (!SUPPORTED.includes(lang)) return;
    this.lang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    this.applyToDOM();
    // Re-render dynamic content if available
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
  }

  /**
   * Toggle between 'it' and 'en'.
   */
  toggle() {
    this.setLanguage(this.lang === 'it' ? 'en' : 'it');
  }

  /**
   * Initialize: detect language, apply to DOM, expose globals.
   */
  initialize() {
    this.lang = this._detectLanguage();
    this.applyToDOM();

    // Expose globally so inline HTML and other modules can call t()
    window.t = (key, ...args) => this.t(key, ...args);
    window.i18n = this;

    console.log(`🌐 i18n initialized: ${this.lang}`);
  }
}

export const i18n = new I18nService();
