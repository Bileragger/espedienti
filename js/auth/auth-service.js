/**
 * AuthService - Firebase Authentication + Role Management
 *
 * Handles login, registration (with optional invite validation), logout.
 * Stores user profiles in Firestore `users/{uid}`.
 * Invite codes live in Firestore `invites` collection.
 *
 * Roles:
 *   user    → free registration
 *   artist  → requires invite code
 *   manager → requires invite code
 *   admin   → requires invite code
 */

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const USERS_COLLECTION = 'users';

export class AuthService {
  constructor() {
    this.auth = null;
    this.db = null;
    this.currentUser = null;
    this.currentRole = null;
    this._stateListeners = [];
    this._initialized = false;
  }

  async initialize() {
    if (this._initialized) return;
    await this._waitForFirebase();

    this.auth = getAuth(window.firebaseApp);
    this.db = getFirestore(window.firebaseApp);
    this._initialized = true;

    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        this.currentUser = user;
        this.currentRole = await this._fetchRole(user.uid);
      } else {
        this.currentUser = null;
        this.currentRole = null;
      }
      this._stateListeners.forEach(fn => fn(this.currentUser, this.currentRole));
    });

    console.log('✅ AuthService initialized');
  }

  _waitForFirebase() {
    return new Promise(resolve => {
      if (window.firebaseReady && window.firebaseApp) return resolve();
      window.addEventListener('firebaseReady', resolve, { once: true });
    });
  }

  async _fetchRole(uid) {
    try {
      const ref  = doc(this.db, USERS_COLLECTION, uid);
      const snap = await getDoc(ref);
      if (snap.exists()) return snap.data().role || 'user';

      // No profile found — create a minimal one so the account appears in user list
      const user = this.auth.currentUser;
      await setDoc(ref, {
        uid,
        email:       user?.email || '',
        displayName: user?.displayName || user?.email?.split('@')[0] || '',
        role:        'user',
        createdAt:   new Date().toISOString(),
      });
    } catch {}
    return 'user';
  }

  /** Register a listener called whenever auth state changes */
  onAuthStateChange(fn) {
    this._stateListeners.push(fn);
    // Fire immediately if already resolved
    if (this._initialized) fn(this.currentUser, this.currentRole);
  }

  /**
   * Sign in with email + password.
   * Throws on failure (caller handles error display).
   */
  async signIn(email, password) {
    await signInWithEmailAndPassword(this.auth, email.trim(), password);
  }

  /**
   * Register a new user (role: 'user' only — free registration).
   * Invite-based roles (admin, manager, artist) register via register.html.
   */
  async signUp({ email, password, displayName }) {
    const credential = await createUserWithEmailAndPassword(
      this.auth,
      email.trim(),
      password
    );

    await setDoc(doc(this.db, USERS_COLLECTION, credential.user.uid), {
      uid: credential.user.uid,
      email: email.trim(),
      displayName: displayName.trim(),
      role: 'user',
      createdAt: new Date().toISOString(),
    });
  }

  async signOut() {
    await firebaseSignOut(this.auth);
  }
}

export const authService = new AuthService();
