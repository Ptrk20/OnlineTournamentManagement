/**
 * Online Tournament Management
 * auth.js — Authentication logic
 */

'use strict';

/* =============================================
   AUTH MODULE
   ============================================= */
const AuthModule = (() => {

  const SESSION_KEY = 'otm_session';
  const USERS_KEY   = 'otm_users';
  const ROLE_ADMIN = 'Administrator';
  const ROLE_REPRESENTATIVE = 'Representative';

  function normalizeRole(role) {
    return String(role || '').trim().toLowerCase();
  }

  function isRepresentative(role) {
    return normalizeRole(role) === ROLE_REPRESENTATIVE.toLowerCase();
  }

  function isAdministrator(role) {
    return normalizeRole(role) === ROLE_ADMIN.toLowerCase();
  }

  // ── Default admin account (seeded on first load) ──
  const DEFAULT_ADMIN = {
    id:       1,
    username: 'admin',
    // NEVER store plain-text passwords in production.
    // Use bcrypt hashing server-side (PHP/Node.js).
    // This is a demo hash placeholder.
    password: 'Admin@2026',
    role:     'Administrator',
    name:     'System Administrator',
    email:    'admin@otm.local',
    status:   'Active',
    created:  '2026-01-01',
  };

  function seedAdmin() {
    const users = getUsers();
    const exists = users.find(u => u.username === DEFAULT_ADMIN.username);
    if (!exists) {
      users.push(DEFAULT_ADMIN);
      saveUsers(users);
    }
  }

  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
    catch { return []; }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  // ── Login (with PHP API) ──────────────────────
  async function login(username, password) {
    try {
      const response = await fetch('api/auth/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success && data.user) {
        // Create session from API response
        const session = {
          id:       data.user.id,
          name:     data.user.full_name,
          username: data.user.username,
          role:     data.user.role,
          email:    data.user.email,
          token:    generateToken(),
          expires:  Date.now() + 8 * 60 * 60 * 1000, // 8 hours
        };

        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return { ok: true, user: session };
      } else {
        return { ok: false, message: data.message || 'Login failed.' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { ok: false, message: 'Connection error. Please try again.' };
    }
  }

  // ── Logout ────────────────────────────────────
  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = '../login.html';
  }

  // ── Get current session ───────────────────────
  function getSession() {
    try {
      const s = JSON.parse(sessionStorage.getItem(SESSION_KEY));
      if (!s) return null;
      if (Date.now() > s.expires) {
        sessionStorage.removeItem(SESSION_KEY);
        return null;
      }
      return s;
    } catch { return null; }
  }

  function getHomePath(session, isAdminPage = false) {
    const role = session?.role;
    if (isRepresentative(role)) {
      return isAdminPage ? 'register.html' : 'admin/register.html';
    }
    if (isAdministrator(role)) {
      return isAdminPage ? 'dashboard.html' : 'admin/dashboard.html';
    }
    return isAdminPage ? 'dashboard.html' : 'admin/dashboard.html';
  }

  // ── Guard: redirect if not logged in ──────────
  function requireAuth() {
    const session = getSession();
    if (!session) {
      window.location.href = '../login.html';
      return null;
    }

    const currentPage = (window.location.pathname.split('/').pop() || '').toLowerCase();
    if (isRepresentative(session.role) && currentPage !== 'register.html') {
      window.location.href = 'register.html';
      return null;
    }

    return session;
  }

  // ── Guard: redirect if already logged in ──────
  function requireGuest() {
    const session = getSession();
    if (session) {
      window.location.href = getHomePath(session, false);
    }
  }

  function applyRoleAccess(session) {
    if (!session) return;
    if (!isRepresentative(session.role)) return;

    document.querySelectorAll('.sidebar-nav a').forEach(link => {
      const href = (link.getAttribute('href') || '').toLowerCase();
      if (href !== 'register.html') {
        link.style.display = 'none';
      }
    });

    document.querySelectorAll('.sidebar-nav .nav-label').forEach(label => {
      label.style.display = 'none';
    });

    const regLink = document.querySelector('.sidebar-nav a[href="register.html"]');
    if (regLink) {
      regLink.style.display = '';
      regLink.classList.add('active');
    }

    // Hide other admin-page links in content sections as well.
    document.querySelectorAll('a[href$=".html"]').forEach(link => {
      const href = (link.getAttribute('href') || '').toLowerCase();
      if (!href || href === 'register.html' || href === '../index.html') return;
      if (href.includes('://') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      link.style.display = 'none';
    });

    // Representatives should not see the public-site shortcut from admin pages.
    document.querySelectorAll('.sidebar-footer a').forEach(link => {
      link.style.display = 'none';
    });
  }

  function markRoleAccessReady() {
    if (document.body) {
      document.body.classList.add('role-access-ready');
    }
  }

  // ── Populate admin UI with user info ──────────
  function populateAdminUI(session) {
    if (!session) return;

    const brandName = document.querySelector('.sidebar-brand .brand-text .name');
    if (brandName) {
      brandName.textContent = isRepresentative(session.role)
        ? 'CvSU Bacoor Sports Hub Registration'
        : 'CvSU Bacoor Sports Hub';
    }

    document.querySelectorAll('[data-user-name]').forEach(el => {
      el.textContent = session.name;
    });
    document.querySelectorAll('[data-user-role]').forEach(el => {
      el.textContent = session.role;
    });
    document.querySelectorAll('[data-user-initials]').forEach(el => {
      el.textContent = getInitials(session.name);
    });
  }

  // ── Simple token generator (for demo) ────────
  function generateToken() {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  function getInitials(name) {
    return (name || '')
      .split(' ')
      .slice(0, 2)
      .map(n => n[0] || '')
      .join('')
      .toUpperCase();
  }

  // Seed default admin on module load (deprecated - using database now)
  // seedAdmin();

  return {
    login,
    logout,
    getSession,
    requireAuth,
    requireGuest,
    populateAdminUI,
    getUsers,
    saveUsers,
    getHomePath,
    applyRoleAccess,
    markRoleAccessReady
  };
})();

// Apply role-based module visibility as early as possible on admin pages
// to prevent a brief flash of restricted modules before admin.js initializes.
(() => {
  const path = (window.location.pathname || '').toLowerCase();
  if (!path.includes('/admin/')) return;

  const session = AuthModule.getSession();
  if (!session) return;

  AuthModule.populateAdminUI(session);
  AuthModule.applyRoleAccess(session);
  AuthModule.markRoleAccessReady();
})();

/* =============================================
   LOGIN FORM HANDLER (login.html)
   ============================================= */
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  // Redirect if already logged in
  AuthModule.requireGuest();

  // Toggle password visibility
  const togglePwd = document.getElementById('togglePassword');
  const pwdInput  = document.getElementById('password');
  if (togglePwd && pwdInput) {
    togglePwd.addEventListener('click', () => {
      const isText       = pwdInput.type === 'text';
      pwdInput.type      = isText ? 'password' : 'text';
      togglePwd.textContent = isText ? '👁' : '🙈';
    });
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = loginForm.querySelector('#username').value.trim();
    const password = loginForm.querySelector('#password').value;
    const errBox   = document.getElementById('login-error');
    const btn    = loginForm.querySelector('[type="submit"]');

    if (!username || !password) {
      if (errBox) { errBox.textContent = 'Please fill in all fields.'; errBox.style.display = 'block'; }
      return;
    }

    btn.disabled    = true;
    btn.textContent = 'Logging in…';

    try {
      const result = await AuthModule.login(username, password);

      if (result.ok) {
        if (errBox) errBox.style.display = 'none';

        // Role is now known; prepare role-specific UI state before navigation.
        AuthModule.applyRoleAccess(result.user);
        AuthModule.markRoleAccessReady();

        window.location.href = AuthModule.getHomePath(result.user, false);
      } else {
        if (errBox) { errBox.textContent = result.message; errBox.style.display = 'block'; }
        btn.disabled    = false;
        btn.textContent = 'Login → ';
      }
    } catch (error) {
      if (errBox) { errBox.textContent = 'An error occurred. Please try again.'; errBox.style.display = 'block'; }
      btn.disabled    = false;
      btn.textContent = 'Login → ';
    }
  });
});
