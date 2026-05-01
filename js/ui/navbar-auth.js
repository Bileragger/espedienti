/**
 * Lightweight navbar auth watcher — runs on every page.
 *
 * - Initializes Firebase (reusing existing app if present)
 * - Exposes window.firebaseApp so authService works everywhere
 * - Subscribes to auth state to keep the navbar in sync
 * - Caches auth state in sessionStorage for instant display on next load
 */

import {
  initializeApp,
  getApps,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';

import {
  getAuth,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

import {
  getFirestore,
  doc,
  getDoc,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { FIREBASE_CONFIG } from '../config/firebase-config.js';

// ── Firebase init ─────────────────────────────────────────────────────────────

const _existingApps = getApps();
const _app  = _existingApps.length > 0 ? _existingApps[0] : initializeApp(FIREBASE_CONFIG);
const _auth = getAuth(_app);
const _db   = getFirestore(_app);

// Make Firebase accessible to authService._waitForFirebase() on every page
if (!window.firebaseApp) window.firebaseApp = _app;
if (!window.firebaseReady) {
  window.firebaseReady = true;
  window.dispatchEvent(new Event('firebaseReady'));
}

// ── sessionStorage cache ──────────────────────────────────────────────────────

function _cacheAuth(name, isAdmin) {
  try { sessionStorage.setItem('navAuth', JSON.stringify({ name, isAdmin })); } catch (_) {}
}

function _clearAuthCache() {
  try { sessionStorage.removeItem('navAuth'); } catch (_) {}
}

// ── Navbar DOM updates ────────────────────────────────────────────────────────

function _setNavUser(user, role) {
  const btn   = document.getElementById('authNavBtn');
  const label = document.getElementById('authNavLabel');
  if (btn) {
    const name = user.displayName || user.email.split('@')[0];
    if (label) {
      label.textContent = name;
      label.removeAttribute('data-i18n'); // prevent i18n from overwriting username
    }
    btn.classList.add('logged-in');
    btn.title = user.email;
    if (window.lucide) window.lucide.createIcons({ nodes: [btn] });
  }

  const isAdmin = role === 'admin';
  _cacheAuth(user.displayName || user.email.split('@')[0], isAdmin);

  ['adminNavLink', 'adminNavLinkMobile'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = isAdmin ? 'flex' : 'none';
  });
}

function _setNavLoggedOut() {
  const btn   = document.getElementById('authNavBtn');
  const label = document.getElementById('authNavLabel');
  if (btn) {
    if (label) {
      label.setAttribute('data-i18n', 'auth.tab.login');
      label.textContent = window.t ? window.t('auth.tab.login') : 'Accedi';
    }
    btn.classList.remove('logged-in');
    btn.title = '';
    _clearAuthCache();
  }
  ['adminNavLink', 'adminNavLinkMobile'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

// ── Auth state subscription ───────────────────────────────────────────────────

onAuthStateChanged(_auth, async (user) => {
  if (!user) { _setNavLoggedOut(); return; }

  let role = 'user';
  try {
    const snap = await getDoc(doc(_db, 'users', user.uid));
    if (snap.exists()) role = snap.data().role || 'user';
  } catch { /* use default */ }

  _setNavUser(user, role);
});
