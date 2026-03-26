/**
 * Translations - Italian and English UI strings
 */

export const translations = {
  it: {
    // Navigation
    'nav.project': 'Il Progetto',
    'nav.contacts': 'Contatti',
    'nav.home': 'Home',
    'nav.features': 'Funzionalità',

    // Hero
    'hero.title': 'Cosa facciamo oggi a Napoli?',
    'hero.subtitle.default': 'Events, luoghi e persone',
    'hero.btn.map': '🗺️ Esplora la mappa',
    'hero.btn.calendar': '📅 Vedi calendario',
    'hero.btn.community': '💬 Community',
    'hero.subtitles': [
      "Cosa c'è da fare stanotte?",
      'Napoli non smette mai di sorprenderti.',
      'Scegli come vivere la città.',
      'Ogni angolo ha qualcosa da raccontare.',
      'Dai un senso alla serata.',
      'Un posto per ogni umore.',
      'Lasciati trascinare dalla città.',
      "C'è sempre qualcosa che non sapevi.",
      'La città è tua — esplorala.',
      'Partenope ti aspetta fuori.',
    ],

    // Main section
    'section.explore': 'Esplora gli eventi ed i luoghi di Napoli',

    // Local warning
    'warning.local.title': '⚠️ Modalità Locale Rilevata',
    'warning.local.body': 'Stai visualizzando il sito dal file system. Gli eventi mostrati sono di esempio.',
    'warning.local.hint': 'Per vedere i tuoi eventi, usa un server locale:',

    // Search
    'search.placeholder': '🔍 Cerca per nome evento, data (YYYY-MM-DD), nome luogo o #tag',

    // Mobile tabs
    'tabs.calendar': '📅 Calendario',
    'tabs.map': '🗺️ Mappa',

    // Event filters
    'filters.events.title': 'Che tipo di eventi cerchi?',
    'filters.all': 'Tutti',
    'filters.live-music': '🎵 Live Music',
    'filters.open-mic': '🎤 Open Mic',
    'filters.concerto': '🎸 Concerti',
    'filters.spettacolo-teatrale': '🎭 Teatro',
    'filters.mostra': '🖼️ Mostre',
    'filters.workshop': '🛠️ Workshop',
    'filters.fiera': '🎪 Fiere',
    'filters.altro': 'Altro',

    // Place filters
    'filters.places.title': 'Che tipo di location cerchi?',
    'filters.museo': '🏛️ Musei',
    'filters.galleria': '🖼️ Gallerie',
    'filters.parco': '🌳 Parchi',
    'filters.biblioteca': '📚 Biblioteche',
    'filters.teatro': '🎭 Teatri',
    'filters.coworking': '💼 Coworking',
    'filters.ristorante': '🍽️ Ristoranti',
    'filters.centro-sociale': '🤝 Centri Sociali',
    'filters.fondazione': '🏢 Fondazioni',

    // Calendar card
    'calendar.title': '📅 Calendario Eventi',

    // Map card
    'map.title': '🗺️ Mappa luoghi ed eventi',
    'map.locate': '📍 Dove sono',
    'map.openNow': '🕐 Aperti ora',
    'map.locate.title': 'Trova la mia posizione',
    'map.openNow.title': 'Mostra solo luoghi aperti ora',
    'map.fullscreen.title': 'Schermo intero',

    // Unified list
    'list.title': 'La Tua Ricerca',
    'list.title.full': (events, places) => `La Tua Ricerca (${events} eventi, ${places} luoghi)`,
    'list.section.events': '📅 Eventi',
    'list.section.places': '🏛️ Luoghi',
    'list.empty': 'Nessun risultato trovato.',
    'list.pagination.prev': '← Prec',
    'list.pagination.next': 'Succ →',
    'list.pagination.info': (current, total) => `Pagina ${current} di ${total}`,

    // List item buttons
    'item.poster': '🖼️ Vedi locandina',
    'item.details': '📄 Maggiori dettagli',
    'item.placeDetails': '📄 Dettagli',
    'item.directions': '🧭 Indicazioni',
    'item.website': '🌐 Sito Web',
    'item.addCalendar': '➕ Aggiungi',
    'item.chat': '💬 Chat',
    'item.hours': '🕐 Orari',
    'item.image': '🖼️ Immagine',
    'item.showOnMap': '🗺️ Mostra su mappa',
    'item.openingHours': 'Orari di apertura',

    // Quick filters / search info
    'quickfilter.today': '📅 Eventi di oggi',
    'quickfilter.reset': '🔄 Reset filtri',
    'quickfilter.hint': '💡 <strong>Suggerimento:</strong> Clicca su un giorno del calendario o su un marker nella mappa per filtrare gli eventi.',

    // Community section
    'community.title': '💬 Community per Interessi',
    'community.description': 'Unisciti alle chat WhatsApp organizzate per interesse! Trova persone con le tue stesse passioni e organizzatevi per partecipare insieme agli eventi.',
    'community.general.label': 'Community Generale',
    'community.general.desc': 'Per chi vuole conoscere persone nuove e scoprire tutti i tipi di eventi',
    'community.general.btn': 'Unisciti alla Community Generale',
    'community.wip.title': 'Work in Progress',
    'community.wip.text': 'Stiamo lavorando alla community! Presto potrai unirti alle chat di gruppo organizzate per interesse.',

    // Footer
    'footer.tagline': 'Una piattaforma per scoprire eventi e conoscere persone nuove',
    'footer.copy': '© 2026 - Fatto con ❤️ per la community',

    // Alerts
    'alert.noEventsToday': "Nessun evento in programma oggi 😔\nProva a guardare i prossimi giorni!",
    'alert.noOpenPlaces': 'Nessun luogo aperto in questo momento.',

    // About page
    'about.title': 'Chi Siamo',
    'about.hero.desc': "Espedienti a Napoli nasce con l'obiettivo di abbattere le barriere culturali e tecnologiche, rendendo semplice scoprire cosa succede nella tua città e trovare compagni di avventure",
    'about.mission.title': 'La Nostra Mission',
    'about.mission.p1': "In un'epoca dove la tecnologia può allontanare le persone, crediamo che possa anche avvicinarle. Espedienti è la piattaforma che trasforma la scoperta di eventi culturali in un'esperienza sociale.",
    'about.mission.p2': 'Che tu sia appena arrivato in città o viva qui da sempre, vogliamo aiutarti a scoprire nuove esperienze e incontrare persone con interessi simili ai tuoi.',
    'about.howItWorks': 'Come Funziona',
    'about.feature1.title': 'Calendario Condiviso',
    'about.feature1.desc': 'Visualizza tutti gli eventi della tua città in un unico calendario. Mai più occasioni perse!',
    'about.feature2.title': 'Mappa Interattiva',
    'about.feature2.desc': 'Scopri eventi vicino a te con la nostra mappa. Clicca sui marker per vedere i dettagli.',
    'about.feature3.title': 'Trova Compagni',
    'about.feature3.desc': 'Usa le chat per organizzarti con altre persone e partecipare insieme agli eventi.',
    'about.feature4.title': 'Aggiungi al Tuo Calendario',
    'about.feature4.desc': 'Con un click aggiungi gli eventi che ti interessano al tuo Google Calendar personale.',
    'about.feature5.title': 'Chat per Interessi',
    'about.feature5.desc': 'Community organizzate per tema: musica, teatro, mostre e altro ancora.',
    'about.feature6.title': 'Sempre Aggiornato',
    'about.feature6.desc': 'Iscriviti alla newsletter per ricevere aggiornamenti su nuovi eventi e funzionalità.',
    'about.newsletter.title': '📬 Resta aggiornato',
    'about.newsletter.desc': 'Iscriviti alla newsletter per ricevere notifiche sui nuovi eventi e aggiornamenti sulla piattaforma',
    'about.newsletter.placeholder': 'Il tuo indirizzo email',
    'about.newsletter.btn': 'Iscriviti',
    'about.newsletter.error': '⚠️ Inserisci un indirizzo email valido.',
    'about.newsletter.success': '✅ Grazie per esserti iscritto! Riceverai presto aggiornamenti sui nuovi eventi.',
    'about.newsletter.loading': '⏳ Iscrizione...',
    'about.newsletter.alertError': "Errore durante l'iscrizione. Riprova più tardi.",
    'about.contacts.title': 'Contatti',
    'about.contacts.p1': 'Hai una segnalazione di bug, vuoi collaborare al progetto o proporre nuovi eventi?',
    'about.contacts.p2': 'Scrivici direttamente via email!',
    'about.contacts.bug': '🐛 Segnala Bug',
    'about.contacts.collab': '✉️ Collabora',
    'about.cta.title': 'Inizia Subito',
    'about.cta.desc': 'Scopri cosa succede oggi a Napoli e trova nuovi compagni di avventure!',
    'about.cta.btn': 'Esplora Gli Eventi',
    'about.footer.tagline': 'Una piattaforma per scoprire eventi e incontrare persone',
    'about.footer.chiSiamo': 'Chi Siamo',

    // Open/closed status
    'status.open': 'aperto',
    'status.closed': 'chiuso',

    // Language toggle
    'lang.toggle': 'EN',
  },

  en: {
    // Navigation
    'nav.project': 'The Project',
    'nav.contacts': 'Contacts',
    'nav.home': 'Home',
    'nav.features': 'Features',

    // Hero
    'hero.title': "What are we doing today in Naples?",
    'hero.subtitle.default': 'Events, places and people',
    'hero.btn.map': '🗺️ Explore the map',
    'hero.btn.calendar': '📅 View calendar',
    'hero.btn.community': '💬 Community',
    'hero.subtitles': [
      "What's there to do tonight?",
      'Naples never stops surprising you.',
      'Choose how to experience the city.',
      'Every corner has a story to tell.',
      'Make the evening count.',
      'A place for every mood.',
      'Let the city carry you away.',
      "There's always something you didn't know.",
      'The city is yours — explore it.',
      'Parthenope is waiting outside.',
    ],

    // Main section
    'section.explore': 'Explore events and places in Naples',

    // Local warning
    'warning.local.title': '⚠️ Local Mode Detected',
    'warning.local.body': 'You are viewing the site from the file system. The events shown are examples.',
    'warning.local.hint': 'To see your events, use a local server:',

    // Search
    'search.placeholder': '🔍 Search by event name, date (YYYY-MM-DD), place name or #tag',

    // Mobile tabs
    'tabs.calendar': '📅 Calendar',
    'tabs.map': '🗺️ Map',

    // Event filters
    'filters.events.title': 'What kind of events are you looking for?',
    'filters.all': 'All',
    'filters.live-music': '🎵 Live Music',
    'filters.open-mic': '🎤 Open Mic',
    'filters.concerto': '🎸 Concerts',
    'filters.spettacolo-teatrale': '🎭 Theatre',
    'filters.mostra': '🖼️ Exhibitions',
    'filters.workshop': '🛠️ Workshop',
    'filters.fiera': '🎪 Fairs',
    'filters.altro': 'Other',

    // Place filters
    'filters.places.title': 'What kind of venue are you looking for?',
    'filters.museo': '🏛️ Museums',
    'filters.galleria': '🖼️ Galleries',
    'filters.parco': '🌳 Parks',
    'filters.biblioteca': '📚 Libraries',
    'filters.teatro': '🎭 Theatres',
    'filters.coworking': '💼 Coworking',
    'filters.ristorante': '🍽️ Restaurants',
    'filters.centro-sociale': '🤝 Social Centres',
    'filters.fondazione': '🏢 Foundations',

    // Calendar card
    'calendar.title': '📅 Events Calendar',

    // Map card
    'map.title': '🗺️ Map of places and events',
    'map.locate': '📍 Where am I',
    'map.openNow': '🕐 Open now',
    'map.locate.title': 'Find my location',
    'map.openNow.title': 'Show only places open now',
    'map.fullscreen.title': 'Full screen',

    // Unified list
    'list.title': 'Your Search',
    'list.title.full': (events, places) => `Your Search (${events} events, ${places} places)`,
    'list.section.events': '📅 Events',
    'list.section.places': '🏛️ Places',
    'list.empty': 'No results found.',
    'list.pagination.prev': '← Prev',
    'list.pagination.next': 'Next →',
    'list.pagination.info': (current, total) => `Page ${current} of ${total}`,

    // List item buttons
    'item.poster': '🖼️ View poster',
    'item.details': '📄 More details',
    'item.placeDetails': '📄 Details',
    'item.directions': '🧭 Directions',
    'item.website': '🌐 Website',
    'item.addCalendar': '➕ Add',
    'item.chat': '💬 Chat',
    'item.hours': '🕐 Hours',
    'item.image': '🖼️ Image',
    'item.showOnMap': '🗺️ Show on map',
    'item.openingHours': 'Opening hours',

    // Quick filters / search info
    'quickfilter.today': "📅 Today's events",
    'quickfilter.reset': '🔄 Reset filters',
    'quickfilter.hint': '💡 <strong>Tip:</strong> Click a day on the calendar or a marker on the map to filter events.',

    // Community section
    'community.title': '💬 Interest Communities',
    'community.description': 'Join WhatsApp chats organised by interest! Find people who share your passions and plan to attend events together.',
    'community.general.label': 'General Community',
    'community.general.desc': 'For those who want to meet new people and discover all kinds of events',
    'community.general.btn': 'Join the General Community',
    'community.wip.title': 'Work in Progress',
    'community.wip.text': "We're working on the community! You'll soon be able to join interest-based group chats.",

    // Footer
    'footer.tagline': 'A platform to discover events and meet new people',
    'footer.copy': '© 2026 - Made with ❤️ for the community',

    // Alerts
    'alert.noEventsToday': "No events scheduled today 😔\nTry looking at the next few days!",
    'alert.noOpenPlaces': 'No places open at the moment.',

    // About page
    'about.title': 'About Us',
    'about.hero.desc': 'Espedienti a Napoli was born with the goal of breaking down cultural and technological barriers, making it easy to discover what\'s happening in your city and find adventure companions',
    'about.mission.title': 'Our Mission',
    'about.mission.p1': "In an era where technology can distance people, we believe it can also bring them closer together. Espedienti is the platform that turns the discovery of cultural events into a social experience.",
    'about.mission.p2': 'Whether you just arrived in the city or have lived here forever, we want to help you discover new experiences and meet people with similar interests.',
    'about.howItWorks': 'How It Works',
    'about.feature1.title': 'Shared Calendar',
    'about.feature1.desc': 'View all events in your city in one calendar. Never miss an occasion again!',
    'about.feature2.title': 'Interactive Map',
    'about.feature2.desc': 'Discover events near you with our map. Click on markers to see the details.',
    'about.feature3.title': 'Find Companions',
    'about.feature3.desc': 'Use the chats to organise with other people and attend events together.',
    'about.feature4.title': 'Add to Your Calendar',
    'about.feature4.desc': 'With one click add the events you like to your personal Google Calendar.',
    'about.feature5.title': 'Interest Chats',
    'about.feature5.desc': 'Communities organised by theme: music, theatre, exhibitions and more.',
    'about.feature6.title': 'Always Up to Date',
    'about.feature6.desc': 'Subscribe to the newsletter to receive updates on new events and features.',
    'about.newsletter.title': '📬 Stay updated',
    'about.newsletter.desc': 'Subscribe to the newsletter to receive notifications about new events and platform updates',
    'about.newsletter.placeholder': 'Your email address',
    'about.newsletter.btn': 'Subscribe',
    'about.newsletter.error': '⚠️ Please enter a valid email address.',
    'about.newsletter.success': '✅ Thank you for subscribing! You will soon receive updates on new events.',
    'about.newsletter.loading': '⏳ Subscribing...',
    'about.newsletter.alertError': 'Error during subscription. Please try again later.',
    'about.contacts.title': 'Contacts',
    'about.contacts.p1': 'Do you have a bug report, want to collaborate on the project or suggest new events?',
    'about.contacts.p2': 'Write to us directly by email!',
    'about.contacts.bug': '🐛 Report Bug',
    'about.contacts.collab': '✉️ Collaborate',
    'about.cta.title': 'Get Started',
    'about.cta.desc': 'Discover what\'s happening today in Naples and find new adventure companions!',
    'about.cta.btn': 'Explore Events',
    'about.footer.tagline': 'A platform to discover events and meet people',
    'about.footer.chiSiamo': 'About Us',

    // Open/closed status
    'status.open': 'open',
    'status.closed': 'closed',

    // Language toggle
    'lang.toggle': 'IT',
  },
};
