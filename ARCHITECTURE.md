# Architettura Modulare Espedienti

## Panoramica

L'applicazione Espedienti è stata refactorizzata da un'architettura monolitica (script inline) a un'architettura modulare ES6 per migliorare:

- ✅ **Manutenibilità**: Ogni modulo ha una responsabilità specifica (Single Responsibility Principle)
- ✅ **Testabilità**: Ogni modulo può essere testato indipendentemente
- ✅ **Scalabilità**: Facile aggiungere/rimuovere funzionalità
- ✅ **Performance**: Code splitting, lazy loading, tree shaking
- ✅ **Developer Experience**: Code completion, import/export chiari, hot reload

### Metriche

| Metrica | Prima | Dopo |
|---------|-------|------|
| **Righe inline** | 4476 (index.html) + 1138 (admin.html) | 0 |
| **Moduli JS** | 0 | 25 moduli + 2 entry points |
| **Variabili globali** | ~30 | 0 (tutto in StateManager) |
| **Testabilità** | Bassa | Alta (moduli isolati) |
| **Bundle size** | Tutto caricato | Code splitting possibile |

---

## Struttura Cartelle

```
/js/
├── app.js                          # Entry point index.html
├── admin/
│   ├── admin-app.js                # Entry point admin.html
│   ├── event-form-manager.js       # CRUD eventi
│   ├── place-form-manager.js       # CRUD luoghi + orari
│   ├── geocoding-service.js        # Nominatim API + debouncing
│   ├── image-upload-service.js     # ImgBB upload + drag&drop
│   ├── mini-map-service.js         # Mini mappe Leaflet
│   └── tab-manager.js              # Switch tab Eventi/Luoghi
├── config/
│   └── constants.js                # Costanti (icone, config mappa, fallback data)
├── core/
│   ├── state-manager.js            # State Proxy reattivo
│   ├── event-bus.js                # Pub/Sub pattern
│   └── module-loader.js            # Dependency injection
├── data/
│   ├── firebase-service.js         # Firebase CRUD + listeners
│   ├── events-repository.js        # Load eventi (Firebase → JSON → fallback)
│   ├── places-repository.js        # Load luoghi (Firebase → JSON → fallback)
│   └── categories-loader.js        # Load categorie
├── filters/
│   ├── filter-coordinator.js       # Coordinatore filtri
│   ├── search-filter.js            # Filtro testo (debounced)
│   ├── category-filter.js          # Filtri categorie eventi/luoghi
│   ├── date-filter.js              # Filtri data/location/tag
│   └── open-now-filter.js          # Filtro "aperti ora"
├── ui/
│   ├── calendar-renderer.js        # Calendario mensile
│   ├── event-list-renderer.js      # Lista eventi
│   ├── place-list-renderer.js      # Lista luoghi
│   ├── map-renderer.js             # Mappa Leaflet (eventi + luoghi)
│   ├── community-renderer.js       # Sezione community
│   └── modal-manager.js            # Gestione modali
└── utils/
    ├── date-formatter.js           # Formattazione date
    ├── opening-hours-parser.js     # Parse/validazione orari
    ├── geolocation-service.js      # Geolocalizzazione browser
    └── calendar-export.js          # Export Google Calendar/iCal
```

---

## Pattern Architetturali

### 1. State Management (`state-manager.js`)

**Problema risolto**: Eliminare 30+ variabili globali sparse nel codice.

**Soluzione**: Proxy reattivo centralizzato con pub/sub integrato.

```javascript
// Prima (variabili globali)
let events = [];
let filteredEvents = [];
let selectedDate = null;
let map = null;
// ... altre 26+ variabili

// Dopo (state centralizzato)
import { state } from './core/state-manager.js';

state.set('events', []);
const events = state.get('events');

// Reattività automatica
state.subscribe('filteredEvents', (newEvents) => {
  console.log('Eventi aggiornati:', newEvents.length);
});
```

**Architettura**:
```javascript
export class StateManager {
  constructor() {
    this.state = { /* stato iniziale */ };
    this.subscribers = new Map();

    // Proxy per reattività automatica
    this.proxyState = new Proxy(this.state, {
      set: (target, property, value) => {
        target[property] = value;
        this.notify(property, value); // Notifica automatica
        return true;
      }
    });
  }
}
```

**Stati gestiti**:
- Eventi e luoghi (raw + filtrati)
- Filtri attivi (date, location, tag, categorie)
- Stato UI (mese corrente, toggle eventi/luoghi)
- Mappa e marker
- Categorie e configurazioni

---

### 2. Event Bus (`event-bus.js`)

**Problema risolto**: Accoppiamento stretto tra moduli (chiamate dirette).

**Soluzione**: Pub/Sub pattern per comunicazione loosely-coupled.

```javascript
// Prima (accoppiamento stretto)
function updateMap() {
  renderEventMarkers();
  renderPlaceMarkers();
  fitMapBounds();
}

// Dopo (pub/sub)
import { eventBus } from './core/event-bus.js';

// Publisher
eventBus.emit('filters:applied', { count: 15 });

// Subscriber
eventBus.on('filters:applied', (data) => {
  mapRenderer.render();
});
```

**Eventi standard**:

| Categoria | Eventi |
|-----------|--------|
| **Data Loading** | `events:loaded`, `places:loaded`, `categories:loaded` |
| **Filtri** | `filters:applied`, `filter:applied`, `filters:reset` |
| **UI Interazioni** | `calendar:dateSelected`, `event:scrollTo`, `place:scrollTo` |
| **Mappa** | `map:initialized`, `map:markerClicked`, `map:centerOn` |
| **Admin** | `admin:tabChanged` |
| **Sistema** | `firebase:ready`, `modal:showPoster` |

---

### 3. Module Loader (`module-loader.js`)

**Problema risolto**: Gestione manuale dell'ordine di inizializzazione.

**Soluzione**: Dependency injection con topological sort automatico.

```javascript
// Utilizzo in app.js
import { moduleLoader } from './core/module-loader.js';

const modules = [
  { name: 'firebase', instance: firebaseService, deps: [] },
  { name: 'events', instance: eventsRepository, deps: ['firebase'] },
  { name: 'calendar', instance: calendarRenderer, deps: ['events'] }
];

await moduleLoader.initializeAll(modules);
```

**Algoritmo topological sort**:
1. Costruisce grafo delle dipendenze
2. Ordina moduli (depth-first)
3. Inizializza in sequenza corretta
4. Gestisce dipendenze circolari

---

### 4. Repository Pattern (`*-repository.js`)

**Problema risolto**: Logica di caricamento dati sparsa.

**Soluzione**: Layer dedicato con fallback chain.

```javascript
// events-repository.js
async load() {
  try {
    // 1. Prova Firebase
    this.events = await this.firebase.getEvents();
  } catch (error) {
    try {
      // 2. Fallback: JSON locale
      this.events = await this.loadFromJSON();
    } catch {
      // 3. Fallback: dati hardcoded
      this.events = FALLBACK_EVENTS;
    }
  }

  state.set('events', this.events);
  eventBus.emit('events:loaded');
}
```

**Vantaggi**:
- Resilienza (fallback multipli)
- Testing facile (mock Firebase)
- Separazione concerns

---

### 5. Filter Coordinator (`filter-coordinator.js`)

**Problema risolto**: Logica filtri intrecciata e difficile da mantenere.

**Soluzione**: Coordinatore centralizzato con pipeline chiara.

```javascript
applyFilters() {
  let events = state.get('events');
  let places = state.get('places');

  // Pipeline filtri eventi
  events = this.searchFilter.filterEvents(events);
  events = this.categoryFilter.filterEvents(events);
  events = this.dateFilter.filterEvents(events);

  // Pipeline filtri luoghi
  places = this.searchFilter.filterPlaces(places);
  places = this.categoryFilter.filterPlaces(places);
  places = this.openNowFilter.filterPlaces(places);

  state.set('filteredEvents', events);
  state.set('filteredPlaces', places);
  eventBus.emit('filters:applied');
}
```

**Responsabilità**:
- Ordine applicazione filtri
- Composizione risultati
- Notifica cambiamenti
- Reset filtri

---

## Flusso Inizializzazione

### Index.html (`app.js`)

```
1. DOM Ready
   ↓
2. Initialize Core
   - StateManager
   - EventBus
   ↓
3. Initialize Firebase
   - Aspetta firebaseReady event
   ↓
4. Load Data (parallelo)
   - Categories
   - Events (Firebase → JSON → fallback)
   - Places (Firebase → JSON → fallback)
   ↓
5. Initialize Filters
   - SearchFilter
   - CategoryFilter
   - DateFilter
   - OpenNowFilter
   - FilterCoordinator
   ↓
6. Initialize UI
   - CalendarRenderer
   - EventListRenderer
   - PlaceListRenderer
   - MapRenderer (con delay 100ms)
   - CommunityRenderer
   - ModalManager
   ↓
7. Setup Window Handlers
   - toggleView()
   - toggleEventCategory()
   - filterToday()
   - locateUser()
   - ecc.
   ↓
8. Ready! 🎉
```

### Admin.html (`admin-app.js`)

```
1. DOM Ready
   ↓
2. Initialize Firebase
   ↓
3. Initialize Tab Manager
   ↓
4. Initialize Form Managers (parallelo)
   - EventFormManager
     ├── Setup form submit
     ├── Setup location search
     ├── Setup tag input
     ├── Setup image upload
     └── Load events from Firebase

   - PlaceFormManager
     ├── Setup form submit
     ├── Setup location search
     ├── Setup image upload
     ├── Collect opening hours
     └── Load places from Firebase
   ↓
5. Setup Window Handlers
   - editEvent() / deleteEvent()
   - editPlace() / deletePlace()
   - selectLocation()
   - showPoster()
   ↓
6. Ready! 🎉
```

---

## Dettaglio Moduli Chiave

### 📊 State Manager (`core/state-manager.js`)

**Responsabilità**: Gestione centralizzata dello stato con reattività.

**API**:
```javascript
state.get(key)              // Leggi valore
state.set(key, value)       // Scrivi valore (notifica automatica)
state.subscribe(key, fn)    // Osserva cambiamenti
state.unsubscribe(key, fn)  // Rimuovi observer
```

**Stati principali**:
- `events`, `filteredEvents`
- `places`, `filteredPlaces`
- `selectedDate`, `selectedLocation`, `selectedTag`
- `selectedEventCategories`, `selectedPlaceCategories`
- `currentMonth`, `showEvents`, `showPlaces`
- `map`, `markers`, `placeMarkers`, `userMarker`

---

### 🔔 Event Bus (`core/event-bus.js`)

**Responsabilità**: Comunicazione event-driven tra moduli.

**API**:
```javascript
eventBus.on(event, callback)      // Sottoscrivi
eventBus.emit(event, data)        // Pubblica
eventBus.off(event, callback)     // Disiscriviti
eventBus.once(event, callback)    // Sottoscrivi (1 volta)
```

**Pattern d'uso**:
```javascript
// Modulo A (publisher)
filterCoordinator.applyFilters();
eventBus.emit('filters:applied', { count: 15 });

// Modulo B (subscriber)
eventBus.on('filters:applied', () => {
  mapRenderer.render();
  eventListRenderer.render();
});
```

---

### 🗺️ Map Renderer (`ui/map-renderer.js`)

**Responsabilità**: Gestione mappa Leaflet con marker eventi/luoghi.

**Caratteristiche**:
- Inizializzazione lazy (delay 100ms per DOM ready)
- Marker personalizzati (eventi: goccia viola, luoghi: emoji categoria)
- Popup interattivi con bottoni
- Geolocalizzazione utente
- Auto-fit bounds per mostrare tutti i marker
- Integrazione con filtri

**Metodi principali**:
```javascript
initializeMap()                    // Init Leaflet map
render()                           // Render tutti i marker
centerOn(lat, lng, zoom)           // Centra mappa
locateUser()                       // Geolocalizza utente
_renderEventMarkers(events)        // Render marker eventi
_renderPlaceMarkers(places)        // Render marker luoghi
```

---

### 📝 Form Managers (`admin/*-form-manager.js`)

**Event Form Manager**:
- CRUD eventi
- Geocoding Nominatim con debouncing
- Tag management (#hashtags)
- Upload immagini ImgBB
- Mini mappa verifica posizione

**Place Form Manager**:
- CRUD luoghi
- Validazione orari apertura (3 formati)
- Check "aperto ora"
- Ordinamento alfabetico italiano
- Mini mappa verifica posizione

**Formati orari supportati**:
1. Singola apertura: `10:30-13:30`
2. Doppia apertura: `10:30-13:30 - 16:00-18:00`
3. Appuntamento: `su appuntamento`

---

### 🔍 Filter Coordinator (`filters/filter-coordinator.js`)

**Responsabilità**: Coordinamento applicazione filtri.

**Pipeline**:
```
Eventi:  Search → Category → Date → State
Luoghi:  Search → Category → OpenNow → State
```

**Metodi**:
```javascript
applyFilters()              // Applica tutti i filtri
resetAll()                  // Reset tutti i filtri
hasActiveFilters()          // Check filtri attivi
```

---

## Retrocompatibilità

Le funzioni necessarie per gli `onclick` HTML sono esposte a `window`:

### Index.html
```javascript
window.changeMonth = (delta) => { /* ... */ }
window.showPoster = (url) => { /* ... */ }
window.filterByTag = (tag) => { /* ... */ }
window.toggleEventCategory = (cat) => { /* ... */ }
window.togglePlaceCategory = (cat) => { /* ... */ }
window.filterToday = () => { /* ... */ }
window.locateUser = () => { /* ... */ }
window.resetFilters = () => { /* ... */ }
window.centerOnPlace = (lat, lng) => { /* ... */ }
window.addToCalendar = (event) => { /* ... */ }
window.openDirections = (lat, lng, name, address) => { /* ... */ }
```

### Admin.html
```javascript
window.switchTab = (tab) => { /* ... */ }
window.editEvent = (id) => { /* ... */ }
window.deleteEvent = (id) => { /* ... */ }
window.editPlace = (id) => { /* ... */ }
window.deletePlace = (id) => { /* ... */ }
window.selectLocation = (index) => { /* ... */ }
window.selectPlaceLocation = (index) => { /* ... */ }
window.useManualAddress = () => { /* ... */ }
window.usePlaceManualAddress = () => { /* ... */ }
window.removeTag = (tag) => { /* ... */ }
window.showPoster = (url) => { /* ... */ }
window.closePosterModal = () => { /* ... */ }
```

---

## Testing Strategy

### Unit Testing

Ogni modulo può essere testato indipendentemente:

```javascript
// Esempio: test state-manager.js
import { StateManager } from './core/state-manager.js';

test('StateManager notifica subscriber su set', () => {
  const state = new StateManager();
  let notified = false;

  state.subscribe('events', () => { notified = true; });
  state.set('events', [1, 2, 3]);

  expect(notified).toBe(true);
  expect(state.get('events')).toEqual([1, 2, 3]);
});
```

### Integration Testing

Test comunicazione tra moduli:

```javascript
// Esempio: test filter-coordinator
test('FilterCoordinator applica filtri in ordine', () => {
  const events = [/* eventi test */];
  state.set('events', events);

  filterCoordinator.applyFilters();

  const filtered = state.get('filteredEvents');
  expect(filtered.length).toBeLessThanOrEqual(events.length);
});
```

### E2E Testing

Verifica flussi completi:
- Caricamento → Filtro → Render
- Click mappa → Scroll lista
- Geocoding → Mini mappa → Salvataggio

---

## Guida Manutenzione

### Aggiungere un nuovo modulo

1. **Crea il file** nella cartella appropriata:
   ```bash
   touch js/utils/new-feature.js
   ```

2. **Implementa la classe**:
   ```javascript
   export class NewFeature {
     constructor(dependencies) {
       this.dep = dependencies;
     }

     initialize() {
       // Setup
     }
   }

   export const newFeature = new NewFeature(/* deps */);
   ```

3. **Importa in `app.js`**:
   ```javascript
   import { newFeature } from './utils/new-feature.js';

   async function initializeModules() {
     // ...
     newFeature.initialize();
   }
   ```

### Modificare un filtro esistente

1. **Modifica il modulo specifico** (es. `search-filter.js`)
2. **Testa isolatamente** il modulo
3. **Verifica FilterCoordinator** applichi correttamente
4. **Test E2E** del flusso completo

### Aggiungere un nuovo evento EventBus

1. **Documenta in questo file** nella tabella eventi
2. **Emit** dal modulo publisher:
   ```javascript
   eventBus.emit('newEvent:happened', { data });
   ```
3. **Subscribe** nei moduli interessati:
   ```javascript
   eventBus.on('newEvent:happened', (data) => { /* ... */ });
   ```

### Debug

**Console logs già presenti**:
```
🚀 Initializing Espedienti modules...
✅ StateManager initialized
✅ EventBus initialized
📥 Loading application data...
✅ All data loaded
✅ MapRenderer initialized
✅ Espedienti initialized successfully!
```

**Ispeziona stato**:
```javascript
// In console browser
window.debugState = state; // Esporre per debug
debugState.get('filteredEvents');
```

**Traccia eventi**:
```javascript
eventBus.onAny((event, data) => {
  console.log(`Event: ${event}`, data);
});
```

---

## Performance

### Code Splitting (futuro)

Con ES6 modules, possibile implementare:

```javascript
// Lazy load admin modules solo se necessario
if (isAdmin) {
  const { adminApp } = await import('./admin/admin-app.js');
  adminApp.initialize();
}
```

### Tree Shaking

Build tools (Vite, Webpack) possono eliminare codice inutilizzato:
- Import solo ciò che serve
- Export granulari (non `export *`)

### Debouncing

Già implementato in:
- `search-filter.js`: 300ms
- `geocoding-service.js`: 500ms

---

## Migrazione HTML

### Prima
```html
<script>
  let events = [];
  // ... 4476 righe ...
</script>
```

### Dopo
```html
<script type="module" src="js/app.js"></script>
```

**Vantaggi**:
- HTML più pulito
- Script esterno cacheable
- Code completion in IDE
- Debugging migliorato (source maps)

---

## Roadmap Futura

### Short-term
- [ ] Unit tests con Jest/Vitest
- [ ] Build pipeline (Vite)
- [ ] Environment variables (dev/prod)

### Mid-term
- [ ] TypeScript migration
- [ ] Service Worker (offline mode)
- [ ] Analytics module

### Long-term
- [ ] Framework migration (Svelte/Vue)
- [ ] SSR/Static Generation
- [ ] PWA completa

---

## Risorse

### Pattern & Best Practices
- [JavaScript Modules (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [Observer Pattern](https://refactoring.guru/design-patterns/observer)
- [Pub/Sub Pattern](https://www.patterns.dev/posts/publish-subscribe-pattern)

### Tools
- [Vite](https://vitejs.dev/) - Build tool moderno
- [Vitest](https://vitest.dev/) - Testing framework
- [ESLint](https://eslint.org/) - Linting

### Firebase
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Emulator](https://firebase.google.com/docs/emulator-suite)

---

## Contribuire

### Setup Locale

```bash
# Clone repo
git clone https://github.com/yourusername/espedienti.git
cd espedienti

# Installa dipendenze (se presenti)
npm install

# Serve locale
python -m http.server 8000
# oppure
npx serve

# Apri browser
open http://localhost:8000
```

### Workflow

1. Crea branch feature: `git checkout -b feature/nome-feature`
2. Implementa modifiche nei moduli appropriati
3. Testa localmente
4. Commit: `git commit -m "feat: descrizione"`
5. Push e pull request

---

## Supporto

Per domande o problemi:
- 📧 Email: [tuo-email]
- 💬 Issues: [GitHub Issues]
- 📖 Wiki: [GitHub Wiki]

---

**Versione architettura**: 2.0
**Data ultimo aggiornamento**: 2026-01-27
**Autore**: Simone Esposito + Claude Code
