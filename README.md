# 🎭 Espedienti per incontrarsi

Piattaforma per scoprire eventi e incontrare persone nuove

## 📁 Struttura del Progetto

```
espedienti-per-incontrarsi/
├── index.html          # Pagina principale del sito
├── events.json         # Database degli eventi
├── admin.html          # Pannello di gestione (solo locale)
└── README.md           # Questo file
```

## 🚀 Come Pubblicare su GitHub Pages

### 1. Crea un Repository su GitHub

1. Vai su [GitHub](https://github.com) e crea un nuovo repository
2. Chiamalo ad esempio `espedienti-per-incontrarsi`
3. Lascialo pubblico

### 2. Carica i File

Carica questi 3 file nel repository:
- `index.html`
- `events.json`
- `README.md`

**NON caricare `admin.html` su GitHub** (tienilo solo in locale)

### 3. Attiva GitHub Pages

1. Vai nelle Settings del repository
2. Cerca la sezione "Pages" nel menu laterale
3. In "Source" seleziona "main" branch
4. Clicca "Save"
5. Dopo qualche minuto il sito sarà online su: `https://tuousername.github.io/espedienti-per-incontrarsi/`

## ✏️ Come Aggiungere Nuovi Eventi

### Metodo 1: Usando il Pannello Admin (CONSIGLIATO)

1. Apri `admin.html` nel tuo browser (doppio click sul file)
2. Compila il form con i dettagli dell'evento
3. Per le coordinate usa [latlong.net](https://www.latlong.net/)
4. Per caricare le locandine usa [Imgur](https://imgur.com/)
5. Clicca "Aggiungi Evento"
6. Quando hai finito, clicca "Scarica events.json"
7. Sostituisci il file `events.json` nel repository con quello scaricato
8. Fai commit e push su GitHub

### Metodo 2: Modificando Manualmente il JSON

Apri `events.json` e aggiungi un nuovo evento seguendo questa struttura:

```json
{
  "id": 5,
  "title": "Nome Evento",
  "date": "2024-11-15",
  "location": "Luogo dell'evento",
  "coordinates": {
    "lat": 40.8359,
    "lng": 14.2489
  },
  "whatsappLink": "https://chat.whatsapp.com/...",
  "tags": ["#tag1", "#tag2"],
  "poster": "https://... (opzionale)"
}
```

**IMPORTANTE:** 
- Gli ID devono essere univoci
- Le date devono essere nel formato YYYY-MM-DD
- I tag devono iniziare con #

## 🔧 Aggiornare il Sito

Dopo aver modificato `events.json`:

```bash
git add events.json
git commit -m "Aggiunto nuovo evento"
git push
```

Il sito si aggiornerà automaticamente in pochi minuti!

## 🗺️ Come Trovare le Coordinate

1. Vai su [latlong.net](https://www.latlong.net/)
2. Cerca l'indirizzo del luogo
3. Copia latitudine e longitudine

## 🖼️ Come Caricare le Locandine

1. Vai su [Imgur](https://imgur.com/)
2. Carica l'immagine
3. Clicca con il tasto destro sull'immagine caricata
4. Seleziona "Copia indirizzo immagine"
5. Incolla il link nel campo "poster"

## 💬 Link WhatsApp

Per creare un link di invito a un gruppo WhatsApp:
1. Apri il gruppo WhatsApp
2. Tocca il nome del gruppo in alto
3. Vai su "Invita tramite link"
4. Copia il link

## 🛠️ Manutenzione

### Backup
Fai sempre un backup del file `events.json` prima di fare modifiche importanti.

### Testare in Locale
Per testare il sito in locale prima di pubblicarlo:
1. Usa un server locale (es. Python: `python -m http.server`)
2. Oppure usa estensioni browser come "Live Server" in VS Code

### Risolvere Problemi

**Il sito non si aggiorna?**
- Aspetta 5-10 minuti dopo il push
- Svuota la cache del browser (Ctrl+Shift+R)
- Controlla che GitHub Pages sia attivo nelle Settings

**Gli eventi non si caricano?**
- Verifica che `events.json` sia valido usando [jsonlint.com](https://jsonlint.com/)
- Controlla la console del browser (F12) per errori

**La mappa non funziona?**
- Verifica di avere connessione internet
- La libreria Leaflet viene caricata da CDN

## 📱 Funzionalità del Sito

- 📅 Calendario interattivo
- 🗺️ Mappa con OpenStreetMap
- 🔍 Ricerca per titolo, data, luogo e tag
- 🏷️ Filtro per tag
- 📍 Filtro per location (click sulla mappa)
- 📆 Filtro per data (click sul calendario)
- 🖼️ Visualizzazione locandine
- ➕ Aggiunta eventi a Google Calendar
- 💬 Link diretti alle chat WhatsApp

## 🔒 Sicurezza

La pagina `admin.html`:
- NON va caricata su GitHub
- Funziona solo in locale
- Salva i dati nel localStorage del browser
- È sicura perché non è accessibile online

## 📞 Supporto

Per problemi o domande, consulta la documentazione di:
- [GitHub Pages](https://docs.github.com/pages)
- [Leaflet.js](https://leafletjs.com/)
- [OpenStreetMap](https://www.openstreetmap.org/)

## 🎨 Personalizzazione

Puoi personalizzare:
- Colori nel CSS (cerca `#667eea` e `#764ba2`)
- Testi nelle sezioni Hero e Features
- Logo (emoji 🎭 nell'header)
- Link alla community WhatsApp generale

## 📊 Statistiche

Il sito è:
- ✅ Completamente statico (nessun server necessario)
- ✅ Gratis (GitHub Pages è gratuito)
- ✅ Veloce (solo HTML, CSS, JS)
- ✅ Responsive (funziona su mobile)
- ✅ SEO-friendly

## 🚀 Workflow Consigliato

1. **Aggiungi eventi** usando `admin.html`
2. **Scarica** il file `events.json`
3. **Sostituisci** il file nel repository
4. **Push** su GitHub
5. **Verifica** il sito dopo 5 minuti

## 📝 Licenza

Progetto personale - Usa come preferisci!

---

**Fatto con ❤️ per la community**