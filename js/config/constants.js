/**
 * Constants - Application-wide Constants, Icons, and Fallback Data
 *
 * Contains all static configuration values used throughout the application.
 */

// ============================================================================
// EVENT CATEGORIES
// ============================================================================

export const EVENT_CATEGORIES = {
  'live-music': { id: 'live-music', name: 'Live Music', icon: '🎵' },
  'open-mic': { id: 'open-mic', name: 'Open Mic', icon: '🎤' },
  'concerto': { id: 'concerto', name: 'Concerto', icon: '🎸' },
  'spettacolo-teatrale': { id: 'spettacolo-teatrale', name: 'Spettacolo Teatrale', icon: '🎭' },
  'mostra': { id: 'mostra', name: 'Mostra', icon: '🖼️' },
  'workshop': { id: 'workshop', name: 'Workshop', icon: '🛠️' },
  'fiera': { id: 'fiera', name: 'Fiera', icon: '🎪' },
  'altro': { id: 'altro', name: 'Altro', icon: '📍' }
};

// ============================================================================
// PLACE CATEGORIES
// ============================================================================

export const PLACE_CATEGORIES = {
  'museo': { id: 'museo', name: 'Museo', icon: '🏛️' },
  'galleria': { id: 'galleria', name: 'Galleria d\'Arte', icon: '🖼️' },
  'parco': { id: 'parco', name: 'Parco', icon: '🌳' },
  'biblioteca': { id: 'biblioteca', name: 'Biblioteca', icon: '📚' },
  'teatro': { id: 'teatro', name: 'Teatro', icon: '🎭' },
  'coworking': { id: 'coworking', name: 'Coworking Space', icon: '💼' },
  'ristorante': { id: 'ristorante', name: 'Ristorante', icon: '🍽️' },
  'centro-sociale': { id: 'centro-sociale', name: 'Centro Sociale', icon: '🤝' },
  'fondazione': { id: 'fondazione', name: 'Fondazione', icon: '🏢' },
  'altro': { id: 'altro', name: 'Altro', icon: '📍' }
};

// ============================================================================
// CATEGORY ICONS (for quick lookup)
// ============================================================================

export const EVENT_CATEGORY_ICONS = {
  'live-music': '🎵',
  'open-mic': '🎤',
  'concerto': '🎸',
  'spettacolo-teatrale': '🎭',
  'mostra': '🖼️',
  'workshop': '🛠️',
  'fiera': '🎪',
  'altro': '📍'
};

export const PLACE_CATEGORY_ICONS = {
  'museo': '🏛️',
  'galleria': '🖼️',
  'parco': '🌳',
  'biblioteca': '📚',
  'teatro': '🎭',
  'coworking': '💼',
  'ristorante': '🍽️',
  'centro-sociale': '🤝',
  'fondazione': '🏢',
  'altro': '📍'
};

export const PLACE_CATEGORY_NAMES = {
  'museo': 'Museo',
  'galleria': 'Galleria d\'Arte',
  'parco': 'Parco',
  'biblioteca': 'Biblioteca',
  'teatro': 'Teatro',
  'coworking': 'Coworking Space',
  'ristorante': 'Ristorante',
  'centro-sociale': 'Centro Sociale',
  'fondazione': 'Fondazione',
  'altro': 'Altro'
};

// ============================================================================
// CATEGORY COLORS (for map markers)
// ============================================================================

export const EVENT_CATEGORY_COLORS = {
  'live-music':          '#ef4444', // rosso
  'open-mic':            '#f97316', // arancio
  'concerto':            '#eab308', // giallo
  'spettacolo-teatrale': '#a855f7', // viola
  'mostra':              '#0ea5e9', // azzurro
  'workshop':            '#10b981', // verde
  'fiera':               '#ec4899', // rosa
  'altro':               '#94a3b8'  // grigio
};

export const PLACE_CATEGORY_COLORS = {
  'museo':          '#2563eb', // blu
  'galleria':       '#d946ef', // fucsia
  'parco':          '#16a34a', // verde
  'biblioteca':     '#7c3aed', // indaco
  'teatro':         '#f43f5e', // rosso-rosa
  'coworking':      '#0891b2', // ciano
  'ristorante':     '#dc2626', // rosso scuro
  'centro-sociale': '#d97706', // ambra
  'fondazione':     '#475569', // ardesia
  'altro':          '#64748b'  // grigio
};

// ============================================================================
// DAY AND MONTH NAMES
// ============================================================================

export const DAYS_OF_WEEK_SHORT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

export const DAYS_OF_WEEK_FULL = [
  'domenica',
  'lunedi',
  'martedi',
  'mercoledi',
  'giovedi',
  'venerdi',
  'sabato'
];

export const DAY_NAMES_IT = {
  'lunedi': 'Lunedì',
  'martedi': 'Martedì',
  'mercoledi': 'Mercoledì',
  'giovedi': 'Giovedì',
  'venerdi': 'Venerdì',
  'sabato': 'Sabato',
  'domenica': 'Domenica'
};

// ============================================================================
// FALLBACK DATA
// ============================================================================

export const FALLBACK_EVENTS = [
  {
    id: 1,
    title: 'Concerto in Piazza',
    date: '2025-10-5',
    dateEnd: null,
    time: { start: '21:00', end: '23:30' },
    location: 'Piazza del Plebiscito',
    coordinates: { lat: 40.8359, lng: 14.2489 },
    description: 'Un concerto di musica classica all\'aperto con l\'orchestra sinfonica di Napoli.',
    category: 'concerto',
    tags: ['#musica', '#concerto', '#gratuito'],
    poster: 'https://via.placeholder.com/400x600/667eea/ffffff?text=Concerto+in+Piazza'
  },
  {
    id: 2,
    title: 'Mostra d\'Arte Moderna',
    date: '2024-10-20',
    dateEnd: '2024-11-15',
    time: null,
    location: 'Museo MADRE',
    coordinates: { lat: 40.8518, lng: 14.2571 },
    description: 'Esposizione di opere contemporanee di artisti emergenti italiani.',
    category: 'mostra',
    tags: ['#arte', '#mostra', '#cultura'],
    poster: 'https://via.placeholder.com/400x600/764ba2/ffffff?text=Mostra+Arte+Moderna'
  },
  {
    id: 3,
    title: 'Teatro: La Commedia',
    date: '2024-10-25',
    dateEnd: null,
    time: { start: '20:30', end: null },
    location: 'Teatro San Carlo',
    coordinates: { lat: 40.8376, lng: 14.2496 },
    description: null,
    category: 'spettacolo-teatrale',
    tags: ['#teatro', '#spettacolo', '#cultura']
  }
];

export const FALLBACK_CATEGORIES = {
  categories: [
    { id: 'live-music', name: 'Live Music', icon: '🎵', whatsappLink: 'https://chat.whatsapp.com/live-music-group' },
    { id: 'open-mic', name: 'Open Mic', icon: '🎤', whatsappLink: 'https://chat.whatsapp.com/open-mic-group' },
    { id: 'concerto', name: 'Concerto', icon: '🎸', whatsappLink: 'https://chat.whatsapp.com/concerto-group' },
    { id: 'spettacolo-teatrale', name: 'Spettacolo Teatrale', icon: '🎭', whatsappLink: 'https://chat.whatsapp.com/teatro-group' },
    { id: 'mostra', name: 'Mostra', icon: '🖼️', whatsappLink: 'https://chat.whatsapp.com/mostra-group' },
    { id: 'workshop', name: 'Workshop', icon: '🛠️', whatsappLink: 'https://chat.whatsapp.com/workshop-group' },
    { id: 'fiera', name: 'Fiera', icon: '🎪', whatsappLink: 'https://chat.whatsapp.com/fiera-group' },
    { id: 'altro', name: 'Altro', icon: '📍', whatsappLink: 'https://chat.whatsapp.com/altro-group' }
  ],
  generalChat: 'https://chat.whatsapp.com/generalgroup'
};

// ============================================================================
// MAP CONFIGURATION
// ============================================================================

export const MAP_CONFIG = {
  defaultCenter: { lat: 40.8359, lng: 14.2489 }, // Piazza del Plebiscito, Napoli
  defaultZoom: 14,
  minZoom: 10,
  maxZoom: 19,
  tileLayerUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  tileLayerAttribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
};

export const MARKER_STYLES = {
  event: {
    default: {
      background: '#ffe500',
      width: 32,
      height: 32,
      borderRadius: 16,
      fontSize: 18
    },
    selected: {
      background: '#f0c800',
      width: 38,
      height: 38,
      borderRadius: 19,
      fontSize: 20
    }
  },
  place: {
    background: '#ffe500',
    width: 28,
    height: 28,
    borderRadius: 14,
    fontSize: 16
  },
  user: {
    background: '#34a853',
    width: 32,
    height: 32,
    borderRadius: '50%',
    fontSize: 16
  }
};

// ============================================================================
// DATE/TIME CONFIGURATION
// ============================================================================

export const DATE_FORMAT_OPTIONS = {
  full: { day: 'numeric', month: 'long', year: 'numeric' },
  short: { day: 'numeric', month: 'short' },
  monthYear: { month: 'long', year: 'numeric' }
};

export const LOCALE = 'it-IT';

// ============================================================================
// OPENING HOURS PATTERNS
// ============================================================================

export const OPENING_HOURS_PATTERNS = {
  single: /^\d{2}:\d{2}-\d{2}:\d{2}$/,
  double: /^\d{2}:\d{2}-\d{2}:\d{2} - \d{2}:\d{2}-\d{2}:\d{2}$/,
  appointment: /^su appuntamento$/i
};

// ============================================================================
// UI MESSAGES
// ============================================================================

export const MESSAGES = {
  noEventsFound: 'Nessun evento trovato.',
  noPlacesFound: 'Nessun luogo trovato.',
  loadingEvents: 'Caricamento eventi...',
  loadingPlaces: 'Caricamento luoghi...',
  errorLoadingData: 'Errore nel caricamento dei dati.',
  geolocationError: 'Impossibile ottenere la tua posizione.',
  geolocationSuccess: 'Posizione rilevata!',
  filterApplied: 'Filtri applicati',
  filterReset: 'Filtri resettati'
};

// ============================================================================
// DEBOUNCE DELAYS (milliseconds)
// ============================================================================

export const DEBOUNCE_DELAYS = {
  search: 300,
  filter: 200,
  resize: 250
};

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const API_ENDPOINTS = {
  events: 'events.json',
  places: 'places.json',
  categories: 'categories.json'
};

// ============================================================================
// FIREBASE COLLECTIONS
// ============================================================================

export const FIREBASE_COLLECTIONS = {
  events: 'events',
  places: 'places',
  categories: 'categories'
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get event category info
 * @param {string} categoryId - Category ID
 * @returns {Object} Category info with id, name, icon
 */
export function getEventCategoryInfo(categoryId) {
  return EVENT_CATEGORIES[categoryId] || { id: 'altro', name: 'Altro', icon: '✨' };
}

/**
 * Get place category info
 * @param {string} categoryId - Category ID
 * @returns {Object} Category info with id, name, icon
 */
export function getPlaceCategoryInfo(categoryId) {
  return PLACE_CATEGORIES[categoryId] || { id: 'altro', name: 'Altro', icon: '📍' };
}

/**
 * Get event category icon
 * @param {string} categoryId - Category ID
 * @returns {string} Icon emoji
 */
export function getEventCategoryIcon(categoryId) {
  return EVENT_CATEGORY_ICONS[categoryId] || '📍';
}

/**
 * Get place category icon
 * @param {string} categoryId - Category ID
 * @returns {string} Icon emoji
 */
export function getPlaceCategoryIcon(categoryId) {
  return PLACE_CATEGORY_ICONS[categoryId] || '📍';
}

/**
 * Get place category name
 * @param {string} categoryId - Category ID
 * @returns {string} Category name
 */
export function getPlaceCategoryName(categoryId) {
  return PLACE_CATEGORY_NAMES[categoryId] || 'Altro';
}
