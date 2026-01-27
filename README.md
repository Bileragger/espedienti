# 🎭 Espedienti - Eventi e Luoghi di Napoli

Piattaforma web per scoprire eventi culturali e luoghi interessanti a Napoli, con mappa interattiva, filtri avanzati e interfaccia admin per la gestione dei contenuti.

## ✨ Caratteristiche

### 🗺️ Mappa Interattiva
- Visualizzazione eventi e luoghi su mappa Leaflet
- Marker personalizzati con popup informativi
- Geolocalizzazione utente
- Indicazioni stradali integrate

### 🔍 Filtri Avanzati
- **Ricerca testuale**: Cerca eventi e luoghi per nome/descrizione
- **Categorie**: Filtra per tipo evento (concerti, mostre, teatro, ecc.)
- **Data**: Visualizza eventi di oggi o seleziona data specifica
- **Tag**: Filtra per hashtag (#jazz, #gratis, ecc.)
- **Aperti ora**: Mostra solo luoghi attualmente aperti

### 📅 Calendario
- Vista mensile con indicatori eventi
- Selezione data interattiva
- Export eventi a Google Calendar / iCal

### 🎨 Interfaccia Admin
- CRUD completo per eventi e luoghi
- Geocoding automatico (Nominatim API)
- Upload immagini (ImgBB)
- Validazione orari apertura
- Mini mappe per verifica posizioni

## 🚀 Quick Start

### Prerequisiti

- Browser moderno con supporto ES6 modules
- Connessione internet (per Firebase e API esterne)

### Installazione

```bash
# Clone repository
git clone https://github.com/yourusername/espedienti.git
cd espedienti

# Serve locale (sceglierne uno)
python -m http.server 8000
# oppure
npx serve
# oppure
php -S localhost:8000

# Apri browser
open http://localhost:8000
```

### Configurazione Firebase

1. Crea progetto su [Firebase Console](https://console.firebase.google.com)
2. Abilita Firestore Database
3. Copia credenziali in `index.html` e `admin.html` (linea ~16-24)
4. Configura regole Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Lettura pubblica
    match /events/{document=**} {
      allow read: if true;
      allow write: if request.auth != null; // Solo admin autenticati
    }
    match /places/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /categories/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 📁 Struttura Progetto

```
espedienti/
├── index.html              # Pagina principale utenti
├── admin.html              # Pannello amministrazione
├── styles.css              # Stili globali
├── js/                     # Moduli JavaScript ES6
│   ├── app.js              # Entry point index.html
│   ├── admin/              # Moduli admin
│   ├── core/               # Core (state, event bus, DI)
│   ├── config/             # Configurazioni e costanti
│   ├── data/               # Repository dati
│   ├── filters/            # Logica filtri
│   ├── ui/                 # Renderer UI
│   └── utils/              # Utility (date, geo, ecc.)
├── data/                   # Dati locali (fallback)
│   ├── events.json
│   ├── places.json
│   └── categories.json
├── ARCHITECTURE.md         # 📖 Documentazione architettura
└── README.md               # Questo file
```

## 🏗️ Architettura

Il progetto utilizza un'**architettura modulare ES6** con:

- **25 moduli specializzati** organizzati per responsabilità
- **State Management** centralizzato con Proxy reattivo
- **Event Bus** per comunicazione pub/sub tra moduli
- **Dependency Injection** per inizializzazione ordinata
- **Zero variabili globali** (tutto in StateManager)

Per dettagli completi, vedi **[ARCHITECTURE.md](ARCHITECTURE.md)**.

### Pattern Principali

| Pattern | Utilizzo |
|---------|----------|
| **Repository** | Caricamento dati con fallback chain |
| **Observer** | State Manager reattivo |
| **Pub/Sub** | Event Bus per comunicazione moduli |
| **Coordinator** | Filter Coordinator per logica filtri |
| **Singleton** | Export istanze singleton moduli |

## 🛠️ Tecnologie

### Frontend
- **Vanilla JavaScript** (ES6+ modules)
- **Leaflet.js** - Mappa interattiva
- **CSS3** - Gradient scuri, animazioni

### Backend & Services
- **Firebase Firestore** - Database NoSQL real-time
- **Nominatim API** - Geocoding OpenStreetMap
- **ImgBB API** - Upload immagini

### Build & Deploy
- Nessun build step (ES6 nativi)
- Hosting: Firebase Hosting / Netlify / GitHub Pages

## 📱 Uso

### Utenti (index.html)

1. **Esplora mappa**: Click sui marker per dettagli
2. **Filtra eventi**: Usa barra ricerca, categorie, data
3. **Calendario**: Naviga mesi e seleziona date
4. **Aggiungi al calendario**: Click "➕ Aggiungi" su evento
5. **Indicazioni**: Click "🧭 Indicazioni" per aprire Google Maps

### Admin (admin.html)

1. **Switch tab**: Scegli Eventi o Luoghi
2. **Aggiungi evento**:
   - Compila form
   - Cerca posizione (geocoding automatico)
   - Aggiungi tag con # + Enter
   - Upload locandina (drag & drop)
   - Submit
3. **Aggiungi luogo**:
   - Compila form
   - Inserisci orari apertura per giorno
   - Verifica posizione su mini mappa
   - Submit
4. **Modifica/Elimina**: Click icone ✏️ / 🗑️ nella lista

## 🔧 Manutenzione

### Aggiungere un evento manualmente

```javascript
// In admin.html o via Firebase Console
{
  title: "Concerto Jazz al Fico",
  category: "Musica",
  date: "2026-02-15",
  location: "Fico - Vico Lungo Teatro Nuovo, Napoli",
  coordinates: { lat: 40.8467, lng: 14.2514 },
  tags: ["#jazz", "#live", "#gratis"],
  poster: "https://i.ibb.co/xxx/poster.jpg", // opzionale
  whatsappLink: "https://chat.whatsapp.com/xxx" // opzionale
}
```

### Aggiungere una categoria

1. Modifica `js/config/constants.js`:
```javascript
export const EVENT_CATEGORY_ICONS = {
  // ...esistenti
  'Fotografia': '📷'
};
```

2. Aggiungi entry in Firestore collection `categories`:
```json
{
  "id": "fotografia",
  "name": "Fotografia",
  "icon": "📷",
  "color": "#10b981",
  "whatsappLink": "https://chat.whatsapp.com/xxx"
}
```

### Debug

Apri console browser (F12) per vedere:
```
🚀 Initializing Espedienti modules...
✅ StateManager initialized
✅ EventBus initialized
📥 Loading application data...
✅ All data loaded
✅ Espedienti initialized successfully!
```

Ispeziona stato:
```javascript
// In console
window.debugState = state;
debugState.get('filteredEvents');
debugState.get('map');
```

## 🧪 Testing

```bash
# Unit tests (da implementare con Vitest)
npm test

# E2E tests (da implementare con Playwright)
npm run test:e2e
```

## 📦 Build & Deploy

### Development
```bash
# Serve locale
npm run dev
```

### Production
```bash
# Build (opzionale con Vite)
npm run build

# Deploy Firebase Hosting
firebase deploy --only hosting
```

## 🤝 Contribuire

1. Fork del progetto
2. Crea branch feature: `git checkout -b feature/nome-feature`
3. Commit modifiche: `git commit -m 'feat: descrizione'`
4. Push: `git push origin feature/nome-feature`
5. Apri Pull Request

### Commit Convention

Usa [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nuova funzionalità
- `fix:` Bug fix
- `docs:` Documentazione
- `style:` Formattazione
- `refactor:` Refactoring
- `test:` Test
- `chore:` Manutenzione

## 📄 Licenza

MIT License - vedi [LICENSE](LICENSE)

## 👥 Autori

- **Simone Esposito** - *Initial work & Design*
- **Claude Code** - *Architecture & Refactoring*

## 🙏 Ringraziamenti

- [Leaflet.js](https://leafletjs.com/) - Mappa interattiva
- [Firebase](https://firebase.google.com/) - Backend & Hosting
- [Nominatim](https://nominatim.org/) - Geocoding
- [ImgBB](https://imgbb.com/) - Image hosting
- Community di Napoli 💜

## 📞 Contatti

- 🌐 Website: [espedienti.napoli](https://espedienti.napoli)
- 💬 WhatsApp Community: [Link gruppo](https://chat.whatsapp.com/xxx)

---

**Fatto con ❤️ a Napoli**