import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { SPAContext } from './contexts/SPAContext.jsx';
import { Navbar } from './components/Navbar.jsx';
import { AuthModal } from './components/AuthModal.jsx';
import { DetailModal } from './components/DetailModal.jsx';
import { Home } from './pages/Home.jsx';
import { About } from './pages/About.jsx';
import { Contatti } from './pages/Contatti.jsx';

function App() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <AuthProvider>
      <Navbar />
      <AuthModal />
      <DetailModal />
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
