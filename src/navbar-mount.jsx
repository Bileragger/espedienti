import { createRoot } from 'react-dom/client';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { Navbar } from './components/Navbar.jsx';
import { AuthModal } from './components/AuthModal.jsx';

const root = document.getElementById('navbar-root');
if (root) {
  createRoot(root).render(
    <AuthProvider>
      <Navbar />
      <AuthModal />
    </AuthProvider>
  );
}
