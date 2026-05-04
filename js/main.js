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
  initNewsPage();
  initNewsArticlePage();
  loadPublicAboutPage();
  loadPublicContactInfo();
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
   7. LOAD PUBLIC EVENTS (from API — Current then Upcoming)
   ============================================= */
async function loadPublicEvents() {
  const container = document.getElementById('events-list');
  if (!container) return;

  try {
    const res  = await fetch('api/events/read.php');
    const json = await parsePublicApiJson(res);
    const all  = (json.success && Array.isArray(json.data)) ? json.data : [];

    // Keep only Ongoing (Current) and Upcoming events
    const filtered = all.filter(function (ev) {
      const s = String(ev.status || '').toLowerCase();
      return s === 'ongoing' || s === 'upcoming';
    });

    // Sort: Ongoing first, then Upcoming; within each group sort by start date ascending
    filtered.sort(function (a, b) {
      const aOngoing = String(a.status || '').toLowerCase() === 'ongoing';
      const bOngoing = String(b.status || '').toLowerCase() === 'ongoing';
      if (aOngoing !== bOngoing) return aOngoing ? -1 : 1;
      const aDate = new Date(a.event_start_date || a.created_at || 0).getTime();
      const bDate = new Date(b.event_start_date || b.created_at || 0).getTime();
      return aDate - bDate;
    });

    if (!filtered.length) {
      container.innerHTML = '<p class="text-center" style="color:#aaa;padding:30px;">No current or upcoming events at the moment.</p>';
      return;
    }

    renderEventsCarousel(container, filtered);
  } catch (err) {
    console.error('loadPublicEvents error:', err);
    container.innerHTML = '<p class="text-center" style="color:#aaa;padding:30px;">Unable to load events.</p>';
  }
}

function renderEventsCarousel(container, events) {
  const slides = events.map(function (ev) {
    return '<div class="ev-carousel-slide">' + renderEventCard(ev) + '</div>';
  }).join('');

  const dots = events.map(function (_, i) {
    return '<button type="button" class="ev-carousel-dot' + (i === 0 ? ' active' : '') +
           '" data-idx="' + i + '" aria-label="Slide ' + (i + 1) + '"></button>';
  }).join('');

  container.innerHTML =
    '<div class="ev-carousel">' +
      '<div class="ev-carousel-viewport">' +
        '<div class="ev-carousel-track">' + slides + '</div>' +
      '</div>' +
      (events.length > 1
        ? '<button type="button" class="ev-carousel-nav prev" aria-label="Previous">&#10094;</button>' +
          '<button type="button" class="ev-carousel-nav next" aria-label="Next">&#10095;</button>'
        : '') +
    '</div>' +
    (events.length > 1 ? '<div class="ev-carousel-dots">' + dots + '</div>' : '');

  var track   = container.querySelector('.ev-carousel-track');
  var allSlides = container.querySelectorAll('.ev-carousel-slide');
  var allDots   = container.querySelectorAll('.ev-carousel-dot');
  var prevBtn   = container.querySelector('.ev-carousel-nav.prev');
  var nextBtn   = container.querySelector('.ev-carousel-nav.next');
  var current   = 0;
  var autoTimer = null;

  function visibleCount() {
    var w = window.innerWidth;
    if (w >= 900) return 3;
    if (w >= 580) return 2;
    return 1;
  }

  function maxIndex() {
    return Math.max(0, allSlides.length - visibleCount());
  }

  function goTo(idx) {
    current = Math.max(0, Math.min(idx, maxIndex()));
    // translateX % is relative to the track's own width.
    // Each slide = (100 / visibleCount)% of track width, so moving N slides = N*(100/vc)%
    var pct = (current * 100 / visibleCount()).toFixed(6);
    track.style.transform = 'translateX(-' + pct + '%)';
    allDots.forEach(function (dot, i) {
      dot.classList.toggle('active', i === current);
    });
  }

  function startAuto() {
    clearInterval(autoTimer);
    if (events.length <= visibleCount()) return;
    autoTimer = setInterval(function () {
      goTo(current >= maxIndex() ? 0 : current + 1);
    }, 5000);
  }

  if (prevBtn) prevBtn.addEventListener('click', function () { goTo(current - 1); startAuto(); });
  if (nextBtn) nextBtn.addEventListener('click', function () { goTo(current + 1); startAuto(); });

  allDots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      goTo(Number(dot.getAttribute('data-idx')));
      startAuto();
    });
  });

  var carousel = container.querySelector('.ev-carousel');
  if (carousel) {
    carousel.addEventListener('mouseenter', function () { clearInterval(autoTimer); });
    carousel.addEventListener('mouseleave', function () { startAuto(); });
  }

  window.addEventListener('resize', function () { goTo(current); });

  goTo(0);
  startAuto();
}

function renderEventCard(ev) {
  var title    = escapeHTML(ev.title || '—');
  var sport    = escapeHTML(ev.sport_name || '—');
  var category = escapeHTML(ev.category || '—');
  var location = escapeHTML(ev.location || '—');
  var status   = escapeHTML(ev.status   || '');
  var statusCls = 'status-' + status.toLowerCase().replace(/\s+/g, '-');
  if (!['ongoing','upcoming','pending','completed','cancelled'].includes(status.toLowerCase())) {
    statusCls = 'status-default';
  }

  function fmtDate(str) {
    if (!str) return '—';
    var d = new Date(str);
    if (isNaN(d)) return str;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  var startDate = fmtDate(ev.event_start_date);
  var endDate   = fmtDate(ev.event_end_date);
  var href = 'events.html#' + escapeHTML(String(ev.public_id || ev.id || ''));

  return '' +
    '<div class="ev-event-card">' +
      '<div class="ev-event-card-header">' +
        '<h3 class="ev-event-card-title">' + title + '</h3>' +
        '<span class="ev-event-status ' + statusCls + '">' + status + '</span>' +
      '</div>' +
      '<div class="ev-event-card-body">' +
        '<div class="ev-event-meta-row"><span class="icon">&#9917;</span><span><strong>Sport:</strong> ' + sport + '</span></div>' +
        '<div class="ev-event-meta-row"><span class="icon">&#127942;</span><span><strong>Category:</strong> ' + category + '</span></div>' +
        '<div class="ev-event-divider"></div>' +
        '<div class="ev-event-meta-row"><span class="icon">&#128197;</span><span><strong>Start:</strong> ' + startDate + '</span></div>' +
        '<div class="ev-event-meta-row"><span class="icon">&#128198;</span><span><strong>End:</strong> ' + endDate + '</span></div>' +
        '<div class="ev-event-divider"></div>' +
        '<div class="ev-event-meta-row"><span class="icon">&#128205;</span><span>' + location + '</span></div>' +
      '</div>' +
      '<div class="ev-event-card-footer"><a href="' + href + '">View Details &rarr;</a></div>' +
    '</div>';
}

/* =============================================
   8. LOAD PUBLIC NEWS
   ============================================= */
async function loadPublicNews() {
  const container = document.getElementById('news-list');
  if (!container) return;

  try {
    const res = await fetch('api/news/read.php?limit=8');
    const json = await parsePublicApiJson(res);
    const rows = json.success && Array.isArray(json.data) ? json.data.slice(0, 8) : [];

    if (!rows.length) {
      container.innerHTML = '<p class="text-center" style="color:#aaa;padding:30px;">No news articles yet.</p>';
      return;
    }

    container.innerHTML =
      '<div class="home-news-carousel">' +
        '<div class="home-news-track">' +
          rows.map(function (row) {
            return renderHomeNewsSlide(row);
          }).join('') +
        '</div>' +
        '<button type="button" class="home-news-nav prev" aria-label="Previous article">&#10094;</button>' +
        '<button type="button" class="home-news-nav next" aria-label="Next article">&#10095;</button>' +
      '</div>' +
      '<div class="home-news-dots" role="tablist" aria-label="News articles">' +
        rows.map(function (_, idx) {
          return '<button type="button" class="home-news-dot' + (idx === 0 ? ' active' : '') + '" data-slide="' + idx + '" role="tab" aria-selected="' + (idx === 0 ? 'true' : 'false') + '" aria-label="Go to article ' + (idx + 1) + '"></button>';
        }).join('') +
      '</div>';

    const track = container.querySelector('.home-news-track');
    const slides = container.querySelectorAll('.home-news-slide');
    const dots = container.querySelectorAll('.home-news-dot');
    const prevBtn = container.querySelector('.home-news-nav.prev');
    const nextBtn = container.querySelector('.home-news-nav.next');
    const carousel = container.querySelector('.home-news-carousel');
    let currentIndex = 0;
    let autoTimer = null;

    function setSlide(index) {
      if (!track || !slides.length) return;
      currentIndex = (index + slides.length) % slides.length;
      track.style.transform = 'translateX(-' + (currentIndex * 100) + '%)';
      dots.forEach(function (dot, dotIndex) {
        const isActive = dotIndex === currentIndex;
        dot.classList.toggle('active', isActive);
        dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
    }

    function restartAutoPlay() {
      if (autoTimer) clearInterval(autoTimer);
      if (slides.length <= 1) return;
      autoTimer = setInterval(function () {
        setSlide(currentIndex + 1);
      }, 5000);
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        setSlide(currentIndex - 1);
        restartAutoPlay();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        setSlide(currentIndex + 1);
        restartAutoPlay();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        setSlide(Number(dot.getAttribute('data-slide')) || 0);
        restartAutoPlay();
      });
    });

    if (carousel) {
      carousel.addEventListener('mouseenter', function () {
        if (autoTimer) clearInterval(autoTimer);
      });
      carousel.addEventListener('mouseleave', function () {
        restartAutoPlay();
      });
    }

    setSlide(0);
    restartAutoPlay();
  } catch {
    container.innerHTML = '<p class="text-center" style="color:#aaa;padding:30px;">Unable to load news articles.</p>';
  }
}

function renderHomeNewsSlide(n) {
  const images = parseNewsArticlePhotoPaths(n.photo_path);
  const imageSrc = images[0] || 'src/images/placeholder.png';
  const articleHref = n.id ? 'news-article.html?id=' + encodeURIComponent(String(n.id)) : 'news.html';

  return `
    <article class="home-news-slide">
      <div class="news-card home-news-card reveal revealed">
        <a href="${articleHref}" class="news-img home-news-image-link" aria-label="Read ${escapeHTML(n.title || 'article')}">
          <img src="${escapeHTML(imageSrc)}" alt="${escapeHTML(n.title || 'News article')}" />
        </a>
        <div class="news-body home-news-body">
          <div class="news-category">${escapeHTML(n.category || 'News')}</div>
          <h3>${escapeHTML(n.title || 'Untitled article')}</h3>
          <p>${escapeHTML(n.excerpt || 'Read the latest update from Online Tournament Management.')}</p>
          <div class="news-meta">
            <span>📅 ${escapeHTML(formatNewsDateForPublic(n.publish_date))}</span>
            <a href="${articleHref}" class="home-news-readmore">Read more →</a>
          </div>
        </div>
      </div>
    </article>
  `;
}

function initNewsPage() {
  const gallery = document.getElementById('highlightsGallery');
  const tallyBody = document.getElementById('newsStandingsBody');
  const tallyUpdated = document.getElementById('newsStandingsUpdated');
  const winnersList = document.getElementById('winnersAnnouncementList');
  const leaderboardList = document.getElementById('sportLeaderboardList');
  const leaderboardFilters = document.getElementById('leaderboardSportFilters');

  if (!gallery || !tallyBody || !winnersList || !leaderboardList || !leaderboardFilters) return;

  const STANDINGS_KEY = 'otm_sportsfest_standings';
  const state = { sport: 'vol', highlightIndex: 0, highlightTimer: null };

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
    } catch {
      return defaultStandings;
    }
  }

  function sortOverall(data) {
    return [...data].sort(function (a, b) {
      return b.g !== a.g ? b.g - a.g : b.s !== a.s ? b.s - a.s : b.b - a.b;
    });
  }

  function getSportValuePoints(val) {
    if (val === 'G') return 3;
    if (val === 'S') return 2;
    if (val === 'B') return 1;
    return 0;
  }

  function medalTag(val) {
    if (val === 'G') return '<span class="sport-result" style="background:rgba(255,215,0,.2);color:gold;">G</span>';
    if (val === 'S') return '<span class="sport-result" style="background:rgba(180,180,180,.18);color:#6e7788;">S</span>';
    if (val === 'B') return '<span class="sport-result" style="background:rgba(205,127,50,.2);color:#cd7f32;">B</span>';
    return '<span class="sport-result" style="color:#a6b1c8;">&#8212;</span>';
  }

  function rankBadge(rank) {
    const styles = {
      1: 'background:gold;color:#333;',
      2: 'background:#aaa;color:#111;',
      3: 'background:#cd7f32;color:#fff;',
    };
    const style = styles[rank] || 'background:#e8eefb;color:#3d4a6d;';
    return '<span class="rank-badge" style="' + style + '">' + rank + '</span>';
  }

  function rowClass(rank) {
    if (rank === 1) return 'standing-row top-1';
    if (rank === 2) return 'standing-row top-2';
    if (rank === 3) return 'standing-row top-3';
    return 'standing-row';
  }

  function medalCell(val) {
    if (val === 'G') return '<span class="news-medal sport-g">G</span>';
    if (val === 'S') return '<span class="news-medal sport-s">S</span>';
    if (val === 'B') return '<span class="news-medal sport-b">B</span>';
    return '<span class="news-medal sport-n">-</span>';
  }

  async function getHighlights() {
    try {
      const res = await fetch('api/news/read.php?limit=50');
      const json = await parsePublicApiJson(res);
      if (json.success && Array.isArray(json.data) && json.data.length) {
        const rows = json.data;
        const highlightRows = rows.filter(function (row) {
          return String(row.category || '').toLowerCase() === 'highlights';
        });

        const source = highlightRows.length ? highlightRows : rows;
        return source.slice(0, 10).map(function (row) {
          const images = parseNewsArticlePhotoPaths(row.photo_path);
          return {
            id: row.id,
            src: images[0] || 'src/images/placeholder.png',
            title: row.title || 'Highlight',
            caption: row.excerpt || '',
            publishDate: row.publish_date || ''
          };
        });
      }
    } catch {
      // fall through to fallback content
    }

    return [
      { id: '', src: 'src/images/vb-random.jpg', title: 'Volleyball Finals', caption: 'Crowd-favorite championship match', publishDate: '' },
      { id: '', src: 'src/images/bb-random.jpg', title: 'Basketball Semis', caption: 'Fast-break highlights and buzzer plays', publishDate: '' },
      { id: '', src: 'src/images/fs-random.jpg', title: 'Futsal Knockouts', caption: 'Back-to-back goals in the final minutes', publishDate: '' },
      { id: '', src: 'src/images/bd-random.jpg', title: 'Badminton Open', caption: 'Singles and doubles winners take the podium', publishDate: '' },
    ];
  }

  function updateHighlightSlide(index) {
    const track = gallery.querySelector('.highlights-track');
    const dots = gallery.querySelectorAll('.highlight-dot');
    const slides = gallery.querySelectorAll('.highlight-card');
    if (!track || !slides.length) return;

    const safeIndex = (index + slides.length) % slides.length;
    state.highlightIndex = safeIndex;
    track.style.transform = 'translateX(-' + (safeIndex * 100) + '%)';

    dots.forEach(function (dot, i) {
      dot.classList.toggle('active', i === safeIndex);
      dot.setAttribute('aria-selected', i === safeIndex ? 'true' : 'false');
    });
  }

  function restartHighlightAutoPlay() {
    if (state.highlightTimer) {
      clearInterval(state.highlightTimer);
      state.highlightTimer = null;
    }

    const slides = gallery.querySelectorAll('.highlight-card');
    if (slides.length <= 1) return;

    state.highlightTimer = setInterval(function () {
      updateHighlightSlide(state.highlightIndex + 1);
    }, 4500);
  }

  async function renderHighlights() {
    const items = await getHighlights();
    if (!items.length) {
      gallery.innerHTML = '<div class="news-empty">No highlights available.</div>';
      return;
    }

    gallery.innerHTML =
      '<div class="highlights-carousel">' +
        '<div class="highlights-track">' +
          items.map(function (item) {
            const linkStart = item.id ? '<a class="highlight-link" href="news-article.html?id=' + encodeURIComponent(String(item.id)) + '">' : '';
            const linkEnd = item.id ? '</a>' : '';
            return '<figure class="highlight-card">' +
              linkStart +
              '<img src="' + escapeHTML(item.src || '') + '" alt="' + escapeHTML(item.title || 'Highlight') + '" />' +
              '<figcaption><strong>' + escapeHTML(item.title || 'Highlight') + '</strong><span>' + escapeHTML(item.caption || '') + '</span></figcaption>' +
              linkEnd +
            '</figure>';
          }).join('') +
        '</div>' +
        '<button type="button" class="highlights-nav prev" aria-label="Previous highlight">&#10094;</button>' +
        '<button type="button" class="highlights-nav next" aria-label="Next highlight">&#10095;</button>' +
      '</div>' +
      '<div class="highlights-dots" role="tablist" aria-label="Highlight slides">' +
        items.map(function (_, idx) {
          return '<button type="button" class="highlight-dot' + (idx === 0 ? ' active' : '') + '" data-slide="' + idx + '" role="tab" aria-selected="' + (idx === 0 ? 'true' : 'false') + '" aria-label="Go to slide ' + (idx + 1) + '"></button>';
        }).join('') +
      '</div>';

    const prevBtn = gallery.querySelector('.highlights-nav.prev');
    const nextBtn = gallery.querySelector('.highlights-nav.next');
    const dotsWrap = gallery.querySelector('.highlights-dots');
    const carousel = gallery.querySelector('.highlights-carousel');

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        updateHighlightSlide(state.highlightIndex - 1);
        restartHighlightAutoPlay();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        updateHighlightSlide(state.highlightIndex + 1);
        restartHighlightAutoPlay();
      });
    }

    if (dotsWrap) {
      dotsWrap.addEventListener('click', function (e) {
        const dot = e.target.closest('.highlight-dot');
        if (!dot) return;
        const slide = Number(dot.getAttribute('data-slide'));
        updateHighlightSlide(slide);
        restartHighlightAutoPlay();
      });
    }

    if (carousel) {
      carousel.addEventListener('mouseenter', function () {
        if (state.highlightTimer) clearInterval(state.highlightTimer);
      });
      carousel.addEventListener('mouseleave', function () {
        restartHighlightAutoPlay();
      });
    }

    updateHighlightSlide(0);
    restartHighlightAutoPlay();
  }

  function renderTally() {
    const sorted = sortOverall(getStandings());
    tallyBody.innerHTML = sorted.map(function (row, i) {
      const rank = i + 1;
      return '<div class="' + rowClass(rank) + '">' +
        '<div style="display:flex;align-items:center;color:#26325e;font-weight:700;">' +
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

    if (tallyUpdated) {
      tallyUpdated.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }

  function getWinnerAnnouncements() {
    let items = [];

    try {
      const stored = JSON.parse(localStorage.getItem('otm_winner_announcements')) || [];
      if (Array.isArray(stored) && stored.length) {
        items = stored;
      }
    } catch {
      // ignore
    }

    if (!items.length) {
      const announcements = DataStore.getAnnouncements();
      items = announcements
        .filter(function (a) {
          const text = (a.title || '') + ' ' + (a.message || a.content || '');
          return /winner|champion|championship/i.test(text);
        })
        .map(function (a) {
          return {
            title: a.title || 'Winner Announcement',
            winner: a.winner || 'TBA',
            sport: a.sport || 'General',
            date: a.date || '',
            smsStatus: 'Sent'
          };
        });
    }

    if (!items.length) {
      items = [
        { title: 'Volleyball Championship Winner', winner: 'IT', sport: 'Volleyball', date: 'Apr 28, 2026', smsStatus: 'Sent' },
        { title: 'Basketball Tournament Winner', winner: 'CS', sport: 'Basketball', date: 'Apr 29, 2026', smsStatus: 'Sent' },
        { title: 'Futsal Cup Winner', winner: 'Crim', sport: 'Futsal', date: 'Apr 30, 2026', smsStatus: 'Queued' },
      ];
    }

    return items;
  }

  function renderWinnerAnnouncements() {
    const items = getWinnerAnnouncements();
    winnersList.innerHTML = items.map(function (item) {
      const smsClass = String(item.smsStatus || '').toLowerCase() === 'sent' ? 'sent' : 'queued';
      return '<div class="winner-item">' +
        '<h4>' + escapeHTML(item.title || 'Winner Announcement') + '</h4>' +
        '<p><strong>Winner:</strong> ' + escapeHTML(item.winner || 'TBA') + ' <span class="dot">•</span> <strong>Sport:</strong> ' + escapeHTML(item.sport || 'General') + '</p>' +
        '<div class="winner-meta"><span>' + escapeHTML(item.date || '') + '</span><span class="sms-pill ' + smsClass + '">SMS ' + escapeHTML(item.smsStatus || 'Queued') + '</span></div>' +
      '</div>';
    }).join('');
  }

  function renderSportLeaderboard() {
    const rows = getStandings().map(function (row) {
      const medal = row[state.sport];
      const points = getSportValuePoints(medal);
      return {
        course: row.course,
        medal: medal,
        points: points,
        placed: points > 0  // True if course has a medal in this sport
      };
    }).sort(function (a, b) {
      return b.points - a.points || a.course.localeCompare(b.course);
    });

    leaderboardList.innerHTML = rows.map(function (row, idx) {
      // Only show medal emoji for placers, empty for non-placers
      let medalDisplay = '';
      if (row.placed) {
        // Show medal emoji based on medal type
        if (row.medal === 'G') medalDisplay = '&#129351;';  // Gold medal
        else if (row.medal === 'S') medalDisplay = '&#129352;';  // Silver medal
        else if (row.medal === 'B') medalDisplay = '&#129353;';  // Bronze medal
      }
      
      return '<div class="leaderboard-row">' +
        '<div class="leaderboard-course">' + escapeHTML(row.course) + '</div>' +
        '<div class="leaderboard-medal">' + medalDisplay + '</div>' +
      '</div>';
    }).join('');

    leaderboardFilters.querySelectorAll('[data-sport]').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-sport') === state.sport);
    });
  }

  leaderboardFilters.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-sport]');
    if (!btn) return;
    state.sport = btn.getAttribute('data-sport');
    renderSportLeaderboard();
  });

  renderHighlights();
  renderTally();
  renderWinnerAnnouncements();
  renderSportLeaderboard();
}

/* =============================================
   9. NEWS ARTICLE PAGE
   ============================================= */
async function initNewsArticlePage() {
  const page = document.getElementById('newsArticlePage');
  if (!page) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  const carouselTrack = document.getElementById('articleCarouselTrack');
  const titleEl = document.getElementById('articleTitle');
  const dateEl = document.getElementById('articleDate');
  const contentEl = document.getElementById('articleContent');
  const dotsEl = document.getElementById('articleCarouselDots');
  const prevBtn = document.getElementById('articleCarouselPrev');
  const nextBtn = document.getElementById('articleCarouselNext');

  if (!id) {
    if (contentEl) contentEl.innerHTML = '<p>Article not found.</p>';
    return;
  }

  try {
    const res = await fetch('api/news/read.php?id=' + encodeURIComponent(id));
    const json = await parsePublicApiJson(res);

    if (!json.success || !json.data) {
      throw new Error('Article not found');
    }

    const article = json.data;
    const images = parseNewsArticlePhotoPaths(article.photo_path);

    if (titleEl) titleEl.textContent = article.title || 'Untitled Article';
    if (dateEl) dateEl.textContent = formatNewsDateForPublic(article.publish_date);
    if (contentEl) {
      const raw = String(article.content || article.excerpt || '').trim();
      if (raw) {
        const paragraphs = raw.split(/\r?\n\s*\r?\n/).map(function (p) { return p.trim(); }).filter(Boolean);
        if (paragraphs.length) {
          contentEl.innerHTML = paragraphs.map(function (p) { return '<p>' + escapeHTML(p).replace(/\n/g, '<br>') + '</p>'; }).join('');
        } else {
          contentEl.innerHTML = '<p>' + escapeHTML(raw).replace(/\n/g, '<br>') + '</p>';
        }
      } else {
        contentEl.innerHTML = '<p>No article content available.</p>';
      }
    }

    let current = 0;

    if (carouselTrack) {
      carouselTrack.innerHTML = images.map(function (src) {
        return '<div class="article-slide"><img src="' + escapeHTML(src) + '" alt="Article image" /></div>';
      }).join('');
    }

    if (dotsEl) {
      dotsEl.innerHTML = images.map(function (_, idx) {
        return '<button type="button" class="article-dot' + (idx === 0 ? ' active' : '') + '" data-slide="' + idx + '" aria-label="Go to image ' + (idx + 1) + '"></button>';
      }).join('');
    }

    function setSlide(idx) {
      if (!carouselTrack || !images.length) return;
      current = (idx + images.length) % images.length;
      carouselTrack.style.transform = 'translateX(-' + (current * 100) + '%)';
      if (dotsEl) {
        dotsEl.querySelectorAll('.article-dot').forEach(function (dot, i) {
          dot.classList.toggle('active', i === current);
        });
      }
    }

    if (prevBtn) {
      prevBtn.style.display = images.length > 1 ? 'inline-flex' : 'none';
      prevBtn.addEventListener('click', function () { setSlide(current - 1); });
    }

    if (nextBtn) {
      nextBtn.style.display = images.length > 1 ? 'inline-flex' : 'none';
      nextBtn.addEventListener('click', function () { setSlide(current + 1); });
    }

    if (dotsEl) {
      dotsEl.addEventListener('click', function (e) {
        const dot = e.target.closest('.article-dot');
        if (!dot) return;
        setSlide(Number(dot.getAttribute('data-slide')));
      });
    }

    setSlide(0);
  } catch {
    if (contentEl) contentEl.innerHTML = '<p>Unable to load this article.</p>';
  }
}

/* =============================================
   10. LOAD PUBLIC ABOUT PAGE
   ============================================= */
async function loadPublicAboutPage() {
  const titleEl = document.getElementById('publicAboutTitle');
  const descriptionEl = document.getElementById('publicAboutDescription');
  const missionEl = document.getElementById('publicMissionContent');
  const visionEl = document.getElementById('publicVisionContent');
  const imageEl = document.getElementById('publicAboutImage');
  const teamGridEl = document.getElementById('publicTeamGrid');

  if (!titleEl && !descriptionEl && !missionEl && !visionEl && !imageEl && !teamGridEl) return;

  try {
    const requests = [fetch('api/about/read-content.php')];
    if (teamGridEl) {
      requests.push(fetch('api/about/members/read.php'));
    }

    const responses = await Promise.all(requests);
    const contentJson = await parsePublicApiJson(responses[0]);
    const membersJson = teamGridEl && responses[1]
      ? await parsePublicApiJson(responses[1])
      : null;

    if (contentJson.success && contentJson.data) {
      const content = contentJson.data;
      if (titleEl) {
        titleEl.textContent = content.organization_name || 'Online Tournament Management';
      }
      if (imageEl) {
        imageEl.src = content.photo_path || 'src/images/placeholder.png';
      }

      const rawDescription = String(content.description || '').trim();
      const rawMission = String(content.mission || '').trim();
      const rawVision = String(content.vision || '').trim();

      const renderTextBlocks = function (el, rawText, fallbackText) {
        if (!el) return;
        const sourceText = rawText || fallbackText;
        const paragraphs = sourceText
          .split(/\r?\n\s*\r?\n/)
          .map((paragraph) => paragraph.trim())
          .filter(Boolean);

        if (paragraphs.length) {
          el.innerHTML = paragraphs
            .map((paragraph) => `<p>${escapeHTML(paragraph)}</p>`)
            .join('');
        } else {
          el.innerHTML = `<p>${escapeHTML(sourceText)}</p>`;
        }
      };

      if (descriptionEl && rawDescription) {
        renderTextBlocks(descriptionEl, rawDescription, '');
      }

      renderTextBlocks(
        missionEl,
        rawMission,
        'To provide a reliable, efficient, and user-friendly online platform that empowers sports organizers to plan and manage tournaments with ease while keeping all stakeholders informed through modern communication tools.'
      );

      renderTextBlocks(
        visionEl,
        rawVision,
        'To make CvSU Bacoor Sports Hub the leading campus sports platform in the Philippines, fostering a vibrant sports community through technology, transparency, and real-time communication.'
      );
    }

    if (teamGridEl && membersJson && membersJson.success && Array.isArray(membersJson.data) && membersJson.data.length) {
      teamGridEl.innerHTML = membersJson.data.map((member) => `
        <div class="reveal revealed" style="text-align:center;">
          <div style="width:90px;height:90px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:2rem;color:#fff;margin:0 auto 16px;overflow:hidden;background:linear-gradient(135deg,var(--primary),var(--accent));">
            <img src="${escapeHTML(member.photo_path || 'src/images/placeholder.png')}" alt="${escapeHTML(member.full_name || 'Member Photo')}" style="width:100%;height:100%;object-fit:cover;display:block;" />
          </div>
          <h4 style="color:var(--primary);margin-bottom:4px;">${escapeHTML(member.full_name || 'Team Member')}</h4>
          <p style="color:var(--accent);font-size:.8rem;font-weight:600;text-transform:uppercase;letter-spacing:1px;">${escapeHTML(member.role_title || '')}</p>
          <p style="color:var(--text-muted);font-size:.85rem;margin-top:8px;">${escapeHTML(member.bio || 'No biography available.')}</p>
        </div>
      `).join('');
    }
  } catch {
    // Keep existing fallback content already in the markup.
  }
}

async function loadPublicContactInfo() {
  const addressEl = document.getElementById('contactAddressDisplay');
  const phoneEl   = document.getElementById('contactPhoneDisplay');
  const emailEl   = document.getElementById('contactEmailDisplay');
  const facebookEl = document.getElementById('contactFacebookDisplay');
  const footerAddressEls = document.querySelectorAll('[data-footer-contact-address]');
  const footerPhoneEls = document.querySelectorAll('[data-footer-contact-phone]');
  const footerEmailEls = document.querySelectorAll('[data-footer-contact-email]');
  const footerFacebookEls = document.querySelectorAll('[data-footer-contact-facebook]');

  if (!addressEl && !phoneEl && !emailEl && !facebookEl && !footerAddressEls.length && !footerPhoneEls.length && !footerEmailEls.length && !footerFacebookEls.length) return;

  try {
    const res = await fetch('api/contact/read-info.php');
    const data = await res.json();

    if (data.success) {
      const addressHtml = data.address
        ? escapeHTML(data.address).replace(/\n/g, '<br>')
        : '';
      const phoneHtml = data.phone
        ? escapeHTML(data.phone).replace(/\n/g, '<br>')
        : '';
      const emailHtml = data.email
        ? escapeHTML(data.email).replace(/\n/g, '<br>')
        : '';
      const facebookText = String(data.facebook_url || '').trim();
      const facebookUrl = facebookText
        ? (/^https?:\/\//i.test(facebookText) ? facebookText : ('https://' + facebookText))
        : '';
      const facebookHtml = facebookText ? escapeHTML(facebookText) : '';

      if (addressEl && addressHtml) {
        addressEl.innerHTML = addressHtml;
      }
      if (phoneEl && phoneHtml) {
        phoneEl.innerHTML = phoneHtml;
      }
      if (emailEl && emailHtml) {
        emailEl.innerHTML = emailHtml;
      }
      if (facebookEl) {
        if (facebookUrl) {
          facebookEl.innerHTML = '<a href="' + escapeHTML(facebookUrl) + '" target="_blank" rel="noopener noreferrer">' + facebookHtml + '</a>';
        } else {
          facebookEl.textContent = 'Not set';
        }
      }

      footerAddressEls.forEach(function (el) {
        if (!addressHtml) return;
        el.innerHTML = '&#128205; ' + addressHtml;
      });

      footerPhoneEls.forEach(function (el) {
        if (!phoneHtml) return;
        const phoneText = String(data.phone).split(/\r?\n/).map(function (part) { return part.trim(); }).filter(Boolean)[0] || String(data.phone).trim();
        el.innerHTML = '&#128222; ' + phoneHtml;
        el.setAttribute('href', 'tel:' + phoneText.replace(/[^\d+]/g, ''));
      });

      footerEmailEls.forEach(function (el) {
        if (!emailHtml) return;
        const emailText = String(data.email).split(/\r?\n/).map(function (part) { return part.trim(); }).filter(Boolean)[0] || String(data.email).trim();
        el.innerHTML = '&#9993; ' + emailHtml;
        el.setAttribute('href', 'mailto:' + emailText);
      });

      footerFacebookEls.forEach(function (el) {
        if (!facebookUrl) return;
        el.innerHTML = 'f ' + facebookHtml;
        el.setAttribute('href', facebookUrl);
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener noreferrer');
      });
    }
  } catch {
    // Keep existing fallback content already in the markup.
  }
}

/* =============================================
   11. HELPER FUNCTIONS
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

function parseNewsArticlePhotoPaths(value) {
  if (!value) return ['src/images/placeholder.png'];

  const raw = String(value).trim();
  if (!raw || raw === 'src/images/placeholder.png') {
    return ['src/images/placeholder.png'];
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) {
      return parsed.map(function (v) { return String(v || '').trim(); }).filter(Boolean);
    }
  } catch {
    // not JSON format
  }

  if (raw.includes(',')) {
    const list = raw.split(',').map(function (v) { return v.trim(); }).filter(Boolean);
    return list.length ? list : ['src/images/placeholder.png'];
  }

  return [raw];
}

function formatNewsDateForPublic(dateStr) {
  if (!dateStr) return 'Date not available';
  const d = new Date(String(dateStr).slice(0, 10) + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
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

async function parsePublicApiJson(response) {
  const text = await response.text();
  let parsed;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Invalid API response.');
  }

  if (!response.ok) {
    throw new Error(parsed.message || 'Request failed.');
  }

  return parsed;
}

/* =============================================
   11. DATA STORE — localStorage abstraction
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
    try {
      const resp = await fetch('api/contact/submit.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      return data.success === true;
    } catch {
      return false;
    }
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
  const btn = document.querySelector('.btn-login') || document.querySelector('.nav-menu a[href="login.html"]');
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
            { datetime: 'Apr 29, 2026 03:00 PM', match: 'CRIM vs CS', venue: 'Sports Center', status: 'Upcoming' },
            { datetime: 'May 1, 2026 03:00 PM', match: 'CRIM vs HRM', venue: 'Sports Center', status: 'Upcoming' }
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
    const scheduleViewToggle = document.getElementById('scheduleViewToggle');
    const scheduleViewList = document.getElementById('scheduleViewList');
    const scheduleViewCalendar = document.getElementById('scheduleViewCalendar');
    const jumpScheduleBtn = document.getElementById('jumpScheduleBtn');

    if (!sportsOptions) return;

    const state = {
      sportId: sports[0].id,
      gender: 'Mens',
      eventId: null,
      course: '',
      scheduleView: 'list',
      calendarYear: null,
      calendarMonth: null
    };
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

    function parseScheduleDate(dateString) {
      var parsed = new Date(dateString);
      if (isNaN(parsed.getTime())) return null;
      return parsed;
    }

    function renderScheduleViewButtons() {
      if (!scheduleViewToggle) return;
      scheduleViewList.classList.toggle('active', state.scheduleView === 'list');
      scheduleViewCalendar.classList.toggle('active', state.scheduleView === 'calendar');
    }

    function renderScheduleList(schedule) {
      scheduleList.className = 'schedule-list';
      scheduleList.innerHTML = schedule.map(function (item) {
        var live = item.status === 'Ongoing';
        return '<div class="schedule-item">' +
          '<div class="schedule-time">' + item.datetime + '</div>' +
          '<div><strong>' + item.match + '</strong><div class="schedule-meta">' + item.venue + '</div></div>' +
          '<span class="schedule-status' + (live ? ' live' : '') + '">' + item.status + '</span></div>';
      }).join('');
    }

    function renderScheduleCalendar(schedule) {
      var parsedEntries = schedule.map(function (item) {
        return { item: item, date: parseScheduleDate(item.datetime) };
      }).filter(function (entry) {
        return entry.date !== null;
      });

      if (!parsedEntries.length) {
        scheduleList.className = 'schedule-list';
        scheduleList.innerHTML = '<div class="empty-state">No valid schedule dates to display in calendar view.</div>';
        return;
      }

      if (state.calendarYear === null || state.calendarMonth === null) {
        var initialDate = parsedEntries[0].date;
        state.calendarYear = initialDate.getFullYear();
        state.calendarMonth = initialDate.getMonth();
      }

      var year = state.calendarYear;
      var month = state.calendarMonth;
      var firstDay = new Date(year, month, 1);
      var startOffset = firstDay.getDay();
      var daysInMonth = new Date(year, month + 1, 0).getDate();
      var monthLabel = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      var eventsByDay = {};
      parsedEntries.forEach(function (entry) {
        if (entry.date.getFullYear() !== year || entry.date.getMonth() !== month) return;
        var day = entry.date.getDate();
        if (!eventsByDay[day]) eventsByDay[day] = [];
        eventsByDay[day].push(entry);
      });

      var html = '<div class="schedule-calendar">' +
        '<div class="calendar-header">' +
          '<button type="button" class="calendar-nav-btn" data-calendar-nav="prev" aria-label="Previous month">&#8249;</button>' +
          '<span class="calendar-month-label">' + monthLabel + '</span>' +
          '<button type="button" class="calendar-nav-btn" data-calendar-nav="next" aria-label="Next month">&#8250;</button>' +
        '</div>' +
        '<div class="calendar-weekdays">' +
          '<span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>' +
        '</div><div class="calendar-grid">';

      for (var blank = 0; blank < startOffset; blank += 1) {
        html += '<div class="calendar-cell empty"></div>';
      }

      for (var dayNum = 1; dayNum <= daysInMonth; dayNum += 1) {
        var dayEvents = eventsByDay[dayNum] || [];
        html += '<div class="calendar-cell">';
        html += '<div class="calendar-day">' + dayNum + '</div>';

        if (!dayEvents.length) {
          html += '<div class="calendar-no-events">No games</div>';
        } else {
          html += '<div class="calendar-events">';
          dayEvents.slice(0, 3).forEach(function (entry) {
            var item = entry.item;
            var timeLabel = entry.date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            html += '<div class="calendar-event">' +
              '<strong>' + timeLabel + '</strong><span>' + item.match + '</span>' +
            '</div>';
          });
          if (dayEvents.length > 3) {
            html += '<div class="calendar-more">+' + (dayEvents.length - 3) + ' more</div>';
          }
          html += '</div>';
        }

        html += '</div>';
      }

      html += '</div></div>';
      scheduleList.className = 'schedule-list schedule-list-calendar';
      scheduleList.innerHTML = html;
    }

    function renderSchedule() {
      var ev = getCurrentEvent();
      var schedule = (ev.schedule || []).filter(function (item) {
        if (!state.course) return true;
        return item.match.indexOf(state.course) !== -1;
      });

      renderScheduleViewButtons();

      if (!schedule.length) {
        scheduleList.className = 'schedule-list';
        scheduleList.innerHTML = '<div class="empty-state">No schedules for this filter.</div>';
        return;
      }

      if (state.scheduleView === 'calendar') {
        renderScheduleCalendar(schedule);
      } else {
        renderScheduleList(schedule);
      }
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
    if (scheduleViewToggle) {
      scheduleViewToggle.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-view]');
        if (!btn) return;
        state.scheduleView = btn.getAttribute('data-view');
        if (state.scheduleView === 'calendar' && (state.calendarYear === null || state.calendarMonth === null)) {
          var currentDate = new Date();
          state.calendarYear = currentDate.getFullYear();
          state.calendarMonth = currentDate.getMonth();
        }
        renderSchedule();
      });
    }

    scheduleList.addEventListener('click', function (e) {
      var navBtn = e.target.closest('[data-calendar-nav]');
      if (!navBtn) return;

      if (state.calendarYear === null || state.calendarMonth === null) {
        var now = new Date();
        state.calendarYear = now.getFullYear();
        state.calendarMonth = now.getMonth();
      }

      if (navBtn.getAttribute('data-calendar-nav') === 'prev') {
        state.calendarMonth -= 1;
      } else {
        state.calendarMonth += 1;
      }

      if (state.calendarMonth < 0) {
        state.calendarMonth = 11;
        state.calendarYear -= 1;
      }
      if (state.calendarMonth > 11) {
        state.calendarMonth = 0;
        state.calendarYear += 1;
      }

      renderSchedule();
    });
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

