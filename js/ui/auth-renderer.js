/**
 * AuthRenderer - Login / Registration UI
 *
 * Renders inside #authContent.
 * States: logged-out (login tab | register tab) → logged-in (profile panel).
 */

import { authService } from '../auth/auth-service.js';

const ROLE_LABELS = {
  user:    () => window.t ? window.t('auth.role.user')    : 'Utente',
  artist:  () => window.t ? window.t('auth.role.artist')  : 'Artista',
  manager: () => window.t ? window.t('auth.role.manager') : 'Manager',
  admin:   () => window.t ? window.t('auth.role.admin')   : 'Admin',
};

const ROLE_COLORS = {
  admin:   '#dc2626',
  manager: '#7c3aed',
  artist:  '#0284c7',
  user:    '#16a34a',
};

export class AuthRenderer {
  constructor() {
    this._activeTab = 'login'; // 'login' | 'register'
  }

  initialize() {
    authService.onAuthStateChange((user, role) => {
      this._render(user, role);
      this._updateNavBtn(user, role);
      // Auto-close modal on successful login
      if (user) this._closeModal();
    });

    window.addEventListener('languageChanged', () => {
      this._render(authService.currentUser, authService.currentRole);
      this._updateNavBtn(authService.currentUser, authService.currentRole);
    });

    window.authSwitchTab = (tab) => {
      this._activeTab = tab;
      this._render(authService.currentUser, authService.currentRole);
    };

    window.openAuthModal = () => this._openModal();
    window.closeAuthModal = () => this._closeModal();

    console.log('✅ AuthRenderer initialized');
  }

  _container() {
    return document.getElementById('authContent');
  }

  _t(key, fallback) {
    return window.t ? window.t(key) : fallback;
  }

  _openModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.add('show');
    this._render(authService.currentUser, authService.currentRole);
  }

  _closeModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.remove('show');
  }

  _updateNavBtn(user, role) {
    const btn   = document.getElementById('authNavBtn');
    const label = document.getElementById('authNavLabel');
    if (!btn) return;

    if (user) {
      const name = user.displayName || user.email.split('@')[0];
      if (label) label.textContent = name;
      btn.classList.add('logged-in');
      btn.title = user.email;
    } else {
      if (label) label.textContent = this._t('auth.tab.login', 'Accedi');
      btn.classList.remove('logged-in');
      btn.title = '';
    }

    // Show/hide admin link in both desktop and mobile nav
    const isAdmin = user && role === 'admin';
    ['adminNavLink', 'adminNavLinkMobile'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = isAdmin ? 'flex' : 'none';
    });

    if (window.lucide) window.lucide.createIcons({ nodes: [btn] });
  }

  _render(user, role) {
    const el = this._container();
    if (!el) return;
    if (user) {
      el.innerHTML = this._loggedInHTML(user, role);
    } else {
      el.innerHTML = this._loggedOutHTML();
      this._bindForms();
    }
    if (window.lucide) window.lucide.createIcons();
  }

  // ── Logged-in panel ──────────────────────────────────────────────────────

  _loggedInHTML(user, role) {
    const name = user.displayName || user.email;
    const roleLabel = ROLE_LABELS[role] ? ROLE_LABELS[role]() : (role || 'user');
    const color = ROLE_COLORS[role] || ROLE_COLORS.user;
    return `
      <div class="auth-profile">
        <div class="auth-avatar"><i data-lucide="user-circle"></i></div>
        <div class="auth-profile-info">
          <div class="auth-profile-name">${this._esc(name)}</div>
          <div class="auth-profile-email">${this._esc(user.email)}</div>
          <span class="auth-role-badge" style="background:${color};">${roleLabel}</span>
        </div>
      </div>
      <button class="btn auth-submit-btn" style="margin-top:18px;" onclick="authLogout()">
        <i data-lucide="log-out"></i>
        <span>${this._t('auth.logout.btn', 'Esci')}</span>
      </button>`;
  }

  // ── Logged-out tabs + forms ───────────────────────────────────────────────

  _loggedOutHTML() {
    return `
      <div class="auth-tabs">
        <button class="auth-tab ${this._activeTab === 'login' ? 'active' : ''}"
          onclick="authSwitchTab('login')">${this._t('auth.tab.login', 'Accedi')}</button>
        <button class="auth-tab ${this._activeTab === 'register' ? 'active' : ''}"
          onclick="authSwitchTab('register')">${this._t('auth.tab.register', 'Registrati')}</button>
      </div>
      <div id="authFormWrap">
        ${this._activeTab === 'login' ? this._loginFormHTML() : this._registerFormHTML()}
      </div>`;
  }

  _loginFormHTML() {
    return `
      <form id="authLoginForm" class="auth-form" onsubmit="return false;">
        <div class="auth-field">
          <label>${this._t('auth.email', 'Email')}</label>
          <input type="email" id="authLoginEmail" autocomplete="email" required
            placeholder="email@esempio.it">
        </div>
        <div class="auth-field">
          <label>${this._t('auth.password', 'Password')}</label>
          <input type="password" id="authLoginPassword" autocomplete="current-password" required
            placeholder="••••••••">
        </div>
        <div class="auth-error" id="authLoginError"></div>
        <button type="submit" class="btn auth-submit-btn" id="authLoginBtn">
          <i data-lucide="log-in"></i>
          <span>${this._t('auth.login.btn', 'Accedi')}</span>
        </button>
      </form>`;
  }

  _registerFormHTML() {
    return `
      <form id="authRegisterForm" class="auth-form" onsubmit="return false;">
        <div class="auth-field">
          <label>${this._t('auth.displayName', 'Nome')}</label>
          <input type="text" id="authRegName" autocomplete="name" required
            placeholder="Il tuo nome">
        </div>
        <div class="auth-field">
          <label>${this._t('auth.email', 'Email')}</label>
          <input type="email" id="authRegEmail" autocomplete="email" required
            placeholder="email@esempio.it">
        </div>
        <div class="auth-field">
          <label>${this._t('auth.password', 'Password')}</label>
          <input type="password" id="authRegPassword" autocomplete="new-password" required
            placeholder="Min. 6 caratteri">
        </div>
        <div class="auth-field">
          <label>${this._t('auth.confirmPassword', 'Conferma Password')}</label>
          <input type="password" id="authRegConfirm" autocomplete="new-password" required
            placeholder="Ripeti la password">
        </div>
        <div class="auth-error" id="authRegError"></div>
        <button type="submit" class="btn auth-submit-btn" id="authRegBtn">
          <i data-lucide="user-plus"></i>
          <span>${this._t('auth.register.btn', 'Registrati')}</span>
        </button>
      </form>`;
  }

  // ── Form binding ──────────────────────────────────────────────────────────

  _bindForms() {
    if (this._activeTab === 'login') {
      document.getElementById('authLoginForm')?.addEventListener('submit', () => this._handleLogin());
    } else {
      document.getElementById('authRegisterForm')?.addEventListener('submit', () => this._handleRegister());
    }

    // Expose logout globally
    window.authLogout = async () => {
      await authService.signOut();
    };
  }

  async _handleLogin() {
    const email    = document.getElementById('authLoginEmail')?.value;
    const password = document.getElementById('authLoginPassword')?.value;
    const errEl    = document.getElementById('authLoginError');
    const btn      = document.getElementById('authLoginBtn');

    this._setLoading(btn, true);
    this._setError(errEl, '');

    try {
      await authService.signIn(email, password);
    } catch (err) {
      this._setError(errEl, this._mapError(err));
    } finally {
      this._setLoading(btn, false);
    }
  }

  async _handleRegister() {
    const displayName = document.getElementById('authRegName')?.value || '';
    const email       = document.getElementById('authRegEmail')?.value;
    const password    = document.getElementById('authRegPassword')?.value;
    const confirm     = document.getElementById('authRegConfirm')?.value;
    const errEl       = document.getElementById('authRegError');
    const btn         = document.getElementById('authRegBtn');

    this._setError(errEl, '');

    if (password !== confirm) {
      return this._setError(errEl, this._t('auth.error.passwordMismatch', 'Le password non coincidono.'));
    }

    this._setLoading(btn, true);
    try {
      await authService.signUp({ email, password, displayName });
    } catch (err) {
      this._setError(errEl, this._mapError(err));
    } finally {
      this._setLoading(btn, false);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  _setLoading(btn, loading) {
    if (!btn) return;
    btn.disabled = loading;
    btn.style.opacity = loading ? '0.6' : '1';
  }

  _setError(el, msg) {
    if (el) el.textContent = msg;
  }

  _mapError(err) {
    const code = err?.code || err?.message || '';
    if (code.includes('invite/invalid') || code.includes('invite/missing')) {
      return this._t('auth.error.invalidInvite', 'Codice invito non valido o già utilizzato.');
    }
    if (code.includes('email-already-in-use')) {
      return this._t('auth.error.emailInUse', 'Email già in uso.');
    }
    if (code.includes('wrong-password') || code.includes('invalid-credential')) {
      return this._t('auth.error.invalidCredential', 'Email o password non validi.');
    }
    if (code.includes('weak-password')) {
      return this._t('auth.error.weakPassword', 'La password deve essere di almeno 6 caratteri.');
    }
    return this._t('auth.error.generic', 'Si è verificato un errore. Riprova.');
  }

  _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

export const authRenderer = new AuthRenderer();
