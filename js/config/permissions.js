/**
 * permissions.js — Single source of truth for roles and access control.
 *
 * Firestore schema (users/{uid}):
 *   roles:      string[]   — array of role keys (replaces old `role` string)
 *   locationId: string?    — set for host_admin; scopes their write access
 *
 * Firestore schema (invites/{id}):
 *   roles:      string[]   — roles to assign on registration
 */

export const ROLE_KEYS = /** @type {const} */ ([
  'admin',
  'host_admin',
  'artist',
  'user',
  'event_hunter',
  'event_validator',
]);

export const ROLE_META = {
  admin:           { label: 'Admin',             color: '#dc2626', description: 'Accesso completo: eventi, luoghi, categorie, utenti, inviti' },
  host_admin:      { label: 'Host Admin',         color: '#7c3aed', description: 'Gestisce la propria location e i suoi eventi' },
  artist:          { label: 'Artista',            color: '#0284c7', description: 'Può inserire disponibilità e contatti social' },
  user:            { label: 'Utente',             color: '#16a34a', description: 'Accesso standard al portale' },
  event_hunter:    { label: 'Event Hunter',       color: '#d97706', description: 'Può segnalare nuovi eventi tramite app mobile' },
  event_validator: { label: 'Event Validator',    color: '#0891b2', description: 'Può approvare/rifiutare eventi in attesa di validazione' },
};

// Convenience exports for legacy code that only needs label/color
export const ROLE_LABELS = Object.fromEntries(
  ROLE_KEYS.map(k => [k, ROLE_META[k].label])
);
export const ROLE_COLORS = Object.fromEntries(
  ROLE_KEYS.map(k => [k, ROLE_META[k].color])
);

/**
 * Normalise the Firestore user doc into a roles array.
 * Handles both the old `role: string` field and the new `roles: string[]` field.
 */
export function normalizeRoles(data) {
  if (!data) return ['user'];
  if (Array.isArray(data.roles) && data.roles.length) return data.roles;
  if (typeof data.role === 'string' && data.role) return [data.role];
  return ['user'];
}

/** Returns true if the given roles array includes the requested role. */
export function hasRole(roles, role) {
  return Array.isArray(roles) && roles.includes(role);
}

// ── Named permission checks ───────────────────────────────────────────────────

/** Full admin: can do everything. */
export function canAccessAdmin(roles) {
  return hasRole(roles, 'admin');
}

/** Can manage ALL events and places (admin only). */
export function canManageAll(roles) {
  return hasRole(roles, 'admin');
}

/**
 * Can manage events for a specific location.
 * Admin always yes. host_admin only if their locationId matches.
 */
export function canManageLocation(roles, userLocationId, targetLocationId) {
  if (hasRole(roles, 'admin')) return true;
  return hasRole(roles, 'host_admin') && userLocationId === targetLocationId;
}

/** Can validate pending events. */
export function canValidateEvents(roles) {
  return hasRole(roles, 'admin') || hasRole(roles, 'event_validator');
}

/** Can submit new event suggestions (not publish). */
export function canSubmitEvents(roles) {
  return hasRole(roles, 'admin') || hasRole(roles, 'event_hunter') || hasRole(roles, 'host_admin');
}

/** Can access the artist dashboard. */
export function canAccessArtistSection(roles) {
  return hasRole(roles, 'artist') || hasRole(roles, 'admin');
}

/** Should see the admin link in the navbar. */
export function showAdminLink(roles) {
  return hasRole(roles, 'admin')
    || hasRole(roles, 'host_admin')
    || hasRole(roles, 'event_validator');
}
