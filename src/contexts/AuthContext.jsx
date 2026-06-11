import { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore, doc, getDoc, collection, getDocs, addDoc,
  updateDoc, deleteDoc, onSnapshot, query, where, orderBy,
} from 'firebase/firestore';
import { FIREBASE_CONFIG } from '../../js/config/firebase-config.js';
import { normalizeRoles, hasRole as _hasRole, showAdminLink } from '../../js/config/permissions.js';

const app  = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db   = getFirestore(app);

// Expose for legacy callers (admin.html Firestore/Storage still uses window.auth for signOut etc.)
if (!window.auth) window.auth = auth;

// Always overwrite window.db with the npm Firebase instance (which carries auth state).
if (!window.firebaseApp) window.firebaseApp = app;
window.db = db;
window.firestoreModules = {
  collection, getDocs, addDoc, doc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy,
};
if (!window.firebaseReady) {
  window.firebaseReady = true;
  window.dispatchEvent(new Event('firebaseReady'));
}

function readCache() {
  try { return JSON.parse(sessionStorage.getItem('navAuth') || 'null'); } catch { return null; }
}
function writeCache(name, roles) {
  try { sessionStorage.setItem('navAuth', JSON.stringify({ name, roles, isAdmin: roles.includes('admin') })); } catch { /* private mode */ }
}
function clearCache() {
  try { sessionStorage.removeItem('navAuth'); } catch { /* ignore */ }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const cached = readCache();
  const cachedRoles = Array.isArray(cached?.roles) ? cached.roles : (cached?.isAdmin ? ['admin'] : ['user']);

  const [user,    setUser]    = useState(null);
  const [roles,   setRoles]   = useState(cachedRoles);
  const [name,    setName]    = useState(cached?.name ?? null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setRoles(['user']);
        setName(null);
        setLoading(false);
        clearCache();
        window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user: null, roles: ['user'], name: null } }));
        return;
      }

      let r = ['user'];
      try {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (snap.exists()) r = normalizeRoles(snap.data());
      } catch { /* use default */ }

      const displayName = firebaseUser.displayName || firebaseUser.email.split('@')[0];
      setUser(firebaseUser);
      setRoles(r);
      setName(displayName);
      setLoading(false);
      writeCache(displayName, r);
      window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user: firebaseUser, roles: r, name: displayName } }));
    });
  }, []);

  const hasRole = (role) => _hasRole(roles, role);

  return (
    <AuthContext.Provider value={{
      user, roles, name, loading, auth,
      hasRole,
      isAdmin:     hasRole('admin'),
      showAdminLink: showAdminLink(roles),
      // Legacy compat: single primary role string (highest-privilege first)
      role: roles.find(r => r === 'admin')
         ?? roles.find(r => r === 'host_admin')
         ?? roles.find(r => r === 'event_validator')
         ?? roles.find(r => r === 'event_hunter')
         ?? roles.find(r => r === 'artist')
         ?? 'user',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
