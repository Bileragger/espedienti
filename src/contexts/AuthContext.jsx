import { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { FIREBASE_CONFIG } from '../../js/config/firebase-config.js';

const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db   = getFirestore(app);

// Expose for legacy vanilla JS that still uses window.firebaseApp
if (!window.firebaseApp) window.firebaseApp = app;
if (!window.firebaseReady) {
  window.firebaseReady = true;
  window.dispatchEvent(new Event('firebaseReady'));
}

function readCache() {
  try { return JSON.parse(sessionStorage.getItem('navAuth') || 'null'); } catch { return null; }
}
function writeCache(name, isAdmin) {
  try { sessionStorage.setItem('navAuth', JSON.stringify({ name, isAdmin })); } catch { /* private mode */ }
}
function clearCache() {
  try { sessionStorage.removeItem('navAuth'); } catch { /* ignore */ }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const cached = readCache();

  const [user,    setUser]    = useState(null);
  const [role,    setRole]    = useState(cached?.isAdmin ? 'admin' : 'user');
  const [name,    setName]    = useState(cached?.name ?? null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setRole('user');
        setName(null);
        setLoading(false);
        clearCache();
        return;
      }

      let r = 'user';
      try {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (snap.exists()) r = snap.data().role || 'user';
      } catch { /* use default */ }

      const displayName = firebaseUser.displayName || firebaseUser.email.split('@')[0];
      setUser(firebaseUser);
      setRole(r);
      setName(displayName);
      setLoading(false);
      writeCache(displayName, r === 'admin');
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, name, loading, isAdmin: role === 'admin', auth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
