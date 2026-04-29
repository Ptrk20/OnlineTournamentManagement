/**
 * Online Tournament Management
 * admin.js — Admin panel logic (CRUD, charts, etc.)
 */

'use strict';

/* =============================================
   ADMIN BOOTSTRAP — runs on every admin page
   ============================================= */
document.addEventListener('DOMContentLoaded', () => {

  // ── Auth guard ────────────────────────────────
  const session = AuthModule.requireAuth();
  if (!session) return;

  AuthModule.populateAdminUI(session);

  // ── Sidebar toggle ────────────────────────────
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar       = document.getElementById('adminSidebar');

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      const isMobile = window.innerWidth <= 992;
      if (isMobile) {
        sidebar.classList.toggle('mobile-open');
      } else {
        sidebar.classList.toggle('collapsed');
        const main = document.getElementById('adminMain');
        if (main) main.classList.toggle('expanded');
      }
    });
  }

  // ── Close sidebar on mobile overlay click ─────
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 992 && sidebar && sidebar.classList.contains('mobile-open')) {
      if (!sidebar.contains(e.target) && !sidebarToggle?.contains(e.target)) {
        sidebar.classList.remove('mobile-open');
      }
    }
  });

  // ── Active sidebar link ───────────────────────
  const page = window.location.pathname.split('/').pop();
  document.querySelectorAll('.sidebar-nav a').forEach(link => {
    if (link.getAttribute('href') === page) link.classList.add('active');
  });

  // ── Logout button ─────────────────────────────
  document.querySelectorAll('[data-logout]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Are you sure you want to log out?')) AuthModule.logout();
    });
  });

  // ── Init page-specific modules ────────────────
  initDashboard();
  initEventManager();
  initNewsManager();
  initUserManager();
  initAnnouncementManager();
  initContactManager();
  initReports();
});

/* =============================================
   MODAL HELPERS
   ============================================= */
function openModal(id)  {
  const m = document.getElementById(id);
  if (m) { m.classList.add('open'); document.body.style.overflow = 'hidden'; }
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.remove('open'); document.body.style.overflow = ''; }
}

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
    document.body.style.overflow = '';
  }
  if (e.target.classList.contains('modal-close') || e.target.closest('.modal-close')) {
    const modal = e.target.closest('.modal-overlay');
    if (modal) { modal.classList.remove('open'); document.body.style.overflow = ''; }
  }
});

/* =============================================
   ADMIN TOAST
   ============================================= */
function adminToast(message, type = 'success') {
  if (typeof showToast === 'function') { showToast(message, type); return; }

  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:10px;';
    document.body.appendChild(container);
  }

  const icons = { success: '✅', error: '❌', warning: '⚠️' };
  const toast  = document.createElement('div');
  toast.style.cssText = `
    background:#fff;border-radius:8px;padding:14px 20px;
    box-shadow:0 6px 24px rgba(0,0,0,.18);display:flex;align-items:center;
    gap:12px;min-width:280px;animation:slideIn .35s ease;
    border-left:4px solid ${type === 'success' ? '#2e7d32' : type === 'error' ? '#c62828' : '#ff6f00'};
  `;
  toast.innerHTML = `<span>${icons[type] || '✅'}</span><span style="font-size:.88rem;font-weight:500;color:#333;">${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 350); }, 3500);
}

/* =============================================
   DASHBOARD MODULE
   ============================================= */
function initDashboard() {
  if (!document.getElementById('adminDashboard')) return;

  // Populate stats
  const events = DataStore.getEvents();
  const news   = DataStore.getNews();
  const users  = AuthModule.getUsers();
  const msgs   = DataStore.getMessages();

  setStatEl('stat-events',   events.length);
  setStatEl('stat-users',    users.length);
  setStatEl('stat-news',     news.length);
  setStatEl('stat-messages', msgs.filter(m => !m.read).length);
  setStatEl('stat-ongoing',  events.filter(e => e.status === 'Ongoing').length);
  setStatEl('stat-upcoming', events.filter(e => e.status === 'Upcoming').length);

  // Recent events table
  renderRecentEvents();

  // Mini chart (bar chart using canvas)
  drawEventChart();
}

function setStatEl(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function renderRecentEvents() {
  const tbody = document.getElementById('recentEventsTable');
  if (!tbody) return;

  const events = DataStore.getEvents().slice(0, 5);
  if (!events.length) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#aaa;">No events found.</td></tr>'; return; }

  tbody.innerHTML = events.map(ev => `
    <tr>
      <td>${escapeAdminHTML(ev.title)}</td>
      <td>${escapeAdminHTML(ev.date)}</td>
      <td>${escapeAdminHTML(ev.location)}</td>
      <td>${escapeAdminHTML(ev.teams)}</td>
      <td><span class="badge badge-${statusBadge(ev.status)}">${escapeAdminHTML(ev.status)}</span></td>
    </tr>
  `).join('');
}

function drawEventChart() {
  const canvas = document.getElementById('eventChart');
  if (!canvas || !canvas.getContext) return;

  const ctx    = canvas.getContext('2d');
  const events = DataStore.getEvents();

  const statuses = ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'];
  const counts   = statuses.map(s => events.filter(e => e.status === s).length);
  const colors   = ['#ff6f00', '#2e7d32', '#1a237e', '#c62828'];

  const barW   = 50;
  const gap    = 30;
  const startX = 60;
  const maxY   = Math.max(...counts, 1);
  const H      = canvas.height - 60;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#f8f9fc';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  statuses.forEach((label, i) => {
    const x      = startX + i * (barW + gap);
    const barH   = (counts[i] / maxY) * H;
    const y      = canvas.height - 30 - barH;

    ctx.fillStyle = colors[i];
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, barW, barH, [6, 6, 0, 0]) : ctx.rect(x, y, barW, barH);
    ctx.fill();

    // Value label
    ctx.fillStyle   = '#333';
    ctx.font        = 'bold 13px Segoe UI';
    ctx.textAlign   = 'center';
    ctx.fillText(counts[i], x + barW / 2, y - 6);

    // X label
    ctx.fillStyle = '#777';
    ctx.font      = '11px Segoe UI';
    ctx.fillText(label, x + barW / 2, canvas.height - 10);
  });
}

/* =============================================
   EVENTS MANAGER
   ============================================= */
function initEventManager() {
  const page = document.getElementById('adminEvents');
  if (!page) return;

  renderEventsTable();

  // Open add modal
  const addBtn = document.getElementById('addEventBtn');
  if (addBtn) addBtn.addEventListener('click', () => { clearEventForm(); openModal('eventModal'); });

  // Save event
  const saveBtn = document.getElementById('saveEventBtn');
  if (saveBtn) saveBtn.addEventListener('click', saveEvent);

  // Search
  const search = document.getElementById('eventSearch');
  if (search) search.addEventListener('input', () => renderEventsTable(search.value));
}

function renderEventsTable(filter = '') {
  const tbody = document.getElementById('eventsTableBody');
  if (!tbody) return;

  const events = DataStore.getEvents().filter(ev =>
    !filter || ev.title.toLowerCase().includes(filter.toLowerCase())
  );

  if (!events.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#aaa;padding:30px;">No events found.</td></tr>';
    return;
  }

  tbody.innerHTML = events.map((ev, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${escapeAdminHTML(ev.title)}</strong></td>
      <td>${escapeAdminHTML(ev.date)}</td>
      <td>${escapeAdminHTML(ev.location)}</td>
      <td><span class="badge badge-${statusBadge(ev.status)}">${escapeAdminHTML(ev.status)}</span></td>
      <td>
        <div class="action-btns">
          <button class="action-btn edit" title="Edit" onclick="editEvent('${ev.id}')">✏️</button>
          <button class="action-btn del"  title="Delete" onclick="deleteEvent('${ev.id}')">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function saveEvent() {
  const id    = document.getElementById('eventId')?.value;
  const title = document.getElementById('eventTitle')?.value.trim();
  const date  = document.getElementById('eventDate')?.value;
  const loc   = document.getElementById('eventLocation')?.value.trim();
  const teams = document.getElementById('eventTeams')?.value.trim();
  const desc  = document.getElementById('eventDesc')?.value.trim();
  const stat  = document.getElementById('eventStatus')?.value;

  if (!title || !date || !loc) { adminToast('Please fill in required fields.', 'error'); return; }

  const events = DataStore.getEvents();

  if (id) {
    const idx = events.findIndex(e => e.id === id);
    if (idx > -1) events[idx] = { ...events[idx], title, date, location: loc, teams, description: desc, status: stat };
  } else {
    events.unshift({ id: 'ev' + Date.now(), title, date, location: loc, teams, description: desc, status: stat });
  }

  DataStore.saveEvents(events);
  renderEventsTable();
  closeModal('eventModal');
  adminToast(id ? 'Event updated successfully.' : 'Event added successfully.');
}

window.editEvent = function(id) {
  const ev = DataStore.getEvents().find(e => e.id === id);
  if (!ev) return;

  document.getElementById('eventId').value       = ev.id;
  document.getElementById('eventTitle').value    = ev.title;
  document.getElementById('eventDate').value     = ev.date;
  document.getElementById('eventLocation').value = ev.location;
  document.getElementById('eventTeams').value    = ev.teams;
  document.getElementById('eventDesc').value     = ev.description;
  document.getElementById('eventStatus').value   = ev.status;
  document.getElementById('eventModalTitle').textContent = 'Edit Event';

  openModal('eventModal');
};

window.deleteEvent = function(id) {
  if (!confirm('Delete this event? This action cannot be undone.')) return;
  const events = DataStore.getEvents().filter(e => e.id !== id);
  DataStore.saveEvents(events);
  renderEventsTable();
  adminToast('Event deleted.', 'warning');
};

function clearEventForm() {
  ['eventId','eventTitle','eventDate','eventLocation','eventTeams','eventDesc'].forEach(i => {
    const el = document.getElementById(i);
    if (el) el.value = '';
  });
  const st = document.getElementById('eventStatus');
  if (st) st.value = 'Upcoming';
  const title = document.getElementById('eventModalTitle');
  if (title) title.textContent = 'Add New Event';
}

/* =============================================
   NEWS MANAGER
   ============================================= */
function initNewsManager() {
  const page = document.getElementById('adminNews');
  if (!page) return;

  renderNewsTable();

  const addBtn  = document.getElementById('addNewsBtn');
  if (addBtn) addBtn.addEventListener('click', () => { clearNewsForm(); openModal('newsModal'); });

  const saveBtn = document.getElementById('saveNewsBtn');
  if (saveBtn) saveBtn.addEventListener('click', saveNews);

  const search  = document.getElementById('newsSearch');
  if (search) search.addEventListener('input', () => renderNewsTable(search.value));
}

function renderNewsTable(filter = '') {
  const tbody = document.getElementById('newsTableBody');
  if (!tbody) return;

  const news = DataStore.getNews().filter(n =>
    !filter || n.title.toLowerCase().includes(filter.toLowerCase())
  );

  if (!news.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#aaa;padding:30px;">No articles found.</td></tr>';
    return;
  }

  tbody.innerHTML = news.map((n, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${escapeAdminHTML(n.title)}</strong></td>
      <td>${escapeAdminHTML(n.category)}</td>
      <td>${escapeAdminHTML(n.date)}</td>
      <td>
        <div class="action-btns">
          <button class="action-btn edit" title="Edit"   onclick="editNews('${n.id}')">✏️</button>
          <button class="action-btn del"  title="Delete" onclick="deleteNews('${n.id}')">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function saveNews() {
  const id       = document.getElementById('newsId')?.value;
  const title    = document.getElementById('newsTitle')?.value.trim();
  const category = document.getElementById('newsCategory')?.value.trim();
  const excerpt  = document.getElementById('newsExcerpt')?.value.trim();
  const content  = document.getElementById('newsContent')?.value.trim();
  const date     = new Date().toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });

  if (!title || !excerpt) { adminToast('Title and excerpt are required.', 'error'); return; }

  const news = DataStore.getNews();
  if (id) {
    const idx = news.findIndex(n => n.id === id);
    if (idx > -1) news[idx] = { ...news[idx], title, category, excerpt, content };
  } else {
    news.unshift({ id: 'n' + Date.now(), title, category, excerpt, content, date });
  }

  DataStore.saveNews(news);
  renderNewsTable();
  closeModal('newsModal');
  adminToast(id ? 'Article updated.' : 'Article published.');
}

window.editNews = function(id) {
  const n = DataStore.getNews().find(item => item.id === id);
  if (!n) return;
  document.getElementById('newsId').value       = n.id;
  document.getElementById('newsTitle').value    = n.title;
  document.getElementById('newsCategory').value = n.category;
  document.getElementById('newsExcerpt').value  = n.excerpt;
  document.getElementById('newsContent').value  = n.content || '';
  document.getElementById('newsModalTitle').textContent = 'Edit Article';
  openModal('newsModal');
};

window.deleteNews = function(id) {
  if (!confirm('Delete this article?')) return;
  DataStore.saveNews(DataStore.getNews().filter(n => n.id !== id));
  renderNewsTable();
  adminToast('Article deleted.', 'warning');
};

function clearNewsForm() {
  ['newsId','newsTitle','newsCategory','newsExcerpt','newsContent'].forEach(i => {
    const el = document.getElementById(i);
    if (el) el.value = '';
  });
  const t = document.getElementById('newsModalTitle');
  if (t) t.textContent = 'Add Article';
}

/* =============================================
   USER MANAGER
   ============================================= */
function initUserManager() {
  const page = document.getElementById('adminUsers');
  if (!page) return;

  renderUsersTable();

  const addBtn  = document.getElementById('addUserBtn');
  if (addBtn) addBtn.addEventListener('click', () => {
    clearUserForm();
    const userNameLabel = document.querySelector('label[for="userName"]') || document.querySelector('#userName')?.closest('.admin-form-group')?.querySelector('label');
    if (userNameLabel) userNameLabel.textContent = 'Full Name';
    openModal('userModal');
  });

  const saveBtn = document.getElementById('saveUserBtn');
  if (saveBtn) saveBtn.addEventListener('click', saveUser);

  const search  = document.getElementById('userSearch');
  if (search) search.addEventListener('input', () => renderUsersTable(search.value));
}

async function renderUsersTable(filter = '') {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#aaa;padding:30px;">Loading users...</td></tr>';

  try {
    const users = await fetchUsersFromApi(filter);

    if (!users.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#aaa;padding:30px;">No users found.</td></tr>';
      return;
    }

    tbody.innerHTML = users.map((u, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>
          <div class="user-cell">
            <div class="user-avatar">${getInitialsAdmin(u.full_name)}</div>
            <div>
              <div class="user-name">${escapeAdminHTML(u.full_name)}</div>
              <div class="user-email">${escapeAdminHTML(u.email)}</div>
            </div>
          </div>
        </td>
        <td>${escapeAdminHTML(u.username)}</td>
        <td>${escapeAdminHTML(u.role)}</td>
        <td><span class="badge badge-${u.status === 'Active' ? 'success' : 'danger'}">${escapeAdminHTML(u.status)}</span></td>
        <td>
          <div class="action-btns">
            <button class="action-btn edit" onclick="editUser(${u.id})">✏️</button>
            <button class="action-btn del"  onclick="deleteUser(${u.id})">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#c62828;padding:30px;">Failed to load users.</td></tr>';
    adminToast(err.message || 'Failed to load users.', 'error');
  }
}

async function saveUser() {
  const id       = document.getElementById('userId')?.value;
  const name     = document.getElementById('userName')?.value.trim();
  const username = document.getElementById('userUsername')?.value.trim();
  const email    = document.getElementById('userEmail')?.value.trim();
  const phone    = document.getElementById('userPhone')?.value.trim();
  const role     = document.getElementById('userRole')?.value;
  const status   = document.getElementById('userStatus')?.value;
  const password = document.getElementById('userPassword')?.value;

  if (!name || !username || !email) { adminToast('Name, username, and email are required.', 'error'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { adminToast('Invalid email address.', 'error'); return; }

  if (!id && !password) { adminToast('Password is required for new users.', 'error'); return; }

  const payload = {
    id: id ? Number(id) : undefined,
    full_name: name,
    username,
    email,
    phone,
    role,
    status
  };

  if (password) payload.password = password;

  try {
    if (id) {
      const updatePayload = {
        id: Number(id),
        full_name: name,
        email,
        phone,
        role,
        status
      };
      if (password) updatePayload.password = password;
      await userApiRequest('../api/users/update.php', 'PUT', updatePayload);
    } else {
      await userApiRequest('../api/users/create.php', 'POST', payload);
    }

    await renderUsersTable(document.getElementById('userSearch')?.value || '');
    closeModal('userModal');
    adminToast(id ? 'User updated.' : 'User added successfully.');
  } catch (err) {
    adminToast(err.message || 'Failed to save user.', 'error');
  }
}

window.editUser = async function(id) {
  try {
    const res = await fetch(`../api/users/read.php?id=${encodeURIComponent(id)}`);
    const data = await parseApiJson(res);
    if (!data.success || !data.data) throw new Error(data.message || 'User not found.');

    const u = data.data;
    document.getElementById('userId').value       = u.id;
    document.getElementById('userName').value     = u.full_name || '';
    document.getElementById('userUsername').value = u.username || '';
    document.getElementById('userEmail').value    = u.email || '';
    document.getElementById('userPhone').value    = u.phone || '';
    document.getElementById('userRole').value     = u.role || 'Organizer';
    document.getElementById('userStatus').value   = u.status || 'Active';
    document.getElementById('userPassword').value = '';
    document.getElementById('userUsername').disabled = true;
    document.getElementById('userModalTitle').textContent = 'Edit User';
    openModal('userModal');
  } catch (err) {
    adminToast(err.message || 'Failed to load user.', 'error');
  }
};

window.deleteUser = async function(id) {
  const session = AuthModule.getSession();
  if (session && Number(session.id) === Number(id)) {
    adminToast('You cannot delete your own account.', 'error');
    return;
  }
  if (!confirm('Delete this user?')) return;

  try {
    await userApiRequest('../api/users/delete.php', 'DELETE', { id: Number(id) });
    await renderUsersTable(document.getElementById('userSearch')?.value || '');
    adminToast('User deleted.', 'warning');
  } catch (err) {
    adminToast(err.message || 'Failed to delete user.', 'error');
  }
};

function clearUserForm() {
  ['userId','userName','userUsername','userEmail','userPhone','userPassword'].forEach(i => {
    const el = document.getElementById(i);
    if (el) el.value = '';
  });
  const usernameEl = document.getElementById('userUsername');
  if (usernameEl) usernameEl.disabled = false;
  const roleEl = document.getElementById('userRole');
  if (roleEl) roleEl.value = 'Organizer';
  const statusEl = document.getElementById('userStatus');
  if (statusEl) statusEl.value = 'Active';
  const t = document.getElementById('userModalTitle');
  if (t) t.textContent = 'Add User';
}

async function fetchUsersFromApi(filter = '') {
  const res = await fetch('../api/users/read.php');
  const data = await parseApiJson(res);
  if (!data.success || !Array.isArray(data.data)) {
    throw new Error(data.message || 'Failed to fetch users.');
  }

  const q = String(filter || '').trim().toLowerCase();
  if (!q) return data.data;

  return data.data.filter(u =>
    String(u.full_name || '').toLowerCase().includes(q) ||
    String(u.username || '').toLowerCase().includes(q) ||
    String(u.email || '').toLowerCase().includes(q)
  );
}

async function userApiRequest(url, method, payload) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await parseApiJson(res);
  if (!data.success) {
    throw new Error(data.message || 'Request failed.');
  }
  return data;
}

async function parseApiJson(response) {
  const text = await response.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Server returned invalid JSON. Check PHP errors and API path.');
  }

  if (!response.ok && parsed && parsed.message) {
    throw new Error(parsed.message);
  }
  if (!response.ok && (!parsed || !parsed.message)) {
    throw new Error('Server request failed.');
  }

  return parsed;
}

/* =============================================
   ANNOUNCEMENTS MANAGER
   ============================================= */
function initAnnouncementManager() {
  const page = document.getElementById('adminAnnouncements');
  if (!page) return;

  renderAnnouncementsTable();

  const addBtn  = document.getElementById('addAnnouncementBtn');
  if (addBtn) addBtn.addEventListener('click', () => { clearAnnouncementForm(); openModal('announcementModal'); });

  const saveBtn = document.getElementById('saveAnnouncementBtn');
  if (saveBtn) saveBtn.addEventListener('click', saveAnnouncement);
}

function renderAnnouncementsTable() {
  const tbody = document.getElementById('announcementsTableBody');
  if (!tbody) return;

  const items = DataStore.getAnnouncements();
  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#aaa;padding:30px;">No announcements.</td></tr>';
    return;
  }

  tbody.innerHTML = items.map((a, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${escapeAdminHTML(a.title)}</strong><br><small style="color:#aaa">${escapeAdminHTML(a.message.slice(0,80))}…</small></td>
      <td>${escapeAdminHTML(a.date)}</td>
      <td>
        <div class="action-btns">
          <button class="action-btn edit" onclick="editAnnouncement('${a.id}')">✏️</button>
          <button class="action-btn del"  onclick="deleteAnnouncement('${a.id}')">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function saveAnnouncement() {
  const id      = document.getElementById('announcementId')?.value;
  const title   = document.getElementById('announcementTitle')?.value.trim();
  const message = document.getElementById('announcementMessage')?.value.trim();

  if (!title || !message) { adminToast('Title and message are required.', 'error'); return; }

  const items = DataStore.getAnnouncements();
  const date  = new Date().toLocaleDateString();

  if (id) {
    const idx = items.findIndex(a => a.id === id);
    if (idx > -1) items[idx] = { ...items[idx], title, message };
  } else {
    items.unshift({ id: 'a' + Date.now(), title, message, date });
  }

  DataStore.saveAnnouncements(items);
  renderAnnouncementsTable();
  closeModal('announcementModal');
  adminToast(id ? 'Announcement updated.' : 'Announcement published.');
}

window.editAnnouncement = function(id) {
  const a = DataStore.getAnnouncements().find(x => x.id === id);
  if (!a) return;
  document.getElementById('announcementId').value      = a.id;
  document.getElementById('announcementTitle').value   = a.title;
  document.getElementById('announcementMessage').value = a.message;
  openModal('announcementModal');
};

window.deleteAnnouncement = function(id) {
  if (!confirm('Delete this announcement?')) return;
  DataStore.saveAnnouncements(DataStore.getAnnouncements().filter(a => a.id !== id));
  renderAnnouncementsTable();
  adminToast('Announcement deleted.', 'warning');
};

function clearAnnouncementForm() {
  ['announcementId','announcementTitle','announcementMessage'].forEach(i => {
    const el = document.getElementById(i); if (el) el.value = '';
  });
}

/* =============================================
   CONTACT MESSAGE MANAGER
   ============================================= */
function initContactManager() {
  const page = document.getElementById('adminContact');
  if (!page) return;
  renderContactMessages();
}

function renderContactMessages() {
  const tbody = document.getElementById('messagesTableBody');
  if (!tbody) return;

  const msgs = DataStore.getMessages();
  if (!msgs.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#aaa;padding:30px;">No messages.</td></tr>';
    return;
  }

  tbody.innerHTML = msgs.map((m, i) => `
    <tr style="${!m.read ? 'background:#fffde7;' : ''}">
      <td>${i + 1}</td>
      <td>${escapeAdminHTML(m.name)}<br><small style="color:#aaa">${escapeAdminHTML(m.email)}</small></td>
      <td>${escapeAdminHTML(m.subject)}</td>
      <td>${escapeAdminHTML(m.date)}</td>
      <td>
        <div class="action-btns">
          <button class="action-btn view" onclick="viewMessage(${m.id})">👁️</button>
          <button class="action-btn del"  onclick="deleteMessage(${m.id})">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

window.viewMessage = function(id) {
  const msgs = DataStore.getMessages();
  const idx  = msgs.findIndex(m => m.id === id);
  if (idx < 0) return;

  const m = msgs[idx];
  msgs[idx].read = true;
  DataStore.saveMessages(msgs);

  const body = document.getElementById('msgViewBody');
  if (body) {
    body.innerHTML = `
      <p><strong>From:</strong> ${escapeAdminHTML(m.name)} &lt;${escapeAdminHTML(m.email)}&gt;</p>
      <p><strong>Subject:</strong> ${escapeAdminHTML(m.subject)}</p>
      <p><strong>Date:</strong> ${escapeAdminHTML(m.date)}</p>
      <hr style="margin:14px 0;border:none;border-top:1px solid #eee;">
      <p style="white-space:pre-wrap;">${escapeAdminHTML(m.message)}</p>
    `;
  }

  openModal('msgViewModal');
  renderContactMessages();
};

window.deleteMessage = function(id) {
  if (!confirm('Delete this message?')) return;
  DataStore.saveMessages(DataStore.getMessages().filter(m => m.id !== id));
  renderContactMessages();
  adminToast('Message deleted.', 'warning');
};

/* =============================================
   REPORTS
   ============================================= */
function initReports() {
  const exportBtn = document.getElementById('exportReportBtn');
  if (!exportBtn) return;

  exportBtn.addEventListener('click', () => {
    const events = DataStore.getEvents();
    const csvRows = [
      ['ID','Title','Date','Location','Teams','Status'],
      ...events.map(e => [e.id, e.title, e.date, e.location, e.teams, e.status])
    ];

    const csv  = csvRows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `events_report_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    adminToast('Report exported as CSV.');
  });
}

/* =============================================
   UTILS
   ============================================= */
function escapeAdminHTML(str) {
  if (typeof str !== 'string') return str ?? '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getInitialsAdmin(name) {
  return (name || '').split(' ').slice(0, 2).map(n => n[0] || '').join('').toUpperCase();
}

function statusBadge(status) {
  const map = { 'Ongoing':'success', 'Upcoming':'accent', 'Completed':'primary', 'Cancelled':'danger' };
  return map[status] || 'primary';
}
