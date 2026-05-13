import { createRoot } from 'react-dom/client';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { Navbar } from './components/Navbar.jsx';

// Mount React navbar
const root = document.getElementById('navbar-root');
if (root) {
  createRoot(root).render(
    <AuthProvider>
      <Navbar />
    </AuthProvider>
  );
}

// Inject auth modal shell (filled later by authRenderer)
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

// Initialize auth modal functionality (login/register forms)
import('../js/auth/auth-service.js')
  .then(({ authService }) => authService.initialize())
  .then(() => import('../js/ui/auth-renderer.js'))
  .then(({ authRenderer }) => authRenderer.initialize())
  .catch(e => console.warn('Auth modal init failed:', e));
