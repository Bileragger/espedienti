import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { LogIn, UserPlus, LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { ROLE_LABELS, ROLE_COLORS } from '../../js/config/permissions.js';

// Signal that the React modal owns window.openAuthModal — checked by app.js
// to skip authRenderer.initialize() which would overwrite it.
window.__reactAuthModal = true;

function mapError(err) {
  const code = err?.code ?? '';
  if (code.includes('email-already-in-use'))                          return 'Email già in uso.';
  if (code.includes('wrong-password') || code.includes('invalid-credential')) return 'Email o password non validi.';
  if (code.includes('weak-password'))  return 'La password deve essere di almeno 6 caratteri.';
  return 'Si è verificato un errore. Riprova.';
}

export function AuthModal() {
  const { user, role, name, auth } = useAuth();
  const [open, setOpen]   = useState(false);
  const [tab,  setTab]    = useState('login');

  // Expose open/close to Navbar's onClick and any legacy callers
  useEffect(() => {
    window.openAuthModal  = () => setOpen(true);
    window.closeAuthModal = () => setOpen(false);
  }, []);

  // Auto-close after successful login
  useEffect(() => { if (user) setOpen(false); }, [user]);

  if (!open) return null;

  return createPortal(
    <div className="modal auth-modal show" onClick={() => setOpen(false)}>
      <div className="auth-modal-content" onClick={e => e.stopPropagation()}>

        <div className="auth-modal-header">
          <h2>
            <UserCircle size={18} />
            <span>{user ? (name ?? 'Profilo') : 'Accedi'}</span>
          </h2>
          <button type="button" className="auth-modal-close" onClick={() => setOpen(false)}>
            &times;
          </button>
        </div>

        <div className="auth-modal-body">
          {user
            ? <ProfilePanel user={user} name={name} auth={auth} />
            : <AuthPanel    tab={tab}   setTab={setTab} auth={auth} />
          }
        </div>

      </div>
    </div>,
    document.body
  );
}

// ── Logged-in ────────────────────────────────────────────────────────────────

function ProfilePanel({ user, name, auth }) {
  const { roles } = useAuth();

  return (
    <>
      <div className="auth-profile">
        <div className="auth-avatar"><UserCircle size={48} /></div>
        <div className="auth-profile-info">
          <div className="auth-profile-name">{name ?? user.email}</div>
          <div className="auth-profile-email">{user.email}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            {roles.map(r => (
              <span key={r} className="auth-role-badge"
                style={{ background: ROLE_COLORS[r] ?? ROLE_COLORS.user }}>
                {ROLE_LABELS[r] ?? r}
              </span>
            ))}
          </div>
        </div>
      </div>
      <button type="button" className="btn auth-submit-btn" style={{ marginTop: 18 }}
        onClick={() => signOut(auth)}>
        <LogOut size={16} /><span>Esci</span>
      </button>
    </>
  );
}

// ── Logged-out tabs ──────────────────────────────────────────────────────────

function AuthPanel({ tab, setTab, auth }) {
  return (
    <>
      <div className="auth-tabs">
        <button type="button" className={`auth-tab${tab === 'login'    ? ' active' : ''}`} onClick={() => setTab('login')}>Accedi</button>
        <button type="button" className={`auth-tab${tab === 'register' ? ' active' : ''}`} onClick={() => setTab('register')}>Registrati</button>
      </div>
      {tab === 'login' ? <LoginForm auth={auth} /> : <RegisterForm auth={auth} />}
    </>
  );
}

function LoginForm({ auth }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      setError(mapError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-field">
        <label>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          autoComplete="email" required placeholder="email@esempio.it" />
      </div>
      <div className="auth-field">
        <label>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          autoComplete="current-password" required placeholder="••••••••" />
      </div>
      {error && <div className="auth-error">{error}</div>}
      <button type="submit" className="btn auth-submit-btn"
        disabled={loading} style={{ opacity: loading ? 0.6 : 1 }}>
        <LogIn size={16} /><span>{loading ? '…' : 'Accedi'}</span>
      </button>
    </form>
  );
}

function RegisterForm({ auth }) {
  const [displayName, setDisplayName] = useState('');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) { setError('Le password non coincidono.'); return; }
    setLoading(true); setError('');
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await setDoc(doc(getFirestore(auth.app), 'users', user.uid), {
        uid:         user.uid,
        email:       email.trim(),
        displayName: displayName.trim(),
        role:        'user',
        createdAt:   new Date().toISOString(),
      });
    } catch (err) {
      setError(mapError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-field">
        <label>Nome</label>
        <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
          autoComplete="name" required placeholder="Il tuo nome" />
      </div>
      <div className="auth-field">
        <label>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          autoComplete="email" required placeholder="email@esempio.it" />
      </div>
      <div className="auth-field">
        <label>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          autoComplete="new-password" required placeholder="Min. 6 caratteri" />
      </div>
      <div className="auth-field">
        <label>Conferma Password</label>
        <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
          autoComplete="new-password" required placeholder="Ripeti la password" />
      </div>
      {error && <div className="auth-error">{error}</div>}
      <button type="submit" className="btn auth-submit-btn"
        disabled={loading} style={{ opacity: loading ? 0.6 : 1 }}>
        <UserPlus size={16} /><span>{loading ? '…' : 'Registrati'}</span>
      </button>
    </form>
  );
}
