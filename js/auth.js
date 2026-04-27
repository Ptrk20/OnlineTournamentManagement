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

  // ── Login ─────────────────────────────────────
  function login(username, password) {
    const users = getUsers();
    // In production: send credentials to server, verify hash, return JWT.
    const user  = users.find(
      u => u.username === username && u.password === password && u.status === 'Active'
    );
    if (!user) return { ok: false, message: 'Invalid username or password.' };

    const session = {
      id:       user.id,
      name:     user.name,
      username: user.username,
      role:     user.role,
      email:    user.email,
      token:    generateToken(),
      expires:  Date.now() + 8 * 60 * 60 * 1000, // 8 hours
    };

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { ok: true, user: session };
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

  // ── Guard: redirect if not logged in ──────────
  function requireAuth() {
    const session = getSession();
    if (!session) {
      window.location.href = '../login.html';
      return null;
    }
    return session;
  }

  // ── Guard: redirect if already logged in ──────
  function requireGuest() {
    if (getSession()) {
      window.location.href = 'admin/dashboard.html';
    }
  }

  // ── Populate admin UI with user info ──────────
  function populateAdminUI(session) {
    if (!session) return;

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

  // Seed default admin on module load
  seedAdmin();

  return { login, logout, getSession, requireAuth, requireGuest, populateAdminUI, getUsers, saveUsers };
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

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const username = loginForm.querySelector('#username').value.trim();
    const password = loginForm.querySelector('#password').value;
    const errBox   = document.getElementById('login-error');

    if (!username || !password) {
      if (errBox) { errBox.textContent = 'Please fill in all fields.'; errBox.style.display = 'block'; }
      return;
    }

    const result = AuthModule.login(username, password);
    const btn    = loginForm.querySelector('[type="submit"]');

    btn.disabled    = true;
    btn.textContent = 'Logging in…';

    // Simulate server delay
    setTimeout(() => {
      if (result.ok) {
        window.location.href = 'admin/dashboard.html';
      } else {
        if (errBox) { errBox.textContent = result.message; errBox.style.display = 'block'; }
        btn.disabled    = false;
        btn.textContent = 'Login';
      }
    }, 600);
  });
});
