(function () {
  // Inject shared auth-modal CSS (once)
  if (!document.getElementById('authModalCss')) {
    var link = document.createElement('link');
    link.id   = 'authModalCss';
    link.rel  = 'stylesheet';
    link.href = 'js/ui/auth-modal.css';
    document.head.appendChild(link);
  }
  var path = window.location.pathname;
  var activeNav =
    path.endsWith('about.html')    ? 'project'  :
    path.endsWith('contatti.html') ? 'contacts' :
    path.endsWith('admin.html')    ? 'admin'     : null;

  var header = document.createElement('header');
  header.innerHTML = [
    '<div class="header-content">',
      '<div class="logo"><a href="index.html">Espedienti a Napoli</a></div>',
      '<button type="button" class="hamburger" id="hamburgerBtn"',
        ' onclick="document.getElementById(\'mobileMenu\').classList.toggle(\'open\')"',
        ' aria-label="Menu">☰</button>',
      '<nav class="nav-links">',
        '<a href="about.html" data-i18n="nav.project" data-nav="project">Il Progetto</a>',
        '<a href="contatti.html" data-i18n="nav.contacts" data-nav="contacts">Contatti</a>',
        '<a href="admin.html" id="adminNavLink" class="admin-nav-link" style="display:none;" data-nav="admin">',
          '<i data-lucide="settings"></i><span data-i18n="nav.admin">Admin</span>',
        '</a>',
        '<button type="button" id="authNavBtn" class="auth-nav-btn"',
          ' onclick="window.openAuthModal && window.openAuthModal()">',
          '<i data-lucide="user"></i><span id="authNavLabel" data-i18n="auth.tab.login">Accedi</span>',
        '</button>',
        '<button type="button" id="langToggleBtn" class="lang-toggle-btn"',
          ' onclick="window.i18n && window.i18n.toggle()">EN</button>',
      '</nav>',
      '<nav class="mobile-menu" id="mobileMenu">',
        '<a href="about.html" data-i18n="nav.project" data-nav="project">Il Progetto</a>',
        '<a href="contatti.html" data-i18n="nav.contacts" data-nav="contacts">Contatti</a>',
        '<a href="admin.html" id="adminNavLinkMobile" class="admin-nav-link" style="display:none;" data-nav="admin">',
          '<i data-lucide="settings"></i><span data-i18n="nav.admin">Admin</span>',
        '</a>',
        '<button type="button" class="auth-nav-btn"',
          ' onclick="window.openAuthModal && window.openAuthModal()">',
          '<i data-lucide="user"></i><span data-i18n="auth.tab.login">Accedi</span>',
        '</button>',
        '<button type="button" class="lang-toggle-btn"',
          ' onclick="window.i18n && window.i18n.toggle()">EN</button>',
      '</nav>',
    '</div>'
  ].join('');

  // Insert the header right after this <script> tag
  document.currentScript.insertAdjacentElement('afterend', header);

  // Highlight active link
  if (activeNav) {
    header.querySelectorAll('[data-nav="' + activeNav + '"]').forEach(function (el) {
      el.classList.add('active');
    });
  }

  // Admin page: show admin links immediately (only admins can reach this page)
  if (activeNav === 'admin') {
    ['adminNavLink', 'adminNavLinkMobile'].forEach(function (id) {
      var el = header.querySelector('#' + id);
      if (el) el.style.display = 'flex';
    });
  }

  // ── Optimistic auth state from sessionStorage ─────────────────────────────
  // Firebase onAuthStateChanged is async (~300-500ms). Reading the cached state
  // here (sync, at paint time) makes auth UI appear instantly on repeat visits.
  try {
    var cached = JSON.parse(sessionStorage.getItem('navAuth') || 'null');
    if (cached && cached.name) {
      var btn   = header.querySelector('#authNavBtn');
      var label = header.querySelector('#authNavLabel');
      if (label) {
        label.textContent = cached.name;
        label.removeAttribute('data-i18n'); // prevent i18n from overwriting the username
      }
      if (btn) {
        btn.classList.add('logged-in');
        btn.removeAttribute('data-i18n');
      }

      if (cached.isAdmin) {
        ['adminNavLink', 'adminNavLinkMobile'].forEach(function (id) {
          var el = header.querySelector('#' + id);
          if (el) el.style.display = 'flex';
        });
      }
    }
  } catch (_) { /* sessionStorage unavailable (private mode edge case) */ }

  // Lucide is loaded as a regular <script> in <head>, so window.lucide is ready
  if (window.lucide) window.lucide.createIcons({ nodes: [header] });

  // Inject auth modal (once — authRenderer will fill #authContent)
  if (!document.getElementById('authModal')) {
    var modal = document.createElement('div');
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
})();
