// Shared navbar module — imported on every page.
// navbar-inline.js (sync) handles HTML injection.
// This module handles auth state + full auth modal on every page.

import './navbar-auth.js';
import { authService } from '../auth/auth-service.js';
import { authRenderer } from './auth-renderer.js';

// Skip legacy renderer when the React AuthModal is mounted (it owns window.openAuthModal)
authService.initialize().then(() => {
  if (!window.__reactAuthModal) authRenderer.initialize();
});
