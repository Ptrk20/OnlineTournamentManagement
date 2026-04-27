/**
 * Online Tournament Management
 * main.js — Front-end interactions & UI logic
 */

'use strict';

/* =============================================
   1. NAVIGATION — Hamburger / Active Link
   ============================================= */
document.addEventListener('DOMContentLoaded', () => {

  // ── Hamburger toggle ──────────────────────
  const hamburger = document.querySelector('.hamburger');
  const navMenu   = document.querySelector('.nav-menu');

  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      hamburger.classList.toggle('active');
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
        navMenu.classList.remove('open');
        hamburger.classList.remove('active');
      }
    });
  }

  // ── Active link ───────────────────────────
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-menu a').forEach(link => {
    const href = link.getAttribute('href');
    if (href && href === currentPage) {
      link.classList.add('active');
    }
  });

  // ── Init components ───────────────────────
  initCounters();
  initScrollReveal();
  initContactForm();
  initAnnouncementClose();
  loadPublicEvents();
  loadPublicNews();
});

/* =============================================
   2. ANIMATED COUNTERS
   ============================================= */
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

function animateCounter(el) {
  const target   = parseInt(el.getAttribute('data-count'), 10);
  const duration = 1500;
  const step     = target / (duration / 16);
  let   current  = 0;

  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      el.textContent = target.toLocaleString();
      clearInterval(timer);
    } else {
      el.textContent = Math.floor(current).toLocaleString();
    }
  }, 16);
}

/* =============================================
   3. SCROLL REVEAL ANIMATIONS
   ============================================= */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  reveals.forEach(el => observer.observe(el));

  // Add default CSS for reveal effect if not in stylesheet
  if (!document.getElementById('reveal-styles')) {
    const style = document.createElement('style');
    style.id = 'reveal-styles';
    style.textContent = `
      .reveal { opacity: 0; transform: translateY(25px); transition: opacity 0.6s ease, transform 0.6s ease; }
      .reveal.revealed { opacity: 1; transform: translateY(0); }
    `;
    document.head.appendChild(style);
  }
}

/* =============================================
   4. CONTACT FORM — Client-side Validation
   ============================================= */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateContactForm(form)) return;

    const btn = form.querySelector('[type="submit"]');
    btn.disabled    = true;
    btn.textContent = 'Sending…';

    // Simulate async POST to backend
    const payload = {
      name:    sanitize(form.querySelector('#c-name').value),
      email:   sanitize(form.querySelector('#c-email').value),
      subject: sanitize(form.querySelector('#c-subject').value),
      message: sanitize(form.querySelector('#c-message').value),
    };

    const ok = await ContactAPI.submit(payload);

    if (ok) {
      showToast('Your message was sent successfully! We will get back to you soon.', 'success');
      form.reset();
    } else {
      showToast('Failed to send message. Please try again later.', 'error');
    }

    btn.disabled    = false;
    btn.textContent = 'Send Message';
  });
}

function validateContactForm(form) {
  let valid = true;

  const fields = [
    { id: 'c-name',    rule: v => v.trim().length >= 2,               msg: 'Name must be at least 2 characters.' },
    { id: 'c-email',   rule: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), msg: 'Enter a valid email address.' },
    { id: 'c-subject', rule: v => v.trim().length >= 3,               msg: 'Subject is required.' },
    { id: 'c-message', rule: v => v.trim().length >= 10,              msg: 'Message must be at least 10 characters.' },
  ];

  fields.forEach(({ id, rule, msg }) => {
    const el      = form.querySelector(`#${id}`);
    const errEl   = form.querySelector(`#${id}-error`);
    const wrapper = el ? el.closest('.form-group') : null;
    if (!el) return;

    if (!rule(el.value)) {
      valid = false;
      if (wrapper) wrapper.classList.add('has-error');
      if (errEl)   errEl.textContent = msg;
    } else {
      if (wrapper) wrapper.classList.remove('has-error');
      if (errEl)   errEl.textContent = '';
    }
  });

  return valid;
}

/* =============================================
   5. ANNOUNCEMENT BAR — Close Button
   ============================================= */
function initAnnouncementClose() {
  const bar = document.querySelector('.announcement-bar');
  const btn = document.querySelector('.announcement-close');
  if (btn && bar) {
    btn.addEventListener('click', () => {
      bar.style.display = 'none';
      sessionStorage.setItem('ann-closed', '1');
    });

    if (sessionStorage.getItem('ann-closed') === '1') {
      bar.style.display = 'none';
    }
  }
}

/* =============================================
   6. TOAST NOTIFICATIONS
   ============================================= */
function showToast(message, type = 'success', duration = 4000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast  = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="t-icon">${icons[type] || icons.info}</span>
    <span class="t-msg">${escapeHTML(message)}</span>
    <span class="t-close" role="button" aria-label="Close">✕</span>
  `;

  toast.querySelector('.t-close').addEventListener('click', () => removeToast(toast));
  container.appendChild(toast);

  setTimeout(() => removeToast(toast), duration);
}

function removeToast(toast) {
  toast.style.opacity   = '0';
  toast.style.transform = 'translateX(120%)';
  setTimeout(() => toast.remove(), 350);
}

/* =============================================
   7. LOAD PUBLIC EVENTS (from localStorage / API)
   ============================================= */
function loadPublicEvents() {
  const container = document.getElementById('events-list');
  if (!container) return;

  const events = DataStore.getEvents();
  if (!events.length) {
    container.innerHTML = '<p class="text-center" style="color:#aaa;padding:30px;">No events available at the moment.</p>';
    return;
  }

  container.innerHTML = events.slice(0, 6).map(ev => renderEventCard(ev)).join('');
}

function renderEventCard(ev) {
  const d     = new Date(ev.date);
  const month = d.toLocaleString('default', { month: 'short' }).toUpperCase();
  const day   = d.getDate();

  return `
    <div class="event-card reveal">
      <div class="event-img">
        🏆
        <div class="event-date-badge">
          <span class="month">${month}</span>
          <span class="day">${day}</span>
        </div>
      </div>
      <div class="event-body">
        <span class="badge badge-${statusBadge(ev.status)}">${ev.status}</span>
        <h3>${escapeHTML(ev.title)}</h3>
        <div class="meta">
          <span>📍 ${escapeHTML(ev.location)}</span>
          <span>👥 ${escapeHTML(ev.teams)} Teams</span>
        </div>
        <p>${escapeHTML(ev.description.slice(0, 100))}…</p>
        <a href="events.html#${ev.id}" class="btn btn-dark">View Details</a>
      </div>
    </div>
  `;
}

/* =============================================
   8. LOAD PUBLIC NEWS
   ============================================= */
function loadPublicNews() {
  const container = document.getElementById('news-list');
  if (!container) return;

  const news = DataStore.getNews();
  if (!news.length) {
    container.innerHTML = '<p class="text-center" style="color:#aaa;padding:30px;">No news articles yet.</p>';
    return;
  }

  container.innerHTML = news.slice(0, 3).map(n => renderNewsCard(n)).join('');
}

function renderNewsCard(n) {
  return `
    <div class="news-card reveal">
      <div class="news-img">📰</div>
      <div class="news-body">
        <div class="news-category">${escapeHTML(n.category)}</div>
        <h3>${escapeHTML(n.title)}</h3>
        <p>${escapeHTML(n.excerpt)}</p>
        <div class="news-meta">
          <span>📅 ${n.date}</span>
          <a href="news.html#${n.id}" style="color:#ff6f00;font-weight:600;">Read more →</a>
        </div>
      </div>
    </div>
  `;
}

/* =============================================
   9. HELPER FUNCTIONS
   ============================================= */
function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Strip tags from user input before sending to server
function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

function statusBadge(status) {
  const map = { 'Ongoing': 'success', 'Upcoming': 'accent', 'Completed': 'primary', 'Cancelled': 'danger' };
  return map[status] || 'primary';
}

/* =============================================
   10. DATA STORE — localStorage abstraction
       (replaces MySQL in pure front-end env;
        swap fetch() calls for real API)
   ============================================= */
const DataStore = {
  _key: (k) => `otm_${k}`,

  getEvents() {
    try {
      return JSON.parse(localStorage.getItem(this._key('events'))) || this._defaultEvents();
    } catch { return this._defaultEvents(); }
  },

  getNews() {
    try {
      return JSON.parse(localStorage.getItem(this._key('news'))) || this._defaultNews();
    } catch { return this._defaultNews(); }
  },

  getUsers() {
    try {
      return JSON.parse(localStorage.getItem(this._key('users'))) || [];
    } catch { return []; }
  },

  saveEvents(data)  { localStorage.setItem(this._key('events'), JSON.stringify(data)); },
  saveNews(data)    { localStorage.setItem(this._key('news'),   JSON.stringify(data)); },
  saveUsers(data)   { localStorage.setItem(this._key('users'),  JSON.stringify(data)); },

  getAnnouncements() {
    try {
      return JSON.parse(localStorage.getItem(this._key('announcements'))) || [];
    } catch { return []; }
  },

  saveAnnouncements(data) { localStorage.setItem(this._key('announcements'), JSON.stringify(data)); },

  getMessages() {
    try {
      return JSON.parse(localStorage.getItem(this._key('messages'))) || [];
    } catch { return []; }
  },

  saveMessages(data) { localStorage.setItem(this._key('messages'), JSON.stringify(data)); },

  _defaultEvents() {
    return [
      { id: 'ev1', title: 'National Basketball Championship', date: '2026-06-15', location: 'Manila Arena', teams: '16', status: 'Upcoming',  description: 'Annual national level basketball championship featuring top teams across the country.' },
      { id: 'ev2', title: 'Regional Volleyball League',        date: '2026-05-20', location: 'Rizal Stadium',   teams: '12', status: 'Ongoing',   description: 'Regional volleyball competition showcasing talent from various provinces.' },
      { id: 'ev3', title: 'City Chess Tournament',             date: '2026-04-10', location: 'City Hall',       teams: '32', status: 'Completed', description: 'Annual city-wide chess tournament for all skill levels.' },
    ];
  },

  _defaultNews() {
    return [
      { id: 'n1', title: 'OTM Platform Launches SMS Blaster Feature', category: 'Announcement', excerpt: 'The new SMS Blaster powered by iTexMo allows organizers to notify participants instantly.', date: 'Apr 20, 2026' },
      { id: 'n2', title: 'National Basketball Championship Opens Registration', category: 'Events',       excerpt: 'Registration for the upcoming National Basketball Championship is now open. Teams can sign up before May 30.', date: 'Apr 15, 2026' },
      { id: 'n3', title: 'Top 10 Teams to Watch This Season',            category: 'Highlights',   excerpt: 'Our analysts pick the top 10 teams expected to dominate the tournaments this year.', date: 'Apr 10, 2026' },
    ];
  },
};

/* =============================================
   11. CONTACT API — wraps fetch to backend
   ============================================= */
const ContactAPI = {
  async submit(payload) {
    // In production, replace with real API endpoint:
    // return fetch('/api/contact', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) }).then(r => r.ok);

    // Save locally for now
    const messages = DataStore.getMessages();
    messages.unshift({ ...payload, id: Date.now(), read: false, date: new Date().toLocaleDateString() });
    DataStore.saveMessages(messages);
    return true;
  }
};

/* =============================================
   12. SESSION / AUTH GUARD (public pages)
   ============================================= */
const Auth = {
  getSession() {
    try {
      return JSON.parse(sessionStorage.getItem('otm_session'));
    } catch { return null; }
  },

  isLoggedIn() {
    const s = this.getSession();
    return s && s.token;
  },

  logout() {
    sessionStorage.removeItem('otm_session');
    window.location.href = 'login.html';
  }
};

// Update nav login button if user is logged in
(function updateNavAuth() {
  const btn = document.querySelector('.btn-login');
  if (!btn) return;
  if (Auth.isLoggedIn()) {
    btn.textContent = 'Dashboard';
    btn.href        = 'admin/dashboard.html';
  }
})();

/* =============================================
   13. CAMPUS SPORTSFEST — LIVE MEDAL STANDINGS
       Sports: Volleyball, Basketball, Futsal, Badminton
       Courses: IT, CS, Crim, HRM, BSM, BSEDUC, BSPSYCH
       Result values: 'G'=Gold, 'S'=Silver, 'B'=Bronze, '-'=No medal
   ============================================= */
(function initStandings() {
  const STANDINGS_KEY = 'otm_sportsfest_standings';

  const defaultStandings = [
    { course: 'IT',      vol: 'G', bbl: 'S', fut: '-', bad: 'G',  g: 2, s: 1, b: 0 },
    { course: 'CS',      vol: 'S', bbl: 'G', fut: 'B', bad: '-',  g: 1, s: 1, b: 1 },
    { course: 'Crim',    vol: '-', bbl: 'B', fut: 'G', bad: 'S',  g: 1, s: 1, b: 1 },
    { course: 'HRM',     vol: 'B', bbl: '-', fut: 'S', bad: 'B',  g: 0, s: 1, b: 2 },
    { course: 'BSM',     vol: '-', bbl: '-', fut: '-', bad: 'B',  g: 0, s: 0, b: 1 },
    { course: 'BSEDUC',  vol: '-', bbl: '-', fut: '-', bad: '-',  g: 0, s: 0, b: 0 },
    { course: 'BSPSYCH', vol: '-', bbl: '-', fut: '-', bad: '-',  g: 0, s: 0, b: 0 },
  ];

  function getStandings() {
    try {
      return JSON.parse(localStorage.getItem(STANDINGS_KEY)) || defaultStandings;
    } catch { return defaultStandings; }
  }

  function sortStandings(data) {
    return [...data].sort((a, b) =>
      b.g !== a.g ? b.g - a.g :
      b.s !== a.s ? b.s - a.s :
      b.b - a.b
    );
  }

  function medalTag(val) {
    if (val === 'G') return '<span class="sport-result" style="background:rgba(255,215,0,.2);color:gold;">G</span>';
    if (val === 'S') return '<span class="sport-result" style="background:rgba(200,200,200,.15);color:#ddd;">S</span>';
    if (val === 'B') return '<span class="sport-result" style="background:rgba(205,127,50,.2);color:#cd7f32;">B</span>';
    return '<span class="sport-result" style="color:rgba(255,255,255,.2);">&#8212;</span>';
  }

  function rankBadge(rank) {
    const styles = {
      1: 'background:gold;color:#333;',
      2: 'background:#aaa;color:#111;',
      3: 'background:#cd7f32;color:#fff;',
    };
    const style = styles[rank] || 'background:rgba(255,255,255,.15);color:#fff;';
    return '<span class="rank-badge" style="' + style + '">' + rank + '</span>';
  }

  function rowClass(rank) {
    if (rank === 1) return 'standing-row top-1';
    if (rank === 2) return 'standing-row top-2';
    if (rank === 3) return 'standing-row top-3';
    return 'standing-row';
  }

  function renderStandings() {
    const body = document.getElementById('standingsBody');
    if (!body) return;

    const sorted = sortStandings(getStandings());

    body.innerHTML = sorted.map(function (row, i) {
      const rank = i + 1;
      return '<div class="' + rowClass(rank) + '">' +
        '<div style="display:flex;align-items:center;color:#fff;font-weight:700;">' +
          rankBadge(rank) +
          '<span style="font-size:.85rem;">' + escapeHTML(row.course) + '</span>' +
        '</div>' +
        '<div>' + medalTag(row.vol) + '</div>' +
        '<div>' + medalTag(row.bbl) + '</div>' +
        '<div>' + medalTag(row.fut) + '</div>' +
        '<div>' + medalTag(row.bad) + '</div>' +
        '<div class="medal-count medal-gold">' + row.g + '</div>' +
        '<div class="medal-count medal-silver">' + row.s + '</div>' +
        '<div class="medal-count medal-bronze">' + row.b + '</div>' +
      '</div>';
    }).join('');

    const ts = document.getElementById('lastUpdated');
    if (ts) ts.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Expose for admin use: window.updateStandings(newDataArray)
  window.updateStandings = function (data) {
    localStorage.setItem(STANDINGS_KEY, JSON.stringify(data));
    renderStandings();
  };

  // Run on DOM ready; auto-refresh every 30 seconds
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      renderStandings();
      setInterval(renderStandings, 30000);
    });
  } else {
    renderStandings();
    setInterval(renderStandings, 30000);
  }
})();

/* =============================================
   14. EVENTS BRACKET PAGE
   ============================================= */
(function initEventsBracket() {
  const courses = ['IT', 'CS', 'CRIM', 'HRM', 'BSM', 'BSEDUC', 'BSPSYCH'];
  const sports = [
    {
      id: 'volleyball', label: 'Volleyball', icon: '&#127952;',
      events: [
        {
          id: 'vol-current', name: 'Campus Volleyball League 2026', status: 'Ongoing',
          bracket: {
            Mens: {
              upper: [
                { round: 'Quarterfinal', a: 'IT', b: 'CS', score: '2-1' },
                { round: 'Quarterfinal', a: 'CRIM', b: 'HRM', score: '2-0' },
                { round: 'Semifinal', a: 'IT', b: 'CRIM', score: '1-2' }
              ],
              lower: [
                { round: 'Lower R1', a: 'CS', b: 'HRM', score: '2-0' },
                { round: 'Lower Final', a: 'CS', b: 'IT', score: '1-2' }
              ]
            },
            Womens: {
              upper: [
                { round: 'Quarterfinal', a: 'BSM', b: 'BSEDUC', score: '2-0' },
                { round: 'Quarterfinal', a: 'CS', b: 'BSPSYCH', score: '2-1' },
                { round: 'Semifinal', a: 'BSM', b: 'CS', score: '1-2' }
              ],
              lower: [
                { round: 'Lower R1', a: 'BSEDUC', b: 'BSPSYCH', score: '2-1' },
                { round: 'Lower Final', a: 'BSEDUC', b: 'BSM', score: '0-2' }
              ]
            }
          },
          schedule: [
            { datetime: 'Apr 28, 2026 09:00 AM', match: 'IT vs CS', venue: 'Main Gym', status: 'Ongoing' },
            { datetime: 'Apr 28, 2026 01:00 PM', match: 'CRIM vs HRM', venue: 'Main Gym', status: 'Upcoming' },
            { datetime: 'Apr 29, 2026 10:00 AM', match: 'Semifinal Match', venue: 'Main Gym', status: 'Upcoming' }
          ]
        },
        {
          id: 'vol-intramurals', name: 'Intramurals Volleyball Cup', status: 'Upcoming',
          bracket: {
            Mens: { upper: [{ round: 'Round 1', a: 'IT', b: 'BSM', score: 'TBD' }], lower: [] },
            Womens: { upper: [{ round: 'Round 1', a: 'CS', b: 'BSEDUC', score: 'TBD' }], lower: [] }
          },
          schedule: [{ datetime: 'May 03, 2026 08:30 AM', match: 'IT vs BSM', venue: 'Covered Court', status: 'Upcoming' }]
        }
      ]
    },
    {
      id: 'basketball', label: 'Basketball', icon: '&#127936;',
      events: [
        {
          id: 'bsk-current', name: 'Campus Basketball Tournament 2026', status: 'Ongoing',
          bracket: {
            Mens: {
              upper: [
                { round: 'Quarterfinal', a: 'IT', b: 'CRIM', score: '78-74' },
                { round: 'Quarterfinal', a: 'CS', b: 'HRM', score: '69-63' },
                { round: 'Semifinal', a: 'IT', b: 'CS', score: '81-80' }
              ],
              lower: [
                { round: 'Lower R1', a: 'CRIM', b: 'HRM', score: '75-71' },
                { round: 'Lower Final', a: 'CRIM', b: 'CS', score: '66-70' }
              ]
            },
            Womens: {
              upper: [
                { round: 'Quarterfinal', a: 'BSPSYCH', b: 'BSEDUC', score: '60-55' },
                { round: 'Quarterfinal', a: 'BSM', b: 'CS', score: '54-59' }
              ],
              lower: [{ round: 'Lower Final', a: 'BSEDUC', b: 'BSM', score: '50-57' }]
            }
          },
          schedule: [
            { datetime: 'Apr 28, 2026 03:00 PM', match: 'IT vs CS', venue: 'Sports Center', status: 'Ongoing' },
            { datetime: 'Apr 29, 2026 03:00 PM', match: 'CRIM vs CS', venue: 'Sports Center', status: 'Upcoming' }
          ]
        }
      ]
    },
    {
      id: 'futsal', label: 'Futsal', icon: '&#9917;',
      events: [
        {
          id: 'fut-current', name: 'Campus Futsal Challenge', status: 'Ongoing',
          bracket: {
            Mens: {
              upper: [
                { round: 'Quarterfinal', a: 'IT', b: 'BSPSYCH', score: '3-1' },
                { round: 'Quarterfinal', a: 'CRIM', b: 'BSM', score: '2-2 (4-3)' }
              ],
              lower: [{ round: 'Lower R1', a: 'BSPSYCH', b: 'BSM', score: '2-0' }]
            },
            Womens: {
              upper: [
                { round: 'Quarterfinal', a: 'CS', b: 'BSEDUC', score: '1-0' },
                { round: 'Quarterfinal', a: 'HRM', b: 'BSM', score: '2-1' }
              ],
              lower: []
            }
          },
          schedule: [
            { datetime: 'Apr 30, 2026 09:00 AM', match: 'IT vs CRIM', venue: 'Open Field A', status: 'Upcoming' },
            { datetime: 'Apr 30, 2026 11:00 AM', match: 'CS vs HRM', venue: 'Open Field A', status: 'Upcoming' }
          ]
        }
      ]
    },
    {
      id: 'badminton', label: 'Badminton', icon: '&#127992;',
      events: [
        {
          id: 'bad-current', name: 'Campus Badminton Open', status: 'Ongoing',
          bracket: {
            Mens: {
              upper: [
                { round: 'Upper R1', a: 'IT', b: 'HRM', score: '2-0' },
                { round: 'Upper R1', a: 'CRIM', b: 'CS', score: '1-2' }
              ],
              lower: [{ round: 'Lower R1', a: 'HRM', b: 'CRIM', score: '2-1' }]
            },
            Womens: {
              upper: [
                { round: 'Upper R1', a: 'BSEDUC', b: 'BSPSYCH', score: '2-1' },
                { round: 'Upper R1', a: 'BSM', b: 'CS', score: '0-2' }
              ],
              lower: [{ round: 'Lower R1', a: 'BSPSYCH', b: 'BSM', score: '2-0' }]
            }
          },
          schedule: [
            { datetime: 'Apr 28, 2026 08:00 AM', match: 'IT vs CS', venue: 'Badminton Hall 1', status: 'Ongoing' },
            { datetime: 'Apr 28, 2026 10:00 AM', match: 'BSEDUC vs BSM', venue: 'Badminton Hall 2', status: 'Upcoming' }
          ]
        }
      ]
    }
  ];

  window.bracketData = { sports: sports, courses: courses };
  window.initBracketUI = function() {
    const sportsOptions = document.getElementById('sportsOptions');
    const genderSwitch = document.getElementById('genderSwitch');
    const eventFilter = document.getElementById('eventFilter');
    const courseFilter = document.getElementById('courseFilter');
    const bracketBoard = document.getElementById('bracketBoard');
    const scheduleList = document.getElementById('scheduleList');
    const jumpScheduleBtn = document.getElementById('jumpScheduleBtn');

    if (!sportsOptions) return;

    const state = { sportId: sports[0].id, gender: 'Mens', eventId: null, course: '' };
    const sportImageById = {
      volleyball: 'src/images/volleyball.png',
      basketball: 'src/images/basketball.png',
      futsal: 'src/images/futsal.png',
      badminton: 'src/images/shuttlecock.png'
    };

    function getCurrentSport() { return sports.find(function (s) { return s.id === state.sportId; }) || sports[0]; }
    function getCurrentEvent() {
      var sport = getCurrentSport();
      return sport.events.find(function (e) { return e.id === state.eventId; }) || sport.events[0];
    }
    function defaultEventIdForSport(sport) {
      var ongoing = sport.events.find(function (ev) { return ev.status === 'Ongoing'; });
      return (ongoing || sport.events[0]).id;
    }

    function renderSports() {
      sportsOptions.innerHTML = sports.map(function (s) {
        var active = s.id === state.sportId ? 'active' : '';
        var imageSrc = sportImageById[s.id] || '';
        return '<button type="button" class="sport-option ' + active + '" data-sport="' + s.id + '">' +
          '<span class="sport-bubble"><img src="' + imageSrc + '" alt="' + s.label + '" /></span><span class="sport-label">' + s.label + '</span></button>';
      }).join('');
    }

    function renderEventOptions() {
      var sport = getCurrentSport();
      eventFilter.innerHTML = sport.events.map(function (ev) {
        return '<option value="' + ev.id + '">' + ev.name + ' (' + ev.status + ')</option>';
      }).join('');
      if (!sport.events.some(function (ev) { return ev.id === state.eventId; })) {
        state.eventId = defaultEventIdForSport(sport);
      }
      eventFilter.value = state.eventId;
    }

    // Group flat match list into rounds: [ { roundName, matches: [{a,b,score,winner}] } ]
    function groupIntoRounds(matches) {
      var roundMap = [];
      var seen = {};
      matches.forEach(function (m) {
        if (!seen[m.round]) { seen[m.round] = true; roundMap.push({ name: m.round, matches: [] }); }
        roundMap[roundMap.length - 1].matches.push(m);
      });
      // re-group correctly
      var map = {};
      var order = [];
      matches.forEach(function (m) {
        if (!map[m.round]) { map[m.round] = []; order.push(m.round); }
        map[m.round].push(m);
      });
      return order.filter(function(r, i) { return order.indexOf(r) === i; }).map(function (r) {
        return { name: r, matches: map[r] };
      });
    }

    function matchCard(m, courseFilter) {
      var highlight = courseFilter && (m.a === courseFilter || m.b === courseFilter);
      var scores = m.score !== 'TBD' ? m.score.split('-') : ['', ''];
      var scoreA = scores[0] ? scores[0].trim() : '';
      var scoreB = scores[1] ? scores[1].trim() : '';
      // Determine winner by score (only if both numeric)
      var numA = parseInt(scoreA), numB = parseInt(scoreB);
      var winA = !isNaN(numA) && !isNaN(numB) && numA > numB;
      var winB = !isNaN(numA) && !isNaN(numB) && numB > numA;
      return '<div class="playoff-match' + (highlight ? ' highlighted' : '') + '">' +
        '<div class="playoff-team' + (winA ? ' winner' : '') + '">' +
          '<span class="playoff-name">' + m.a + '</span>' +
          '<span class="playoff-score">' + (scoreA || '—') + '</span>' +
        '</div>' +
        '<div class="playoff-team' + (winB ? ' winner' : '') + '">' +
          '<span class="playoff-name">' + m.b + '</span>' +
          '<span class="playoff-score">' + (scoreB || '—') + '</span>' +
        '</div>' +
      '</div>';
    }

    function renderBracket() {
      var ev = getCurrentEvent();
      var group = ev.bracket[state.gender];
      var allMatches = (group.upper || []).concat(group.lower || []);
      var filtered = state.course
        ? allMatches.filter(function (m) { return m.a === state.course || m.b === state.course; })
        : allMatches;

      if (!filtered.length) {
        bracketBoard.innerHTML = '<div class="empty-state" style="padding:32px;">No bracket data for this filter.</div>';
        renderSchedule();
        return;
      }

      var rounds = groupIntoRounds(filtered);
      var numRounds = rounds.length;

      // Determine champion: winner of last round last match
      var lastRound = rounds[numRounds - 1];
      var lastMatch = lastRound.matches[lastRound.matches.length - 1];
      var scores = lastMatch.score !== 'TBD' ? lastMatch.score.split('-') : ['', ''];
      var sA = parseInt(scores[0]), sB = parseInt(scores[1]);
      var champion = (!isNaN(sA) && !isNaN(sB)) ? (sA > sB ? lastMatch.a : lastMatch.b) : null;

      var html = '<div class="playoff-bracket">';

      rounds.forEach(function (round, ri) {
        var isLast = ri === numRounds - 1;
        html += '<div class="playoff-round">';
        html += '<div class="playoff-round-label">' + round.name + '</div>';
        html += '<div class="playoff-round-matches">';
        round.matches.forEach(function (m) {
          html += '<div class="playoff-match-wrap">';
          html += matchCard(m, state.course);
          if (!isLast) html += '<div class="playoff-connector"><div class="playoff-connector-line"></div></div>';
          html += '</div>';
        });
        html += '</div></div>';
      });

      // Champion slot
      html += '<div class="playoff-round playoff-champion-round">';
      html += '<div class="playoff-round-label">&#127942; Champion</div>';
      html += '<div class="playoff-round-matches">';
      html += '<div class="playoff-champion-slot">' + (champion ? champion : '?') + '</div>';
      html += '</div></div>';

      html += '</div>';
      bracketBoard.innerHTML = html;
      renderSchedule();
    }

    function renderSchedule() {
      var ev = getCurrentEvent();
      var schedule = (ev.schedule || []).filter(function (item) {
        if (!state.course) return true;
        return item.match.indexOf(state.course) !== -1;
      });

      if (!schedule.length) {
        scheduleList.innerHTML = '<div class="empty-state">No schedules for this filter.</div>';
        return;
      }

      scheduleList.innerHTML = schedule.map(function (item) {
        var live = item.status === 'Ongoing';
        return '<div class="schedule-item">' +
          '<div class="schedule-time">' + item.datetime + '</div>' +
          '<div><strong>' + item.match + '</strong><div class="schedule-meta">' + item.venue + '</div></div>' +
          '<span class="schedule-status' + (live ? ' live' : '') + '">' + item.status + '</span></div>';
      }).join('');
    }

    function renderAll() { renderSports(); renderEventOptions(); renderBracket(); }

    sportsOptions.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-sport]');
      if (!btn) return;
      state.sportId = btn.getAttribute('data-sport');
      state.eventId = defaultEventIdForSport(getCurrentSport());
      state.course = '';
      courseFilter.value = '';
      renderAll();
    });

    genderSwitch.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-gender]');
      if (!btn) return;
      state.gender = btn.getAttribute('data-gender');
      genderSwitch.querySelectorAll('button').forEach(function (b) { b.classList.toggle('active', b === btn); });
      renderBracket();
    });

    eventFilter.addEventListener('change', function () { state.eventId = eventFilter.value; renderBracket(); });
    courseFilter.addEventListener('change', function () { state.course = courseFilter.value; renderBracket(); });
    if (jumpScheduleBtn) {
      jumpScheduleBtn.addEventListener('click', function () {
        document.getElementById('schedulesSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    state.eventId = defaultEventIdForSport(getCurrentSport());
    renderAll();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initBracketUI);
  } else {
    window.initBracketUI();
  }
})();

