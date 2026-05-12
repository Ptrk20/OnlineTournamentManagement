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
  const winnersList = document.getElementById('winnersAnnouncementList');
  const courseLeaderboardBody = document.getElementById('courseLeaderboardBody');
  const courseLeaderboardYear = document.getElementById('courseLeaderboardYear');
  const courseLeaderboardUpdated = document.getElementById('courseLeaderboardUpdated');

  if (!gallery || !winnersList || !courseLeaderboardBody || !courseLeaderboardYear) return;

  const STANDINGS_KEY = 'otm_sportsfest_standings';
  const state = {
    highlightIndex: 0,
    highlightTimer: null,
    courseSummaryByYear: {},
    allYears: []
  };

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
    const tallyBody = document.getElementById('newsStandingsBody');
    const tallyUpdated = document.getElementById('newsStandingsUpdated');
    if (!tallyBody) return;
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

  async function getWinnerAnnouncements() {
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
      try {
        const resp = await fetch('api/announcements/read.php');
        const data = await parsePublicApiJson(resp);
        if (data.success && Array.isArray(data.data)) {
          items = data.data
            .filter(function (a) {
              const text = (a.title || '') + ' ' + (a.message || '');
              return /winner|champion|championship/i.test(text);
            })
            .map(function (a) {
              return {
                title: a.title || 'Winner Announcement',
                winner: a.title || 'TBA',
                sport: 'Sports',
                date: a.created_at ? new Date(a.created_at).toLocaleDateString() : '',
                smsStatus: a.sms_sent ? 'Sent' : 'Page Only'
              };
            });
        }
      } catch {
        // fallback to DataStore
        const announcements = DataStore.getAnnouncements();
        if (Array.isArray(announcements)) {
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
      }
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

  async function getAllAnnouncements() {
    let items = [];

    try {
      const resp = await fetch('api/announcements/read.php');
      const data = await parsePublicApiJson(resp);
      if (data.success && Array.isArray(data.data)) {
        items = data.data.map(function (a) {
          return {
            title: a.title || 'Announcement',
            message: a.message || '',
            date: a.created_at ? new Date(a.created_at).toLocaleDateString() : ''
          };
        });
      }
    } catch (err) {
      console.error('Error fetching announcements:', err);
      // fallback to stored announcements
      try {
        const announcements = DataStore.getAnnouncements();
        if (Array.isArray(announcements)) {
          items = announcements.map(function (a) {
            return {
              title: a.title || 'Announcement',
              message: a.message || a.content || '',
              date: a.date || ''
            };
          });
        }
      } catch {
        // no fallback available
      }
    }

    if (!items.length) {
      items = [
        { title: 'Welcome to Sports Hub', message: 'Stay tuned for upcoming tournaments and events!', date: 'Apr 28, 2026' }
      ];
    }

    return items;
  }

  async function renderWinnerAnnouncements() {
    const items = await getAllAnnouncements();
    winnersList.innerHTML = items.map(function (item) {
      return '<div class="winner-item">' +
        '<h4>' + escapeHTML(item.title || 'Announcement') + '</h4>' +
        '<p>' + escapeHTML(item.message || '') + '</p>' +
        '<div class="winner-meta"><span>' + escapeHTML(item.date || '') + '</span></div>' +
      '</div>';
    }).join('');
  }

  function getEventYear(ev) {
    const raw = ev.event_start_date || ev.event_end_date || ev.created_at || '';
    const date = new Date(raw);
    if (!Number.isNaN(date.getTime())) return String(date.getFullYear());
    const match = String(raw).match(/(\d{4})/);
    return match ? match[1] : 'Unknown';
  }

  function getLosingTeamId(match) {
    const winner = Number(match.winner_team_id || 0);
    const t1 = Number(match.team1 && match.team1.id || 0);
    const t2 = Number(match.team2 && match.team2.id || 0);
    if (!winner || !t1 || !t2) return null;
    return winner === t1 ? t2 : winner === t2 ? t1 : null;
  }

  function pickFinalMatch(matches) {
    const grand = matches.filter(function (m) {
      const stage = String(m.bracket_stage || '').toLowerCase();
      return (stage === 'final' || stage === 'grand_final') && Number(m.winner_team_id || 0) > 0;
    });

    if (grand.length) {
      grand.sort(function (a, b) {
        const roundDiff = Number(b.round || 0) - Number(a.round || 0);
        if (roundDiff) return roundDiff;
        return Number(b.id || 0) - Number(a.id || 0);
      });
      return grand[0];
    }

    const main = matches.filter(function (m) {
      return String(m.bracket_stage || 'main').toLowerCase() !== 'third_place' && Number(m.winner_team_id || 0) > 0;
    });

    if (!main.length) return null;

    main.sort(function (a, b) {
      const roundDiff = Number(b.round || 0) - Number(a.round || 0);
      if (roundDiff) return roundDiff;
      return Number(b.id || 0) - Number(a.id || 0);
    });

    return main[0];
  }

  function pickThirdPlaceMatch(matches) {
    const third = matches.filter(function (m) {
      return String(m.bracket_stage || '').toLowerCase() === 'third_place' && Number(m.winner_team_id || 0) > 0;
    });

    if (!third.length) return null;

    third.sort(function (a, b) {
      const roundDiff = Number(b.round || 0) - Number(a.round || 0);
      if (roundDiff) return roundDiff;
      return Number(b.id || 0) - Number(a.id || 0);
    });

    return third[0];
  }

  function pickLosersFinalMatch(matches) {
    const lower = matches.filter(function (m) {
      return String(m.bracket_stage || '').toLowerCase() === 'lower' && Number(m.winner_team_id || 0) > 0;
    });

    if (!lower.length) return null;

    lower.sort(function (a, b) {
      const roundDiff = Number(b.round || 0) - Number(a.round || 0);
      if (roundDiff) return roundDiff;
      return Number(b.id || 0) - Number(a.id || 0);
    });

    return lower[0];
  }

  function initYearBuckets(bucket, year) {
    if (!bucket[year]) bucket[year] = {};
    if (!bucket.ALL) bucket.ALL = {};
  }

  function ensureDepartmentRow(byDept, department) {
    if (!byDept[department]) {
      byDept[department] = { department: department, gold: 0, silver: 0, bronze: 0 };
    }
  }

  function addMedal(summary, year, department, medalType) {
    initYearBuckets(summary, year);
    ensureDepartmentRow(summary[year], department);
    ensureDepartmentRow(summary.ALL, department);

    summary[year][department][medalType] += 1;
    summary.ALL[department][medalType] += 1;
  }

  function sortDepartmentRows(rows) {
    return rows.sort(function (a, b) {
      if (b.gold !== a.gold) return b.gold - a.gold;
      if (b.silver !== a.silver) return b.silver - a.silver;
      if (b.bronze !== a.bronze) return b.bronze - a.bronze;
      return a.department.localeCompare(b.department);
    });
  }

  function renderCourseLeaderboardRows(yearKey) {
    const selected = state.courseSummaryByYear[yearKey] || {};
    const rows = Object.values(selected);

    if (!rows.length) {
      courseLeaderboardBody.innerHTML = '<tr><td colspan="4" class="course-leaderboard-empty">No departments found for the selected year.</td></tr>';
      return;
    }

    const sorted = sortDepartmentRows(rows);
    courseLeaderboardBody.innerHTML = sorted.map(function (row) {
      return '<tr>' +
        '<td>' + escapeHTML(row.department) + '</td>' +
        '<td class="medal-gold">' + row.gold + '</td>' +
        '<td class="medal-silver">' + row.silver + '</td>' +
        '<td class="medal-bronze">' + row.bronze + '</td>' +
      '</tr>';
    }).join('');
  }

  function renderCourseYearFilter() {
    const options = ['<option value="ALL">All</option>'].concat(state.allYears.map(function (year) {
      return '<option value="' + escapeHTML(year) + '">' + escapeHTML(year) + '</option>';
    }));

    courseLeaderboardYear.innerHTML = options.join('');
    courseLeaderboardYear.value = state.allYears[0] || 'ALL';
    renderCourseLeaderboardRows(courseLeaderboardYear.value);
  }

  async function loadCourseLeaderboardFromEventsAndMatches() {
    try {
      const [eventsRes, registrationsRes] = await Promise.all([
        fetch('api/events/read.php'),
        fetch('api/registrations/read.php')
      ]);

      const eventsJson = await parsePublicApiJson(eventsRes);
      const registrationsJson = await parsePublicApiJson(registrationsRes);

      const events = eventsJson && eventsJson.success && Array.isArray(eventsJson.data) ? eventsJson.data : [];
      const registrations = registrationsJson && registrationsJson.success && Array.isArray(registrationsJson.data) ? registrationsJson.data : [];

      const departmentByRegistrationId = {};
      const allDepartments = new Set();
      registrations.forEach(function (reg) {
        const regId = Number(reg.id || 0);
        if (!regId) return;
        const department = String(reg.representative_course_name || '').trim() || 'Unassigned';
        departmentByRegistrationId[regId] = department;
        allDepartments.add(department);
      });

      const bracketJsonByEvent = await Promise.all(events.map(async function (event) {
        const eventId = Number(event.id || 0);
        if (!eventId) return null;
        try {
          const res = await fetch('api/brackets/read.php?event_id=' + encodeURIComponent(String(eventId)));
          return await parsePublicApiJson(res);
        } catch {
          return null;
        }
      }));

      const summary = {};
      const years = new Set();

      events.forEach(function (event, idx) {
        const bracketJson = bracketJsonByEvent[idx];
        if (!bracketJson || !bracketJson.success || !bracketJson.data || !Array.isArray(bracketJson.data.matches)) return;

        const matches = bracketJson.data.matches;
        if (!matches.length) return;

        const year = getEventYear(event);
        years.add(year);

        // Initialize all departments for this year with 0 medals
        if (!summary[year]) {
          summary[year] = {};
        }
        allDepartments.forEach(function (dept) {
          if (!summary[year][dept]) {
            summary[year][dept] = { department: dept, gold: 0, silver: 0, bronze: 0 };
          }
        });

        const finalMatch = pickFinalMatch(matches);
        if (!finalMatch) return;

        const goldRegId = Number(finalMatch.winner_team_id || 0);
        const silverRegId = Number(getLosingTeamId(finalMatch) || 0);
        const bronzeMatch = pickThirdPlaceMatch(matches);
        let bronzeRegId = bronzeMatch ? Number(bronzeMatch.winner_team_id || 0) : 0;
        if (!bronzeRegId) {
          // Double-elimination fallback: bronze is usually the loser of the losers final.
          const losersFinal = pickLosersFinalMatch(matches);
          bronzeRegId = losersFinal ? Number(getLosingTeamId(losersFinal) || 0) : 0;
        }

        if (goldRegId && departmentByRegistrationId[goldRegId]) {
          addMedal(summary, year, departmentByRegistrationId[goldRegId], 'gold');
        }
        if (silverRegId && departmentByRegistrationId[silverRegId]) {
          addMedal(summary, year, departmentByRegistrationId[silverRegId], 'silver');
        }
        if (bronzeRegId && departmentByRegistrationId[bronzeRegId]) {
          addMedal(summary, year, departmentByRegistrationId[bronzeRegId], 'bronze');
        }
      });

      // Initialize ALL bucket with all departments
      if (!summary.ALL) {
        summary.ALL = {};
      }
      allDepartments.forEach(function (dept) {
        if (!summary.ALL[dept]) {
          summary.ALL[dept] = { department: dept, gold: 0, silver: 0, bronze: 0 };
        }
      });

      state.courseSummaryByYear = summary;
      state.allYears = Array.from(years).sort(function (a, b) { return String(b).localeCompare(String(a)); });
      renderCourseYearFilter();

      if (courseLeaderboardUpdated) {
        courseLeaderboardUpdated.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    } catch {
      courseLeaderboardBody.innerHTML = '<tr><td colspan="4" class="course-leaderboard-empty">Unable to load leaderboard data.</td></tr>';
    }
  }

  courseLeaderboardYear.addEventListener('change', function () {
    renderCourseLeaderboardRows(courseLeaderboardYear.value || 'ALL');
  });

  renderHighlights();
  renderWinnerAnnouncements().catch(err => console.error('Error rendering announcements:', err));
  initMedalStandingsWidget({
    tbodyId:   'newsStandingsTable',
    yearSelId: 'newsStandingsYear',
    updatedId: 'newsStandingsUpdated',
    allYearOpt: false,
    poll:       false,
    sportClass: 'news-stn-sport',
    goldClass:  'medal-gold',
    silverClass:'medal-silver',
    bronzeClass:'medal-bronze',
    emptyClass: 'course-leaderboard-empty'
  });
  loadCourseLeaderboardFromEventsAndMatches();
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
    const data = await parsePublicApiJson(res);

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
  if (!response.ok) {
    try {
      const parsedError = JSON.parse(text);
      throw new Error(parsedError.message || 'Request failed.');
    } catch {
      throw new Error('Request failed with status ' + response.status + '.');
    }
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON response: ' + text.slice(0, 120));
  }
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
      const data = await parsePublicApiJson(resp);
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
   13. MEDAL STANDINGS — shared widget
   ============================================= */
function initMedalStandingsWidget(opts) {
  var tbody     = document.getElementById(opts.tbodyId);
  var yearSel   = opts.yearSelId   ? document.getElementById(opts.yearSelId)   : null;
  var tsEl      = opts.updatedId   ? document.getElementById(opts.updatedId)   : null;
  var indicator = opts.indicatorId ? document.getElementById(opts.indicatorId) : null;
  if (!tbody) return;

  var sportClass  = opts.sportClass  || 'stn-sport';
  var goldClass   = opts.goldClass   || 'stn-gold';
  var silverClass = opts.silverClass || 'stn-silver';
  var bronzeClass = opts.bronzeClass || 'stn-bronze';
  var emptyClass  = opts.emptyClass  || 'stn-placeholder';
  var showIcon    = opts.sportIcon !== false && !opts.sportClass; // icons on homepage only
  var allYearOpt  = !!opts.allYearOpt;

  var allEvents    = [];
  var selectedYear = '';

  function populateYears(events) {
    if (!yearSel) return;
    var years = [];
    events.forEach(function (ev) {
      var d = ev.event_start_date || ev.created_at || '';
      var y = d ? new Date(d).getFullYear() : null;
      if (y && !isNaN(y) && years.indexOf(y) === -1) years.push(y);
    });
    years.sort(function (a, b) { return b - a; });

    if (allYearOpt) {
      yearSel.innerHTML = '<option value="">All</option>' + years.map(function (y) {
        return '<option value="' + y + '"' + (String(y) === selectedYear ? ' selected' : '') + '>' + y + '</option>';
      }).join('');
    } else {
      if (!years.length) {
        selectedYear = '';
        yearSel.innerHTML = '<option value="">No year</option>';
        return;
      }
      if (!selectedYear || years.indexOf(Number(selectedYear)) === -1) {
        selectedYear = String(years[0]);
      }
      yearSel.innerHTML = years.map(function (y) {
        return '<option value="' + y + '"' + (String(y) === selectedYear ? ' selected' : '') + '>' + y + '</option>';
      }).join('');
    }
  }

  function filterByYear(events) {
    if (!selectedYear) return events;
    return events.filter(function (ev) {
      var d = ev.event_start_date || ev.created_at || '';
      if (!d) return false;
      return String(new Date(d).getFullYear()) === selectedYear;
    });
  }

  function setIndicator(hasOngoing) {
    if (!indicator) return;
    if (hasOngoing) {
      indicator.innerHTML = '<span style="width:7px;height:7px;background:#4cff72;border-radius:50%;animation:pulse 1.2s infinite;display:inline-block;"></span> LIVE';
      indicator.style.background = 'rgba(0,0,0,.25)';
    } else {
      indicator.innerHTML = '<span style="width:7px;height:7px;background:#94a3b8;border-radius:50%;display:inline-block;"></span> STANDINGS';
      indicator.style.background = 'rgba(0,0,0,.25)';
    }
  }

  function computeMedals(bracket) {
    var teams   = Array.isArray(bracket.teams)   ? bracket.teams   : [];
    var matches = Array.isArray(bracket.matches) ? bracket.matches : [];
    var teamMap = {};
    teams.forEach(function (t) { teamMap[t.id] = t.name || 'Team'; });

    if (!matches.length || !teams.length) {
      return { gold: '-', silver: '-', bronze: '-' };
    }

    if (String(bracket.tournament_type || '').toLowerCase().includes('round')) {
      var stats = {};
      teams.forEach(function (t) {
        stats[t.id] = { wins: 0, losses: 0, forPts: 0, againstPts: 0 };
      });
      matches.forEach(function (m) {
        if (!m.winner_team_id) return;
        var t1 = m.team1 && m.team1.id;
        var t2 = m.team2 && m.team2.id;
        if (!t1 || !t2 || !stats[t1] || !stats[t2]) return;
        var s1 = Number(m.score1 || 0), s2 = Number(m.score2 || 0);
        stats[t1].forPts += s1; stats[t1].againstPts += s2;
        stats[t2].forPts += s2; stats[t2].againstPts += s1;
        if (Number(m.winner_team_id) === Number(t1)) {
          stats[t1].wins++; stats[t2].losses++;
        } else {
          stats[t2].wins++; stats[t1].losses++;
        }
      });
      var sorted = teams.slice().sort(function (a, b) {
        var sa = stats[a.id], sb = stats[b.id];
        var da = sa.forPts - sa.againstPts, db = sb.forPts - sb.againstPts;
        return sb.wins - sa.wins || db - da || sb.forPts - sa.forPts;
      });
      return {
        gold:   sorted[0] ? (teamMap[sorted[0].id] || '-') : '-',
        silver: sorted[1] ? (teamMap[sorted[1].id] || '-') : '-',
        bronze: sorted[2] ? (teamMap[sorted[2].id] || '-') : '-'
      };
    }

    var withWinner = matches.filter(function (m) { return !!m.winner_team_id; });
    if (!withWinner.length) return { gold: '-', silver: '-', bronze: '-' };

    var grandWithWinner = withWinner.filter(function (m) {
      var stage = String(m.bracket_stage || '').toLowerCase();
      return stage === 'final' || stage === 'grand_final';
    });

    var mainWithWinner = grandWithWinner.length ? grandWithWinner : withWinner.filter(function (m) {
      var stage = String(m.bracket_stage || '').toLowerCase();
      return !stage || stage === 'main' || stage === 'upper';
    });
    if (!mainWithWinner.length) mainWithWinner = withWinner;

    var maxRound = 0;
    mainWithWinner.forEach(function (m) { if ((m.round || 0) > maxRound) maxRound = m.round || 0; });
    var finalMatch = mainWithWinner.filter(function (m) { return (m.round || 0) === maxRound; })[0];

    var goldId = finalMatch ? Number(finalMatch.winner_team_id) : 0;
    var gold   = goldId ? (teamMap[goldId] || '-') : '-';
    var silver = '-';
    if (finalMatch) {
      var t1id = finalMatch.team1 && Number(finalMatch.team1.id);
      var t2id = finalMatch.team2 && Number(finalMatch.team2.id);
      var silverId = goldId === t1id ? t2id : t1id;
      silver = silverId ? (teamMap[silverId] || '-') : '-';
    }
    var bronzeMatch = matches.find(function (m) {
      var label = String(m.label || m.bracket_stage || '').toLowerCase();
      return label.includes('3rd') || label.includes('third') || label.includes('bronze') || label.includes('place');
    });
    var bronze = '-';
    if (bronzeMatch && bronzeMatch.winner_team_id) {
      bronze = teamMap[Number(bronzeMatch.winner_team_id)] || '-';
    } else {
      var lowerWithWinner = withWinner.filter(function (m) {
        return String(m.bracket_stage || '').toLowerCase() === 'lower';
      });
      if (lowerWithWinner.length) {
        lowerWithWinner.sort(function (a, b) {
          var rd = Number(b.round || 0) - Number(a.round || 0);
          if (rd) return rd;
          return Number(b.id || 0) - Number(a.id || 0);
        });
        var losersFinal = lowerWithWinner[0];
        var lfWinner = Number(losersFinal.winner_team_id || 0);
        var lfT1 = losersFinal.team1 && Number(losersFinal.team1.id || 0);
        var lfT2 = losersFinal.team2 && Number(losersFinal.team2.id || 0);
        var bronzeId = lfWinner === lfT1 ? lfT2 : (lfWinner === lfT2 ? lfT1 : 0);
        if (bronzeId) bronze = teamMap[bronzeId] || '-';
      }
    }
    return { gold: gold, silver: silver, bronze: bronze };
  }

  function sportIcon(name) {
    var n = String(name || '').toLowerCase();
    if (n.includes('basketball'))  return '\uD83C\uDFC0';
    if (n.includes('volleyball'))  return '\uD83C\uDFD0';
    if (n.includes('futsal') || n.includes('football') || n.includes('soccer')) return '\u26BD';
    if (n.includes('badminton'))   return '\uD83C\uDFF8';
    if (n.includes('tennis'))      return '\uD83C\uDFBE';
    if (n.includes('swimming'))    return '\uD83C\uDFCA';
    if (n.includes('track') || n.includes('run') || n.includes('athlet')) return '\uD83C\uDFC3';
    if (n.includes('chess'))       return '\u265E';
    if (n.includes('table tennis') || n.includes('pingpong')) return '\uD83C\uDFD3';
    if (n.includes('baseball') || n.includes('softball')) return '\u26BE';
    if (n.includes('boxing'))      return '\uD83E\uDD4A';
    if (n.includes('archery'))     return '\uD83C\uDFF9';
    return '\uD83C\uDFC5';
  }

  async function load() {
    try {
      var evRes  = await fetch('api/events/read.php');
      var evJson = await parsePublicApiJson(evRes);
      allEvents  = (evJson.success && Array.isArray(evJson.data)) ? evJson.data : [];
      populateYears(allEvents);
      await render();
    } catch (err) {
      console.error('Medal standings error:', err);
      tbody.innerHTML = '<tr><td colspan="5" class="' + emptyClass + '">Unable to load standings.</td></tr>';
    }
  }

  async function render() {
    var yearFiltered = filterByYear(allEvents);
    var relevant = yearFiltered.filter(function (ev) {
      var s = String(ev.status || '').toLowerCase();
      return s === 'ongoing' || s === 'completed';
    });
    var hasOngoing = yearFiltered.some(function (ev) {
      return String(ev.status || '').toLowerCase() === 'ongoing';
    });
    setIndicator(hasOngoing);

    if (!relevant.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="' + emptyClass + '">No completed or ongoing events' +
        (selectedYear ? ' in ' + selectedYear : '') + '.</td></tr>';
      if (tsEl) tsEl.textContent = '--';
      return;
    }

    var bracketResults = await Promise.all(relevant.map(function (ev) {
      return fetch('api/brackets/read.php?event_id=' + encodeURIComponent(String(ev.id)))
        .then(function (r) { return parsePublicApiJson(r); })
        .catch(function () { return null; });
    }));

    var rows = [];
    relevant.forEach(function (ev, i) {
      var bJson  = bracketResults[i];
      var bData  = bJson && bJson.success && bJson.data ? bJson.data : null;
      var medals = bData ? computeMedals(bData) : { gold: '-', silver: '-', bronze: '-' };
      rows.push({
        sport:    escapeHTML(ev.sport_name || 'Unknown'),
        category: escapeHTML(ev.category  || 'General'),
        gold:     escapeHTML(medals.gold),
        silver:   escapeHTML(medals.silver),
        bronze:   escapeHTML(medals.bronze)
      });
    });

    // Deduplicate by sport+category — keep the entry with the most resolved medals
    var dedupMap = {};
    rows.forEach(function (r) {
      var key = r.sport + '|' + r.category;
      if (!dedupMap[key]) {
        dedupMap[key] = r;
      } else {
        var prev = dedupMap[key];
        var prevScore = (prev.gold !== '-' ? 1 : 0) + (prev.silver !== '-' ? 1 : 0) + (prev.bronze !== '-' ? 1 : 0);
        var currScore = (r.gold !== '-' ? 1 : 0) + (r.silver !== '-' ? 1 : 0) + (r.bronze !== '-' ? 1 : 0);
        if (currScore > prevScore) dedupMap[key] = r;
      }
    });
    rows = Object.values(dedupMap);

    rows.sort(function (a, b) {
      return a.sport.localeCompare(b.sport) || a.category.localeCompare(b.category);
    });

    var html = '';
    var i = 0;
    while (i < rows.length) {
      var sport = rows[i].sport;
      var span  = 0;
      for (var j = i; j < rows.length && rows[j].sport === sport; j++) span++;
      for (var k = 0; k < span; k++) {
        var r = rows[i + k];
        html += '<tr>';
        if (k === 0) {
          html += '<td class="' + sportClass + '" rowspan="' + span + '">' +
            (showIcon ? '<span class="stn-sport-icon" aria-hidden="true">' + sportIcon(r.sport) + '</span>' : '') +
            r.sport + '</td>';
        }
        html +=
          '<td' + (showIcon ? ' class="stn-category"' : ' style="text-align:left"') + '>' + r.category + '</td>' +
          '<td class="' + goldClass   + '">' + r.gold   + '</td>' +
          '<td class="' + silverClass + '">' + r.silver + '</td>' +
          '<td class="' + bronzeClass + '">' + r.bronze + '</td>' +
        '</tr>';
      }
      i += span;
    }
    tbody.innerHTML = html;
    if (tsEl) tsEl.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  if (yearSel) {
    yearSel.addEventListener('change', function () {
      selectedYear = yearSel.value;
      render();
    });
  }

  function start() {
    load();
    if (opts.poll) setInterval(load, 30000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
}

window.updateStandings = function () {
  // kept for backwards compat — homepage re-loads via its own interval
};

initMedalStandingsWidget({
  tbodyId:     'standingsBody',
  yearSelId:   'standingsYear',
  updatedId:   'lastUpdated',
  indicatorId: 'liveIndicator',
  poll:        true
});

/* =============================================
   14. EVENTS BRACKET PAGE
   ============================================= */
(function initEventsBracket() {
  function normalizeToken(value) {
    return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
  }

  function normalizeCategory(value) {
    return String(value || '').trim().toLowerCase();
  }

  function statusRank(status) {
    var s = String(status || '').toLowerCase();
    if (s === 'ongoing') return 0;
    if (s === 'upcoming') return 1;
    if (s === 'completed') return 2;
    return 3;
  }

  function asArraySuccess(json) {
    return json && json.success && Array.isArray(json.data) ? json.data : [];
  }

  function asObjectSuccess(json) {
    return json && json.success && json.data ? json.data : null;
  }

  function safeImagePath(path) {
    var value = String(path || '').trim();
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) return value;
    if (value.indexOf('src/images') === 0 || value.indexOf('uploads') === 0 || value.indexOf('api/') === 0) return value;
    if (value.indexOf('../') === 0) return value.slice(3);
    return value;
  }

  window.initBracketUI = function () {
    var sportsOptions = document.getElementById('sportsOptions');
    var categorySwitch = document.getElementById('genderSwitch');
    var eventFilter = document.getElementById('eventFilter');
    var courseFilter = document.getElementById('courseFilter');
    var bracketBoard = document.getElementById('bracketBoard');
    var scheduleList = document.getElementById('scheduleList');
    var scheduleViewToggle = document.getElementById('scheduleViewToggle');
    var jumpScheduleBtn = document.getElementById('jumpScheduleBtn');

    if (!sportsOptions || !eventFilter || !courseFilter || !bracketBoard || !scheduleList) return;

    var state = {
      sports: [],
      eventsBySport: {},
      bracketByEvent: {},
      registrationCourseById: {},
      seedMap: {},
      sportId: null,
      category: '',
      eventId: null,
      course: '',
      scheduleView: 'list',
      calendarYear: null,
      calendarMonth: null
    };

    function currentSport() {
      return state.sports.find(function (s) { return Number(s.id) === Number(state.sportId); }) || state.sports[0] || null;
    }

    function filteredEvents() {
      var list = state.eventsBySport[String(state.sportId)] || [];
      if (!state.category) return list;
      return list.filter(function (ev) {
        return normalizeCategory(ev.category) === normalizeCategory(state.category);
      });
    }

    function currentEvent() {
      var list = filteredEvents();
      return list.find(function (ev) { return Number(ev.id) === Number(state.eventId); }) || list[0] || null;
    }

    function teamSeedMap(bracket) {
      var map = {};
      (bracket.teams || []).forEach(function (team, idx) {
        map[String(team.id)] = idx + 1;
      });
      return map;
    }

    function winnerSide(match) {
      var winnerId = Number(match.winner_team_id || 0);
      if (!winnerId) return 0;
      var t1 = match.team1 && Number(match.team1.id || 0);
      var t2 = match.team2 && Number(match.team2.id || 0);
      if (winnerId && t1 && winnerId === t1) return 1;
      if (winnerId && t2 && winnerId === t2) return 2;
      return 0;
    }

    function teamCourse(team) {
      if (!team || team.id == null) return '';
      return state.registrationCourseById[String(team.id)] || '';
    }

    function matchPassesCourse(match) {
      if (!state.course) return true;
      var c1 = teamCourse(match.team1);
      var c2 = teamCourse(match.team2);
      return c1 === state.course || c2 === state.course;
    }

    function roundLabel(matchCount, roundNo) {
      if (matchCount === 1) return 'Finals';
      if (matchCount === 2) return 'Semifinals';
      if (matchCount === 4) return 'Quarterfinals';
      if (matchCount === 8) return 'Round of 16';
      if (matchCount === 16) return 'Round of 32';
      return 'Round ' + roundNo;
    }

    function renderEliminationSection(sectionTitle, sectionMatches, thirdPlaceMatches) {
      if (!sectionMatches.length && !thirdPlaceMatches.length) return '';

      var CARD_HEIGHT = 86;
      var BASE_GAP = 14;
      var UNIT = CARD_HEIGHT + BASE_GAP;

      var roundsMap = {};
      sectionMatches.forEach(function (m) {
        var key = Number(m.round || 1);
        if (!roundsMap[key]) roundsMap[key] = [];
        roundsMap[key].push(m);
      });

      var rounds = Object.keys(roundsMap).map(Number).sort(function (a, b) { return a - b; });

      var roundsHtml = rounds.map(function (r, roundIndex) {
        var roundMatches = roundsMap[r] || [];
        var hasNextRound = roundIndex < rounds.length - 1;
        var nextRoundKey = hasNextRound ? rounds[roundIndex + 1] : null;
        var nextRoundMatches = nextRoundKey !== null ? (roundsMap[nextRoundKey] || []) : [];
        // Same-count rounds should use simple forward lines; collapsing rounds use paired connectors.
        var useStraightConnectors = hasNextRound && roundMatches.length === nextRoundMatches.length;
        var usePairedConnectors = hasNextRound && !useStraightConnectors;
        var step = UNIT * Math.pow(2, roundIndex);
        var offset = Math.max(0, (step / 2) - (CARD_HEIGHT / 2));
        var prevBottom = 0;

        var matchHtml = roundMatches.map(function (match, matchIndex) {
          var win = winnerSide(match);
          var t1Name = match.team1 ? (match.team1.name || 'Team') : 'TBD';
          var t2Name = match.team2 ? (match.team2.name || 'Team') : 'TBD';
          var s1 = Number(match.score1 || 0);
          var s2 = Number(match.score2 || 0);
          var seed1 = match.team1 ? (state.seedMap[String(match.team1.id)] || '-') : '-';
          var seed2 = match.team2 ? (state.seedMap[String(match.team2.id)] || '-') : '-';
          var y = offset + (matchIndex * step);
          var marginTop = Math.max(0, Math.round(y - prevBottom));
          prevBottom = y + CARD_HEIGHT;

          return '<div class="match-wrap" style="margin-top:' + marginTop + 'px;--pair-step:' + step + 'px;">' +
            '<div class="match-card">' +
              '<div class="team-row' + (win === 1 ? ' winner' : '') + '">' +
                '<div class="seed-col">' + escapeHTML(String(seed1)) + '</div>' +
                '<div class="team-name">' + escapeHTML(t1Name) + '</div>' +
                '<div class="team-score">' + s1 + '</div>' +
              '</div>' +
              '<div class="team-row' + (win === 2 ? ' winner' : '') + '">' +
                '<div class="seed-col">' + escapeHTML(String(seed2)) + '</div>' +
                '<div class="team-name">' + escapeHTML(t2Name) + '</div>' +
                '<div class="team-score">' + s2 + '</div>' +
              '</div>' +
            '</div>' +
            (usePairedConnectors && roundMatches.length > 1 && matchIndex % 2 === 0 ? '<span class="connector-out"></span>' : '') +
          '</div>';
        }).join('');

        // Attach third-place matches at the bottom of the last round column
        var isLastRound = roundIndex === rounds.length - 1;
        var thirdHtml = '';
        if (isLastRound && thirdPlaceMatches.length) {
          thirdHtml = thirdPlaceMatches.map(function (tp) {
            var win = winnerSide(tp);
            var t1Name = tp.team1 ? (tp.team1.name || 'Team') : 'TBD';
            var t2Name = tp.team2 ? (tp.team2.name || 'Team') : 'TBD';
            var s1 = Number(tp.score1 || 0);
            var s2 = Number(tp.score2 || 0);
            var seed1 = tp.team1 ? (state.seedMap[String(tp.team1.id)] || '-') : '-';
            var seed2 = tp.team2 ? (state.seedMap[String(tp.team2.id)] || '-') : '-';
            return '<div class="round-subtitle" style="margin-top:' + BASE_GAP + 'px;">3rd Place Match</div>' +
              '<div class="match-wrap" style="padding-right:52px;">' +
                '<div class="match-card">' +
                  '<div class="team-row' + (win === 1 ? ' winner' : '') + '">' +
                    '<div class="seed-col">' + escapeHTML(String(seed1)) + '</div>' +
                    '<div class="team-name">' + escapeHTML(t1Name) + '</div>' +
                    '<div class="team-score">' + s1 + '</div>' +
                  '</div>' +
                  '<div class="team-row' + (win === 2 ? ' winner' : '') + '">' +
                    '<div class="seed-col">' + escapeHTML(String(seed2)) + '</div>' +
                    '<div class="team-name">' + escapeHTML(t2Name) + '</div>' +
                    '<div class="team-score">' + s2 + '</div>' +
                  '</div>' +
                '</div>' +
              '</div>';
          }).join('');
        }

        var label = roundMatches[0] && roundMatches[0].label
          ? roundMatches[0].label
          : roundLabel(roundMatches.length, r);

        return '<div class="round' +
          (usePairedConnectors ? ' has-connectors' : '') +
          (useStraightConnectors ? ' has-lines' : '') +
        '">' +
          '<h3 class="round-title">' + escapeHTML(label) + '</h3>' +
          '<div class="round-matches">' + matchHtml + thirdHtml + '</div>' +
        '</div>';
      }).join('');

      return '<div class="event-bracket-section">' +
        (sectionTitle ? '<div class="event-bracket-section-title">' + escapeHTML(sectionTitle) + '</div>' : '') +
        '<div class="rounds">' + roundsHtml + '</div>' +
      '</div>';
    }

    function renderRoundRobinSection(matches) {
      if (!matches.length) return '';
      var roundsMap = {};
      matches.forEach(function (m) {
        var key = Number(m.round || 1);
        if (!roundsMap[key]) roundsMap[key] = [];
        roundsMap[key].push(m);
      });

      var rounds = Object.keys(roundsMap).map(Number).sort(function (a, b) { return a - b; });
      if (!rounds.length) return '<div class="empty-state" style="padding:24px;">No round robin matches generated yet.</div>';

      var roundsHtml = rounds.map(function (r) {
        var roundMatches = roundsMap[r] || [];
        var cards = roundMatches.map(function (match) {
          var win = winnerSide(match);
          var t1Name = match.team1 ? (match.team1.name || 'Team') : 'TBD';
          var t2Name = match.team2 ? (match.team2.name || 'Team') : 'TBD';
          var s1 = Number(match.score1 || 0);
          var s2 = Number(match.score2 || 0);
          var seed1 = match.team1 ? (state.seedMap[String(match.team1.id)] || '-') : '-';
          var seed2 = match.team2 ? (state.seedMap[String(match.team2.id)] || '-') : '-';
          return '<div class="match-wrap" style="padding-right:0;">' +
            '<div class="match-card">' +
              '<div class="team-row' + (win === 1 ? ' winner' : '') + '">' +
                '<div class="seed-col">' + escapeHTML(String(seed1)) + '</div>' +
                '<div class="team-name">' + escapeHTML(t1Name) + '</div>' +
                '<div class="team-score">' + s1 + '</div>' +
              '</div>' +
              '<div class="team-row' + (win === 2 ? ' winner' : '') + '">' +
                '<div class="seed-col">' + escapeHTML(String(seed2)) + '</div>' +
                '<div class="team-name">' + escapeHTML(t2Name) + '</div>' +
                '<div class="team-score">' + s2 + '</div>' +
              '</div>' +
            '</div>' +
          '</div>';
        }).join('');

        return '<div class="round">' +
          '<h3 class="round-title">' + escapeHTML(roundMatches[0]?.label || ('Round ' + r)) + '</h3>' +
          '<div class="round-matches">' + cards + '</div>' +
        '</div>';
      }).join('');

      return '<div class="event-bracket-section">' +
        '<div class="event-bracket-section-title">Round Robin</div>' +
        '<div class="rounds">' + roundsHtml + '</div>' +
      '</div>';
    }

    function renderDoubleEliminationSection(matches) {
      if (!matches.length) return '';

      var CARD_HEIGHT = 86;
      var BASE_GAP = 14;
      var UNIT = CARD_HEIGHT + BASE_GAP;

      function groupByRound(list) {
        var map = {};
        list.forEach(function (match) {
          var key = Number(match.round || 1);
          if (!map[key]) map[key] = [];
          map[key].push(match);
        });
        return map;
      }

      function buildMatchCardHtml(match) {
        var win = winnerSide(match);
        return '<div class="match-card" data-match-id="' + match.id + '">' +
          '<div class="team-row' + (win === 1 ? ' winner' : '') + '">' +
            '<div class="seed-col">' + escapeHTML(String(match.team1 ? (state.seedMap[String(match.team1.id)] || '-') : '-')) + '</div>' +
            '<div class="team-name">' + escapeHTML(match.team1 ? (match.team1.name || 'Team') : 'TBD') + '</div>' +
            '<div class="team-score">' + Number(match.score1 || 0) + '</div>' +
          '</div>' +
          '<div class="team-row' + (win === 2 ? ' winner' : '') + '">' +
            '<div class="seed-col">' + escapeHTML(String(match.team2 ? (state.seedMap[String(match.team2.id)] || '-') : '-')) + '</div>' +
            '<div class="team-name">' + escapeHTML(match.team2 ? (match.team2.name || 'Team') : 'TBD') + '</div>' +
            '<div class="team-score">' + Number(match.score2 || 0) + '</div>' +
          '</div>' +
        '</div>';
      }

      function buildRoundsHtml(roundsMap, opts) {
        var rounds = Object.keys(roundsMap).map(Number).sort(function (a, b) { return a - b; });
        if (!rounds.length) return '';

        var maxMatchCount = opts && opts.maxMatchCount ? opts.maxMatchCount : roundsMap[rounds[0]].length;
        var appendedColumn = !!(opts && opts.appendedColumn);

        return rounds.map(function (r, roundIndex) {
          var roundMatches = roundsMap[r] || [];
          var nextKey = rounds[roundIndex + 1];
          var nextMatches = nextKey != null ? roundsMap[nextKey] : null;
          var isLast = roundIndex === rounds.length - 1;
          var isHalving = nextMatches && nextMatches.length < roundMatches.length;
          var hasForwardLine = !isHalving && (!isLast || appendedColumn);

          var step = UNIT * (maxMatchCount / Math.max(1, roundMatches.length));
          var offset = (step - CARD_HEIGHT) / 2;
          var prevBottom = 0;

          var matchHtml = roundMatches.map(function (match, matchIndex) {
            var y = offset + (matchIndex * step);
            var marginTop = Math.max(0, Math.round(y - prevBottom));
            prevBottom = y + CARD_HEIGHT;

            return '<div class="match-wrap" style="margin-top:' + marginTop + 'px;--pair-step:' + step + 'px;">' +
              buildMatchCardHtml(match) +
              (isHalving && (matchIndex % 2 === 0) ? '<span class="connector-out"></span>' : '') +
            '</div>';
          }).join('');

          var label = roundMatches[0]?.label || ('Round ' + r);
          var cssClass = 'round' + (isHalving ? ' has-connectors' : (hasForwardLine ? ' has-lines' : ''));
          return '<div class="' + cssClass + '">' +
            '<h3 class="round-title">' + escapeHTML(label) + '</h3>' +
            '<div class="round-matches">' + matchHtml + '</div>' +
          '</div>';
        }).join('');
      }

      function buildFinalsColumn(finalMatches, topOffset) {
        if (!finalMatches.length) return '';
        var sorted = finalMatches.slice().sort(function (a, b) { return Number(a.id) - Number(b.id); });
        var first = true;
        var cardsHtml = sorted.map(function (match) {
          var mt = first ? topOffset : BASE_GAP;
          first = false;
          return '<div class="match-wrap" style="margin-top:' + mt + 'px;padding-right:0;">' +
            buildMatchCardHtml(match) +
          '</div>';
        }).join('');

        return '<div class="round">' +
          '<h3 class="round-title">Grand Finals</h3>' +
          '<div class="round-matches">' + cardsHtml + '</div>' +
        '</div>';
      }

      var allMatches = matches.slice();
      var upperMatches = allMatches.filter(function (m) { return String(m.bracket_stage || '').toLowerCase() === 'upper'; });
      var lowerMatches = allMatches.filter(function (m) { return String(m.bracket_stage || '').toLowerCase() === 'lower'; });
      var finalMatches = allMatches.filter(function (m) {
        var stage = String(m.bracket_stage || '').toLowerCase();
        return stage === 'final' && String(m.label || '').toLowerCase() !== 'if necessary';
      });

      var upperRoundsMap = groupByRound(upperMatches);
      var upperRoundNos = Object.keys(upperRoundsMap).map(Number).sort(function (a, b) { return a - b; });
      var maxUpperCount = upperRoundNos.length ? upperRoundsMap[upperRoundNos[0]].length : 1;
      var wFinalCount = upperRoundNos.length ? upperRoundsMap[upperRoundNos[upperRoundNos.length - 1]].length : 1;
      var wFinalStep = UNIT * (maxUpperCount / Math.max(1, wFinalCount));
      var wFinalOffset = Math.round((wFinalStep - CARD_HEIGHT) / 2);

      var lowerRoundsMap = groupByRound(lowerMatches);
      var lowerRoundNos = Object.keys(lowerRoundsMap).map(Number).sort(function (a, b) { return a - b; });
      var maxLowerCount = lowerRoundNos.length ? lowerRoundsMap[lowerRoundNos[0]].length : 1;

      var winnerHtml = buildRoundsHtml(upperRoundsMap, { maxMatchCount: maxUpperCount, appendedColumn: finalMatches.length > 0 });
      var finalsHtml = buildFinalsColumn(finalMatches, wFinalOffset);
      var loserHtml = buildRoundsHtml(lowerRoundsMap, { maxMatchCount: maxLowerCount });

      return '<div class="de-section">' +
        '<div class="de-section-title">Winners Bracket</div>' +
        '<div class="rounds">' + winnerHtml + finalsHtml + '</div>' +
      '</div>' +
      (loserHtml
        ? '<div class="de-section">' +
            '<div class="de-section-title">Losers Bracket</div>' +
            '<div class="rounds">' + loserHtml + '</div>' +
          '</div>'
        : '');
    }

    function formatScheduleDate(match) {
      var date = String(match.date || '').trim();
      var time = String(match.time || '').trim();
      if (!date && !time) return '';
      if (!date) return time;
      var dt = new Date(date + (time ? 'T' + time : ''));
      if (isNaN(dt.getTime())) return (date + (time ? ' ' + time : ''));
      var dateLabel = dt.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      var timeLabel = time ? dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';
      return (dateLabel + (timeLabel ? ' ' + timeLabel : '')).trim();
    }

    function scheduleEntries(bracket) {
      return (bracket.matches || [])
        .filter(function (m) { return matchPassesCourse(m); })
        .filter(function (m) {
          return String(m.date || '').trim() || String(m.time || '').trim() || String(m.location || '').trim();
        })
        .map(function (m) {
          var t1 = m.team1 ? (m.team1.name || 'TBD') : 'TBD';
          var t2 = m.team2 ? (m.team2.name || 'TBD') : 'TBD';
          return {
            datetime: formatScheduleDate(m) || 'TBD',
            match: t1 + ' vs ' + t2,
            venue: String(m.location || 'TBD'),
            status: String(m.status || 'Pending')
          };
        })
        .sort(function (a, b) {
          return a.datetime.localeCompare(b.datetime);
        });
    }

    function parseScheduleDate(dateString) {
      var parsed = new Date(dateString);
      if (isNaN(parsed.getTime())) return null;
      return parsed;
    }

    function renderScheduleList(schedule) {
      scheduleList.className = 'schedule-list';
      scheduleList.innerHTML = schedule.map(function (item) {
        var live = String(item.status || '').toLowerCase() === 'ongoing';
        return '<div class="schedule-item">' +
          '<div class="schedule-time">' + escapeHTML(item.datetime) + '</div>' +
          '<div><strong>' + escapeHTML(item.match) + '</strong><div class="schedule-meta">' + escapeHTML(item.venue) + '</div></div>' +
          '<span class="schedule-status' + (live ? ' live' : '') + '">' + escapeHTML(item.status) + '</span></div>';
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
              '<strong>' + timeLabel + '</strong><span>' + escapeHTML(item.match) + '</span>' +
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

    function renderSchedule(bracket) {
      var schedule = scheduleEntries(bracket || { matches: [] });
      if (!schedule.length) {
        scheduleList.className = 'schedule-list';
        scheduleList.innerHTML = '<div class="empty-state">No schedules for this filter.</div>';
        return;
      }

      if (state.scheduleView === 'calendar') renderScheduleCalendar(schedule);
      else renderScheduleList(schedule);
    }

    async function fetchSports() {
      var res = await fetch('api/sports/read.php');
      var json = await parsePublicApiJson(res);
      return asArraySuccess(json).filter(function (sport) {
        return Number(sport.is_active || 1) === 1;
      });
    }

    async function fetchEventsForSport(sportId) {
      var res = await fetch('api/events/read.php?sports_id=' + encodeURIComponent(String(sportId)));
      var json = await parsePublicApiJson(res);
      var list = asArraySuccess(json);
      return list.sort(function (a, b) {
        var rankDiff = statusRank(a.status) - statusRank(b.status);
        if (rankDiff !== 0) return rankDiff;
        var aDate = new Date(a.event_start_date || a.created_at || 0).getTime();
        var bDate = new Date(b.event_start_date || b.created_at || 0).getTime();
        return aDate - bDate;
      });
    }

    async function fetchRegistrationCourses() {
      var res = await fetch('api/registrations/read.php');
      var json = await parsePublicApiJson(res);
      var map = {};
      asArraySuccess(json).forEach(function (row) {
        map[String(row.id)] = String(row.representative_course_name || row.category || '').trim();
      });
      return map;
    }

    async function fetchBracketForEvent(eventId) {
      if (state.bracketByEvent[String(eventId)]) return state.bracketByEvent[String(eventId)];
      var res = await fetch('api/brackets/read.php?event_id=' + encodeURIComponent(String(eventId)));
      var json = await parsePublicApiJson(res);
      var data = asObjectSuccess(json);
      state.bracketByEvent[String(eventId)] = data || { matches: [], teams: [], tournament_type: '' };
      return state.bracketByEvent[String(eventId)];
    }

    function collectEventCategories(events) {
      var categories = [];
      events.forEach(function (ev) {
        var cat = String(ev.category || '').trim();
        if (cat && categories.indexOf(cat) === -1) categories.push(cat);
      });
      return categories;
    }

    function renderCategoryButtons() {
      if (!categorySwitch) return;
      var events = state.eventsBySport[String(state.sportId)] || [];
      var categories = collectEventCategories(events);
      if (!categories.length) {
        state.category = '';
        categorySwitch.innerHTML = '<button type="button" data-category="" class="active">All Categories</button>';
        return;
      }

      if (!state.category || categories.indexOf(state.category) === -1) {
        state.category = categories[0];
      }

      categorySwitch.innerHTML = categories.map(function (cat) {
        var active = cat === state.category ? 'active' : '';
        return '<button type="button" data-category="' + escapeHTML(cat) + '" class="' + active + '">' + escapeHTML(cat) + '</button>';
      }).join('');
    }

    function renderSports() {
      sportsOptions.innerHTML = state.sports.map(function (sport) {
        var active = Number(sport.id) === Number(state.sportId) ? 'active' : '';
        var image = safeImagePath(sport.photo_path);
        var bubble = image
          ? '<span class="sport-bubble"><img src="' + escapeHTML(image) + '" alt="' + escapeHTML(sport.sport_name) + '" /></span>'
          : '<span class="sport-bubble">&#127942;</span>';
        return '<button type="button" class="sport-option ' + active + '" data-sport-id="' + Number(sport.id) + '">' +
          bubble + '<span class="sport-label">' + escapeHTML(sport.sport_name) + '</span></button>';
      }).join('');
    }

    function syncEventFilter() {
      var events = filteredEvents();
      eventFilter.innerHTML = events.map(function (ev) {
        return '<option value="' + Number(ev.id) + '">' +
          escapeHTML(ev.title || 'Untitled Event') + ' (' + escapeHTML(ev.status || 'Unknown') + ')' +
        '</option>';
      }).join('');

      if (!events.length) {
        state.eventId = null;
        eventFilter.innerHTML = '<option value="">No events available</option>';
        return;
      }

      var exists = events.some(function (ev) { return Number(ev.id) === Number(state.eventId); });
      if (!exists) state.eventId = Number(events[0].id);
      eventFilter.value = String(state.eventId);
    }

    function syncCourseFilter(bracket) {
      var chosen = state.course;
      var courses = [];
      (bracket.matches || []).forEach(function (match) {
        var c1 = teamCourse(match.team1);
        var c2 = teamCourse(match.team2);
        if (c1 && courses.indexOf(c1) === -1) courses.push(c1);
        if (c2 && courses.indexOf(c2) === -1) courses.push(c2);
      });
      courses.sort(function (a, b) { return a.localeCompare(b); });

      courseFilter.innerHTML = '<option value="">All Courses/Departments</option>' +
        courses.map(function (course) {
          return '<option value="' + escapeHTML(course) + '">' + escapeHTML(course) + '</option>';
        }).join('');

      if (chosen && courses.indexOf(chosen) !== -1) {
        courseFilter.value = chosen;
      } else {
        state.course = '';
        courseFilter.value = '';
      }
    }

    function renderBracket(bracket) {
      var allMatches = (bracket.matches || []).slice();
      if (!allMatches.length) {
        bracketBoard.innerHTML = '<div class="empty-state" style="padding:24px;">No bracket created yet for this event.</div>';
        renderSchedule(bracket);
        return;
      }

      var filtered = allMatches.filter(matchPassesCourse);
      if (!filtered.length) {
        bracketBoard.innerHTML = '<div class="empty-state" style="padding:24px;">No bracket data for this filter.</div>';
        renderSchedule({ matches: [] });
        return;
      }

      // Build seed map and store on state so render helpers can access it
      state.seedMap = teamSeedMap(bracket);

      var isRoundRobin = String(bracket.tournament_type || '').toLowerCase() === 'round_robin';
      var third = filtered.filter(function (m) { return String(m.bracket_stage || '').toLowerCase() === 'third_place'; });

      var tournamentType = String(bracket.tournament_type || '').toLowerCase();
      var isDoubleElimination = tournamentType === 'double_elimination';
      var html = '<div class="event-bracket-stage' + (isDoubleElimination ? ' double-elim-view' : '') + '">';

      if (isRoundRobin) {
        html += renderRoundRobinSection(filtered);
      } else if (isDoubleElimination) {
        html += renderDoubleEliminationSection(filtered);
      } else {
        // Single elimination retains the original public bracket layout.
        var upperMain = filtered.filter(function (m) {
          var s = String(m.bracket_stage || '').toLowerCase();
          return s === '' || s === 'main' || s === 'upper';
        });
        var third = filtered.filter(function (m) {
          return String(m.bracket_stage || '').toLowerCase() === 'third_place';
        });
        html += renderEliminationSection('Bracket', upperMain, third);
      }

      html += '</div>';
      bracketBoard.innerHTML = html;
      renderSchedule({ matches: filtered });
    }

    async function renderCurrentEventView() {
      var event = currentEvent();
      if (!event) {
        bracketBoard.innerHTML = '<div class="empty-state" style="padding:24px;">No events found for this sport/category.</div>';
        scheduleList.innerHTML = '<div class="empty-state">No schedules for this filter.</div>';
        courseFilter.innerHTML = '<option value="">All Courses/Departments</option>';
        return;
      }

      try {
        var bracket = await fetchBracketForEvent(event.id);
        syncCourseFilter(bracket);
        renderBracket(bracket);
      } catch (err) {
        console.error('Events bracket load error:', err);
        bracketBoard.innerHTML = '<div class="empty-state" style="padding:24px;">Unable to load bracket data.</div>';
        scheduleList.innerHTML = '<div class="empty-state">Unable to load schedules.</div>';
      }
    }

    async function loadEventsForSport(sportId) {
      state.eventsBySport[String(sportId)] = await fetchEventsForSport(sportId);
    }

    async function onSportChanged(sportId) {
      state.sportId = Number(sportId);
      if (!state.eventsBySport[String(state.sportId)]) {
        await loadEventsForSport(state.sportId);
      }

      renderSports();
      renderCategoryButtons();
      syncEventFilter();
      state.course = '';
      state.calendarYear = null;
      state.calendarMonth = null;
      await renderCurrentEventView();
    }

    async function initialize() {
      try {
        var loadedSports = await fetchSports();
        if (!loadedSports.length) {
          sportsOptions.innerHTML = '<div class="empty-state">No sports available.</div>';
          return;
        }

        state.sports = loadedSports;
        state.registrationCourseById = await fetchRegistrationCourses();

        state.sportId = Number(state.sports[0].id);
        await loadEventsForSport(state.sportId);
        renderSports();
        renderCategoryButtons();
        syncEventFilter();
        await renderCurrentEventView();
      } catch (err) {
        console.error('Events page load error:', err);
        sportsOptions.innerHTML = '<div class="empty-state">Unable to load sports.</div>';
        bracketBoard.innerHTML = '<div class="empty-state" style="padding:24px;">Unable to load bracket data.</div>';
        scheduleList.innerHTML = '<div class="empty-state">Unable to load schedules.</div>';
      }
    }

    sportsOptions.addEventListener('click', async function (e) {
      var btn = e.target.closest('[data-sport-id]');
      if (!btn) return;
      await onSportChanged(btn.getAttribute('data-sport-id'));
    });

    if (categorySwitch) {
      categorySwitch.addEventListener('click', async function (e) {
        var btn = e.target.closest('[data-category]');
        if (!btn) return;
        state.category = String(btn.getAttribute('data-category') || '');
        categorySwitch.querySelectorAll('button').forEach(function (item) {
          item.classList.toggle('active', item === btn);
        });
        syncEventFilter();
        state.course = '';
        state.calendarYear = null;
        state.calendarMonth = null;
        await renderCurrentEventView();
      });
    }

    eventFilter.addEventListener('change', async function () {
      state.eventId = Number(eventFilter.value || 0) || null;
      state.course = '';
      state.calendarYear = null;
      state.calendarMonth = null;
      await renderCurrentEventView();
    });

    courseFilter.addEventListener('change', function () {
      state.course = String(courseFilter.value || '');
      renderCurrentEventView();
    });

    if (scheduleViewToggle) {
      scheduleViewToggle.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-view]');
        if (!btn) return;
        state.scheduleView = btn.getAttribute('data-view') || 'list';
        scheduleViewToggle.querySelectorAll('[data-view]').forEach(function (v) {
          v.classList.toggle('active', v === btn);
        });
        renderCurrentEventView();
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

      if (navBtn.getAttribute('data-calendar-nav') === 'prev') state.calendarMonth -= 1;
      else state.calendarMonth += 1;

      if (state.calendarMonth < 0) {
        state.calendarMonth = 11;
        state.calendarYear -= 1;
      }
      if (state.calendarMonth > 11) {
        state.calendarMonth = 0;
        state.calendarYear += 1;
      }

      renderCurrentEventView();
    });

    if (jumpScheduleBtn) {
      jumpScheduleBtn.addEventListener('click', function () {
        var section = document.getElementById('schedulesSection');
        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    initialize();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initBracketUI);
  } else {
    window.initBracketUI();
  }
})();

