/**
 * Lightweight navbar auth watcher.
 *
 * Initializes Firebase Auth (reusing an existing app if present) and
 * subscribes to auth state changes to keep the shared navbar in sync:
 *   - updates the auth button label / logged-in style
 *   - shows/hides admin links based on the user's role
 *
 * Safe to call on every page — it uses getApps() to avoid re-initializing
 * Firebase if it was already set up by the page's own inline script.
 */

import {
  initializeApp,
  getApps,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';

import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

import {
  getFirestore,
  doc,
  getDoc,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDAaxhfc0ch2mZDEElHmbDHNYdYV1oxlY4',
  authDomain: 'espedienti-napoli.firebaseapp.com',
  projectId: 'espedienti-napoli',
  storageBucket: 'espedienti-napoli.firebasestorage.app',
  messagingSenderId: '450345618879',
  appId: '1:450345618879:web:010b8a6138e9b2f4a4a50a',
};

function _isHomePage() {
  const path = window.location.pathname;
  return path.endsWith('index.html') || path === '/' || path.endsWith('/');
}

function _removePopover() {
  document.getElementById('navAuthPopover')?.remove();
  document.removeEventListener('click', _outsideClick);
}

function _outsideClick(e) {
  if (!document.getElementById('navAuthPopover')?.contains(e.target) &&
      e.target.id !== 'authNavBtn') {
    _removePopover();
  }
}

function _showLoggedInPopover(user, auth) {
  _removePopover();

  const btn = document.getElementById('authNavBtn');
  if (!btn) return;

  const name = user.displayName || user.email.split('@')[0];

  const pop = document.createElement('div');
  pop.id = 'navAuthPopover';
  pop.className = 'nav-auth-popover';
  pop.innerHTML = `
    <div class="pop-name">${name}<br><small style="opacity:.7">${user.email}</small></div>
    <button class="pop-btn" id="navSignOutBtn">Esci</button>`;

  // Position relative to the header-content (which is position:relative or we use the header)
  const header = btn.closest('header') || document.querySelector('header');
  if (header) {
    header.style.position = 'relative';
    header.appendChild(pop);
  }

  document.getElementById('navSignOutBtn').addEventListener('click', async () => {
    _removePopover();
    await signOut(auth);
  });

  setTimeout(() => document.addEventListener('click', _outsideClick), 0);
}

function _cacheAuth(name, isAdmin) {
  try { sessionStorage.setItem('navAuth', JSON.stringify({ name, isAdmin })); } catch (_) {}
}

function _clearAuthCache() {
  try { sessionStorage.removeItem('navAuth'); } catch (_) {}
}

function _setNavUser(user, role, auth) {
  const btn   = document.getElementById('authNavBtn');
  const label = document.getElementById('authNavLabel');
  if (btn) {
    const name = user.displayName || user.email.split('@')[0];
    if (label) {
      label.textContent = name;
      label.removeAttribute('data-i18n');
    }
    btn.classList.add('logged-in');
    btn.title = user.email;
    if (window.lucide) window.lucide.createIcons({ nodes: [btn] });

    // On non-home pages there's no auth modal — show a mini popover instead
    if (!_isHomePage()) {
      btn.onclick = (e) => { e.stopPropagation(); _showLoggedInPopover(user, auth); };
    }
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

    // On non-home pages redirect to home to log in
    if (!_isHomePage()) {
      btn.onclick = () => { window.location.href = 'index.html'; };
    }
  }
  ['adminNavLink', 'adminNavLinkMobile'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

// Auto-run on import
const _existingApps = getApps();
const _app  = _existingApps.length > 0 ? _existingApps[0] : initializeApp(FIREBASE_CONFIG);
const _auth = getAuth(_app);
const _db   = getFirestore(_app);

onAuthStateChanged(_auth, async (user) => {
  if (!user) { _setNavLoggedOut(); return; }

  let role = 'user';
  try {
    const snap = await getDoc(doc(_db, 'users', user.uid));
    if (snap.exists()) role = snap.data().role || 'user';
  } catch { /* use default role */ }

  _setNavUser(user, role, _auth);
});
