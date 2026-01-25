# 🔥 Configurazione Firebase per Espedienti per incontrarsi

## Panoramica
Il progetto è stato aggiornato per utilizzare Firebase Firestore come database in tempo reale. Questo elimina la necessità di scaricare/caricare file JSON manualmente.

## Funzionalità
- ✅ Salvataggio automatico su cloud quando aggiungi eventi/luoghi da admin.html
- ✅ Caricamento automatico da cloud su index.html
- ✅ Aggiornamenti in tempo reale: la pagina principale si aggiorna automaticamente quando aggiungi nuovi contenuti
- ✅ Fallback ai file JSON locali se Firebase non è configurato

---

## 📋 Passo 1: Crea un progetto Firebase

1. Vai su [Firebase Console](https://console.firebase.google.com/)
2. Clicca su "Aggiungi progetto" o "Create a project"
3. Inserisci il nome del progetto (es. "espedienti-napoli")
4. Disabilita Google Analytics (opzionale, non necessario per questo progetto)
5. Clicca su "Crea progetto"

---

## 📋 Passo 2: Configura Firestore Database

1. Nel menu laterale, vai su **Build** → **Firestore Database**
2. Clicca su "Crea database"
3. Seleziona **modalità di produzione** (Production mode)
4. Scegli la posizione del database (consigliato: `europe-west3` per l'Europa)
5. Clicca su "Attiva"

---

## 📋 Passo 3: Configura le regole di sicurezza

Dopo aver creato il database, vai su **Regole** (Rules) e sostituisci il contenuto con:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permetti lettura pubblica per eventi e luoghi
    match /events/{document=**} {
      allow read: if true;
      allow write: if true; // ATTENZIONE: in produzione proteggi con autenticazione
    }

    match /places/{document=**} {
      allow read: if true;
      allow write: if true; // ATTENZIONE: in produzione proteggi con autenticazione
    }
  }
}
```

⚠️ **IMPORTANTE**: Queste regole permettono a chiunque di leggere E scrivere. Per un ambiente di produzione, dovresti:
- Aggiungere Firebase Authentication
- Limitare le scritture solo agli utenti autenticati
- Esempio regola più sicura: `allow write: if request.auth != null;`

Clicca su "Pubblica" per salvare le regole.

---

## 📋 Passo 4: Ottieni le credenziali

1. Nel menu laterale, clicca sull'icona ingranaggio ⚙️ e poi su **Impostazioni progetto**
2. Scorri in basso fino a "Le tue app"
3. Clicca sull'icona `</>` (Web app)
4. Inserisci il nickname dell'app (es. "web-app")
5. **NON** selezionare "Firebase Hosting" per ora
6. Clicca su "Registra app"
7. Copia l'oggetto `firebaseConfig` che appare

Dovrebbe assomigliare a questo:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyABC123...",
  authDomain: "espedienti-napoli.firebaseapp.com",
  projectId: "espedienti-napoli",
  storageBucket: "espedienti-napoli.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

---

## 📋 Passo 5: Aggiorna i file del progetto

### File 1: index.html

Apri [index.html](index.html) e cerca la sezione Firebase SDK (circa riga 10-30).

Sostituisci i valori placeholder con i tuoi:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",              // ← Sostituisci con il tuo valore
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",  // ← Sostituisci
    projectId: "YOUR_PROJECT_ID",        // ← Sostituisci
    storageBucket: "YOUR_PROJECT_ID.appspot.com",  // ← Sostituisci
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",  // ← Sostituisci
    appId: "YOUR_APP_ID"                 // ← Sostituisci
};
```

### File 2: admin.html

Apri [admin.html](admin.html) e fai la stessa cosa nella sezione Firebase SDK.

⚠️ **IMPORTANTE**: Usa esattamente gli stessi valori in entrambi i file!

---

## 📋 Passo 6: Testa la configurazione

1. Apri [admin.html](admin.html) nel browser
2. Se vedi l'avviso giallo "Firebase non è ancora configurato", significa che c'è un errore nella configurazione
3. Apri la **Console del browser** (F12 → Console) per vedere gli errori
4. Aggiungi un evento o luogo di test
5. Se vedi "✅ Evento salvato su Firebase!", la configurazione è corretta
6. Vai su Firebase Console → Firestore Database per vedere i dati salvati

---

## 📋 Passo 7: Verifica aggiornamenti real-time

1. Apri [index.html](index.html) in una finestra del browser
2. Apri [admin.html](admin.html) in un'altra finestra
3. Aggiungi un evento da admin.html
4. Entro 1-2 secondi, dovresti vederlo apparire automaticamente su index.html
5. Se vedi nella console "🔄 Aggiornamento eventi in tempo reale", funziona!

---

## 🔧 Risoluzione problemi

### Errore: "Firebase: Error (auth/invalid-api-key)"
- Hai copiato male l'API key
- Controlla che non ci siano spazi extra all'inizio/fine

### Errore: "Missing or insufficient permissions"
- Le regole di Firestore sono troppo restrittive
- Vai su Firestore → Regole e usa le regole del Passo 3

### Non vedo gli eventi su index.html
- Controlla la Console del browser (F12)
- Verifica che Firebase sia configurato sia su index.html che su admin.html
- Assicurati che la configurazione sia identica in entrambi i file

### Gli aggiornamenti real-time non funzionano
- Controlla la Console del browser per messaggi di errore
- Gli aggiornamenti partono 1 secondo dopo il caricamento della pagina
- Prova a ricaricare la pagina

---

## 📦 Migrazione dei dati esistenti

Se hai già eventi/luoghi nei file JSON:

1. Apri [admin.html](admin.html)
2. Apri la Console del browser (F12)
3. Incolla e esegui questo script per migrare gli eventi:

```javascript
// Carica events.json
fetch('events.json')
  .then(r => r.json())
  .then(async events => {
    for (const event of events) {
      await window.firestoreModules.addDoc(
        window.firestoreModules.collection(window.db, 'events'),
        event
      );
    }
    console.log('✅ Eventi migrati!');
  });
```

4. Ripeti per i luoghi sostituendo `'events.json'` con `'places.json'` e `'events'` con `'places'`

---

## 🎉 Completato!

Ora puoi:
- Aggiungere eventi/luoghi da admin.html → vengono salvati automaticamente su Firebase
- Visualizzare eventi/luoghi su index.html → vengono caricati automaticamente da Firebase
- Vedere gli aggiornamenti in tempo reale senza ricaricare la pagina

I file events.json e places.json sono ora opzionali e servono solo come fallback se Firebase non è raggiungibile.
