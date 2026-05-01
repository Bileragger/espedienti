// Shared navbar module — imported on every page.
// navbar-inline.js (sync) handles HTML injection.
// This module handles auth state + full auth modal on every page.

import './navbar-auth.js';
import { authService } from '../auth/auth-service.js';
import { authRenderer } from './auth-renderer.js';

// Initialize auth modal on every page (authService has its own _initialized guard)
authService.initialize().then(() => {
  authRenderer.initialize();
});
