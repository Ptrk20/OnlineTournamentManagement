/**
 * Online Tournament Management
 * admin.js — Admin panel logic (CRUD, charts, etc.)
 */

'use strict';

const REGISTRATIONS_STORAGE_KEY = 'otm_team_registrations';
let editingCourseId = null;
let registrationEventsCache = [];
let registrationSportsCache = [];
let registrationPlayersDraft = [];
let registrationDocumentsDraft = [];
let currentViewedRegistration = null;

/* =============================================
   ADMIN BOOTSTRAP — runs on every admin page
   ============================================= */
document.addEventListener('DOMContentLoaded', () => {

  // ── Auth guard ────────────────────────────────
  const session = AuthModule.requireAuth();
  if (!session) return;

  AuthModule.populateAdminUI(session);
  AuthModule.applyRoleAccess(session);

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

  // ── Topbar user popup ─────────────────────────
  const topbarUser = document.querySelector('.topbar-user');
  const userPopup  = document.getElementById('userPopup');

  if (topbarUser && userPopup) {
    topbarUser.addEventListener('click', (e) => {
      e.stopPropagation();
      userPopup.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!topbarUser.contains(e.target)) {
        userPopup.classList.remove('open');
      }
    });
  }

  // ── Init page-specific modules ────────────────
  initDashboard();
  initRegistrationManager();
  initEventManager();
  initNewsManager();
  initUserManager();
  initAnnouncementManager();
  initContactManager();
  initAboutManager();
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
    if (e.target.id === 'sportsModal') clearSportForm();
    e.target.classList.remove('open');
    document.body.style.overflow = '';
  }
  if (e.target.classList.contains('modal-close') || e.target.closest('.modal-close')) {
    const modal = e.target.closest('.modal-overlay');
    if (modal) {
      if (modal.id === 'sportsModal') clearSportForm();
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  }
});

/* =============================================
   ADMIN TOAST
   ============================================= */
function showToast(message, type = 'success') {
  const colors = { success: '#4caf50', error: '#f44336', warning: '#ff6f00' };
  const icons  = { success: '✅', error: '❌', warning: '⚠️' };

  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:10000;display:flex;flex-direction:column;gap:10px;';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.style.cssText = `
    background:#fff;border-radius:8px;padding:14px 20px;
    box-shadow:0 6px 24px rgba(0,0,0,.18);display:flex;align-items:center;
    gap:12px;min-width:280px;animation:slideIn .3s ease;
    border-left:4px solid ${colors[type] || colors.success};
  `;
  toast.innerHTML = `<span>${icons[type] || icons.success}</span><span style="font-size:.88rem;font-weight:500;color:#333;">${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity .3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function adminToast(message, type = 'success') {
  showToast(message, type);
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
let eventsCache = [];
let bracketSetupContext = {
  event: null,
  teams: [],
  existingBracketId: null,
  existingParticipantCount: null,
  existingTournamentType: null,
  existingThirdPlace: null
};
let inlineBracketData = null;
let inlineBracketSelectedMatchId = null;
let eventSchedulesState = {
  event: null,
  matches: [],
  view: 'list',
  calendarYear: null,
  calendarMonth: null,
  selectedMatchId: null
};

async function loadSportsDropdown() {
  const sel = document.getElementById('eventSportsId');
  if (!sel) return;

  try {
    const res  = await fetch('../api/sports/read.php');
    const json = await res.json();
    const rows = (json.success && Array.isArray(json.data)) ? json.data : [];

    const opts = rows
      .filter(s => Number(s.is_active) === 1)
      .map(s => {
        const name = s.sport_name || s.sports_name || '';
        return `<option value="${Number(s.id)}">${escapeAdminHTML(name)}</option>`;
      })
      .join('');

    sel.innerHTML = '<option value="">— Select Sport —</option>' + opts;
  } catch (err) {
    console.error('loadSportsDropdown error:', err);
  }
}

function initEventManager() {
  const page = document.getElementById('adminEvents');
  if (!page) return;

  renderEventsTable();

  // Open add modal — also refresh sports dropdown
  const addBtn = document.getElementById('addEventBtn');
  if (addBtn) addBtn.addEventListener('click', async () => {
    clearEventForm();
    await loadSportsDropdown();
    openModal('eventModal');
  });

  // Save event
  const saveBtn = document.getElementById('saveEventBtn');
  if (saveBtn) saveBtn.addEventListener('click', saveEvent);

  // Search (client-side filter against cached data)
  const search = document.getElementById('eventSearch');
  if (search) search.addEventListener('input', () => renderEventsTable(search.value));

  const generateBtn = document.getElementById('generateBracketBtn');
  if (generateBtn) {
    generateBtn.addEventListener('click', generateTournamentBracket);
  }

  initInlineBracketLanding();
  initEventScheduleManager();

  // Sports manager
  const manageSportsBtn = document.getElementById('manageSportsBtn');
  if (manageSportsBtn) {
    manageSportsBtn.addEventListener('click', async () => {
      openModal('sportsModal');
      clearSportForm();
      await renderSportsTable();
    });
  }

  const saveSportBtn = document.getElementById('saveSportBtn');
  if (saveSportBtn) saveSportBtn.addEventListener('click', saveSport);

  const resetSportFormBtn = document.getElementById('resetSportFormBtn');
  if (resetSportFormBtn) resetSportFormBtn.addEventListener('click', clearSportForm);

  const sportImageBrowse = document.getElementById('sportImageBrowse');
  const sportImageRemove = document.getElementById('sportImageRemove');
  const sportImageUpload = document.getElementById('sportImageUpload');

  if (sportImageBrowse && sportImageUpload) {
    sportImageBrowse.addEventListener('click', () => sportImageUpload.click());
  }

  if (sportImageUpload) {
    sportImageUpload.addEventListener('change', () => {
      const file = sportImageUpload.files && sportImageUpload.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        adminToast('Please select a valid image file.', 'error');
        sportImageUpload.value = '';
        return;
      }

      if (sportPreviewPath && sportPreviewPath.startsWith('blob:')) {
        URL.revokeObjectURL(sportPreviewPath);
      }

      sportPendingPhotoFile = file;
      sportPreviewPath = URL.createObjectURL(file);
      setSportImagePreview(sportPreviewPath);
    });
  }

  if (sportImageRemove) {
    sportImageRemove.addEventListener('click', () => {
      if (sportPreviewPath && sportPreviewPath.startsWith('blob:')) {
        URL.revokeObjectURL(sportPreviewPath);
      }
      sportPendingPhotoFile = null;
      sportPreviewPath = '';
      const photoEl = document.getElementById('sportPhotoPath');
      if (photoEl) photoEl.value = '';
      if (sportImageUpload) sportImageUpload.value = '';
      setSportImagePreview('');
    });
  }
}

function formatEventDate(dtStr) {
  if (!dtStr) return '—';
  const d = new Date(dtStr);
  if (isNaN(d)) return dtStr;
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
}

async function renderEventsTable(filter = '') {
  const tbody = document.getElementById('eventsTableBody');
  if (!tbody) return;

  // On first load (no cache yet) fetch from API; on search use cache
  if (!filter && eventsCache.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#aaa;padding:30px;">Loading...</td></tr>';
    try {
      const res  = await fetch('../api/events/read.php');
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to load events.');
      eventsCache = Array.isArray(json.data) ? json.data : [];
    } catch (err) {
      console.error('renderEventsTable fetch error:', err);
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:#e53935;padding:30px;">Failed to load events.</td></tr>`;
      return;
    }
  }

  // Full refresh (no filter passed after save/delete)
  if (!filter) {
    try {
      const res  = await fetch('../api/events/read.php');
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to load events.');
      eventsCache = Array.isArray(json.data) ? json.data : [];
    } catch (err) { /* keep stale cache */ }
  }

  const filtered = filter
    ? eventsCache.filter(ev => ev.title.toLowerCase().includes(filter.toLowerCase()))
    : eventsCache;

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:#aaa;padding:30px;">No events found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((ev, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${escapeAdminHTML(ev.title)}</strong></td>
      <td>${escapeAdminHTML(ev.sport_name || '—')}</td>
      <td>${escapeAdminHTML(ev.category || '—')}</td>
      <td>${formatEventDate(ev.event_start_date)}</td>
      <td>${formatEventDate(ev.event_end_date)}</td>
      <td>${escapeAdminHTML(ev.location)}</td>
      <td><span class="badge badge-${statusBadge(ev.status)}">${escapeAdminHTML(ev.status)}</span></td>
      <td>
        <div class="action-btns">
          <button class="action-btn view" title="Bracketing" onclick="openEventBracketing(${Number(ev.id)})"><img src="../src/images/tournament-bracket.png" alt="Bracketing" class="action-btn-icon" /></button>
          <button class="action-btn view" title="View Saved Schedules" onclick="openEventSchedules(${Number(ev.id)})">&#128197;</button>
          <button class="action-btn edit" title="Edit" onclick="editEvent(${Number(ev.id)})">✏️</button>
          <button class="action-btn del"  title="Delete" onclick="deleteEvent(${Number(ev.id)})">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

async function saveEvent() {
  const id        = document.getElementById('eventId')?.value;
  const title     = document.getElementById('eventTitle')?.value.trim() || '';
  const sportsId  = Number(document.getElementById('eventSportsId')?.value || '0');
  const category  = document.getElementById('eventCategory')?.value.trim() || '';
  const startDate = document.getElementById('eventStartDate')?.value || '';
  const endDate   = document.getElementById('eventEndDate')?.value || '';
  const location  = document.getElementById('eventLocation')?.value.trim() || '';
  const desc      = document.getElementById('eventDesc')?.value.trim() || '';
  const status    = document.getElementById('eventStatus')?.value || 'Upcoming';
  const tournamentType = document.getElementById('eventTournamentType')?.value || 'single_elimination';
  const hasThirdPlaceMatch = (document.querySelector('input[name="eventThirdPlace"]:checked')?.value || 'yes') === 'yes';

  if (!title || !sportsId || !category || !startDate || !endDate || !location) {
    adminToast('Please fill in all required fields.', 'error');
    return;
  }

  if (new Date(endDate) < new Date(startDate)) {
    adminToast('End date must not be before start date.', 'error');
    return;
  }

  // teams_count is auto-calculated from approved registrations; don't send it
  const payload = {
    id: id ? Number(id) : undefined,
    title,
    sports_id: sportsId,
    category,
    event_start_date: startDate,
    event_end_date:   endDate,
    location,
    tournament_type: tournamentType,
    has_third_place_match: hasThirdPlaceMatch,
    description: desc || null,
    status
  };

  const endpoint = id ? '../api/events/update.php' : '../api/events/create.php';

  try {
    const res  = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to save event.');

    adminToast(id ? 'Event updated successfully.' : 'Event created successfully.');
    closeModal('eventModal');
    eventsCache = [];           // force full refresh
    await renderEventsTable();
  } catch (err) {
    console.error('saveEvent error:', err);
    adminToast(err.message || 'Failed to save event.', 'error');
  }
}

window.editEvent = async function(id) {
  const ev = eventsCache.find(e => Number(e.id) === Number(id));
  if (!ev) return;

  clearEventForm();
  await loadSportsDropdown();

  document.getElementById('eventId').value          = ev.id;
  document.getElementById('eventTitle').value       = ev.title || '';
  document.getElementById('eventSportsId').value    = ev.sports_id || '';
  document.getElementById('eventCategory').value    = ev.category || '';
  // datetime-local expects "YYYY-MM-DDTHH:MM"
  document.getElementById('eventStartDate').value   = (ev.event_start_date || '').replace(' ', 'T').slice(0, 16);
  document.getElementById('eventEndDate').value     = (ev.event_end_date || '').replace(' ', 'T').slice(0, 16);
  document.getElementById('eventLocation').value    = ev.location || '';
  document.getElementById('eventTeams').value       = ev.teams_count != null ? ev.teams_count : '';
  document.getElementById('eventDesc').value        = ev.description || '';
  document.getElementById('eventStatus').value      = ev.status || 'Upcoming';
  document.getElementById('eventTournamentType').value = ev.tournament_type || 'single_elimination';
  const hasThirdPlace = ev.has_third_place_match == null ? 1 : Number(ev.has_third_place_match);
  const thirdPlaceChoice = hasThirdPlace === 1 ? 'yes' : 'no';
  const thirdPlaceEl = document.querySelector(`input[name="eventThirdPlace"][value="${thirdPlaceChoice}"]`);
  if (thirdPlaceEl) thirdPlaceEl.checked = true;
  document.getElementById('eventModalTitle').textContent = 'Edit Event';
  // Show teams field for existing events
  const teamsGroup = document.getElementById('eventTeamsGroup');
  if (teamsGroup) teamsGroup.style.display = 'block';

  openModal('eventModal');
};

window.deleteEvent = async function(id) {
  if (!confirm('Delete this event? This action cannot be undone.')) return;

  try {
    const res  = await fetch('../api/events/delete.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: Number(id) })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to delete event.');

    adminToast('Event deleted.', 'warning');
    eventsCache = [];           // force full refresh
    await renderEventsTable();
  } catch (err) {
    console.error('deleteEvent error:', err);
    adminToast(err.message || 'Failed to delete event.', 'error');
  }
};

function renderRegisteredTeamsTable(teams) {
  const wrap = document.getElementById('registeredTeamsWrap');
  const list = document.getElementById('registeredTeamsList');
  if (!wrap || !list) return;

  if (!teams.length) {
    wrap.style.display = 'none';
    list.innerHTML = '';
    return;
  }

  wrap.style.display = 'block';
  list.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Team</th>
          <th>Representative</th>
          <th>Approved At</th>
        </tr>
      </thead>
      <tbody>
        ${teams.map((team, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>${escapeAdminHTML(team.team_name || 'Unnamed Team')}</td>
            <td>${escapeAdminHTML(team.representative_name || '-')}</td>
            <td>${formatEventDate(team.reviewed_at || team.submitted_at || team.created_at)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function setGenerateBracketAvailability(
  teamsCount,
  existingBracketId = null,
  existingParticipantCount = null,
  existingTournamentType = null,
  existingThirdPlace = null,
  currentTournamentType = null,
  currentThirdPlace = null
) {
  const stateEl = document.getElementById('bracketModalState');
  const btn = document.getElementById('generateBracketBtn');
  if (!stateEl || !btn) return;

  const hasExisting = existingBracketId && Number(existingBracketId) > 0;
  const sameTeamCount = hasExisting && existingParticipantCount != null && Number(existingParticipantCount) === Number(teamsCount);
  const sameType = !hasExisting || String(existingTournamentType || '') === String(currentTournamentType || '');
  const sameThirdPlace = !hasExisting || Number(existingThirdPlace ? 1 : 0) === Number(currentThirdPlace ? 1 : 0);
  const sameConfig = sameType && sameThirdPlace;

  if (sameTeamCount && sameConfig) {
    stateEl.textContent = 'Saved bracket found for this event. Click View Bracket to open it.';
    btn.disabled = false;
    btn.textContent = 'View Bracket';
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
    return;
  }

  if (hasExisting && Number(teamsCount) >= 3) {
    const reasons = [];
    if (!sameTeamCount) reasons.push(`team count changed (${teamsCount})`);
    if (!sameType) reasons.push('tournament type changed');
    if (!sameThirdPlace) reasons.push('3rd place setting changed');
    const reasonText = reasons.length ? reasons.join(', ') : 'settings changed';
    stateEl.textContent = `Saved bracket is out of date (${reasonText}). Click Regenerate Bracket.`;
    btn.disabled = false;
    btn.textContent = 'Regenerate Bracket';
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
    return;
  }

  btn.textContent = 'Create Bracket';

  if (teamsCount < 3) {
    stateEl.textContent = 'Minimum of 3 approved teams is required to create a bracket.';
    btn.disabled = true;
    btn.style.opacity = '.6';
    btn.style.cursor = 'not-allowed';
    return;
  }

  stateEl.textContent = 'Approved teams loaded. Click Create Bracket to continue.';
  btn.disabled = false;
  btn.style.opacity = '1';
  btn.style.cursor = 'pointer';
}

window.openEventBracketing = async function(id) {
  const ev = eventsCache.find(e => Number(e.id) === Number(id));
  if (!ev) {
    adminToast('Event not found for bracketing.', 'error');
    return;
  }

  const eventTag = document.getElementById('bracketEventTag');
  const categoryTag = document.getElementById('bracketCategoryTag');
  const typeTag = document.getElementById('bracketTypeTag');
  const teamsTag = document.getElementById('bracketTeamsTag');
  const stateEl = document.getElementById('bracketModalState');
  const titleEl = document.getElementById('bracketModalTitle');

  if (!eventTag || !categoryTag || !typeTag || !teamsTag || !stateEl) {
    adminToast('Bracketing modal is not available on this page.', 'error');
    return;
  }

  if (titleEl) titleEl.textContent = `Event Bracketing - ${ev.title || 'Event'}`;
  eventTag.textContent = `Event: ${ev.title || '-'}`;
  categoryTag.textContent = `Category: ${ev.category || '-'}`;
  typeTag.textContent = `Type: ${String(ev.tournament_type || 'single_elimination').replace(/_/g, ' ')}`;
  teamsTag.textContent = 'Approved Teams: 0';
  stateEl.textContent = 'Loading teams...';
  bracketSetupContext = {
    event: ev,
    teams: [],
    existingBracketId: null,
    existingParticipantCount: null,
    existingTournamentType: null,
    existingThirdPlace: null
  };

  openModal('eventBracketingModal');

  // Check if a bracket already exists for this event.
  try {
    const bracketRes = await fetch(`../api/brackets/read.php?event_id=${Number(ev.id)}`);
    const bracketJson = await bracketRes.json();
    if (bracketJson.success && bracketJson.data && Number(bracketJson.data.bracket_id) > 0) {
      bracketSetupContext.existingBracketId = Number(bracketJson.data.bracket_id);
      bracketSetupContext.existingParticipantCount = Number(bracketJson.data.participant_count || 0);
      bracketSetupContext.existingTournamentType = String(bracketJson.data.tournament_type || 'single_elimination');
      bracketSetupContext.existingThirdPlace = Number(bracketJson.data.has_third_place_match ? 1 : 0) === 1;
    }
  } catch (err) {
    console.warn('Existing bracket check failed:', err);
  }

  try {
    const res = await fetch('../api/registrations/read.php');
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to load registrations.');

    const rows = Array.isArray(json.data) ? json.data : [];
    const approved = rows
      .filter(r => Number(r.event_id) === Number(ev.id) && String(r.status || '').toLowerCase() === 'approved')
      .sort((a, b) => {
        const aTime = new Date(a.submitted_at || a.created_at || 0).getTime();
        const bTime = new Date(b.submitted_at || b.created_at || 0).getTime();
        return aTime - bTime;
      });

    bracketSetupContext.teams = approved;
    teamsTag.textContent = `Approved Teams: ${approved.length}`;

    renderRegisteredTeamsTable(approved);
    setGenerateBracketAvailability(
      approved.length,
      bracketSetupContext.existingBracketId,
      bracketSetupContext.existingParticipantCount,
      bracketSetupContext.existingTournamentType,
      bracketSetupContext.existingThirdPlace,
      String(ev.tournament_type || 'single_elimination'),
      (ev.has_third_place_match == null ? true : Number(ev.has_third_place_match) === 1)
    );
  } catch (err) {
    console.error('openEventBracketing error:', err);
    stateEl.textContent = err.message || 'Failed to load bracket data.';
  }
};

function initEventScheduleManager() {
  const toggle = document.getElementById('adminScheduleViewToggle');
  const listWrap = document.getElementById('adminScheduleList');
  const saveBtn = document.getElementById('adminScheduleSaveBtn');
  const resetBtn = document.getElementById('adminScheduleResetBtn');

  if (toggle) {
    toggle.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-view]');
      if (!btn) return;
      eventSchedulesState.view = btn.getAttribute('data-view') === 'calendar' ? 'calendar' : 'list';
      renderEventScheduleView();
    });
  }

  if (listWrap) {
    listWrap.addEventListener('click', (e) => {
      const navBtn = e.target.closest('[data-calendar-nav]');
      if (navBtn) {
        if (eventSchedulesState.calendarYear == null || eventSchedulesState.calendarMonth == null) {
          const now = new Date();
          eventSchedulesState.calendarYear = now.getFullYear();
          eventSchedulesState.calendarMonth = now.getMonth();
        }

        if (navBtn.getAttribute('data-calendar-nav') === 'prev') {
          eventSchedulesState.calendarMonth -= 1;
        } else {
          eventSchedulesState.calendarMonth += 1;
        }

        if (eventSchedulesState.calendarMonth < 0) {
          eventSchedulesState.calendarMonth = 11;
          eventSchedulesState.calendarYear -= 1;
        }
        if (eventSchedulesState.calendarMonth > 11) {
          eventSchedulesState.calendarMonth = 0;
          eventSchedulesState.calendarYear += 1;
        }
        renderEventScheduleView();
        return;
      }

      const selBtn = e.target.closest('[data-sched-select]');
      if (selBtn) {
        const id = Number(selBtn.getAttribute('data-sched-select') || 0);
        selectEventScheduleMatch(id);
      }
    });
  }

  if (saveBtn) saveBtn.addEventListener('click', saveSelectedEventSchedule);
  if (resetBtn) resetBtn.addEventListener('click', () => {
    const selectedId = Number(document.getElementById('adminScheduleMatchId')?.value || 0);
    if (selectedId > 0) selectEventScheduleMatch(selectedId);
  });
}

function scheduleParseDateTime(datePart, timePart) {
  const d = String(datePart || '').trim();
  const t = String(timePart || '').trim();
  if (!d) return null;
  const full = t ? `${d}T${t}` : `${d}T00:00:00`;
  const dt = new Date(full);
  return isNaN(dt.getTime()) ? null : dt;
}

function scheduleDateTimeToInputValue(dt) {
  if (!(dt instanceof Date) || isNaN(dt.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

function scheduleInputToParts(value) {
  const v = String(value || '').trim();
  if (!v || !v.includes('T')) return { date: null, time: null };
  const parts = v.split('T');
  return {
    date: parts[0] || null,
    time: parts[1] ? `${parts[1]}:00` : null
  };
}

function scheduleStatusDbToUi(dbStatus) {
  const s = String(dbStatus || '').toLowerCase();
  if (s === 'completed') return 'Done';
  if (s === 'ongoing') return 'Ongoing';
  if (s === 'cancelled') return 'Cancelled';
  return 'Upcoming';
}

function scheduleStatusUiToDb(uiStatus) {
  const s = String(uiStatus || '').toLowerCase();
  if (s === 'done') return 'Completed';
  if (s === 'ongoing') return 'Ongoing';
  if (s === 'cancelled') return 'Cancelled';
  return 'Scheduled';
}

function deriveAutoScheduleStatus(startDt, hasWinner, nowDt) {
  if (hasWinner) return 'Done';
  if (!(startDt instanceof Date) || isNaN(startDt.getTime())) return 'Upcoming';
  const now = nowDt instanceof Date ? nowDt : new Date();
  if (now.getTime() >= startDt.getTime()) return 'Ongoing';
  return 'Upcoming';
}

function scheduleStatusPillClass(uiStatus) {
  const s = String(uiStatus || 'Upcoming').toLowerCase();
  if (s === 'ongoing') return 'schedule-status live';
  return 'schedule-status';
}

function scheduleStatusPillStyle(uiStatus) {
  const s = String(uiStatus || 'Upcoming').toLowerCase();
  if (s === 'done') return 'background:#e5e7eb;color:#374151;';
  if (s === 'cancelled') return 'background:#fee2e2;color:#b91c1c;';
  if (s === 'upcoming') return 'background:#dcfce7;color:#15803d;';
  return '';
}

function scheduleMatchSort(a, b) {
  const stageRank = { upper: 1, main: 1, lower: 2, third_place: 3, final: 4, round_robin: 5 };
  const stageA = stageRank[String(a.bracket_stage || 'main')] || 99;
  const stageB = stageRank[String(b.bracket_stage || 'main')] || 99;
  if (stageA !== stageB) return stageA - stageB;
  const roundA = Number(a.round || 0);
  const roundB = Number(b.round || 0);
  if (roundA !== roundB) return roundA - roundB;
  return Number(a.id || 0) - Number(b.id || 0);
}

function normalizeScheduleMatches(rawMatches) {
  const sorted = rawMatches.slice().sort(scheduleMatchSort);
  return sorted.map((m) => {
    const start = scheduleParseDateTime(m.date, m.time);
    const hasWinner = Number(m.winner_team_id || 0) > 0;
    const derived = deriveAutoScheduleStatus(start, hasWinner, new Date());
    const mapped = scheduleStatusDbToUi(m.status);
    return {
      id: Number(m.id),
      label: m.label || `Round ${Number(m.round || 1)}`,
      round: Number(m.round || 0),
      bracket_stage: m.bracket_stage || 'main',
      winner_team_id: m.winner_team_id ? Number(m.winner_team_id) : null,
      team1: m.team1 || null,
      team2: m.team2 || null,
      date: m.date || '',
      time: m.time || '',
      location: m.location || '',
      description: m.description || '',
      status: mapped === 'Cancelled' ? 'Cancelled' : derived
    };
  });
}

function renderEventScheduleViewButtons() {
  const listBtn = document.getElementById('adminScheduleViewList');
  const calBtn = document.getElementById('adminScheduleViewCalendar');
  if (!listBtn || !calBtn) return;
  listBtn.classList.toggle('active', eventSchedulesState.view === 'list');
  calBtn.classList.toggle('active', eventSchedulesState.view === 'calendar');
}

function formatScheduleDateTimeForList(datePart, timePart) {
  const dt = scheduleParseDateTime(datePart, timePart);
  if (!dt) return '—';
  return dt.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
}

function renderEventScheduleList(matches) {
  const listWrap = document.getElementById('adminScheduleList');
  if (!listWrap) return;

  if (!matches.length) {
    listWrap.className = 'schedule-list';
    listWrap.innerHTML = '<div class="empty-state">No saved schedules for this event yet.</div>';
    return;
  }

  listWrap.className = 'schedule-list';
  listWrap.innerHTML = matches.map((m) => {
    const team1 = m.team1 && m.team1.name ? m.team1.name : '-';
    const team2 = m.team2 && m.team2.name ? m.team2.name : '-';
    const selected = Number(m.id) === Number(eventSchedulesState.selectedMatchId);
    return '' +
      '<div class="schedule-item" style="grid-template-columns:180px 1fr auto; border-color:' + (selected ? '#3b82f6' : '#eceef5') + ';">' +
        '<div class="schedule-time">' + escapeAdminHTML(formatScheduleDateTimeForList(m.date, m.time)) + '</div>' +
        '<div><strong>' + escapeAdminHTML(team1 + ' vs ' + team2) + '</strong><div class="schedule-meta">' +
          escapeAdminHTML(m.label) + ' • ' + escapeAdminHTML(m.location || 'No location') +
        '</div></div>' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<span class="' + scheduleStatusPillClass(m.status) + '" style="' + scheduleStatusPillStyle(m.status) + '">' + escapeAdminHTML(m.status) + '</span>' +
          '<button type="button" class="btn" data-sched-select="' + Number(m.id) + '" style="background:#f0f2f5;color:#333;font-size:.75rem;padding:6px 10px;">Edit</button>' +
        '</div>' +
      '</div>';
  }).join('');
}

function renderEventScheduleCalendar(matches) {
  const listWrap = document.getElementById('adminScheduleList');
  if (!listWrap) return;

  const parsedEntries = matches.map((m) => {
    return { match: m, date: scheduleParseDateTime(m.date, m.time) };
  }).filter((entry) => entry.date !== null);

  if (!parsedEntries.length) {
    listWrap.className = 'schedule-list';
    listWrap.innerHTML = '<div class="empty-state">No valid schedule dates to display in calendar view.</div>';
    return;
  }

  if (eventSchedulesState.calendarYear === null || eventSchedulesState.calendarMonth === null) {
    const initialDate = parsedEntries[0].date;
    eventSchedulesState.calendarYear = initialDate.getFullYear();
    eventSchedulesState.calendarMonth = initialDate.getMonth();
  }

  const year = eventSchedulesState.calendarYear;
  const month = eventSchedulesState.calendarMonth;
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const eventsByDay = {};
  parsedEntries.forEach((entry) => {
    if (entry.date.getFullYear() !== year || entry.date.getMonth() !== month) return;
    const day = entry.date.getDate();
    if (!eventsByDay[day]) eventsByDay[day] = [];
    eventsByDay[day].push(entry);
  });

  let html = '<div class="schedule-calendar">' +
    '<div class="calendar-header">' +
      '<button type="button" class="calendar-nav-btn" data-calendar-nav="prev" aria-label="Previous month">&#8249;</button>' +
      '<span class="calendar-month-label">' + escapeAdminHTML(monthLabel) + '</span>' +
      '<button type="button" class="calendar-nav-btn" data-calendar-nav="next" aria-label="Next month">&#8250;</button>' +
    '</div>' +
    '<div class="calendar-weekdays">' +
      '<span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>' +
    '</div><div class="calendar-grid">';

  for (let blank = 0; blank < startOffset; blank += 1) {
    html += '<div class="calendar-cell empty"></div>';
  }

  for (let dayNum = 1; dayNum <= daysInMonth; dayNum += 1) {
    const dayEvents = eventsByDay[dayNum] || [];
    html += '<div class="calendar-cell">';
    html += '<div class="calendar-day">' + dayNum + '</div>';

    if (!dayEvents.length) {
      html += '<div class="calendar-no-events">No games</div>';
    } else {
      html += '<div class="calendar-events">';
      dayEvents.slice(0, 3).forEach((entry) => {
        const match = entry.match;
        const timeLabel = entry.date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        html += '<button type="button" class="calendar-event" data-sched-select="' + Number(match.id) + '" style="cursor:pointer;text-align:left;' + (Number(match.id) === Number(eventSchedulesState.selectedMatchId) ? 'outline:2px solid #3b82f6;' : '') + '">' +
          '<strong>' + escapeAdminHTML(timeLabel) + '</strong><span>' + escapeAdminHTML((match.team1?.name || '-') + ' vs ' + (match.team2?.name || '-')) + '</span>' +
        '</button>';
      });
      if (dayEvents.length > 3) {
        html += '<div class="calendar-more">+' + (dayEvents.length - 3) + ' more</div>';
      }
      html += '</div>';
    }

    html += '</div>';
  }

  html += '</div></div>';
  listWrap.className = 'schedule-list schedule-list-calendar';
  listWrap.innerHTML = html;
}

function renderEventScheduleView() {
  renderEventScheduleViewButtons();
  const matches = eventSchedulesState.matches || [];
  if (eventSchedulesState.view === 'calendar') {
    renderEventScheduleCalendar(matches);
  } else {
    renderEventScheduleList(matches);
  }
}

function selectEventScheduleMatch(matchId) {
  const id = Number(matchId || 0);
  const match = (eventSchedulesState.matches || []).find((m) => Number(m.id) === id);
  if (!match) return;

  eventSchedulesState.selectedMatchId = id;

  const hint = document.getElementById('adminScheduleEditorHint');
  const matchIdEl = document.getElementById('adminScheduleMatchId');
  const matchLabelEl = document.getElementById('adminScheduleMatchLabel');
  const startEl = document.getElementById('adminScheduleStart');
  const locationEl = document.getElementById('adminScheduleLocation');
  const descEl = document.getElementById('adminScheduleDescription');
  const statusEl = document.getElementById('adminScheduleStatus');

  if (hint) hint.textContent = 'Status auto-validates from machine time; Done is only set when winner is declared, unless status is set to Cancelled.';
  if (matchIdEl) matchIdEl.value = String(id);

  const team1 = match.team1 && match.team1.name ? match.team1.name : '-';
  const team2 = match.team2 && match.team2.name ? match.team2.name : '-';
  if (matchLabelEl) matchLabelEl.value = `${match.label} (${team1} vs ${team2})`;

  const start = scheduleParseDateTime(match.date, match.time);

  if (startEl) startEl.value = start ? scheduleDateTimeToInputValue(start) : '';
  if (locationEl) locationEl.value = match.location || '';
  if (descEl) descEl.value = match.description || '';
  if (statusEl) statusEl.value = match.status || 'Upcoming';

  renderEventScheduleView();
}

async function saveSelectedEventSchedule() {
  const matchId = Number(document.getElementById('adminScheduleMatchId')?.value || 0);
  if (matchId <= 0) {
    adminToast('Select a match to edit.', 'error');
    return;
  }

  const match = (eventSchedulesState.matches || []).find((m) => Number(m.id) === matchId);
  if (!match) {
    adminToast('Selected match was not found.', 'error');
    return;
  }

  const startInput = document.getElementById('adminScheduleStart')?.value || '';
  const location = (document.getElementById('adminScheduleLocation')?.value || '').trim();
  const description = (document.getElementById('adminScheduleDescription')?.value || '').trim();
  const statusSelected = document.getElementById('adminScheduleStatus')?.value || 'Upcoming';

  if (!startInput) {
    adminToast('Start datetime is required.', 'error');
    return;
  }
  const startDt = new Date(startInput);
  if (isNaN(startDt.getTime())) {
    adminToast('Invalid start datetime.', 'error');
    return;
  }

  const hasWinner = Number(match.winner_team_id || 0) > 0;
  const autoStatus = statusSelected === 'Cancelled'
    ? 'Cancelled'
    : deriveAutoScheduleStatus(startDt, hasWinner, new Date());

  const startParts = scheduleInputToParts(startInput);

  try {
    const res = await fetch('../api/matches/update.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: matchId,
        schedule_date: startParts.date,
        schedule_time: startParts.time,
        location: location || null,
        match_description: description || null,
        match_status: scheduleStatusUiToDb(autoStatus)
      })
    });
    const json = await parseApiJson(res);
    if (!json.success) throw new Error(json.message || 'Failed to save match schedule.');

    match.date = startParts.date || '';
    match.time = startParts.time || '';
    match.location = location;
    match.description = description;
    match.status = autoStatus;

    const statusEl = document.getElementById('adminScheduleStatus');
    if (statusEl) statusEl.value = autoStatus;

    renderEventScheduleView();
    adminToast('Match schedule saved successfully.');
  } catch (err) {
    console.error('saveSelectedEventSchedule error:', err);
    adminToast(err.message || 'Failed to save match schedule.', 'error');
  }
}

window.openEventSchedules = async function(id) {
  const ev = eventsCache.find(e => Number(e.id) === Number(id));
  if (!ev) {
    adminToast('Event not found.', 'error');
    return;
  }

  const titleEl = document.getElementById('eventSchedulesModalTitle');
  const listWrap = document.getElementById('adminScheduleList');
  if (!listWrap) {
    adminToast('Schedules modal is not available on this page.', 'error');
    return;
  }

  if (titleEl) titleEl.textContent = `Saved Match Schedules - ${ev.title || 'Event'}`;
  listWrap.className = 'schedule-list';
  listWrap.innerHTML = '<div class="empty-state">Loading schedules...</div>';

  eventSchedulesState = {
    event: ev,
    matches: [],
    view: 'list',
    calendarYear: null,
    calendarMonth: null,
    selectedMatchId: null
  };
  renderEventScheduleViewButtons();
  openModal('eventSchedulesModal');

  try {
    const res = await fetch(`../api/brackets/read.php?event_id=${Number(ev.id)}`);
    const json = await parseApiJson(res);

    if (!json.success || !json.data || !Array.isArray(json.data.matches) || !json.data.matches.length) {
      listWrap.innerHTML = '<div class="empty-state">No saved bracket matches found for this event.</div>';
      return;
    }

    eventSchedulesState.matches = normalizeScheduleMatches(json.data.matches);

    const firstWithDate = eventSchedulesState.matches.find((m) => scheduleParseDateTime(m.date, m.time));
    if (firstWithDate) {
      const start = scheduleParseDateTime(firstWithDate.date, firstWithDate.time);
      eventSchedulesState.calendarYear = start.getFullYear();
      eventSchedulesState.calendarMonth = start.getMonth();
    }

    renderEventScheduleView();

    if (eventSchedulesState.matches.length) {
      selectEventScheduleMatch(eventSchedulesState.matches[0].id);
    }
  } catch (err) {
    console.error('openEventSchedules error:', err);
    listWrap.className = 'schedule-list';
    listWrap.innerHTML = '<div class="empty-state" style="color:#e53935;">' + escapeAdminHTML(err.message || 'Failed to load schedules.') + '</div>';
  }
};

function buildAutoPairings(teams) {
  const slots = [];
  for (let i = 0; i < teams.length; i += 2) {
    slots.push({
      teamA: teams[i] || null,
      teamB: teams[i + 1] || null
    });
  }
  return slots;
}

function buildEmptyPairingsByTeamCount(teamCount) {
  const matchCount = Math.max(2, Math.ceil(Number(teamCount || 0) / 2));
  return Array.from({ length: matchCount }, () => ({ teamA: null, teamB: null }));
}

function eliminationRoundLabelByMatchCount(matchCount, roundNo) {
  if (matchCount === 1) return 'Finals';
  if (matchCount === 2) return 'Semifinals';
  if (matchCount === 4) return 'Quarterfinals';
  if (matchCount === 8) return 'Round of 16';
  if (matchCount === 16) return 'Round of 32';
  return `Round ${roundNo}`;
}

function generateSingleEliminationPayload(manualPairings, includeThirdPlaceMatch = false) {
  const matches = [];
  let matchId = 1;
  const rounds = [];

  rounds.push(manualPairings.map(pair => {
    const m = {
      id: matchId++,
      round: 1,
      label: '',
      team1: pair.teamA,
      team2: pair.teamB,
      score1: 0,
      score2: 0,
      winner_team_id: null,
      status: 'Pending',
      date: '',
      time: '',
      location: '',
      description: '',
      next_match_id: null,
      next_slot: null
    };
    matches.push(m);
    return m;
  }));

  let prevRound = rounds[0];
  let roundNo = 2;
  while (prevRound.length > 1) {
    const nextRound = [];
    for (let i = 0; i < prevRound.length; i += 2) {
      const m = {
        id: matchId++,
        round: roundNo,
        label: '',
        team1: null,
        team2: null,
        score1: 0,
        score2: 0,
        winner_team_id: null,
        status: 'Pending',
        date: '',
        time: '',
        location: '',
        description: '',
        next_match_id: null,
        next_slot: null
      };
      matches.push(m);
      nextRound.push(m);
      if (prevRound[i]) {
        prevRound[i].next_match_id = m.id;
        prevRound[i].next_slot = 'team1';
      }
      if (prevRound[i + 1]) {
        prevRound[i + 1].next_match_id = m.id;
        prevRound[i + 1].next_slot = 'team2';
      }
    }
    rounds.push(nextRound);
    prevRound = nextRound;
    roundNo += 1;
  }

  rounds.forEach((roundMatches, idx) => {
    const roundLabel = eliminationRoundLabelByMatchCount(roundMatches.length, idx + 1);
    roundMatches.forEach(match => {
      match.label = roundLabel;
    });
  });

  // Add optional third-place playoff from semifinal losers.
  if (includeThirdPlaceMatch && rounds.length >= 2) {
    const finalRoundNo = rounds.length;
    const semifinalRound = rounds[finalRoundNo - 2] || [];

    if (semifinalRound.length >= 2) {
      const thirdPlaceMatch = {
        id: matchId++,
        round: finalRoundNo,
        label: '3rd Place Match',
        bracket_stage: 'third_place',
        team1: null,
        team2: null,
        score1: 0,
        score2: 0,
        winner_team_id: null,
        status: 'Pending',
        date: '',
        time: '',
        location: '',
        description: 'Losers of the semifinals play for 3rd place.',
        next_match_id: null,
        next_slot: null,
        loser_next_match_id: null,
        loser_next_slot: null
      };

      semifinalRound[0].loser_next_match_id = thirdPlaceMatch.id;
      semifinalRound[0].loser_next_slot = 'team1';
      semifinalRound[1].loser_next_match_id = thirdPlaceMatch.id;
      semifinalRound[1].loser_next_slot = 'team2';

      matches.push(thirdPlaceMatch);
    }
  }

  return matches;
}

function generateRoundRobinPayload(teams) {
  // Match the requested 4-team layout exactly:
  // R1: 1v2, 3v4
  // R2: 1v3, 2v4
  // R3: 1v4, 2v3
  if (teams.length === 4) {
    const [t1, t2, t3, t4] = teams;
    return [
      {
        id: 1,
        round: 1,
        label: 'Round 1',
        team1: t1,
        team2: t2,
        score1: 0,
        score2: 0,
        winner_team_id: null,
        status: 'Pending',
        date: '',
        time: '',
        location: '',
        description: '',
        next_match_id: null,
        next_slot: null
      },
      {
        id: 2,
        round: 1,
        label: 'Round 1',
        team1: t3,
        team2: t4,
        score1: 0,
        score2: 0,
        winner_team_id: null,
        status: 'Pending',
        date: '',
        time: '',
        location: '',
        description: '',
        next_match_id: null,
        next_slot: null
      },
      {
        id: 3,
        round: 2,
        label: 'Round 2',
        team1: t1,
        team2: t3,
        score1: 0,
        score2: 0,
        winner_team_id: null,
        status: 'Pending',
        date: '',
        time: '',
        location: '',
        description: '',
        next_match_id: null,
        next_slot: null
      },
      {
        id: 4,
        round: 2,
        label: 'Round 2',
        team1: t2,
        team2: t4,
        score1: 0,
        score2: 0,
        winner_team_id: null,
        status: 'Pending',
        date: '',
        time: '',
        location: '',
        description: '',
        next_match_id: null,
        next_slot: null
      },
      {
        id: 5,
        round: 3,
        label: 'Round 3',
        team1: t1,
        team2: t4,
        score1: 0,
        score2: 0,
        winner_team_id: null,
        status: 'Pending',
        date: '',
        time: '',
        location: '',
        description: '',
        next_match_id: null,
        next_slot: null
      },
      {
        id: 6,
        round: 3,
        label: 'Round 3',
        team1: t2,
        team2: t3,
        score1: 0,
        score2: 0,
        winner_team_id: null,
        status: 'Pending',
        date: '',
        time: '',
        location: '',
        description: '',
        next_match_id: null,
        next_slot: null
      }
    ];
  }

  // Generic round-robin fallback (circle method)
  const pool = teams.map(t => ({ ...t }));
  if (pool.length % 2 === 1) {
    pool.push({ id: null, team_name: 'BYE', name: 'BYE', __bye: true });
  }

  const matches = [];
  let matchId = 1;
  let rotation = pool.slice();
  const roundsCount = rotation.length - 1;

  for (let r = 1; r <= roundsCount; r += 1) {
    for (let i = 0; i < rotation.length / 2; i += 1) {
      const a = rotation[i];
      const b = rotation[rotation.length - 1 - i];
      if (a?.__bye || b?.__bye) continue;

      matches.push({
        id: matchId++,
        round: r,
        label: `Round ${r}`,
        team1: a,
        team2: b,
        score1: 0,
        score2: 0,
        winner_team_id: null,
        status: 'Pending',
        date: '',
        time: '',
        location: '',
        description: '',
        next_match_id: null,
        next_slot: null
      });
    }

    const fixed = rotation[0];
    const rest = rotation.slice(1);
    rest.unshift(rest.pop());
    rotation = [fixed, ...rest];
  }

  return matches;
}

function buildSeededUpperRoundForFourTeams(teams) {
  if (teams.length !== 4) {
    return buildAutoPairings(teams);
  }

  return [
    { teamA: teams[0], teamB: teams[3] }, // 1 vs 4
    { teamA: teams[2], teamB: teams[1] }  // 3 vs 2
  ];
}

function generateDoubleEliminationPayload(teams) {
  const pairings = buildAutoPairings(teams);
  const upper = generateSingleEliminationPayload(pairings).map(m => ({
    ...m,
    bracket_stage: 'upper',
    loser_next_match_id: null,
    loser_next_slot: null
  }));

  const upperRounds = {};
  upper.forEach(m => {
    const r = Number(m.round || 1);
    if (!upperRounds[r]) upperRounds[r] = [];
    upperRounds[r].push(m);
  });

  const upperRoundNos = Object.keys(upperRounds).map(Number).sort((a, b) => a - b);
  upperRoundNos.forEach(r => {
    const label = eliminationRoundLabelByMatchCount(upperRounds[r].length, r);
    upperRounds[r].forEach(m => {
      m.label = `Winners ${label}`;
    });
  });

  let nextId = upper.reduce((max, m) => Math.max(max, Number(m.id || 0)), 0) + 1;
  const lower = [];
  let lowerRoundNo = 1;
  let lowerLabelNo = 1;

  function createLowerRound(matchCount) {
    const roundMatches = [];
    for (let i = 0; i < matchCount; i += 1) {
      const m = {
        id: nextId++,
        round: lowerRoundNo,
        label: `Losers Round ${lowerLabelNo}`,
        bracket_stage: 'lower',
        team1: null,
        team2: null,
        score1: 0,
        score2: 0,
        winner_team_id: null,
        status: 'Pending',
        date: '',
        time: '',
        location: '',
        description: '',
        next_match_id: null,
        next_slot: null,
        loser_next_match_id: null,
        loser_next_slot: null
      };
      lower.push(m);
      roundMatches.push(m);
    }
    lowerRoundNo += 1;
    lowerLabelNo += 1;
    return roundMatches;
  }

  function setWinnerPath(sourceMatch, targetMatch, slot) {
    if (!sourceMatch || !targetMatch) return;
    sourceMatch.next_match_id = targetMatch.id;
    sourceMatch.next_slot = slot;
  }

  function setLoserPath(sourceMatch, targetMatch, slot) {
    if (!sourceMatch || !targetMatch) return;
    sourceMatch.loser_next_match_id = targetMatch.id;
    sourceMatch.loser_next_slot = slot;
  }

  const firstUpper = upperRounds[1] || [];
  let lowerWinnersFeed = [];

  if (firstUpper.length) {
    const l1Count = Math.max(1, Math.ceil(firstUpper.length / 2));
    const l1 = createLowerRound(l1Count);
    firstUpper.forEach((um, i) => {
      const target = l1[Math.floor(i / 2)];
      const slot = (i % 2 === 0) ? 'team1' : 'team2';
      setLoserPath(um, target, slot);
    });
    lowerWinnersFeed = l1.slice();
  }

  for (let wr = 2; wr <= upperRoundNos.length; wr += 1) {
    const winnersRound = upperRounds[wr] || [];
    if (!winnersRound.length) continue;

    while (lowerWinnersFeed.length > winnersRound.length) {
      const prepCount = Math.ceil(lowerWinnersFeed.length / 2);
      const prepRound = createLowerRound(prepCount);
      lowerWinnersFeed.forEach((src, i) => {
        const target = prepRound[Math.floor(i / 2)];
        const slot = (i % 2 === 0) ? 'team1' : 'team2';
        setWinnerPath(src, target, slot);
      });
      lowerWinnersFeed = prepRound.slice();
    }

    const mergeRound = createLowerRound(winnersRound.length);
    winnersRound.forEach((um, i) => {
      const target = mergeRound[i];
      if (lowerWinnersFeed[i]) setWinnerPath(lowerWinnersFeed[i], target, 'team1');
      setLoserPath(um, target, 'team2');
    });
    lowerWinnersFeed = mergeRound.slice();
  }

  while (lowerWinnersFeed.length > 1) {
    const prepCount = Math.ceil(lowerWinnersFeed.length / 2);
    const prepRound = createLowerRound(prepCount);
    lowerWinnersFeed.forEach((src, i) => {
      const target = prepRound[Math.floor(i / 2)];
      const slot = (i % 2 === 0) ? 'team1' : 'team2';
      setWinnerPath(src, target, slot);
    });
    lowerWinnersFeed = prepRound.slice();
  }

  const finalRoundNo = (upperRoundNos.length || 1) + 1;
  const grandFinal = {
    id: nextId++,
    round: finalRoundNo,
    label: 'Grand Final',
    bracket_stage: 'final',
    team1: null,
    team2: null,
    score1: 0,
    score2: 0,
    winner_team_id: null,
    status: 'Pending',
    date: '',
    time: '',
    location: '',
    description: 'Winners Champion vs Losers Champion',
    next_match_id: null,
    next_slot: null,
    loser_next_match_id: null,
    loser_next_slot: null
  };

  const winnersFinal = upperRounds[upperRoundNos[upperRoundNos.length - 1]]?.[0] || null;
  if (winnersFinal) setWinnerPath(winnersFinal, grandFinal, 'team1');
  if (lowerWinnersFeed[0]) setWinnerPath(lowerWinnersFeed[0], grandFinal, 'team2');

  // Improve lower bracket round labels for terminal rounds
  const lowerRoundMap = {};
  lower.forEach(m => {
    const k = m.round;
    if (!lowerRoundMap[k]) lowerRoundMap[k] = [];
    lowerRoundMap[k].push(m);
  });
  const lowerRoundKeys = Object.keys(lowerRoundMap).map(Number).sort((a, b) => a - b);
  if (lowerRoundKeys.length >= 1) {
    lowerRoundMap[lowerRoundKeys[lowerRoundKeys.length - 1]].forEach(m => { m.label = 'Losers Final'; });
  }
  if (lowerRoundKeys.length >= 2) {
    const semiKey = lowerRoundKeys[lowerRoundKeys.length - 2];
    if (lowerRoundMap[semiKey].length === 1) {
      lowerRoundMap[semiKey].forEach(m => { m.label = 'Losers Semifinals'; });
    }
  }

  return [...upper, ...lower, grandFinal];
}

async function generateTournamentBracket() {
  const event = bracketSetupContext.event;
  const teams = bracketSetupContext.teams || [];
  const existingBracketId = Number(bracketSetupContext.existingBracketId || 0);
  const existingParticipantCount = Number(bracketSetupContext.existingParticipantCount || 0);
  const existingTournamentType = String(bracketSetupContext.existingTournamentType || '');
  const existingThirdPlace = Number(bracketSetupContext.existingThirdPlace ? 1 : 0) === 1;
  if (!event) {
    adminToast('Event context is missing.', 'error');
    return;
  }

  const currentTournamentType = String(event.tournament_type || 'single_elimination');
  const currentThirdPlace = (event.has_third_place_match == null ? true : Number(event.has_third_place_match) === 1);

  // If bracket already exists and still matches current approved team count,
  // open it instead of regenerating.
  if (
    existingBracketId > 0 &&
    existingParticipantCount === Number(teams.length) &&
    existingTournamentType === currentTournamentType &&
    existingThirdPlace === currentThirdPlace
  ) {
    closeModal('eventBracketingModal');
    window.location.href = `bracket-landing.html?event_id=${Number(event.id)}&bracket_id=${existingBracketId}`;
    return;
  }

  if (teams.length < 3) {
    adminToast('Minimum of 3 approved teams is required.', 'error');
    return;
  }

  const type = currentTournamentType;
  const thirdPlace = currentThirdPlace;

  let matches = [];
  try {
    if (type === 'round_robin') {
      matches = generateRoundRobinPayload(teams);
    } else if (type === 'double_elimination') {
      matches = generateDoubleEliminationPayload(teams);
    } else {
      const pairings = buildEmptyPairingsByTeamCount(teams.length);
      matches = generateSingleEliminationPayload(pairings, thirdPlace);
    }
  } catch (e) {
    adminToast(e.message || 'Invalid bracket setup.', 'error');
    return;
  }

  const payload = {
    id: `bracket_${Date.now()}`,
    event_id: Number(event.id),
    event_title: event.title || '',
    category: event.category || '',
    tournament_type: type,
    third_place_match: thirdPlace,
    teams: teams.map(t => ({ id: Number(t.id), name: t.team_name || 'Unnamed Team' })),
    matches,
    created_at: new Date().toISOString()
  };

  // Save to localStorage as fallback / cache
  try {
    localStorage.setItem('otm_active_bracket', JSON.stringify(payload));
  } catch (e) { /* non-fatal */ }

  // Persist to database
  const btn = document.getElementById('generateBracketBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

  let bracketId = null;
  try {
    const loggedUser = JSON.parse(sessionStorage.getItem('otm_user') || localStorage.getItem('otm_user') || '{}');
    const uiTheme = (localStorage.getItem('otm_bracket_theme') === 'light') ? 'light' : 'dark';
    const res = await fetch('../api/brackets/save.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id:         Number(event.id),
        tournament_type:  type,
        third_place_match: thirdPlace,
        ui_theme:         uiTheme,
        category:         event.category || '',
        created_by:       loggedUser.id || null,
        teams:            payload.teams,
        matches:          payload.matches
      })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Save failed.');
    bracketId = json.bracket_id;

    // Update payload with real DB ids
    payload.bracket_id = bracketId;
    if (json.id_map) {
      payload.matches.forEach(m => {
        const dbId = json.id_map[m.id];
        if (dbId) m.db_id = dbId;
      });
    }
    localStorage.setItem('otm_active_bracket', JSON.stringify(payload));
  } catch (err) {
    adminToast('Failed to save bracket to database: ' + (err.message || err), 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Create Bracket'; }
    return;
  }

  if (btn) { btn.disabled = false; btn.textContent = 'Create Bracket'; }
  closeModal('eventBracketingModal');
  window.location.href = `bracket-landing.html?event_id=${Number(event.id)}&bracket_id=${bracketId}`;
}

function initInlineBracketLanding() {
  const tabInfo = document.getElementById('inlineTabInfo');
  const tabScores = document.getElementById('inlineTabScores');
  const saveInfo = document.getElementById('inlineSaveMatchInfoBtn');
  const clearInfo = document.getElementById('inlineClearMatchInfoBtn');
  const submitScores = document.getElementById('inlineSubmitScoresBtn');
  const resetScores = document.getElementById('inlineResetScoresBtn');
  const closeBracketPanelBtn = document.getElementById('inlineCloseBracketPanelBtn');
  const closeMatchPanelBtn = document.getElementById('inlineCloseMatchPanelBtn');

  if (tabInfo) tabInfo.addEventListener('click', () => setInlineMatchTab('info'));
  if (tabScores) tabScores.addEventListener('click', () => setInlineMatchTab('scores'));
  if (saveInfo) saveInfo.addEventListener('click', saveInlineMatchInfo);
  if (clearInfo) clearInfo.addEventListener('click', clearInlineMatchInfo);
  if (submitScores) submitScores.addEventListener('click', submitInlineMatchScores);
  if (resetScores) resetScores.addEventListener('click', resetInlineMatchScores);
  if (closeBracketPanelBtn) closeBracketPanelBtn.addEventListener('click', closeInlineBracketLanding);
  if (closeMatchPanelBtn) closeMatchPanelBtn.addEventListener('click', closeInlineMatchPanel);

  const stage = document.getElementById('inlineBracketStage');
  if (stage) {
    stage.addEventListener('click', (e) => {
      const card = e.target.closest('[data-inline-match-id]');
      if (!card) return;
      openInlineMatchModal(Number(card.getAttribute('data-inline-match-id')));
    });
  }
}

function openInlineBracketLanding(payload) {
  inlineBracketData = payload;
  inlineBracketSelectedMatchId = null;

  const title = document.getElementById('inlineBracketTitle');
  const chipType = document.getElementById('inlineChipType');
  const chipCategory = document.getElementById('inlineChipCategory');
  const chipThird = document.getElementById('inlineChipThird');
  const chipTeams = document.getElementById('inlineChipTeams');

  if (title) title.textContent = `Bracket - ${payload.event_title || 'Event'}`;
  if (chipType) chipType.textContent = `Type: ${String(payload.tournament_type || '-').replace(/_/g, ' ')}`;
  if (chipCategory) chipCategory.textContent = `Category: ${payload.category || '-'}`;
  if (chipThird) chipThird.textContent = `3rd Place Match: ${payload.third_place_match ? 'Yes' : 'No'}`;
  if (chipTeams) chipTeams.textContent = `Teams: ${(payload.teams || []).length || 0}`;

  renderInlineBracketBoard();
  const panel = document.getElementById('inlineBracketPanel');
  if (panel) {
    panel.style.display = 'block';
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function closeInlineBracketLanding() {
  const panel = document.getElementById('inlineBracketPanel');
  const matchPanel = document.getElementById('inlineMatchEditorPanel');
  if (matchPanel) matchPanel.style.display = 'none';
  if (panel) panel.style.display = 'none';
}

function findInlineMatch(id) {
  return (inlineBracketData?.matches || []).find((m) => Number(m.id) === Number(id));
}

function inlineTeamName(team) {
  return team ? (team.name || 'Team') : 'BYE';
}

function inlineTeamSeed(team) {
  if (!team || !Array.isArray(inlineBracketData?.teams)) return '-';
  const idx = inlineBracketData.teams.findIndex((t) => Number(t.id) === Number(team.id));
  return idx >= 0 ? idx + 1 : '-';
}

function inlineMatchWinnerSide(match) {
  if (!match?.winner_team_id) return 0;
  if (match.team1 && Number(match.team1.id) === Number(match.winner_team_id)) return 1;
  if (match.team2 && Number(match.team2.id) === Number(match.winner_team_id)) return 2;
  return 0;
}

function assignInlineWinnerToNext(match, winnerTeam) {
  if (!match || !winnerTeam || !match.next_match_id) return;
  const next = findInlineMatch(match.next_match_id);
  if (!next) return;
  if (match.next_slot === 'team1') next.team1 = winnerTeam;
  if (match.next_slot === 'team2') next.team2 = winnerTeam;
}

function autoAdvanceInlineByes() {
  if (!inlineBracketData?.matches) return;
  inlineBracketData.matches.forEach((match) => {
    if (String(match.status) === 'Completed') return;
    const onlyTeam1 = match.team1 && !match.team2;
    const onlyTeam2 = !match.team1 && match.team2;
    if (!onlyTeam1 && !onlyTeam2) return;
    const winner = onlyTeam1 ? match.team1 : match.team2;
    match.winner_team_id = winner ? Number(winner.id) : null;
    match.status = 'Completed';
    assignInlineWinnerToNext(match, winner);
  });
}

function renderInlineEliminationBoard() {
  const stage = document.getElementById('inlineBracketStage');
  if (!stage || !inlineBracketData) return;

  const CARD_HEIGHT = 86;
  const BASE_GAP = 14;
  const UNIT = CARD_HEIGHT + BASE_GAP;

  const roundsMap = {};
  (inlineBracketData.matches || []).forEach((m) => {
    const key = Number(m.round || 1);
    if (!roundsMap[key]) roundsMap[key] = [];
    roundsMap[key].push(m);
  });

  const rounds = Object.keys(roundsMap).map(Number).sort((a, b) => a - b);
  if (!rounds.length) {
    stage.innerHTML = '<div class="inline-empty-note">No matches generated yet.</div>';
    return;
  }

  stage.innerHTML = '<div class="inline-rounds">' + rounds.map((r, roundIndex) => {
    const roundMatches = roundsMap[r] || [];
    const hasConnectors = roundIndex < (rounds.length - 1);
    const step = UNIT * Math.pow(2, roundIndex);
    const offset = Math.max(0, (step / 2) - (CARD_HEIGHT / 2));

    let prevBottom = 0;
    const matchesHtml = roundMatches.map((match, matchIndex) => {
      const winnerSide = inlineMatchWinnerSide(match);
      const y = offset + (matchIndex * step);
      const marginTop = Math.max(0, Math.round(y - prevBottom));
      prevBottom = y + CARD_HEIGHT;

      return '<div class="inline-match-wrap" style="margin-top:' + marginTop + 'px;--pair-step:' + step + 'px;">' +
        '<div class="inline-match-card" data-inline-match-id="' + match.id + '">' +
          '<div class="inline-team-row' + (winnerSide === 1 ? ' winner' : '') + '">' +
            '<div class="inline-seed-col">' + escapeAdminHTML(String(inlineTeamSeed(match.team1))) + '</div>' +
            '<div class="inline-team-name">' + escapeAdminHTML(inlineTeamName(match.team1)) + '</div>' +
            '<div class="inline-team-score">' + Number(match.score1 || 0) + '</div>' +
          '</div>' +
          '<div class="inline-team-row' + (winnerSide === 2 ? ' winner' : '') + '">' +
            '<div class="inline-seed-col">' + escapeAdminHTML(String(inlineTeamSeed(match.team2))) + '</div>' +
            '<div class="inline-team-name">' + escapeAdminHTML(inlineTeamName(match.team2)) + '</div>' +
            '<div class="inline-team-score">' + Number(match.score2 || 0) + '</div>' +
          '</div>' +
        '</div>' +
        (hasConnectors && (matchIndex % 2 === 0) ? '<span class="inline-connector-out"></span>' : '') +
      '</div>';
    }).join('');

    return '<div class="inline-round' + (hasConnectors ? ' has-connectors' : '') + '">' +
      '<h3 class="inline-round-title">' + escapeAdminHTML(roundMatches[0]?.label || `Round ${r}`) + '</h3>' +
      '<div class="inline-round-matches">' + matchesHtml + '</div>' +
    '</div>';
  }).join('') + '</div>';
}

function renderInlineRoundRobinBoard() {
  const stage = document.getElementById('inlineBracketStage');
  if (!stage || !inlineBracketData) return;

  const matches = inlineBracketData.matches || [];
  if (!matches.length) {
    stage.innerHTML = '<div class="inline-empty-note">No round robin matches generated yet.</div>';
    return;
  }

  stage.innerHTML = '<div class="inline-rr-list">' + matches.map((match) => {
    const winnerSide = inlineMatchWinnerSide(match);
    const left = escapeAdminHTML(inlineTeamName(match.team1));
    const right = escapeAdminHTML(inlineTeamName(match.team2));
    const winner = winnerSide === 1 ? left : (winnerSide === 2 ? right : '-');
    return '<div class="inline-rr-item" data-inline-match-id="' + match.id + '">' +
      '<strong>' + left + '</strong> vs <strong>' + right + '</strong>' +
      ' | Score: ' + Number(match.score1 || 0) + ' - ' + Number(match.score2 || 0) +
      ' | Winner: ' + winner +
    '</div>';
  }).join('') + '</div>';
}

function renderInlineBracketBoard() {
  if (!inlineBracketData) return;
  autoAdvanceInlineByes();
  if (inlineBracketData.tournament_type === 'round_robin') {
    renderInlineRoundRobinBoard();
  } else {
    renderInlineEliminationBoard();
  }
}

function setInlineMatchTab(tab) {
  const paneInfo = document.getElementById('inlinePaneInfo');
  const paneScores = document.getElementById('inlinePaneScores');
  const tabInfo = document.getElementById('inlineTabInfo');
  const tabScores = document.getElementById('inlineTabScores');
  if (!paneInfo || !paneScores || !tabInfo || !tabScores) return;

  const isInfo = tab === 'info';
  paneInfo.style.display = isInfo ? 'block' : 'none';
  paneScores.style.display = isInfo ? 'none' : 'block';
  tabInfo.style.background = isInfo ? '#e8eaf6' : '#f0f2f5';
  tabInfo.style.color = isInfo ? '#1a237e' : '#555';
  tabScores.style.background = isInfo ? '#f0f2f5' : '#e8eaf6';
  tabScores.style.color = isInfo ? '#555' : '#1a237e';
}

function openInlineMatchModal(matchId) {
  inlineBracketSelectedMatchId = Number(matchId);
  const match = findInlineMatch(inlineBracketSelectedMatchId);
  if (!match) return;

  const dateEl = document.getElementById('inlineMatchDate');
  const timeEl = document.getElementById('inlineMatchTime');
  const locationEl = document.getElementById('inlineMatchLocation');
  const descEl = document.getElementById('inlineMatchDescription');
  const scoreTable = document.getElementById('inlineScoreTable');
  if (!dateEl || !timeEl || !locationEl || !descEl || !scoreTable) return;

  dateEl.value = match.date || '';
  timeEl.value = match.time || '';
  locationEl.value = match.location || '';
  descEl.value = match.description || '';

  const winnerSide = inlineMatchWinnerSide(match);
  scoreTable.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr><th>#</th><th>Team</th><th>Winner</th><th>Score</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>${escapeAdminHTML(String(inlineTeamSeed(match.team1)))}</td>
          <td>${escapeAdminHTML(inlineTeamName(match.team1))}</td>
          <td><input type="radio" name="inlineWinnerPick" value="1" ${winnerSide === 1 ? 'checked' : ''} /></td>
          <td><input id="inlineScoreInput1" type="number" min="0" value="${Number(match.score1 || 0)}" style="width:90px;" /></td>
        </tr>
        <tr>
          <td>${escapeAdminHTML(String(inlineTeamSeed(match.team2)))}</td>
          <td>${escapeAdminHTML(inlineTeamName(match.team2))}</td>
          <td><input type="radio" name="inlineWinnerPick" value="2" ${winnerSide === 2 ? 'checked' : ''} /></td>
          <td><input id="inlineScoreInput2" type="number" min="0" value="${Number(match.score2 || 0)}" style="width:90px;" /></td>
        </tr>
      </tbody>
    </table>
  `;

  setInlineMatchTab('info');
  const matchPanel = document.getElementById('inlineMatchEditorPanel');
  if (matchPanel) {
    matchPanel.style.display = 'block';
    matchPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function closeInlineMatchPanel() {
  const matchPanel = document.getElementById('inlineMatchEditorPanel');
  inlineBracketSelectedMatchId = null;
  if (matchPanel) matchPanel.style.display = 'none';
}

function saveInlineMatchInfo() {
  const match = findInlineMatch(inlineBracketSelectedMatchId);
  if (!match) return;
  match.date = document.getElementById('inlineMatchDate')?.value || '';
  match.time = document.getElementById('inlineMatchTime')?.value || '';
  match.location = document.getElementById('inlineMatchLocation')?.value || '';
  match.description = document.getElementById('inlineMatchDescription')?.value || '';
  localStorage.setItem('otm_active_bracket', JSON.stringify(inlineBracketData));
  adminToast('Match info saved.');
}

function clearInlineMatchInfo() {
  const match = findInlineMatch(inlineBracketSelectedMatchId);
  if (!match) return;
  match.date = '';
  match.time = '';
  match.location = '';
  match.description = '';
  localStorage.setItem('otm_active_bracket', JSON.stringify(inlineBracketData));
  openInlineMatchModal(match.id);
}

function submitInlineMatchScores() {
  const match = findInlineMatch(inlineBracketSelectedMatchId);
  if (!match) return;

  const score1 = Number(document.getElementById('inlineScoreInput1')?.value || 0);
  const score2 = Number(document.getElementById('inlineScoreInput2')?.value || 0);
  const winnerPick = document.querySelector('input[name="inlineWinnerPick"]:checked')?.value || '';

  if (!match.team1 && !match.team2) {
    adminToast('No teams in this match yet.', 'error');
    return;
  }

  let winner = null;
  if (winnerPick === '1' && match.team1) winner = match.team1;
  else if (winnerPick === '2' && match.team2) winner = match.team2;
  else {
    if (score1 === score2) {
      adminToast('Scores are tied. Please choose a winner.', 'error');
      return;
    }
    winner = score1 > score2 ? match.team1 : match.team2;
  }

  if (!winner) {
    adminToast('Unable to determine winner.', 'error');
    return;
  }

  match.score1 = score1;
  match.score2 = score2;
  match.winner_team_id = Number(winner.id);
  match.status = 'Completed';
  assignInlineWinnerToNext(match, winner);

  localStorage.setItem('otm_active_bracket', JSON.stringify(inlineBracketData));
  renderInlineBracketBoard();
  openInlineMatchModal(match.id);
}

function resetInlineMatchScores() {
  const match = findInlineMatch(inlineBracketSelectedMatchId);
  if (!match) return;
  match.score1 = 0;
  match.score2 = 0;
  match.winner_team_id = null;
  match.status = 'Pending';
  localStorage.setItem('otm_active_bracket', JSON.stringify(inlineBracketData));
  renderInlineBracketBoard();
  openInlineMatchModal(match.id);
}

function clearEventForm() {
  ['eventId', 'eventTitle', 'eventCategory', 'eventStartDate',
   'eventEndDate', 'eventLocation', 'eventTeams', 'eventDesc'].forEach(i => {
    const el = document.getElementById(i);
    if (el) el.value = '';
  });
  const sport  = document.getElementById('eventSportsId');
  if (sport)  sport.value  = '';
  const status = document.getElementById('eventStatus');
  if (status) status.value = 'Upcoming';
  const tournamentType = document.getElementById('eventTournamentType');
  if (tournamentType) tournamentType.value = 'single_elimination';
  const thirdPlaceDefault = document.querySelector('input[name="eventThirdPlace"][value="yes"]');
  if (thirdPlaceDefault) thirdPlaceDefault.checked = true;
  const titleEl = document.getElementById('eventModalTitle');
  if (titleEl) titleEl.textContent = 'Add New Event';
  // Hide teams field for new events
  const teamsGroup = document.getElementById('eventTeamsGroup');
  if (teamsGroup) teamsGroup.style.display = 'none';
}

let sportsCache = [];
const SPORT_PLACEHOLDER_PREVIEW = '../src/images/placeholder.png';
let sportPendingPhotoFile = null;
let sportPreviewPath = '';

async function renderSportsTable() {
  const tbody = document.getElementById('sportsTableBody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">Loading...</td></tr>';

  try {
    const res = await fetch('../api/sports/read.php');
    const json = await res.json();

    if (!json.success) {
      throw new Error(json.message || 'Failed to load sports.');
    }

    const rows = Array.isArray(json.data) ? json.data : [];
    sportsCache = rows.map(normalizeSportRow);

    if (!sportsCache.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">No sports found.</td></tr>';
      return;
    }

    tbody.innerHTML = sportsCache.map((sport, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeAdminHTML(sport.sport_code || '—')}</td>
        <td><strong>${escapeAdminHTML(sport.sport_name || '')}</strong></td>
        <td>${escapeAdminHTML(sport.photo_path || '—')}</td>
        <td><span class="badge badge-${sport.is_active ? 'success' : 'danger'}">${sport.is_active ? 'Active' : 'Inactive'}</span></td>
        <td>
          <div class="action-btns">
            <button class="action-btn edit" title="Edit" onclick="editSport(${Number(sport.id)})">✏️</button>
            <button class="action-btn del" title="Delete" onclick="deleteSport(${Number(sport.id)})">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('renderSportsTable error:', err);
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#e53935;padding:20px;">Failed to load sports.</td></tr>';
  }
}

function normalizeSportRow(row) {
  const src = row || {};
  return {
    id: Number(src.id || 0),
    sport_code: String(src.sport_code || '').trim(),
    sport_name: String(src.sport_name || src.sports_name || '').trim(),
    photo_path: String(src.photo_path || src.icon_path || '').trim(),
    is_active: Number(src.is_active ?? 1) === 1
  };
}

function toSportPreviewSrc(path) {
  if (!path) return SPORT_PLACEHOLDER_PREVIEW;
  if (path.startsWith('blob:')) return path;
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('../')) return path;
  if (path.startsWith('src/')) return '../' + path;
  return path;
}

function setSportImagePreview(path) {
  const preview = document.getElementById('sportImagePreview');
  if (!preview) return;
  preview.src = toSportPreviewSrc(path);
}

async function uploadSportPhoto(file) {
  const formData = new FormData();
  formData.append('photo', file);

  const res = await fetch('../api/sports/upload-photo.php', {
    method: 'POST',
    body: formData
  });
  const json = await res.json();

  if (!json.success || !json.path) {
    throw new Error(json.message || 'Failed to upload sport image.');
  }

  return json.path;
}

async function saveSport() {
  const id = document.getElementById('sportId')?.value;
  const sportCode = document.getElementById('sportCode')?.value.trim() || '';
  const sportName = document.getElementById('sportName')?.value.trim() || '';
  const photoEl = document.getElementById('sportPhotoPath');
  let photoPath = photoEl?.value.trim() || '';
  const isActive = Number(document.getElementById('sportIsActive')?.value || '1') === 1 ? 1 : 0;

  if (!sportName) {
    adminToast('Sport name is required.', 'error');
    return;
  }

  const endpoint = id ? '../api/sports/update.php' : '../api/sports/create.php';
  const payload = {
    id: id ? Number(id) : undefined,
    sport_code: sportCode || null,
    sport_name: sportName,
    sports_name: sportName,
    photo_path: null,
    is_active: isActive
  };

  try {
    if (sportPendingPhotoFile) {
      photoPath = await uploadSportPhoto(sportPendingPhotoFile);
      sportPendingPhotoFile = null;

      const sportImageUpload = document.getElementById('sportImageUpload');
      if (sportImageUpload) sportImageUpload.value = '';
    }

    payload.photo_path = photoPath || null;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to save sport.');

    if (photoEl) photoEl.value = photoPath || '';
    sportPreviewPath = photoPath || '';
    setSportImagePreview(sportPreviewPath);

    adminToast(id ? 'Sport updated.' : 'Sport created successfully.');
    clearSportForm();
    await renderSportsTable();
  } catch (err) {
    console.error('saveSport error:', err);
    adminToast(err.message || 'Failed to save sport.', 'error');
  }
}

window.editSport = function(id) {
  const sport = sportsCache.find((item) => Number(item.id) === Number(id));
  if (!sport) return;

  const idEl = document.getElementById('sportId');
  const codeEl = document.getElementById('sportCode');
  const nameEl = document.getElementById('sportName');
  const photoEl = document.getElementById('sportPhotoPath');
  const activeEl = document.getElementById('sportIsActive');
  const sportImageUpload = document.getElementById('sportImageUpload');

  if (idEl) idEl.value = sport.id;
  if (codeEl) codeEl.value = sport.sport_code || '';
  if (nameEl) nameEl.value = sport.sport_name || '';
  if (photoEl) photoEl.value = sport.photo_path || '';
  if (activeEl) activeEl.value = sport.is_active ? '1' : '0';

  if (sportPreviewPath && sportPreviewPath.startsWith('blob:')) {
    URL.revokeObjectURL(sportPreviewPath);
  }
  sportPendingPhotoFile = null;
  sportPreviewPath = sport.photo_path || '';
  setSportImagePreview(sportPreviewPath);
  if (sportImageUpload) sportImageUpload.value = '';
};

window.deleteSport = async function(id) {
  if (!confirm('Delete this sport? This action cannot be undone.')) return;

  try {
    const res = await fetch('../api/sports/delete.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: Number(id) })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to delete sport.');

    adminToast('Sport deleted.', 'warning');
    if (String(document.getElementById('sportId')?.value || '') === String(id)) {
      clearSportForm();
    }
    await renderSportsTable();
  } catch (err) {
    console.error('deleteSport error:', err);
    adminToast(err.message || 'Failed to delete sport.', 'error');
  }
};

function clearSportForm() {
  const idEl = document.getElementById('sportId');
  const codeEl = document.getElementById('sportCode');
  const nameEl = document.getElementById('sportName');
  const photoEl = document.getElementById('sportPhotoPath');
  const activeEl = document.getElementById('sportIsActive');
  const sportImageUpload = document.getElementById('sportImageUpload');

  if (sportPreviewPath && sportPreviewPath.startsWith('blob:')) {
    URL.revokeObjectURL(sportPreviewPath);
  }
  sportPendingPhotoFile = null;
  sportPreviewPath = '';

  if (idEl) idEl.value = '';
  if (codeEl) codeEl.value = '';
  if (nameEl) nameEl.value = '';
  if (photoEl) photoEl.value = '';
  if (activeEl) activeEl.value = '1';
  if (sportImageUpload) sportImageUpload.value = '';
  setSportImagePreview('');
}

/* =============================================
   NEWS MANAGER
   ============================================= */
let newsCache = [];
const NEWS_PLACEHOLDER_PREVIEW = '../src/images/placeholder.png';
const NEWS_PLACEHOLDER_DB_PATH = 'src/images/placeholder.png';
let newsPhotoItems = [];

function initNewsManager() {
  const page = document.getElementById('adminNews');
  if (!page) return;

  renderNewsTable();

  const addBtn  = document.getElementById('addNewsBtn');
  if (addBtn) addBtn.addEventListener('click', () => { clearNewsForm(); openModal('newsModal'); });

  const saveBtn = document.getElementById('saveNewsBtn');
  if (saveBtn) saveBtn.addEventListener('click', saveNews);

  const photoAddBtn = document.getElementById('newsPhotoAdd');
  const resetBtn = document.getElementById('newsPhotoReset');
  const uploadInput = document.getElementById('newsPhotoUpload');

  if (photoAddBtn && uploadInput) {
    photoAddBtn.addEventListener('click', () => uploadInput.click());
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      clearNewsPhotoItems();
      if (uploadInput) uploadInput.value = '';
      renderNewsPhotoGallery();
    });
  }

  if (uploadInput) {
    uploadInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      addNewsPhotoFiles(files);
      uploadInput.value = '';
    });
  }

  const search  = document.getElementById('newsSearch');
  if (search) search.addEventListener('input', () => renderNewsTable(search.value));
}

async function renderNewsTable(filter = '') {
  const tbody = document.getElementById('newsTableBody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#aaa;padding:30px;">Loading...</td></tr>';

  try {
    const url = '../api/news/read.php' + (filter ? ('?search=' + encodeURIComponent(filter)) : '');
    const res = await fetch(url);
    const json = await res.json();

    if (!json.success) {
      throw new Error(json.message || 'Failed to load news articles.');
    }

    const news = Array.isArray(json.data) ? json.data : [];
    newsCache = news;

    if (!news.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#aaa;padding:30px;">No articles found.</td></tr>';
      return;
    }

    tbody.innerHTML = news.map((n, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${escapeAdminHTML(n.title || '')}</strong></td>
        <td>${escapeAdminHTML(n.category || 'General')}</td>
        <td>${escapeAdminHTML(formatNewsDateDisplay(n.publish_date))}</td>
        <td>
          <div class="action-btns">
            <button class="action-btn edit" title="Edit" onclick="editNews(${Number(n.id)})">✏️</button>
            <button class="action-btn del" title="Delete" onclick="deleteNews(${Number(n.id)})">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('renderNewsTable error:', err);
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#e53935;padding:30px;">Failed to load news articles.</td></tr>';
  }
}

async function saveNews() {
  const id       = document.getElementById('newsId')?.value;
  const title    = document.getElementById('newsTitle')?.value.trim();
  const category = document.getElementById('newsCategory')?.value.trim();
  const publishDate = document.getElementById('newsPublishDate')?.value;
  const excerpt  = document.getElementById('newsExcerpt')?.value.trim();
  const content  = document.getElementById('newsContent')?.value.trim();

  if (!title || !excerpt || !publishDate) {
    adminToast('Title, excerpt, and publish date are required.', 'error');
    return;
  }

  const endpoint = id ? '../api/news/update.php' : '../api/news/create.php';

  try {
    const photoPath = await buildNewsPhotoPathValue();

    const payload = {
      id: id ? Number(id) : undefined,
      title,
      category: category || 'General',
      excerpt,
      content,
      publish_date: publishDate,
      photo_path: photoPath
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message || 'Failed to save article.');
    }

    await renderNewsTable(document.getElementById('newsSearch')?.value || '');
    closeModal('newsModal');
    adminToast(id ? 'Article updated.' : 'Article published.');
  } catch (err) {
    console.error('saveNews error:', err);
    adminToast(err.message || 'Failed to save article.', 'error');
  }
}

window.editNews = function(id) {
  const n = newsCache.find(item => Number(item.id) === Number(id));
  if (!n) return;
  document.getElementById('newsId').value          = n.id;
  document.getElementById('newsTitle').value       = n.title || '';
  document.getElementById('newsCategory').value    = n.category || 'General';
  document.getElementById('newsPublishDate').value = formatNewsDateInput(n.publish_date);
  clearNewsPhotoItems();
  newsPhotoItems = parseNewsPhotoPaths(n.photo_path).map((path) => ({
    kind: 'existing',
    path,
    preview: toNewsPreviewSrc(path)
  }));
  renderNewsPhotoGallery();
  document.getElementById('newsExcerpt').value     = n.excerpt || '';
  document.getElementById('newsContent').value     = n.content || '';
  document.getElementById('newsModalTitle').textContent = 'Edit Article';
  const saveBtn = document.getElementById('saveNewsBtn');
  if (saveBtn) saveBtn.textContent = 'Update Article';
  openModal('newsModal');
};

window.deleteNews = async function(id) {
  if (!confirm('Delete this article?')) return;
  try {
    const res = await fetch('../api/news/delete.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: Number(id) })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to delete article.');

    await renderNewsTable(document.getElementById('newsSearch')?.value || '');
    adminToast('Article deleted.', 'warning');
  } catch (err) {
    console.error('deleteNews error:', err);
    adminToast(err.message || 'Failed to delete article.', 'error');
  }
};

function clearNewsForm() {
  ['newsId','newsTitle','newsCategory','newsPublishDate','newsPhotoPath','newsExcerpt','newsContent'].forEach(i => {
    const el = document.getElementById(i);
    if (el) el.value = '';
  });
  clearNewsPhotoItems();
  const uploadInput = document.getElementById('newsPhotoUpload');
  if (uploadInput) uploadInput.value = '';
  renderNewsPhotoGallery();
  const category = document.getElementById('newsCategory');
  if (category) category.value = 'General';
  const publishDate = document.getElementById('newsPublishDate');
  if (publishDate) publishDate.value = new Date().toISOString().slice(0, 10);
  const t = document.getElementById('newsModalTitle');
  if (t) t.textContent = 'Add Article';
  const saveBtn = document.getElementById('saveNewsBtn');
  if (saveBtn) saveBtn.textContent = 'Save Article';
}

function formatNewsDateDisplay(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatNewsDateInput(dateStr) {
  if (!dateStr) return '';
  const value = String(dateStr).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '';
}

function parseNewsPhotoPaths(value) {
  if (!value) return [];
  const raw = String(value).trim();
  if (!raw || raw === NEWS_PLACEHOLDER_DB_PATH) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(Boolean).map(v => String(v).trim()).filter(Boolean);
    }
  } catch {
    // not JSON, continue
  }

  if (raw.includes(',')) {
    return raw.split(',').map(v => v.trim()).filter(Boolean);
  }

  return [raw];
}

function serializeNewsPhotoPaths(paths) {
  const clean = (Array.isArray(paths) ? paths : []).filter(Boolean).map(v => String(v).trim()).filter(Boolean);
  if (!clean.length) return NEWS_PLACEHOLDER_DB_PATH;
  if (clean.length === 1) return clean[0];
  return JSON.stringify(clean);
}

function toNewsPreviewSrc(path) {
  if (!path) return NEWS_PLACEHOLDER_PREVIEW;
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('../')) return path;
  if (path.startsWith('src/')) return '../' + path;
  return path;
}

function renderNewsPhotoGallery() {
  const gallery = document.getElementById('newsPhotoGallery');
  const countEl = document.getElementById('newsPhotoCount');
  const hidden = document.getElementById('newsPhotoPath');
  const existingPaths = newsPhotoItems
    .filter((item) => item.kind === 'existing')
    .map((item) => item.path);
  const serialized = serializeNewsPhotoPaths(existingPaths);

  if (hidden) hidden.value = serialized;

  if (gallery) {
    if (!newsPhotoItems.length) {
      gallery.innerHTML =
        '<div class="news-photo-item placeholder">' +
          '<img src="' + NEWS_PLACEHOLDER_PREVIEW + '" alt="Placeholder" />' +
        '</div>';
    } else {
      gallery.innerHTML = newsPhotoItems.map((item, idx) => {
        const src = item.preview || NEWS_PLACEHOLDER_PREVIEW;
        const alt = item.kind === 'new' ? 'Selected photo' : 'Saved photo';
        return '<div class="news-photo-item">' +
            '<img src="' + escapeAdminHTML(src) + '" alt="' + escapeAdminHTML(alt) + '" />' +
            '<button type="button" class="news-photo-remove" onclick="removeNewsPhoto(' + idx + ')" aria-label="Remove image">&times;</button>' +
          '</div>';
      }).join('');
    }
  }

  if (countEl) {
    if (!newsPhotoItems.length) {
      countEl.textContent = 'Using placeholder.png (default)';
    } else if (newsPhotoItems.length === 1) {
      countEl.textContent = '1 image selected';
    } else {
      countEl.textContent = newsPhotoItems.length + ' images selected';
    }
  }
}

function addNewsPhotoFiles(files) {
  files.forEach((file) => {
    const key = file.name + '::' + file.size + '::' + file.lastModified;
    const exists = newsPhotoItems.some((item) => item.kind === 'new' && item.key === key);
    if (exists) return;

    newsPhotoItems.push({
      kind: 'new',
      key,
      file,
      preview: URL.createObjectURL(file)
    });
  });

  renderNewsPhotoGallery();
}

window.removeNewsPhoto = function(index) {
  const i = Number(index);
  if (Number.isNaN(i) || i < 0 || i >= newsPhotoItems.length) return;

  const item = newsPhotoItems[i];
  if (item && item.kind === 'new' && item.preview) {
    URL.revokeObjectURL(item.preview);
  }

  newsPhotoItems.splice(i, 1);
  renderNewsPhotoGallery();
};

function clearNewsPhotoItems() {
  newsPhotoItems.forEach((item) => {
    if (item.kind === 'new' && item.preview) {
      URL.revokeObjectURL(item.preview);
    }
  });
  newsPhotoItems = [];
}

async function uploadNewsPhotos(files) {
  const formData = new FormData();
  files.forEach((file) => formData.append('photos[]', file));

  try {
    const res = await fetch('../api/news/upload-photos.php', {
      method: 'POST',
      body: formData
    });
    const json = await res.json();
    if (!json.success || !Array.isArray(json.paths)) {
      throw new Error(json.message || 'Failed to upload images.');
    }

    return json.paths;
  } catch (err) {
    console.error('uploadNewsPhotos error:', err);
    throw new Error(err.message || 'Failed to upload images.');
  }
}

async function buildNewsPhotoPathValue() {
  const existingPaths = newsPhotoItems
    .filter((item) => item.kind === 'existing' && item.path)
    .map((item) => item.path);

  const newFiles = newsPhotoItems
    .filter((item) => item.kind === 'new' && item.file)
    .map((item) => item.file);

  let uploadedPaths = [];
  if (newFiles.length) {
    uploadedPaths = await uploadNewsPhotos(newFiles);
  }

  const merged = [...existingPaths, ...uploadedPaths].filter(Boolean);
  return serializeNewsPhotoPaths(merged);
}

/* =============================================
   REGISTRATION MANAGER
   ============================================= */
function initRegistrationManager() {
  const page = document.getElementById('adminRegistration');
  if (!page) return;

  const session = AuthModule.getSession();
  if (!session) return;

  const addBtn = document.getElementById('addRegistrationBtn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      clearRegistrationForm(session);
      openModal('registrationModal');
    });
  }

  const saveBtn = document.getElementById('saveRegistrationBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => saveRegistration(session));
  }

  const sportSelect = document.getElementById('regSportId');
  if (sportSelect) {
    sportSelect.addEventListener('change', handleRegistrationSelectionChange);
  }

  const categorySelect = document.getElementById('regCategory');
  if (categorySelect) {
    categorySelect.addEventListener('change', handleRegistrationSelectionChange);
  }

  const eventSelect = document.getElementById('regEventId');
  if (eventSelect) {
    eventSelect.addEventListener('change', toggleRegistrationParticipantsSection);
  }

  const addPlayerBtn = document.getElementById('addPlayerBtn');
  if (addPlayerBtn) {
    addPlayerBtn.addEventListener('click', addRegistrationPlayer);
  }

  const repCourseSelect = document.getElementById('repCourse');
  if (repCourseSelect) {
    repCourseSelect.addEventListener('change', syncPlayersCourseFromRepresentative);
  }

  const docBrowseBtn = document.getElementById('regDocBrowseBtn');
  const docInput = document.getElementById('regDocuments');
  if (docBrowseBtn && docInput) {
    docBrowseBtn.addEventListener('click', () => docInput.click());
    docInput.addEventListener('change', () => {
      addRegistrationDocuments(docInput.files);
      docInput.value = '';
    });
  }

  const docDropzone = document.getElementById('regDocDropzone');
  if (docDropzone) {
    docDropzone.addEventListener('dragover', (event) => {
      event.preventDefault();
      docDropzone.classList.add('dragover');
    });
    docDropzone.addEventListener('dragleave', () => {
      docDropzone.classList.remove('dragover');
    });
    docDropzone.addEventListener('drop', (event) => {
      event.preventDefault();
      docDropzone.classList.remove('dragover');
      addRegistrationDocuments(event.dataTransfer?.files);
    });
  }

  const manageCoursesBtn = document.getElementById('manageCoursesBtn');
  if (manageCoursesBtn) {
    if (isRepresentativeSession(session)) {
      manageCoursesBtn.style.display = 'none';
    } else {
      manageCoursesBtn.addEventListener('click', async () => {
        clearCourseForm();
        await renderCoursesTable();
        openModal('coursesModal');
      });
    }
  }

  const saveCourseBtn = document.getElementById('saveCourseBtn');
  if (saveCourseBtn) {
    saveCourseBtn.addEventListener('click', saveCourse);
  }

  const resetCourseBtn = document.getElementById('resetCourseBtn');
  if (resetCourseBtn) {
    resetCourseBtn.addEventListener('click', clearCourseForm);
  }

  const search = document.getElementById('registrationSearch');
  if (search) {
    search.addEventListener('input', () => renderRegistrationsTable(session, search.value));
  }

  loadRegistrationLookups();
  seedRepresentativeInfoFromSession(session);

  clearRegistrationForm(session);
  renderRegistrationsTable(session);
}

async function loadRegistrationLookups() {
  await Promise.all([
    loadCoursesForRegistration(),
    loadSportsForRegistration(),
    loadEventsForRegistration()
  ]);

  refreshRegistrationEvents();
}

async function loadCoursesForRegistration() {
  const selectIds = ['repCourse'];

  try {
    const courses = await fetchCoursesFromApi();
    const options = ['<option value="">Select course</option>']
      .concat(courses.map((course) => `<option value="${Number(course.id)}">${escapeAdminHTML(course.course_name || '')}</option>`));

    selectIds.forEach((id) => {
      const select = document.getElementById(id);
      if (!select) return;
      select.innerHTML = options.join('');
    });
  } catch (err) {
    selectIds.forEach((id) => {
      const select = document.getElementById(id);
      if (!select) return;
      select.innerHTML = '<option value="">Unable to load courses</option>';
    });
  }
}

async function loadSportsForRegistration() {
  const sportSelect = document.getElementById('regSportId');
  if (!sportSelect) return;

  try {
    const res = await fetch('../api/sports/read.php');
    const data = await parseApiJson(res);
    if (!data.success || !Array.isArray(data.data)) {
      throw new Error(data.message || 'Failed to fetch sports.');
    }

    registrationSportsCache = data.data;
    const options = ['<option value="">Select sport</option>'];

    data.data.forEach((sport) => {
      const active = Number(sport.is_active ?? 1) === 1;
      if (!active) return;
      options.push(`<option value="${Number(sport.id)}">${escapeAdminHTML(sport.sport_name || '')}</option>`);
    });

    sportSelect.innerHTML = options.join('');
  } catch (err) {
    sportSelect.innerHTML = '<option value="">Unable to load sports</option>';
    adminToast(err.message || 'Failed to load sports.', 'error');
  }
}

async function loadEventsForRegistration() {
  try {
    const res = await fetch('../api/events/read.php');
    const data = await parseApiJson(res);
    if (!data.success || !Array.isArray(data.data)) {
      throw new Error(data.message || 'Failed to fetch events.');
    }
    registrationEventsCache = data.data;
  } catch (err) {
    registrationEventsCache = [];
    adminToast(err.message || 'Failed to load events.', 'error');
  }
}

function handleRegistrationSelectionChange() {
  refreshRegistrationEvents();
  toggleRegistrationParticipantsSection();
}

function refreshRegistrationEvents() {
  const eventSelect = document.getElementById('regEventId');
  const sportId = Number(document.getElementById('regSportId')?.value || 0);
  const category = String(document.getElementById('regCategory')?.value || '').trim().toLowerCase();
  if (!eventSelect) return;

  if (!sportId || !category) {
    eventSelect.innerHTML = '<option value="">Select sport and category first</option>';
    return;
  }

  const filtered = registrationEventsCache.filter((event) => {
    return Number(event.sports_id) === sportId && String(event.category || '').trim().toLowerCase() === category;
  });

  if (!filtered.length) {
    eventSelect.innerHTML = '<option value="">No matching events found</option>';
    return;
  }

  eventSelect.innerHTML = ['<option value="">Select event</option>']
    .concat(filtered.map((event) => `<option value="${Number(event.id)}">${escapeAdminHTML(event.title || '')}</option>`))
    .join('');
}

function toggleRegistrationParticipantsSection() {
  const section = document.getElementById('regParticipantsSection');
  if (!section) return;

  const sportId = document.getElementById('regSportId')?.value;
  const category = document.getElementById('regCategory')?.value;
  const eventId = document.getElementById('regEventId')?.value;
  const visible = Boolean(sportId && category && eventId);

  section.style.display = visible ? '' : 'none';
}

function seedRepresentativeInfoFromSession(session) {
  if (!session) return;

  const repFirstName = document.getElementById('repFirstName');
  const repLastName = document.getElementById('repLastName');
  const regEmail = document.getElementById('regEmail');

  const name = String(session.name || '').trim();
  const parts = name.split(/\s+/).filter(Boolean);
  if (repFirstName && !repFirstName.value) repFirstName.value = parts[0] || '';
  if (repLastName && !repLastName.value) repLastName.value = parts.length > 1 ? parts.slice(1).join(' ') : '';
  if (regEmail && !regEmail.value) regEmail.value = session.email || '';
}

function addRegistrationPlayer() {
  const lastName = document.getElementById('playerLastName')?.value.trim();
  const firstName = document.getElementById('playerFirstName')?.value.trim();
  const studentId = document.getElementById('playerStudentId')?.value.trim();
  const repCourseSelect = document.getElementById('repCourse');
  const courseId = Number(repCourseSelect?.value || 0);
  const courseName = repCourseSelect?.selectedOptions?.[0]?.textContent?.trim() || '';

  if (!lastName || !firstName || !studentId || !courseId) {
    adminToast('Player last name, first name, student ID, and representative course are required.', 'error');
    return;
  }

  registrationPlayersDraft.push({
    id: Date.now() + Math.floor(Math.random() * 1000),
    last_name: lastName,
    first_name: firstName,
    student_id: studentId,
    course_id: courseId,
    course_name: courseName
  });

  ['playerLastName', 'playerFirstName', 'playerStudentId'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  renderRegistrationPlayersTable();
}

function syncPlayersCourseFromRepresentative() {
  const repCourseSelect = document.getElementById('repCourse');
  const courseId = Number(repCourseSelect?.value || 0);
  const courseName = repCourseSelect?.selectedOptions?.[0]?.textContent?.trim() || '';

  if (!courseId || !courseName || !registrationPlayersDraft.length) return;

  registrationPlayersDraft = registrationPlayersDraft.map((player) => ({
    ...player,
    course_id: courseId,
    course_name: courseName
  }));

  renderRegistrationPlayersTable();
}

function renderRegistrationPlayersTable() {
  const tbody = document.getElementById('regPlayersTableBody');
  if (!tbody) return;

  if (!registrationPlayersDraft.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">No players added yet.</td></tr>';
    return;
  }

  tbody.innerHTML = registrationPlayersDraft.map((player, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeAdminHTML(player.last_name)}</td>
      <td>${escapeAdminHTML(player.first_name)}</td>
      <td>${escapeAdminHTML(player.student_id)}</td>
      <td>${escapeAdminHTML(player.course_name)}</td>
      <td><button class="action-btn del" onclick="removeRegistrationPlayer(${Number(player.id)})" title="Remove">🗑️</button></td>
    </tr>
  `).join('');
}

window.removeRegistrationPlayer = function(playerId) {
  registrationPlayersDraft = registrationPlayersDraft.filter((player) => Number(player.id) !== Number(playerId));
  renderRegistrationPlayersTable();
};

function addRegistrationDocuments(fileList) {
  if (!fileList || !fileList.length) return;

  const allowed = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
  Array.from(fileList).forEach((file) => {
    if (!allowed.includes(file.type)) {
      return;
    }

    const exists = registrationDocumentsDraft.some((item) => item.name === file.name && item.size === file.size);
    if (exists) return;

    registrationDocumentsDraft.push({
      id: Date.now() + Math.floor(Math.random() * 1000),
      name: file.name,
      size: file.size,
      type: file.type
    });
  });

  renderRegistrationDocumentList();
}

function formatFileSize(bytes) {
  const b = Number(bytes || 0);
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function renderRegistrationDocumentList() {
  const list = document.getElementById('regDocList');
  if (!list) return;

  if (!registrationDocumentsDraft.length) {
    list.innerHTML = '<li class="empty">No files selected.</li>';
    return;
  }

  list.innerHTML = registrationDocumentsDraft.map((doc) => `
    <li>
      <span class="doc-name">${escapeAdminHTML(doc.name)}</span>
      <span class="doc-size">${escapeAdminHTML(formatFileSize(doc.size))}</span>
      <button type="button" class="doc-remove" onclick="removeRegistrationDocument(${Number(doc.id)})" aria-label="Remove file">&times;</button>
    </li>
  `).join('');
}

window.removeRegistrationDocument = function(docId) {
  registrationDocumentsDraft = registrationDocumentsDraft.filter((doc) => Number(doc.id) !== Number(docId));
  renderRegistrationDocumentList();
};

async function fetchRegistrationRecordsFromApi() {
  const res = await fetch('../api/registrations/read.php');
  const data = await parseApiJson(res);
  if (!data.success || !Array.isArray(data.data)) {
    throw new Error(data.message || 'Failed to fetch registrations.');
  }
  return data.data;
}

async function fetchRegistrationById(id) {
  const res = await fetch(`../api/registrations/read.php?id=${encodeURIComponent(id)}`);
  const data = await parseApiJson(res);
  if (!data.success || !data.data) {
    throw new Error(data.message || 'Registration not found.');
  }
  return data.data;
}

async function registrationApiRequest(url, method, payload) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await parseApiJson(res);
  if (!data.success) {
    throw new Error(data.message || 'Registration request failed.');
  }
  return data;
}

function registrationRole(role) {
  return String(role || '').trim().toLowerCase();
}

function isRepresentativeSession(session) {
  return registrationRole(session?.role) === 'representative';
}

function isAdministratorSession(session) {
  return registrationRole(session?.role) === 'administrator';
}

function registrationBadgeClass(status) {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'approved') return 'success';
  if (normalized === 'rejected') return 'danger';
  if (normalized === 'pending') return 'accent';
  return 'primary';
}

function formatRegistrationDateTime(dateValue) {
  if (!dateValue) return '—';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

async function renderRegistrationsTable(session, filter = '') {
  const tbody = document.getElementById('registrationsTableBody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#aaa;padding:30px;">Loading registrations...</td></tr>';

  let rows = [];
  try {
    rows = await fetchRegistrationRecordsFromApi();
    if (isRepresentativeSession(session)) {
      rows = rows.filter((row) => Number(row.created_by_id) === Number(session.id));
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#c62828;padding:30px;">Failed to load registrations.</td></tr>';
    adminToast(err.message || 'Failed to load registrations.', 'error');
    return;
  }

  const q = String(filter || '').trim().toLowerCase();
  if (q) {
    rows = rows.filter((row) => {
      return [
        row.team_name,
        row.event_name,
        row.category,
        row.representative_name,
        row.submitted_by_name,
        row.status
      ]
        .some((value) => String(value || '').toLowerCase().includes(q));
    });
  }

  rows.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#aaa;padding:30px;">${isRepresentativeSession(session) ? 'No submitted registration yet.' : 'No registration records found.'}</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map((row, index) => {
    const canReview =
      isAdministratorSession(session) &&
      String(row.status || '').toLowerCase() === 'pending';

    return `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${escapeAdminHTML(row.team_name || '')}</strong></td>
        <td>${escapeAdminHTML(row.event_name || '')}</td>
        <td>${escapeAdminHTML(row.category || '')}</td>
        <td>${escapeAdminHTML(row.representative_name || row.submitted_by_name || '')}</td>
        <td>${escapeAdminHTML(formatRegistrationDateTime(row.submitted_at))}</td>
        <td><span class="badge badge-${registrationBadgeClass(row.status)}">${escapeAdminHTML(row.status || 'Pending')}</span></td>
        <td>
          <div class="action-btns">
            <button class="action-btn view" onclick="viewRegistrationRequest(${Number(row.id)})" title="View Request">&#128065;</button>
            ${canReview ? `<button class="action-btn edit" onclick="updateRegistrationStatus(${Number(row.id)}, 'Approved')" title="Approve">&#10003;</button>` : ''}
            ${canReview ? `<button class="action-btn del" onclick="updateRegistrationStatus(${Number(row.id)}, 'Rejected')" title="Reject">&#10005;</button>` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function saveRegistration(session) {
  const repFirstName = document.getElementById('repFirstName')?.value.trim();
  const repLastName = document.getElementById('repLastName')?.value.trim();
  const repStudentId = document.getElementById('repStudentId')?.value.trim();
  const repCourseSelect = document.getElementById('repCourse');
  const repCourseId = Number(repCourseSelect?.value || 0);
  const repCourseName = repCourseSelect?.selectedOptions?.[0]?.textContent?.trim() || '';

  const teamName = document.getElementById('regTeamName')?.value.trim();
  const sportSelect = document.getElementById('regSportId');
  const sportId = Number(sportSelect?.value || 0);
  const sportName = sportSelect?.selectedOptions?.[0]?.textContent?.trim() || '';

  const category = document.getElementById('regCategory')?.value;
  const eventSelect = document.getElementById('regEventId');
  const eventId = Number(eventSelect?.value || 0);
  const eventName = eventSelect?.selectedOptions?.[0]?.textContent?.trim() || '';

  const coachFirstName = document.getElementById('coachFirstName')?.value.trim();
  const coachLastName = document.getElementById('coachLastName')?.value.trim();
  const contact = document.getElementById('regContact')?.value.trim();
  const email = document.getElementById('regEmail')?.value.trim();

  const notes = document.getElementById('regNotes')?.value.trim() || '';
  const selectedStatus = document.getElementById('registrationStatus')?.value || 'Pending';

  if (!repFirstName || !repLastName || !repStudentId || !repCourseId || !contact || !email) {
    adminToast('Representative fields are required.', 'error');
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    adminToast('Please enter a valid email address.', 'error');
    return;
  }

  if (!teamName || !sportId || !category || !eventId) {
    adminToast('Team name, sport, category, and event are required.', 'error');
    return;
  }

  if (!coachFirstName || !coachLastName) {
    adminToast('Coach/Manager first name and last name are required.', 'error');
    return;
  }

  if (!registrationPlayersDraft.length) {
    adminToast('Please add at least one player.', 'error');
    return;
  }

  const selectedEvent = registrationEventsCache.find((event) => Number(event.id) === eventId);
  const normalizedCategory = String(category || '').trim().toLowerCase();
  if (!selectedEvent || String(selectedEvent.category || '').trim().toLowerCase() !== normalizedCategory) {
    adminToast('Please select a valid event for the selected sport and category.', 'error');
    return;
  }

  if (Number(selectedEvent.sports_id) !== sportId) {
    adminToast('Selected event does not match the selected sport.', 'error');
    return;
  }

  const representativeName = `${repFirstName} ${repLastName}`.trim();

  if (!teamName || !eventName || !category || !contact) {
    adminToast('Please complete all required registration fields.', 'error');
    return;
  }

  const status = isRepresentativeSession(session) ? 'Pending' : selectedStatus;

  const payload = {
    team_name: teamName,
    sports_id: sportId,
    event_id: eventId,
    category,
    representative_name: representativeName,
    representative_first_name: repFirstName,
    representative_last_name: repLastName,
    representative_student_id: repStudentId,
    representative_course_id: repCourseId,
    representative_course_name: repCourseName,
    contact_number: contact,
    email_address: email,
    coach: {
      first_name: coachFirstName,
      last_name: coachLastName
    },
    players: registrationPlayersDraft.map((player) => ({ ...player })),
    players_count: registrationPlayersDraft.length,
    documents: registrationDocumentsDraft.map((doc) => ({
      name: doc.name,
      size: doc.size,
      type: doc.type
    })),
    notes,
    status,
    submitted_by_name: representativeName || session.name || session.username || 'User',
    submitted_by_role: session.role || '',
    created_by_id: Number(session.id) || 0,
    reviewed_by_name: '',
    reviewed_at: ''
  };

  try {
    await registrationApiRequest('../api/registrations/create.php', 'POST', payload);
    closeModal('registrationModal');
    clearRegistrationForm(session);
    await renderRegistrationsTable(session, document.getElementById('registrationSearch')?.value || '');
    adminToast(isRepresentativeSession(session) ? 'Registration submitted for approval.' : 'Registration saved.');
  } catch (err) {
    adminToast(err.message || 'Failed to save registration.', 'error');
  }
}

function clearRegistrationForm(session) {
  const fieldIds = [
    'registrationId',
    'repFirstName',
    'repLastName',
    'repStudentId',
    'regContact',
    'regEmail',
    'regTeamName',
    'coachFirstName',
    'coachLastName',
    'playerLastName',
    'playerFirstName',
    'playerStudentId',
    'regNotes'
  ];
  fieldIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  const repCourse = document.getElementById('repCourse');
  if (repCourse) repCourse.value = '';

  const sportSelect = document.getElementById('regSportId');
  if (sportSelect) sportSelect.value = '';

  const category = document.getElementById('regCategory');
  if (category) category.value = '';

  refreshRegistrationEvents();

  const eventSelect = document.getElementById('regEventId');
  if (eventSelect) eventSelect.value = '';

  registrationPlayersDraft = [];
  renderRegistrationPlayersTable();

  registrationDocumentsDraft = [];
  renderRegistrationDocumentList();

  toggleRegistrationParticipantsSection();

  seedRepresentativeInfoFromSession(session);

  const status = document.getElementById('registrationStatus');
  if (status) status.value = 'Pending';

  const statusGroup = document.getElementById('registrationStatusGroup');
  if (statusGroup) {
    statusGroup.style.display = isRepresentativeSession(session) ? 'none' : '';
  }
}

window.viewRegistrationRequest = async function(id) {
  const session = AuthModule.getSession();
  if (!session) return;

  let row;
  try {
    row = await fetchRegistrationById(id);
  } catch (err) {
    adminToast(err.message || 'Registration request not found.', 'error');
    return;
  }

  if (isRepresentativeSession(session) && Number(row.created_by_id) !== Number(session.id)) {
    adminToast('You can only view your own submitted registrations.', 'error');
    return;
  }

  const viewBody = document.getElementById('registrationViewBody');
  if (!viewBody) return;

  currentViewedRegistration = row;

  const coach = row.coach || {};
  const players = Array.isArray(row.players) ? row.players : [];
  const documents = Array.isArray(row.documents) ? row.documents : [];

  const playersMarkup = players.length
    ? `<table class="admin-table"><thead><tr><th>#</th><th>Last Name</th><th>First Name</th><th>Student ID</th><th>Course</th></tr></thead><tbody>${players.map((player, index) => `<tr><td>${index + 1}</td><td>${escapeAdminHTML(player.last_name || '')}</td><td>${escapeAdminHTML(player.first_name || '')}</td><td>${escapeAdminHTML(player.student_id || '')}</td><td>${escapeAdminHTML(player.course_name || '')}</td></tr>`).join('')}</tbody></table>`
    : '<p style="margin:0;color:#777;">No players listed.</p>';

  const docsMarkup = documents.length
    ? `<ul style="margin:0;padding-left:18px;color:#444;">${documents.map((doc) => `<li>${escapeAdminHTML(doc.name || '')} (${escapeAdminHTML(formatFileSize(doc.size))})</li>`).join('')}</ul>`
    : '<p style="margin:0;color:#777;">No document uploaded.</p>';

  const downloadBtn = document.getElementById('downloadRegistrationPdfBtn');
  if (downloadBtn) {
    downloadBtn.onclick = () => window.downloadRegistrationRequestPdf();
  }

  viewBody.innerHTML = `
    <div class="registration-view-sections">
      <section class="registration-view-section">
        <h4>Representative Information</h4>
        <div class="admin-form-grid" style="gap:12px;">
          <div class="admin-form-group"><label>Representative</label><input type="text" value="${escapeAdminHTML(row.representative_name || row.submitted_by_name || '')}" disabled /></div>
          <div class="admin-form-group"><label>Student ID</label><input type="text" value="${escapeAdminHTML(row.representative_student_id || '')}" disabled /></div>
          <div class="admin-form-group"><label>Course</label><input type="text" value="${escapeAdminHTML(row.representative_course_name || '')}" disabled /></div>
          <div class="admin-form-group"><label>Contact Number</label><input type="text" value="${escapeAdminHTML(row.contact_number || '')}" disabled /></div>
          <div class="admin-form-group full"><label>Email Address</label><input type="text" value="${escapeAdminHTML(row.email_address || '')}" disabled /></div>
        </div>
      </section>

      <section class="registration-view-section">
        <h4>Team and Event Selection</h4>
        <div class="admin-form-grid" style="gap:12px;">
          <div class="admin-form-group"><label>Team Name</label><input type="text" value="${escapeAdminHTML(row.team_name || '')}" disabled /></div>
          <div class="admin-form-group"><label>Sport</label><input type="text" value="${escapeAdminHTML(row.sport_name || '')}" disabled /></div>
          <div class="admin-form-group"><label>Event</label><input type="text" value="${escapeAdminHTML(row.event_name || '')}" disabled /></div>
          <div class="admin-form-group"><label>Category</label><input type="text" value="${escapeAdminHTML(row.category || '')}" disabled /></div>
          <div class="admin-form-group"><label>Status</label><input type="text" value="${escapeAdminHTML(row.status || '')}" disabled /></div>
          <div class="admin-form-group"><label>Number of Players</label><input type="text" value="${escapeAdminHTML(String(row.players_count || players.length || '0'))}" disabled /></div>
        </div>
      </section>

      <section class="registration-view-section">
        <h4>Coach and Players</h4>
        <div class="admin-form-grid" style="gap:12px;">
          <div class="admin-form-group"><label>Coach Last Name</label><input type="text" value="${escapeAdminHTML(coach.last_name || '')}" disabled /></div>
          <div class="admin-form-group"><label>Coach First Name</label><input type="text" value="${escapeAdminHTML(coach.first_name || '')}" disabled /></div>
          <div class="admin-form-group full"><label>Players</label>${playersMarkup}</div>
        </div>
      </section>

      <section class="registration-view-section">
        <h4>Documents and Submission Details</h4>
        <div class="admin-form-grid" style="gap:12px;">
          <div class="admin-form-group full"><label>Uploaded Documents</label>${docsMarkup}</div>
          <div class="admin-form-group"><label>Submitted By</label><input type="text" value="${escapeAdminHTML(row.submitted_by_name || '')}" disabled /></div>
          <div class="admin-form-group"><label>Submitted At</label><input type="text" value="${escapeAdminHTML(formatRegistrationDateTime(row.submitted_at))}" disabled /></div>
          <div class="admin-form-group"><label>Reviewed By</label><input type="text" value="${escapeAdminHTML(row.reviewed_by_name || 'Not reviewed yet')}" disabled /></div>
          <div class="admin-form-group full"><label>Notes</label><textarea rows="3" disabled>${escapeAdminHTML(row.notes || '')}</textarea></div>
        </div>
      </section>
    </div>
  `;

  openModal('registrationViewModal');
};

window.downloadRegistrationRequestPdf = function() {
  const row = currentViewedRegistration;
  if (!row) {
    adminToast('No registration request selected.', 'error');
    return;
  }

  const coach = row.coach || {};
  const players = Array.isArray(row.players) ? row.players : [];
  const documents = Array.isArray(row.documents) ? row.documents : [];
  const submittedAt = formatRegistrationDateTime(row.submitted_at);

  const playersRows = players.length
    ? players.map((player, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeAdminHTML(player.last_name || '')}</td>
          <td>${escapeAdminHTML(player.first_name || '')}</td>
          <td>${escapeAdminHTML(player.student_id || '')}</td>
          <td>${escapeAdminHTML(player.course_name || '')}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="5">No players listed.</td></tr>';

  const documentsRows = documents.length
    ? `<ul>${documents.map((doc) => `<li>${escapeAdminHTML(doc.name || '')} (${escapeAdminHTML(formatFileSize(doc.size))})</li>`).join('')}</ul>`
    : '<p>No document uploaded.</p>';

  const html = `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>Registration Request ${escapeAdminHTML(String(row.id || ''))}</title>
    <style>
      body{font-family:Arial,sans-serif;margin:24px;color:#222;}
      h1{font-size:20px;margin:0 0 4px;color:#1a237e;}
      h2{font-size:14px;margin:18px 0 8px;color:#1a237e;border-bottom:1px solid #e6e9f0;padding-bottom:4px;}
      .meta{font-size:12px;color:#666;margin-bottom:14px;}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 18px;}
      .field{font-size:12px;}
      .label{font-weight:700;color:#445;display:block;margin-bottom:2px;}
      table{width:100%;border-collapse:collapse;margin-top:8px;}
      th,td{border:1px solid #d9deea;padding:6px 8px;font-size:12px;text-align:left;}
      th{background:#f3f6fc;}
      .notes{border:1px solid #d9deea;padding:10px;border-radius:6px;min-height:48px;font-size:12px;white-space:pre-wrap;}
      @media print { button{display:none;} }
    </style>
  </head>
  <body>
    <h1>Registration Request</h1>
    <div class="meta">Request #${escapeAdminHTML(String(row.id || ''))} • Submitted ${escapeAdminHTML(submittedAt)}</div>

    <h2>Representative Information</h2>
    <div class="grid">
      <div class="field"><span class="label">Representative</span>${escapeAdminHTML(row.representative_name || row.submitted_by_name || '')}</div>
      <div class="field"><span class="label">Student ID</span>${escapeAdminHTML(row.representative_student_id || '')}</div>
      <div class="field"><span class="label">Course</span>${escapeAdminHTML(row.representative_course_name || '')}</div>
      <div class="field"><span class="label">Contact Number</span>${escapeAdminHTML(row.contact_number || '')}</div>
      <div class="field"><span class="label">Email Address</span>${escapeAdminHTML(row.email_address || '')}</div>
    </div>

    <h2>Team and Event Selection</h2>
    <div class="grid">
      <div class="field"><span class="label">Team Name</span>${escapeAdminHTML(row.team_name || '')}</div>
      <div class="field"><span class="label">Sport</span>${escapeAdminHTML(row.sport_name || '')}</div>
      <div class="field"><span class="label">Event</span>${escapeAdminHTML(row.event_name || '')}</div>
      <div class="field"><span class="label">Category</span>${escapeAdminHTML(row.category || '')}</div>
      <div class="field"><span class="label">Status</span>${escapeAdminHTML(row.status || '')}</div>
      <div class="field"><span class="label">Players Count</span>${escapeAdminHTML(String(row.players_count || players.length || 0))}</div>
    </div>

    <h2>Coach Information</h2>
    <div class="grid">
      <div class="field"><span class="label">Coach Last Name</span>${escapeAdminHTML(coach.last_name || '')}</div>
      <div class="field"><span class="label">Coach First Name</span>${escapeAdminHTML(coach.first_name || '')}</div>
    </div>

    <h2>Players</h2>
    <table>
      <thead><tr><th>#</th><th>Last Name</th><th>First Name</th><th>Student ID</th><th>Course</th></tr></thead>
      <tbody>${playersRows}</tbody>
    </table>

    <h2>Uploaded Documents</h2>
    ${documentsRows}

    <h2>Additional Details</h2>
    <div class="grid">
      <div class="field"><span class="label">Submitted By</span>${escapeAdminHTML(row.submitted_by_name || '')}</div>
      <div class="field"><span class="label">Reviewed By</span>${escapeAdminHTML(row.reviewed_by_name || 'Not reviewed yet')}</div>
    </div>
    <div class="field" style="margin-top:10px;"><span class="label">Notes</span><div class="notes">${escapeAdminHTML(row.notes || '')}</div></div>

    <div style="margin-top:18px;"><button onclick="window.print()">Print / Save as PDF</button></div>
  </body>
  </html>`;

  const win = window.open('', '_blank');
  if (!win) {
    adminToast('Allow pop-ups to download PDF.', 'error');
    return;
  }

  win.document.write(html);
  win.document.close();
};

window.updateRegistrationStatus = async function(id, status) {
  const session = AuthModule.getSession();
  if (!session || !isAdministratorSession(session)) {
    adminToast('Only administrators can review requests.', 'error');
    return;
  }

  let row;
  try {
    row = await fetchRegistrationById(id);
  } catch (err) {
    adminToast(err.message || 'Registration request not found.', 'error');
    return;
  }

  if (String(row.status || '').toLowerCase() !== 'pending') {
    adminToast('Only pending requests can be reviewed.', 'warning');
    return;
  }

  try {
    await registrationApiRequest('../api/registrations/update-status.php', 'PUT', {
      id: Number(id),
      status,
      reviewed_by_name: session.name || session.username || 'Administrator'
    });
    await renderRegistrationsTable(session, document.getElementById('registrationSearch')?.value || '');
    adminToast(`Registration ${String(status).toLowerCase()}.`, status === 'Approved' ? 'success' : 'warning');
  } catch (err) {
    adminToast(err.message || 'Failed to update registration status.', 'error');
  }
};

/* =============================================
   COURSE MANAGER (DB-Backed)
   ============================================= */
async function renderCoursesTable() {
  const tbody = document.getElementById('coursesTableBody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#aaa;padding:20px;">Loading courses...</td></tr>';

  try {
    const courses = await fetchCoursesFromApi();

    if (!courses.length) {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#aaa;padding:20px;">No courses found.</td></tr>';
      return;
    }

    tbody.innerHTML = courses.map((course, index) => `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${escapeAdminHTML(course.course_name || '')}</strong></td>
        <td>
          <div class="action-btns">
            <button class="action-btn edit" onclick="editCourse(${Number(course.id)})" title="Edit">✏️</button>
            <button class="action-btn del" onclick="deleteCourse(${Number(course.id)})" title="Delete">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#c62828;padding:20px;">Failed to load courses.</td></tr>';
    adminToast(err.message || 'Failed to load courses.', 'error');
  }
}

async function fetchCoursesFromApi() {
  const res = await fetch('../api/courses/read.php');
  const data = await parseApiJson(res);
  if (!data.success || !Array.isArray(data.data)) {
    throw new Error(data.message || 'Failed to fetch courses.');
  }
  return data.data;
}

async function saveCourse() {
  const courseName = document.getElementById('courseName')?.value.trim();

  if (!courseName) {
    adminToast('Course name is required.', 'error');
    return;
  }

  try {
    if (editingCourseId) {
      await courseApiRequest('../api/courses/update.php', 'PUT', {
        id: editingCourseId,
        course_name: courseName
      });
      adminToast('Course updated.');
    } else {
      await courseApiRequest('../api/courses/create.php', 'POST', {
        course_name: courseName
      });
      adminToast('Course created.');
    }

    clearCourseForm();
    await renderCoursesTable();
  } catch (err) {
    adminToast(err.message || 'Failed to save course.', 'error');
  }
}

window.editCourse = async function(id) {
  try {
    const res = await fetch(`../api/courses/read.php?id=${encodeURIComponent(id)}`);
    const data = await parseApiJson(res);
    if (!data.success || !data.data) {
      throw new Error(data.message || 'Course not found.');
    }

    editingCourseId = Number(data.data.id);
    const courseIdInput = document.getElementById('courseId');
    if (courseIdInput) courseIdInput.value = String(editingCourseId);
    const courseNameInput = document.getElementById('courseName');
    if (courseNameInput) courseNameInput.value = data.data.course_name || '';
  } catch (err) {
    adminToast(err.message || 'Failed to load course.', 'error');
  }
};

window.deleteCourse = async function(id) {
  if (!confirm('Delete this course?')) return;

  try {
    await courseApiRequest('../api/courses/delete.php', 'DELETE', { id: Number(id) });
    if (editingCourseId === Number(id)) {
      clearCourseForm();
    }
    await renderCoursesTable();
    adminToast('Course deleted.', 'warning');
  } catch (err) {
    adminToast(err.message || 'Failed to delete course.', 'error');
  }
};

function clearCourseForm() {
  editingCourseId = null;
  const courseIdInput = document.getElementById('courseId');
  if (courseIdInput) courseIdInput.value = '';
  const courseNameInput = document.getElementById('courseName');
  if (courseNameInput) courseNameInput.value = '';
}

async function courseApiRequest(url, method, payload) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await parseApiJson(res);
  if (!data.success) {
    throw new Error(data.message || 'Course request failed.');
  }
  return data;
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
    document.getElementById('userRole').value     = u.role || 'Representative';
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
  if (roleEl) roleEl.value = 'Representative';
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

  loadContactMessages();

  // ── Contact page info ─────────────────────────
  loadContactInfo();

  document.getElementById('contactModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'contactModal') closeContactModal();
  });
}

async function loadContactMessages() {
  try {
    const resp = await fetch('../api/contact/read-messages.php');
    const data = await resp.json();

    if (!data.success) throw new Error(data.error || 'Failed to load messages');

    const totalEl  = document.getElementById('totalMsgs');
    const unreadEl = document.getElementById('unreadMsgs');
    const readEl   = document.getElementById('readMsgs');
    if (totalEl)  totalEl.textContent  = data.total;
    if (unreadEl) unreadEl.textContent = data.unread;
    if (readEl)   readEl.textContent   = data.read;

    renderContactMessages(data.data);
  } catch (err) {
    console.error('Error loading messages:', err);
    const tbody = document.getElementById('messagesTableBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#e53935;padding:30px;">Error loading messages.</td></tr>';
  }
}

function renderContactMessages(msgs) {
  const tbody = document.getElementById('messagesTableBody');
  if (!tbody) return;

  if (!msgs.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#aaa;padding:30px;">No messages.</td></tr>';
    return;
  }

  tbody.innerHTML = msgs.map((m, i) => `
    <tr style="${!m.is_read ? 'background:#fffde7;' : ''}">
      <td>${i + 1}</td>
      <td>${escapeAdminHTML(m.full_name)}<br><small style="color:#aaa">${escapeAdminHTML(m.email)}</small></td>
      <td>${escapeAdminHTML(m.subject)}</td>
      <td>${escapeAdminHTML(m.submitted_at)}</td>
      <td>
        <div class="action-btns">
          <button class="action-btn view" onclick="viewMessage(${m.id})" title="View">&#128065;</button>
          <button class="action-btn del"  onclick="deleteMessage(${m.id})" title="Delete">&#128465;</button>
        </div>
      </td>
    </tr>
  `).join('');
}

window.viewMessage = async function(id) {
  const tbody = document.getElementById('messagesTableBody');
  const rows  = tbody ? tbody.querySelectorAll('tr') : [];

  // Find message data from already-rendered rows by re-fetching
  try {
    const resp = await fetch('../api/contact/read-messages.php');
    const data = await resp.json();
    if (!data.success) throw new Error(data.error);

    const m = data.data.find(msg => msg.id == id);
    if (!m) return;

    const body = document.getElementById('msgViewBody');
    if (body) {
      body.innerHTML = `
        <p><strong>From:</strong> ${escapeAdminHTML(m.full_name)} &lt;${escapeAdminHTML(m.email)}&gt;</p>
        <p><strong>Subject:</strong> ${escapeAdminHTML(m.subject)}</p>
        <p><strong>Date:</strong> ${escapeAdminHTML(m.submitted_at)}</p>
        <hr style="margin:14px 0;border:none;border-top:1px solid #eee;">
        <p style="white-space:pre-wrap;">${escapeAdminHTML(m.message)}</p>
      `;
    }

    openModal('msgViewModal');

    // Mark as read if unread
    if (!m.is_read) {
      await fetch('../api/contact/mark-read.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      loadContactMessages();
    }
  } catch (err) {
    console.error('Error viewing message:', err);
    adminToast('Error loading message', 'error');
  }
};

window.deleteMessage = async function(id) {
  if (!confirm('Delete this message?')) return;
  try {
    const resp = await fetch('../api/contact/delete-message.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    const data = await resp.json();
    if (!data.success) throw new Error(data.error);
    adminToast('Message deleted.', 'warning');
    loadContactMessages();
  } catch (err) {
    console.error('Error deleting message:', err);
    adminToast('Error deleting message', 'error');
  }
};

/* =============================================
   CONTACT PAGE INFO
   ============================================= */
window.openContactModal = function() {
  const modal = document.getElementById('contactModal');
  if (modal) { modal.classList.add('open'); document.body.style.overflow = 'hidden'; }
};

window.closeContactModal = function() {
  const modal = document.getElementById('contactModal');
  if (modal) { modal.classList.remove('open'); document.body.style.overflow = 'auto'; }
};

async function loadContactInfo() {
  try {
    const resp = await fetch('../api/contact/read-info.php');
    const data = await resp.json();
    if (data.success) {
      const addr  = document.getElementById('displayAddress');
      const phone = document.getElementById('displayPhone');
      const email = document.getElementById('displayEmail');
      const facebook = document.getElementById('displayFacebook');
      if (addr)  addr.innerHTML  = data.address ? data.address.replace(/\n/g, '<br>') : 'Not set';
      if (phone) phone.innerHTML = data.phone   ? data.phone.replace(/\n/g, '<br>')   : 'Not set';
      if (email) email.innerHTML = data.email   ? data.email.replace(/\n/g, '<br>')   : 'Not set';
      if (facebook) {
        const fbUrl = (data.facebook_url || '').trim();
        if (fbUrl) {
          const normalizedUrl = /^https?:\/\//i.test(fbUrl) ? fbUrl : ('https://' + fbUrl);
          const safeUrl = escapeAdminHTML(normalizedUrl);
          facebook.innerHTML = '<a href="' + safeUrl + '" target="_blank" rel="noopener noreferrer">' + safeUrl + '</a>';
        } else {
          facebook.textContent = 'Not set';
        }
      }

      const addrInput  = document.getElementById('contactAddress');
      const phoneInput = document.getElementById('contactPhone');
      const emailInput = document.getElementById('contactEmail');
      const facebookInput = document.getElementById('contactFacebook');
      if (addrInput)  addrInput.value  = data.address || '';
      if (phoneInput) phoneInput.value = data.phone   || '';
      if (emailInput) emailInput.value = data.email   || '';
      if (facebookInput) facebookInput.value = data.facebook_url || '';
    }
  } catch (err) {
    console.error('Error loading contact info:', err);
  }
}

window.saveContactInfo = async function() {
  const btn = document.getElementById('saveContactBtn');
  const origText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Saving...';

  try {
    const resp = await fetch('../api/contact/update-info.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: document.getElementById('contactAddress').value.trim(),
        phone:   document.getElementById('contactPhone').value.trim(),
        email:   document.getElementById('contactEmail').value.trim(),
        facebook_url: document.getElementById('contactFacebook').value.trim()
      })
    });
    const data = await resp.json();
    if (data.success) {
      showToast('Contact information saved successfully');
      await loadContactInfo();
      closeContactModal();
    } else {
      showToast('Error: ' + (data.error || 'Unknown error'), 'error');
    }
  } catch (err) {
    console.error('Error saving contact info:', err);
    showToast('Error saving contact information', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = origText;
  }
};

/* =============================================
   ABOUT PAGE MANAGER
   ============================================= */
function initAboutManager() {
  const aboutForm      = document.getElementById('aboutForm');
  if (!aboutForm) return;

  const aboutOrgNameEl     = document.getElementById('aboutOrgName');
  const aboutDescriptionEl = document.getElementById('aboutDescription');
  const aboutMissionEl     = document.getElementById('aboutMission');
  const aboutVisionEl      = document.getElementById('aboutVision');
  const imagePreviewEl     = document.getElementById('aboutOrgImagePreview');
  const imageBrowseBtn     = document.getElementById('aboutOrgImageBrowse');
  const imageRemoveBtn     = document.getElementById('aboutOrgImageRemove');
  const imageUploadEl      = document.getElementById('aboutOrgImageUpload');
  const addMemberBtn       = document.getElementById('addMemberBtn');
  const saveMemberBtn      = document.getElementById('saveMemberBtn');
  const memberImagePreview = document.getElementById('memberImagePreview');
  const memberImageBrowse  = document.getElementById('memberImageBrowse');
  const memberImageUpload  = document.getElementById('memberImageUpload');

  const PLACEHOLDER_IMAGE    = '../src/images/placeholder.png';
  const PLACEHOLDER_DB_PATH  = 'src/images/placeholder.png';

  let currentPhotoPath     = '';   // org photo path stored in DB
  let newPhotoFile         = null; // org photo selected but not yet uploaded
  let currentMemberPhoto   = '';   // member photo path stored in DB
  let newMemberPhotoFile   = null; // member photo selected but not yet uploaded
  let memberCount          = 0;    // live count from last renderTeamTable call

  // ── Helpers ───────────────────────────────────
  const setOrgImagePreview = (path) => {
    if (!imagePreviewEl) return;
    imagePreviewEl.src = path ? '../' + path : PLACEHOLDER_IMAGE;
  };

  const setMemberImagePreview = (path) => {
    if (!memberImagePreview) return;
    memberImagePreview.src = path ? '../' + path : PLACEHOLDER_IMAGE;
  };

  /** Populate the Display Order <select> with options 1..max and select defaultVal */
  const populateOrderSelect = (max, defaultVal) => {
    const sel  = document.getElementById('memberDisplayOrder');
    const hint = document.getElementById('memberDisplayOrderHint');
    if (!sel) return;
    sel.innerHTML = '';
    for (let i = 1; i <= max; i++) {
      const opt = document.createElement('option');
      opt.value       = i;
      opt.textContent = i;
      if (i === defaultVal) opt.selected = true;
      sel.appendChild(opt);
    }
    if (hint) hint.textContent = `Valid range: 1 – ${max}`;
  };

  // ── Load About Content from DB ────────────────
  const loadAboutContent = async () => {
    try {
      const res  = await fetch('../api/about/read-content.php');
      const json = await parseApiJson(res);

      if (json.success && json.data) {
        const d = json.data;
        if (aboutOrgNameEl)     aboutOrgNameEl.value     = d.organization_name || '';
        if (aboutDescriptionEl) aboutDescriptionEl.value = d.description       || '';
        if (aboutMissionEl)     aboutMissionEl.value     = d.mission           || '';
        if (aboutVisionEl)      aboutVisionEl.value      = d.vision            || '';
        currentPhotoPath = d.photo_path || '';
        setOrgImagePreview(currentPhotoPath);
      } else {
        if (aboutOrgNameEl) aboutOrgNameEl.value = 'Online Tournament Management';
        if (aboutMissionEl) aboutMissionEl.value = '';
        if (aboutVisionEl)  aboutVisionEl.value = '';
        setOrgImagePreview('');
      }
    } catch {
      adminToast('Failed to load about content.', 'error');
    }
  };

  // ── Org image browse ──────────────────────────
  if (imageBrowseBtn && imageUploadEl) {
    imageBrowseBtn.addEventListener('click', () => imageUploadEl.click());
  }

  if (imageUploadEl) {
    imageUploadEl.addEventListener('change', () => {
      const file = imageUploadEl.files && imageUploadEl.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        adminToast('Please select a valid image file.', 'error');
        imageUploadEl.value = '';
        return;
      }
      newPhotoFile = file;
      if (imagePreviewEl) imagePreviewEl.src = URL.createObjectURL(file);
    });
  }

  // ── Org image remove ──────────────────────────
  if (imageRemoveBtn) {
    imageRemoveBtn.addEventListener('click', () => {
      currentPhotoPath = '';
      newPhotoFile     = null;
      if (imageUploadEl) imageUploadEl.value = '';
      setOrgImagePreview('');
      adminToast('Organization photo removed.');
    });
  }

  // ── Member image browse ───────────────────────
  if (memberImageBrowse && memberImageUpload) {
    memberImageBrowse.addEventListener('click', () => memberImageUpload.click());
  }

  if (memberImageUpload) {
    memberImageUpload.addEventListener('change', () => {
      const file = memberImageUpload.files && memberImageUpload.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        adminToast('Please select a valid image file.', 'error');
        memberImageUpload.value = '';
        return;
      }
      newMemberPhotoFile = file;
      if (memberImagePreview) memberImagePreview.src = URL.createObjectURL(file);
    });
  }

  // ── Save About Content to DB ──────────────────
  aboutForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const orgName     = aboutOrgNameEl     ? aboutOrgNameEl.value.trim()     : '';
    const description = aboutDescriptionEl ? aboutDescriptionEl.value.trim() : '';
    const mission     = aboutMissionEl     ? aboutMissionEl.value.trim()     : '';
    const vision      = aboutVisionEl      ? aboutVisionEl.value.trim()      : '';

    if (!orgName) { adminToast('Organization name is required.', 'error'); return; }

    let photoPath = currentPhotoPath;

    // Upload new org photo first if one was selected
    if (newPhotoFile) {
      try {
        const fd = new FormData();
        fd.append('photo', newPhotoFile);
        const upRes  = await fetch('../api/about/upload-photo.php', { method: 'POST', body: fd });
        const upJson = await parseApiJson(upRes);
        if (!upJson.success) throw new Error(upJson.message || 'Upload failed.');
        photoPath        = upJson.path;
        currentPhotoPath = photoPath;
        newPhotoFile     = null;
        if (imageUploadEl) imageUploadEl.value = '';
        setOrgImagePreview(photoPath);
      } catch (err) {
        adminToast(err.message || 'Photo upload failed.', 'error');
        return;
      }
    }

    // Fall back to placeholder if no photo set at all
    const finalPhotoPath = photoPath || PLACEHOLDER_DB_PATH;

    const session   = AuthModule.getSession ? AuthModule.getSession() : null;
    const updatedBy = session ? session.id : null;

    try {
      const res  = await fetch('../api/about/save-content.php', {
        method  : 'POST',
        headers : { 'Content-Type': 'application/json' },
        body    : JSON.stringify({
          organization_name : orgName,
          description       : description,
          mission           : mission,
          vision            : vision,
          photo_path        : finalPhotoPath,
          updated_by        : updatedBy
        })
      });
      const json = await parseApiJson(res);
      if (!json.success) throw new Error(json.message || 'Save failed.');
      adminToast('About Us content saved.');
    } catch (err) {
      adminToast(err.message || 'Failed to save about content.', 'error');
    }
  });

  // ── Render Team Members table ─────────────────
  const renderTeamTable = async () => {
    const tbody = document.getElementById('teamTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">Loading...</td></tr>';

    try {
      const res  = await fetch('../api/about/members/read.php');
      const json = await parseApiJson(res);

      if (!json.success || !json.data || !json.data.length) {
        memberCount = 0;
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">No team members added yet.</td></tr>';
        return;
      }

      memberCount = json.data.length;

      tbody.innerHTML = json.data.map((m, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${escapeAdminHTML(m.full_name)}</td>
          <td>${escapeAdminHTML(m.role_title)}</td>
          <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
              title="${escapeAdminHTML(m.bio || '')}">${escapeAdminHTML(m.bio || '—')}</td>
          <td>${escapeAdminHTML(String(m.display_order))}</td>
          <td>
            <div class="action-btns">
              <button class="action-btn edit" title="Edit"   onclick="editTeamMember(${m.id})">&#9999;&#65039;</button>
              <button class="action-btn del"  title="Delete" onclick="deleteTeamMember(${m.id})">&#128465;&#65039;</button>
            </div>
          </td>
        </tr>
      `).join('');
    } catch {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#c62828;padding:20px;">Failed to load team members.</td></tr>';
    }
  };

  // ── Clear modal form ──────────────────────────
  const clearMemberForm = () => {
    ['memberId', 'memberFullName', 'memberRoleTitle', 'memberBio'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const titleEl  = document.getElementById('memberModalTitle');
    if (titleEl)  titleEl.textContent = 'Add Team Member';

    // Reset member photo
    currentMemberPhoto = '';
    newMemberPhotoFile = null;
    if (memberImageUpload) memberImageUpload.value = '';
    setMemberImagePreview('');

    // Display order: options 1..(memberCount+1), default = memberCount+1
    const newMax = memberCount + 1;
    populateOrderSelect(newMax, newMax);
  };

  // ── Add Member button ─────────────────────────
  if (addMemberBtn) {
    addMemberBtn.addEventListener('click', () => {
      clearMemberForm();
      openModal('memberModal');
    });
  }

  // ── Save Member (create or update) ───────────
  if (saveMemberBtn) {
    saveMemberBtn.addEventListener('click', async () => {
      const id        = document.getElementById('memberId')?.value;
      const fullName  = document.getElementById('memberFullName')?.value.trim();
      const roleTitle = document.getElementById('memberRoleTitle')?.value.trim();
      const bio       = document.getElementById('memberBio')?.value.trim() || null;
      const order     = parseInt(document.getElementById('memberDisplayOrder')?.value, 10) || 1;

      if (!fullName)  { adminToast('Full name is required.', 'error');  return; }
      if (!roleTitle) { adminToast('Role/Title is required.', 'error'); return; }

      // Validate display order range
      const maxOrder = id ? memberCount : memberCount + 1;
      if (order < 1 || order > maxOrder) {
        adminToast(`Display order must be between 1 and ${maxOrder}.`, 'error');
        return;
      }

      // Upload member photo if a new one was selected
      let memberPhotoPath = currentMemberPhoto;
      if (newMemberPhotoFile) {
        try {
          const fd = new FormData();
          fd.append('photo', newMemberPhotoFile);
          const upRes  = await fetch('../api/about/upload-photo.php', { method: 'POST', body: fd });
          const upJson = await parseApiJson(upRes);
          if (!upJson.success) throw new Error(upJson.message || 'Photo upload failed.');
          memberPhotoPath    = upJson.path;
          currentMemberPhoto = memberPhotoPath;
          newMemberPhotoFile = null;
          if (memberImageUpload) memberImageUpload.value = '';
          setMemberImagePreview(memberPhotoPath);
        } catch (err) {
          adminToast(err.message || 'Photo upload failed.', 'error');
          return;
        }
      }

      // Fall back to placeholder if no photo set
      const finalMemberPhoto = memberPhotoPath || PLACEHOLDER_DB_PATH;

      const payload = {
        full_name     : fullName,
        role_title    : roleTitle,
        bio,
        photo_path    : finalMemberPhoto,
        display_order : order
      };
      if (id) payload.id = Number(id);

      const url    = id ? '../api/about/members/update.php' : '../api/about/members/create.php';
      const method = id ? 'PUT' : 'POST';

      try {
        const res  = await fetch(url, {
          method,
          headers : { 'Content-Type': 'application/json' },
          body    : JSON.stringify(payload)
        });
        const json = await parseApiJson(res);
        if (!json.success) throw new Error(json.message || 'Save failed.');

        closeModal('memberModal');
        await renderTeamTable();
        adminToast(id ? 'Member updated.' : 'Member added successfully.');
      } catch (err) {
        adminToast(err.message || 'Failed to save member.', 'error');
      }
    });
  }

  // ── Edit Member — global (called from table onclick) ──
  window.editTeamMember = async (id) => {
    try {
      const res  = await fetch(`../api/about/members/read.php?id=${encodeURIComponent(id)}`);
      const json = await parseApiJson(res);
      if (!json.success || !json.data) throw new Error(json.message || 'Member not found.');

      const m = json.data;
      document.getElementById('memberId').value        = m.id;
      document.getElementById('memberFullName').value  = m.full_name;
      document.getElementById('memberRoleTitle').value = m.role_title;
      document.getElementById('memberBio').value       = m.bio || '';

      // Member photo
      currentMemberPhoto = m.photo_path || '';
      newMemberPhotoFile = null;
      if (memberImageUpload) memberImageUpload.value = '';
      setMemberImagePreview(currentMemberPhoto);

      // Display order: options 1..memberCount (existing set), default = m.display_order
      populateOrderSelect(memberCount || 1, Number(m.display_order));

      const titleEl = document.getElementById('memberModalTitle');
      if (titleEl) titleEl.textContent = 'Edit Team Member';

      openModal('memberModal');
    } catch (err) {
      adminToast(err.message || 'Failed to load member.', 'error');
    }
  };

  // ── Delete Member — global (called from table onclick) ──
  window.deleteTeamMember = async (id) => {
    if (!confirm('Delete this team member? This action cannot be undone.')) return;
    try {
      const res  = await fetch('../api/about/members/delete.php', {
        method  : 'DELETE',
        headers : { 'Content-Type': 'application/json' },
        body    : JSON.stringify({ id: Number(id) })
      });
      const json = await parseApiJson(res);
      if (!json.success) throw new Error(json.message || 'Delete failed.');

      await renderTeamTable();
      adminToast('Member deleted.', 'warning');
    } catch (err) {
      adminToast(err.message || 'Failed to delete member.', 'error');
    }
  };

  // ── Init ──────────────────────────────────────
  loadAboutContent();
  renderTeamTable();
}

/* =============================================
   REPORTS / EXPORT
   ============================================= */
function initReports() {
  const exportBtn = document.getElementById('exportReportBtn');
  if (!exportBtn) return;

  exportBtn.addEventListener('click', () => openModal('exportModal'));

  document.getElementById('exportCsvBtn')?.addEventListener('click', () => {
    exportEvents('csv');
    closeModal('exportModal');
  });

  document.getElementById('exportExcelBtn')?.addEventListener('click', () => {
    exportEvents('excel');
    closeModal('exportModal');
  });

  document.getElementById('exportPdfBtn')?.addEventListener('click', () => {
    exportEvents('pdf');
    closeModal('exportModal');
  });
}

function exportEventsRows() {
  return eventsCache.map(e => ({
    ID:          e.id,
    'Public ID': e.public_id  || '',
    Title:       e.title      || '',
    Sport:       e.sport_name || '',
    Category:    e.category   || '',
    'Start Date': e.event_start_date || '',
    'End Date':   e.event_end_date   || '',
    Location:    e.location   || '',
    Teams:       e.teams_count != null ? e.teams_count : '',
    Status:      e.status     || ''
  }));
}

function exportEvents(format) {
  const rows   = exportEventsRows();
  const keys   = rows.length ? Object.keys(rows[0]) : [];
  const date   = new Date().toISOString().slice(0, 10);

  if (format === 'csv') {
    const lines = [
      keys.map(k => `"${k}"`).join(','),
      ...rows.map(r => keys.map(k => `"${String(r[k]).replace(/"/g, '""')}"`).join(','))
    ];
    downloadBlob(lines.join('\n'), `events_${date}.csv`, 'text/csv');
    adminToast('Exported as CSV.');
    return;
  }

  if (format === 'excel') {
    // Build a tab-separated UTF-8 file with .xls MIME so Excel opens it directly
    const lines = [
      keys.join('\t'),
      ...rows.map(r => keys.map(k => String(r[k])).join('\t'))
    ];
    downloadBlob(lines.join('\n'), `events_${date}.xls`, 'application/vnd.ms-excel');
    adminToast('Exported as Excel.');
    return;
  }

  if (format === 'pdf') {
    const win = window.open('', '_blank');
    if (!win) { adminToast('Allow pop-ups to export PDF.', 'error'); return; }

    const colWidths = keys.map(() => `${Math.floor(100 / keys.length)}%`).join(' ');
    const headerCells = keys.map(k =>
      `<th style="background:#1a237e;color:#fff;padding:7px 10px;text-align:left;font-size:11px;">${k}</th>`
    ).join('');
    const bodyRows = rows.map((r, i) =>
      `<tr style="background:${i % 2 === 0 ? '#f9f9f9' : '#fff'};">
        ${keys.map(k => `<td style="padding:6px 10px;font-size:11px;border-bottom:1px solid #eee;">${r[k]}</td>`).join('')}
      </tr>`
    ).join('');

    win.document.write(`<!DOCTYPE html><html><head><title>Events Export</title>
      <style>body{font-family:Arial,sans-serif;margin:24px;}h2{color:#1a237e;margin-bottom:12px;}
      table{border-collapse:collapse;width:100%;}@media print{button{display:none;}}</style>
      </head><body>
      <h2>Events Report &mdash; ${date}</h2>
      <table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>
      <br><button onclick="window.print()" style="padding:8px 20px;background:#1a237e;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;">🖨️ Print / Save PDF</button>
      </body></html>`);
    win.document.close();
    adminToast('PDF preview opened in new tab.');
  }
}

function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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
