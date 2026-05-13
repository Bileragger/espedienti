import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { SPAContext } from './contexts/SPAContext.jsx';
import { Navbar } from './components/Navbar.jsx';
import { Home } from './pages/Home.jsx';
import { About } from './pages/About.jsx';
import { Contatti } from './pages/Contatti.jsx';

// Inject auth modal shell once (authRenderer.initialize() renders into #authContent)
if (!document.getElementById('authModal')) {
  const modal = document.createElement('div');
  modal.id        = 'authModal';
  modal.className = 'modal auth-modal';
  modal.setAttribute('onclick', 'window.closeAuthModal && window.closeAuthModal()');
  modal.innerHTML =
    '<div class="auth-modal-content" onclick="event.stopPropagation()">' +
      '<div class="auth-modal-header">' +
        '<h2><i data-lucide="user"></i><span id="authModalTitle" data-i18n="auth.title">Accedi</span></h2>' +
        '<button type="button" class="auth-modal-close" onclick="window.closeAuthModal && window.closeAuthModal()">&times;</button>' +
      '</div>' +
      '<div class="auth-modal-body" id="authContent"></div>' +
    '</div>';
  document.body.appendChild(modal);
}

function App() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <AuthProvider>
      <Navbar />
      {/* Home stays mounted to keep vanilla-JS state + Leaflet map alive */}
      <Home hidden={!isHome} />
      <Routes>
        <Route path="/about"    element={<About />} />
        <Route path="/contatti" element={<Contatti />} />
      </Routes>
    </AuthProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <SPAContext.Provider value={true}>
    <HashRouter>
      <App />
    </HashRouter>
  </SPAContext.Provider>
);
