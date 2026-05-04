(function () {
  const storageKey = 'otm_active_bracket';
  const themeStorageKey = 'otm_bracket_theme';
  let bracket = null;
  let selectedMatchId = null;

  // ── URL params ────────────────────────────────────────────────────────
  const urlParams    = new URLSearchParams(window.location.search);
  const urlEventId   = urlParams.get('event_id')   ? parseInt(urlParams.get('event_id'))   : null;
  const urlBracketId = urlParams.get('bracket_id') ? parseInt(urlParams.get('bracket_id')) : null;

  // ── API helpers ───────────────────────────────────────────────────────
  function apiBase() {
    // Works from admin/ directory
    return '../api';
  }

  async function apiUpdateMatch(fields) {
    try {
      const res = await fetch(apiBase() + '/matches/update.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
      });
      const json = await res.json();
      if (!json.success) console.warn('Match update failed:', json.message);
    } catch (err) {
      console.error('apiUpdateMatch error:', err);
    }
  }

  async function apiUpdateBracketTheme(mode) {
    try {
      const res = await fetch(apiBase() + '/brackets/update_theme.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ui_theme: mode,
          bracket_id: bracket?.bracket_id ? Number(bracket.bracket_id) : null,
          event_id: bracket?.event_id ? Number(bracket.event_id) : null
        })
      });
      const json = await res.json();
      if (!json.success) console.warn('Theme update failed:', json.message);
    } catch (err) {
      console.warn('apiUpdateBracketTheme error:', err);
    }
  }

  function dbIdForMatch(match) {
    // Prefer db_id set during bracket creation, else fall back to match.id if
    // the bracket was loaded from DB (ids are already DB ids).
    return match.db_id || match.id;
  }

  const stageEl      = document.getElementById('bracketStage');
  const modalEl      = document.getElementById('matchModalOverlay');
  const scoreTableEl = document.getElementById('scoreTable');
  const titleEl      = document.getElementById('landingTitle');
  const subEl        = document.getElementById('landingSub');
  const chipType     = document.getElementById('chipType');
  const chipCategory = document.getElementById('chipCategory');
  const chipThird    = document.getElementById('chipThird');
  const chipTeams    = document.getElementById('chipTeams');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const rrStandingsSection = document.getElementById('roundRobinStandingsSection');
  const rrStandingsBody = document.getElementById('rrStandingsBody');
  const rrStandingsMeta = document.getElementById('rrStandingsMeta');

  function esc(v) {
    return String(v || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function applyTheme(mode) {
    const useLight = mode === 'light';
    document.body.classList.toggle('light-mode', useLight);
    if (themeToggleBtn) {
      themeToggleBtn.textContent = useLight ? 'Dark Mode' : 'Light Mode';
      themeToggleBtn.setAttribute('aria-pressed', String(useLight));
    }
  }

  function loadTheme() {
    const saved = localStorage.getItem(themeStorageKey);
    applyTheme(saved === 'light' ? 'light' : 'dark');
  }

  async function toggleTheme() {
    const next = document.body.classList.contains('light-mode') ? 'dark' : 'light';
    localStorage.setItem(themeStorageKey, next);
    applyTheme(next);
    if (bracket) {
      bracket.ui_theme = next;
      saveBracket();
      await apiUpdateBracketTheme(next);
    }
  }

  async function loadBracket() {
    // 1. Try API first (by bracket_id or event_id from URL)
    const queryId    = urlBracketId || urlEventId;
    const queryParam = urlBracketId ? 'bracket_id' : 'event_id';
    if (queryId) {
      try {
        const res  = await fetch(apiBase() + '/brackets/read.php?' + queryParam + '=' + queryId);
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          const payload = {
            bracket_id:        d.bracket_id,
            event_id:          d.event_id,
            event_title:       d.event_title || '',
            category:          d.category || '',
            tournament_type:   d.tournament_type,
            third_place_match: d.has_third_place_match,
            ui_theme:          d.ui_theme || 'dark',
            teams:             d.teams,
            matches:           d.matches,
          };
          localStorage.setItem(storageKey, JSON.stringify(payload));
          return payload;
        }
      } catch (err) {
        console.warn('API load failed, falling back to localStorage:', err);
      }
    }
    // 2. Fallback: localStorage cache
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.matches)) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function saveBracket() {
    localStorage.setItem(storageKey, JSON.stringify(bracket));
  }

  function teamName(team) {
    return team ? (team.name || 'Team') : '-select team-';
  }

  function teamSeed(team) {
    if (!team) return '-';
    const idx = (bracket.teams || []).findIndex(t => Number(t.id) === Number(team.id));
    return idx >= 0 ? idx + 1 : '-';
  }

  function findMatch(id) {
    return bracket.matches.find(m => Number(m.id) === Number(id));
  }

  function assignWinnerToNext(match, winnerTeam) {
    if (!match.next_match_id || !winnerTeam) return;
    const next = findMatch(match.next_match_id);
    if (!next) return;

    if (match.next_slot === 'team1') next.team1 = winnerTeam;
    if (match.next_slot === 'team2') next.team2 = winnerTeam;
  }

  function assignLoserToNext(match, loserTeam) {
    if (!match.loser_next_match_id || !loserTeam) return;
    const next = findMatch(match.loser_next_match_id);
    if (!next) return;

    if (match.loser_next_slot === 'team1') next.team1 = loserTeam;
    if (match.loser_next_slot === 'team2') next.team2 = loserTeam;
  }

  function resetMatchResult(match) {
    if (!match) return;
    match.score1          = 0;
    match.score2          = 0;
    match.winner_team_id  = null;
    match.status          = 'Pending';
  }

  function clearDownstreamFromMatch(match) {
    if (!match || !match.next_match_id) return;
    const next = findMatch(match.next_match_id);
    if (!next) return;

    if (match.next_slot === 'team1') next.team1 = null;
    if (match.next_slot === 'team2') next.team2 = null;
    resetMatchResult(next);
    clearDownstreamFromMatch(next);
  }

  function availableTeamsForMatch(match, slotKey) {
    const selectedInRound = new Set();
    (bracket.matches || []).forEach(m => {
      if (Number(m.round || 1) !== Number(match.round || 1)) return;
      if (Number(m.id) === Number(match.id)) return;
      if (m.team1 && m.team1.id != null) selectedInRound.add(Number(m.team1.id));
      if (m.team2 && m.team2.id != null) selectedInRound.add(Number(m.team2.id));
    });

    const current = slotKey === 'team1' ? match.team1 : match.team2;
    if (current && current.id != null) selectedInRound.delete(Number(current.id));

    return (bracket.teams || []).filter(t => !selectedInRound.has(Number(t.id)));
  }

  function renderTeamSelect(selectEl, options, selectedId) {
    if (!selectEl) return;
    const selected = selectedId == null ? '' : String(selectedId);
    selectEl.innerHTML =
      '<option value="">-select team-</option>' +
      '<option value="__BYE__">BYE (auto-advance opponent)</option>' +
      options.map(team =>
        '<option value="' + Number(team.id) + '" ' + (String(Number(team.id)) === selected ? 'selected' : '') + '>' + esc(team.name || 'Team') + '</option>'
      ).join('');
  }

  function eliminationRoundLabelByMatchCount(matchCount, roundNo) {
    if (matchCount === 1) return 'Finals';
    if (matchCount === 2) return 'Semifinals';
    if (matchCount === 4) return 'Quarterfinals';
    if (matchCount === 8) return 'Round of 16';
    if (matchCount === 16) return 'Round of 32';
    return 'Round ' + roundNo;
  }

  function openTeamSelection(match) {
    const team1Select  = document.getElementById('matchTeam1Select');
    const team2Select  = document.getElementById('matchTeam2Select');
    const team1Options = availableTeamsForMatch(match, 'team1');
    const team2Options = availableTeamsForMatch(match, 'team2');

    renderTeamSelect(team1Select, team1Options, match.team1 ? Number(match.team1.id) : null);
    renderTeamSelect(team2Select, team2Options, match.team2 ? Number(match.team2.id) : null);
  }

  function hasSavedMatchInfo(match) {
    if (!match) return false;
    return Boolean(
      String(match.date || '').trim() ||
      String(match.time || '').trim() ||
      String(match.location || '').trim() ||
      String(match.description || '').trim()
    );
  }

  function defaultTabForMatch(match) {
    if (!match.team1 || !match.team2) return 'teams';
    if (hasSavedMatchInfo(match)) return 'scores';
    return 'info';
  }

  function autoAdvanceByes() {
    let changed = false;
    bracket.matches.forEach(match => {
      if (String(match.status) === 'Completed') return;
      const onlyTeam1 = match.team1 && !match.team2;
      const onlyTeam2 = !match.team1 && match.team2;
      if (!onlyTeam1 && !onlyTeam2) return;

      // Do not treat an empty slot as BYE if a feeder match can still fill it.
      const hasPendingFeederForSlot = (slot) => {
        return (bracket.matches || []).some(src => {
          const feedsByWinner = Number(src.next_match_id) === Number(match.id) && src.next_slot === slot;
          const feedsByLoser  = Number(src.loser_next_match_id) === Number(match.id) && src.loser_next_slot === slot;
          if (!feedsByWinner && !feedsByLoser) return false;
          return String(src.status || 'Pending') !== 'Completed';
        });
      };

      if (!match.team1 && hasPendingFeederForSlot('team1')) return;
      if (!match.team2 && hasPendingFeederForSlot('team2')) return;

      const winner = onlyTeam1 ? match.team1 : match.team2;
      match.winner_team_id = winner ? Number(winner.id) : null;
      match.status         = 'Completed';
      assignWinnerToNext(match, winner);
      // BYE doesn't generate a real loser, no loser routing needed
      changed = true;
    });
    if (changed) saveBracket();
  }

  function matchWinnerSide(match) {
    if (!match.winner_team_id) return 0;
    if (match.team1 && Number(match.team1.id) === Number(match.winner_team_id)) return 1;
    if (match.team2 && Number(match.team2.id) === Number(match.winner_team_id)) return 2;
    return 0;
  }

  function renderEliminationBoard() {
    const CARD_HEIGHT = 86;
    const BASE_GAP    = 14;
    const UNIT        = CARD_HEIGHT + BASE_GAP;

    const roundsMap = {};
    const thirdPlaceMatches = [];
    bracket.matches.forEach(m => {
      if (m.bracket_stage === 'third_place') {
        thirdPlaceMatches.push(m);
        return;
      }
      const key = Number(m.round || 1);
      if (!roundsMap[key]) roundsMap[key] = [];
      roundsMap[key].push(m);
    });

    const rounds = Object.keys(roundsMap).map(Number).sort((a, b) => a - b);
    if (!rounds.length) {
      stageEl.innerHTML = '<div class="empty-note">No matches generated yet.</div>';
      return;
    }

    stageEl.innerHTML = '<div class="rounds">' + rounds.map((r, roundIndex) => {
      const roundMatches  = roundsMap[r] || [];
      const hasConnectors = roundIndex < (rounds.length - 1);
      const step          = UNIT * Math.pow(2, roundIndex);
      const offset        = Math.max(0, (step / 2) - (CARD_HEIGHT / 2));

      let prevBottom = 0;
      const matchHtml = roundMatches.map((match, matchIndex) => {
        const winnerSide = matchWinnerSide(match);
        const y          = offset + (matchIndex * step);
        const marginTop  = Math.max(0, Math.round(y - prevBottom));
        prevBottom       = y + CARD_HEIGHT;

        return '<div class="match-wrap" style="margin-top:' + marginTop + 'px;--pair-step:' + step + 'px;">' +
          '<div class="match-card" data-match-id="' + match.id + '">' +
            '<div class="team-row' + (winnerSide === 1 ? ' winner' : '') + '">' +
              '<div class="seed-col">' + esc(teamSeed(match.team1)) + '</div>' +
              '<div class="team-name">' + esc(teamName(match.team1)) + '</div>' +
              '<div class="team-score">' + (Number(match.score1 || 0)) + '</div>' +
            '</div>' +
            '<div class="team-row' + (winnerSide === 2 ? ' winner' : '') + '">' +
              '<div class="seed-col">' + esc(teamSeed(match.team2)) + '</div>' +
              '<div class="team-name">' + esc(teamName(match.team2)) + '</div>' +
              '<div class="team-score">' + (Number(match.score2 || 0)) + '</div>' +
            '</div>' +
          '</div>' +
          (hasConnectors && (matchIndex % 2 === 0) ? '<span class="connector-out"></span>' : '') +
        '</div>';
      }).join('');

      const displayRoundLabel = eliminationRoundLabelByMatchCount(roundMatches.length, r);
      const isLastRound = roundIndex === (rounds.length - 1);
      const thirdPlaceHtml = (isLastRound && thirdPlaceMatches.length)
        ? thirdPlaceMatches.map(tp => {
            const winnerSide = matchWinnerSide(tp);
            return '<div class="round-subtitle" style="margin-top:' + BASE_GAP + 'px;">3rd Place Match</div>' +
              '<div class="match-wrap" style="padding-right:52px;">' +
              '<div class="match-card" data-match-id="' + tp.id + '">' +
                '<div class="team-row' + (winnerSide === 1 ? ' winner' : '') + '">' +
                  '<div class="seed-col">' + esc(teamSeed(tp.team1)) + '</div>' +
                  '<div class="team-name">' + esc(teamName(tp.team1)) + '</div>' +
                  '<div class="team-score">' + (Number(tp.score1 || 0)) + '</div>' +
                '</div>' +
                '<div class="team-row' + (winnerSide === 2 ? ' winner' : '') + '">' +
                  '<div class="seed-col">' + esc(teamSeed(tp.team2)) + '</div>' +
                  '<div class="team-name">' + esc(teamName(tp.team2)) + '</div>' +
                  '<div class="team-score">' + (Number(tp.score2 || 0)) + '</div>' +
                '</div>' +
              '</div>' +
            '</div>';
          }).join('')
        : '';
      return '<div class="round' + (hasConnectors ? ' has-connectors' : '') + '">' +
        '<h3 class="round-title">' + esc(displayRoundLabel) + '</h3>' +
        '<div class="round-matches">' +
        matchHtml + thirdPlaceHtml +
        '</div>' +
      '</div>';
    }).join('') + '</div>';
  }

  function renderRoundRobinBoard() {
    const roundsMap = {};
    (bracket.matches || []).forEach(m => {
      const key = Number(m.round || 1);
      if (!roundsMap[key]) roundsMap[key] = [];
      roundsMap[key].push(m);
    });

    const rounds = Object.keys(roundsMap).map(Number).sort((a, b) => a - b);
    if (!rounds.length) {
      stageEl.innerHTML = '<div class="empty-note">No round robin matches generated yet.</div>';
      return;
    }

    stageEl.innerHTML = '<div class="rounds">' + rounds.map((r) => {
      const roundMatches = roundsMap[r] || [];
      const cards = roundMatches.map(match => {
        const winnerSide = matchWinnerSide(match);
        return '<div class="match-wrap" style="padding-right:0;">' +
          '<div class="match-card" data-match-id="' + match.id + '">' +
            '<div class="team-row' + (winnerSide === 1 ? ' winner' : '') + '">' +
              '<div class="seed-col">' + esc(teamSeed(match.team1)) + '</div>' +
              '<div class="team-name">' + esc(teamName(match.team1)) + '</div>' +
              '<div class="team-score">' + Number(match.score1 || 0) + '</div>' +
            '</div>' +
            '<div class="team-row' + (winnerSide === 2 ? ' winner' : '') + '">' +
              '<div class="seed-col">' + esc(teamSeed(match.team2)) + '</div>' +
              '<div class="team-name">' + esc(teamName(match.team2)) + '</div>' +
              '<div class="team-score">' + Number(match.score2 || 0) + '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');

      return '<div class="round">' +
        '<h3 class="round-title">' + esc(roundMatches[0]?.label || ('Round ' + r)) + '</h3>' +
        '<div class="round-matches">' + cards + '</div>' +
      '</div>';
    }).join('') + '</div>';
  }

  function computeRoundRobinStandings() {
    const teams = Array.isArray(bracket?.teams) ? bracket.teams : [];
    const rows = teams.map((team) => ({
      id: Number(team.id),
      name: String(team.name || 'Team'),
      played: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      pf: 0,
      pa: 0,
      diff: 0,
      points: 0
    }));

    const byId = new Map(rows.map((r) => [r.id, r]));
    const matches = (bracket?.matches || []).filter((m) => String(m.bracket_stage || '') === 'round_robin' || String(bracket?.tournament_type || '') === 'round_robin');

    let countedMatches = 0;

    matches.forEach((match) => {
      const t1 = match.team1 && match.team1.id != null ? byId.get(Number(match.team1.id)) : null;
      const t2 = match.team2 && match.team2.id != null ? byId.get(Number(match.team2.id)) : null;
      if (!t1 || !t2) return;

      const score1 = Number(match.score1 || 0);
      const score2 = Number(match.score2 || 0);
      const winnerId = match.winner_team_id != null ? Number(match.winner_team_id) : null;
      const isComplete = String(match.status || '').toLowerCase() === 'completed' || winnerId !== null;
      if (!isComplete) return;

      countedMatches += 1;

      t1.played += 1;
      t2.played += 1;
      t1.pf += score1;
      t1.pa += score2;
      t2.pf += score2;
      t2.pa += score1;

      if (winnerId && winnerId === t1.id) {
        t1.wins += 1;
        t2.losses += 1;
        t1.points += 2;
      } else if (winnerId && winnerId === t2.id) {
        t2.wins += 1;
        t1.losses += 1;
        t2.points += 2;
      } else {
        t1.draws += 1;
        t2.draws += 1;
        t1.points += 1;
        t2.points += 1;
      }
    });

    rows.forEach((r) => {
      r.diff = r.pf - r.pa;
    });

    rows.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.diff !== a.diff) return b.diff - a.diff;
      if (b.pf !== a.pf) return b.pf - a.pf;
      return a.name.localeCompare(b.name);
    });

    return { rows, countedMatches };
  }

  function renderRoundRobinStandings() {
    if (!rrStandingsSection || !rrStandingsBody || !rrStandingsMeta) return;

    if (String(bracket?.tournament_type || '') !== 'round_robin') {
      rrStandingsSection.style.display = 'none';
      return;
    }

    rrStandingsSection.style.display = 'block';

    const standings = computeRoundRobinStandings();
    const rows = standings.rows || [];
    rrStandingsMeta.textContent = 'Based on completed matches: ' + Number(standings.countedMatches || 0);

    if (!rows.length) {
      rrStandingsBody.innerHTML = '<tr><td colspan="10">No standings available yet.</td></tr>';
      return;
    }

    const leaderPoints = Number(rows[0].points || 0);
    rrStandingsBody.innerHTML = rows.map((row, idx) => {
      const isLeading = row.points === leaderPoints;
      const diffLabel = row.diff > 0 ? ('+' + row.diff) : String(row.diff);
      return '<tr' + (isLeading ? ' class="rr-leading"' : '') + '>' +
        '<td class="rr-rank">' + (idx + 1) + '</td>' +
        '<td>' + esc(row.name) + '</td>' +
        '<td>' + row.played + '</td>' +
        '<td>' + row.wins + '</td>' +
        '<td>' + row.losses + '</td>' +
        '<td>' + row.draws + '</td>' +
        '<td>' + row.pf + '</td>' +
        '<td>' + row.pa + '</td>' +
        '<td>' + diffLabel + '</td>' +
        '<td class="rr-points">' + row.points + '</td>' +
      '</tr>';
    }).join('');
  }

  function renderDoubleEliminationBoard() {
    const CARD_HEIGHT = 86;
    const BASE_GAP    = 14;
    const UNIT        = CARD_HEIGHT + BASE_GAP;

    const allMatches = bracket.matches || [];
    if (!allMatches.length) {
      stageEl.innerHTML = '<div class="empty-note">No double elimination matches generated yet.</div>';
      return;
    }

    const upperMatches = allMatches.filter(m => m.bracket_stage === 'upper');
    const lowerMatches = allMatches.filter(m => m.bracket_stage === 'lower');
    const finalMatches = allMatches
      .filter(m => m.bracket_stage === 'final')
      .filter(m => String(m.label || '').toLowerCase() !== 'if necessary');

    function groupByRound(matches) {
      const map = {};
      matches.forEach(m => {
        const k = Number(m.round || 1);
        if (!map[k]) map[k] = [];
        map[k].push(m);
      });
      return map;
    }

    function buildMatchCardHtml(match) {
      const winnerSide = matchWinnerSide(match);
      return '<div class="match-card" data-match-id="' + match.id + '">' +
        '<div class="team-row' + (winnerSide === 1 ? ' winner' : '') + '">' +
          '<div class="seed-col">' + esc(teamSeed(match.team1)) + '</div>' +
          '<div class="team-name">' + esc(teamName(match.team1)) + '</div>' +
          '<div class="team-score">' + Number(match.score1 || 0) + '</div>' +
        '</div>' +
        '<div class="team-row' + (winnerSide === 2 ? ' winner' : '') + '">' +
          '<div class="seed-col">' + esc(teamSeed(match.team2)) + '</div>' +
          '<div class="team-name">' + esc(teamName(match.team2)) + '</div>' +
          '<div class="team-score">' + Number(match.score2 || 0) + '</div>' +
        '</div>' +
      '</div>';
    }

    // Build rounds HTML.
    // step = UNIT * (maxMatchCount / currentMatchCount) so that:
    //   - halving rounds keep proper arc connector spacing
    //   - same-count rounds stay vertically aligned (flat forward lines)
    function buildRoundsHtml(roundsMap, opts) {
      const rounds = Object.keys(roundsMap).map(Number).sort((a, b) => a - b);
      if (!rounds.length) return '';

      const maxMatchCount  = opts && opts.maxMatchCount ? opts.maxMatchCount : roundsMap[rounds[0]].length;
      const appendedColumn = !!(opts && opts.appendedColumn);

      return rounds.map((r, roundIndex) => {
        const roundMatches   = roundsMap[r] || [];
        const nextKey        = rounds[roundIndex + 1];
        const nextMatches    = nextKey != null ? roundsMap[nextKey] : null;
        const isLast         = roundIndex === rounds.length - 1;
        const isHalving      = nextMatches && nextMatches.length < roundMatches.length;
        // has-lines = forward line without arc (same count or last round but more cols follow)
        const hasForwardLine = !isHalving && (!isLast || appendedColumn);

        const step   = UNIT * (maxMatchCount / Math.max(1, roundMatches.length));
        const offset = (step - CARD_HEIGHT) / 2;

        let prevBottom = 0;
        const matchHtml = roundMatches.map((match, matchIndex) => {
          const y         = offset + (matchIndex * step);
          const marginTop = Math.max(0, Math.round(y - prevBottom));
          prevBottom      = y + CARD_HEIGHT;

          return '<div class="match-wrap" style="margin-top:' + marginTop + 'px;--pair-step:' + step + 'px;">' +
            buildMatchCardHtml(match) +
            (isHalving && (matchIndex % 2 === 0) ? '<span class="connector-out"></span>' : '') +
          '</div>';
        }).join('');

        const label    = roundMatches[0]?.label || ('Round ' + r);
        const cssClass = 'round' + (isHalving ? ' has-connectors' : (hasForwardLine ? ' has-lines' : ''));
        return '<div class="' + cssClass + '">' +
          '<h3 class="round-title">' + esc(label) + '</h3>' +
          '<div class="round-matches">' + matchHtml + '</div>' +
        '</div>';
      }).join('');
    }

    // Grand Finals column — placed after the winners rounds, vertically aligned to W-Final.
    function buildFinalsColumn(matches, topOffset) {
      if (!matches.length) return '';
      const sorted = matches.slice().sort((a, b) => Number(a.id) - Number(b.id));
      let first = true;
      const cardsHtml = sorted.map(match => {
        const mt = first ? topOffset : BASE_GAP;
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

    // Compute winners bracket parameters
    const upperRoundsMap = groupByRound(upperMatches);
    const upperRoundNos  = Object.keys(upperRoundsMap).map(Number).sort((a, b) => a - b);
    const maxUpperCount  = upperRoundNos.length ? upperRoundsMap[upperRoundNos[0]].length : 1;
    // Compute top-offset for Grand Finals column to align with W-Final card
    const wFinalCount  = upperRoundNos.length ? upperRoundsMap[upperRoundNos[upperRoundNos.length - 1]].length : 1;
    const wFinalStep   = UNIT * (maxUpperCount / Math.max(1, wFinalCount));
    const wFinalOffset = Math.round((wFinalStep - CARD_HEIGHT) / 2);

    const lowerRoundsMap = groupByRound(lowerMatches);
    const lowerRoundNos  = Object.keys(lowerRoundsMap).map(Number).sort((a, b) => a - b);
    const maxLowerCount  = lowerRoundNos.length ? lowerRoundsMap[lowerRoundNos[0]].length : 1;

    const winnerHtml = buildRoundsHtml(upperRoundsMap, { maxMatchCount: maxUpperCount, appendedColumn: finalMatches.length > 0 });
    const finalsHtml = buildFinalsColumn(finalMatches, wFinalOffset);
    const loserHtml  = buildRoundsHtml(lowerRoundsMap, { maxMatchCount: maxLowerCount });

    stageEl.innerHTML =
      '<div class="de-section">' +
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

  function renderBoard() {
    autoAdvanceByes();
    if (bracket.tournament_type === 'round_robin') {
      renderRoundRobinBoard();
    } else if (bracket.tournament_type === 'double_elimination') {
      renderDoubleEliminationBoard();
    } else {
      renderEliminationBoard();
    }
    renderRoundRobinStandings();
  }

  function openMatchModal(matchId) {
    selectedMatchId = Number(matchId);
    const match = findMatch(selectedMatchId);
    if (!match) return;

    openTeamSelection(match);

    document.getElementById('matchDate').value        = match.date        || '';
    document.getElementById('matchTime').value        = match.time        || '';
    document.getElementById('matchLocation').value    = match.location    || '';
    document.getElementById('matchDescription').value = match.description || '';

    const winnerSide = matchWinnerSide(match);
    scoreTableEl.innerHTML =
      '<div class="score-head">' +
        '<div class="score-cell center">#</div>' +
        '<div class="score-cell">Team</div>' +
        '<div class="score-cell center">Winner</div>' +
        '<div class="score-cell center">Score</div>' +
      '</div>' +
      '<div class="score-row">' +
        '<div class="score-cell center">' + esc(teamSeed(match.team1)) + '</div>' +
        '<div class="score-cell">' + esc(teamName(match.team1)) + '</div>' +
        '<div class="score-cell center"><input type="radio" name="winnerPick" value="1" ' + (winnerSide === 1 ? 'checked' : '') + ' /></div>' +
        '<div class="score-cell center"><input class="score-input" id="scoreInput1" type="number" min="0" value="' + Number(match.score1 || 0) + '" /></div>' +
      '</div>' +
      '<div class="score-row">' +
        '<div class="score-cell center">' + esc(teamSeed(match.team2)) + '</div>' +
        '<div class="score-cell">' + esc(teamName(match.team2)) + '</div>' +
        '<div class="score-cell center"><input type="radio" name="winnerPick" value="2" ' + (winnerSide === 2 ? 'checked' : '') + ' /></div>' +
        '<div class="score-cell center"><input class="score-input" id="scoreInput2" type="number" min="0" value="' + Number(match.score2 || 0) + '" /></div>' +
      '</div>';

    setActiveTab(defaultTabForMatch(match));

    modalEl.classList.add('open');
  }

  async function saveMatchTeams() {
    const match = findMatch(selectedMatchId);
    if (!match) return;

    const team1Val = document.getElementById('matchTeam1Select').value;
    const team2Val = document.getElementById('matchTeam2Select').value;

    const team1IsBye = !team1Val || team1Val === '__BYE__';
    const team2IsBye = !team2Val || team2Val === '__BYE__';

    if (team1IsBye && team2IsBye) {
      alert('Please select at least one team.');
      return;
    }

    if (!team1IsBye && !team2IsBye && Number(team1Val) === Number(team2Val)) {
      alert('Please select two different teams.');
      return;
    }

    const team1 = team1IsBye ? null : ((bracket.teams || []).find(t => Number(t.id) === Number(team1Val)) || null);
    const team2 = team2IsBye ? null : ((bracket.teams || []).find(t => Number(t.id) === Number(team2Val)) || null);

    match.team1 = team1;
    match.team2 = team2;
    resetMatchResult(match);
    clearDownstreamFromMatch(match);

    saveBracket();
    await apiUpdateMatch({
      id:                     dbIdForMatch(match),
      team1_registration_id:  team1 ? Number(team1.id) : null,
      team2_registration_id:  team2 ? Number(team2.id) : null,
      winner_registration_id: null,
      team1_score:            0,
      team2_score:            0,
      match_status:           'Pending'
    });
    renderBoard();
    openMatchModal(match.id);
  }

  function closeMatchModal() {
    selectedMatchId = null;
    modalEl.classList.remove('open');
  }

  async function saveMatchInfo() {
    const match = findMatch(selectedMatchId);
    if (!match) return;
    match.date        = document.getElementById('matchDate').value        || '';
    match.time        = document.getElementById('matchTime').value        || '';
    match.location    = document.getElementById('matchLocation').value    || '';
    match.description = document.getElementById('matchDescription').value || '';
    saveBracket();
    await apiUpdateMatch({
      id:                dbIdForMatch(match),
      schedule_date:     match.date        || null,
      schedule_time:     match.time        || null,
      location:          match.location    || null,
      match_description: match.description || null
    });
    if (typeof adminToast === 'function') adminToast('Match info saved.');
    else alert('Match info saved.');
    openMatchModal(match.id);
    setActiveTab('scores');
  }

  async function clearMatchInfo() {
    const match = findMatch(selectedMatchId);
    if (!match) return;
    match.date = ''; match.time = ''; match.location = ''; match.description = '';
    saveBracket();
    await apiUpdateMatch({
      id:                dbIdForMatch(match),
      schedule_date:     null,
      schedule_time:     null,
      location:          null,
      match_description: null
    });
    openMatchModal(selectedMatchId);
  }

  async function submitScores() {
    const match = findMatch(selectedMatchId);
    if (!match) return;

    const previousWinnerId = match.winner_team_id ? Number(match.winner_team_id) : null;

    const score1      = Number(document.getElementById('scoreInput1').value || 0);
    const score2      = Number(document.getElementById('scoreInput2').value || 0);
    const winnerPick  = document.querySelector('input[name="winnerPick"]:checked')?.value || '';

    if (!match.team1 && !match.team2) { alert('No teams in this match yet.'); return; }

    let winner = null;
    if (winnerPick === '1' && match.team1)       winner = match.team1;
    else if (winnerPick === '2' && match.team2)  winner = match.team2;
    else {
      if (score1 === score2) { alert('Scores are tied. Please choose a winner.'); return; }
      winner = score1 > score2 ? match.team1 : match.team2;
    }
    if (!winner) { alert('Unable to determine winner.'); return; }

    match.score1          = score1;
    match.score2          = score2;
    match.winner_team_id  = Number(winner.id);
    match.status          = 'Completed';

    // If winner changed, clear all dependent matches before re-propagating.
    if (previousWinnerId !== null && previousWinnerId !== Number(winner.id)) {
      clearDownstreamFromMatch(match);
    }

    assignWinnerToNext(match, winner);
    // Route loser if this match has a loser path (double elimination or 3rd-place feed)
    const loser = (winner === match.team1) ? match.team2 : match.team1;
    if (loser && match.loser_next_match_id) assignLoserToNext(match, loser);
    saveBracket();
    await apiUpdateMatch({
      id:                     dbIdForMatch(match),
      team1_score:            score1,
      team2_score:            score2,
      winner_registration_id: Number(winner.id),
      match_status:           'Completed'
    });
    renderBoard();
    openMatchModal(match.id);
    setActiveTab('scores');
  }

  async function resetScores() {
    const match = findMatch(selectedMatchId);
    if (!match) return;
    match.score1          = 0;
    match.score2          = 0;
    match.winner_team_id  = null;
    match.status          = 'Pending';
    clearDownstreamFromMatch(match);
    saveBracket();
    await apiUpdateMatch({
      id:                     dbIdForMatch(match),
      team1_score:            0,
      team2_score:            0,
      winner_registration_id: null,
      match_status:           'Pending'
    });
    renderBoard();
    openMatchModal(match.id);
  }

  function setActiveTab(name) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === name);
    });
    document.getElementById('tab-teams').classList.toggle('active',  name === 'teams');
    document.getElementById('tab-info').classList.toggle('active',   name === 'info');
    document.getElementById('tab-scores').classList.toggle('active', name === 'scores');
  }

  // ── Bootstrap: load bracket then wire events ─────────────────────────
  (async function init() {
    loadTheme();
    stageEl.innerHTML = '<div class="empty-note">Loading bracket&hellip;</div>';
    bracket = await loadBracket();
    if (!bracket) {
      stageEl.innerHTML = '<div class="empty-note">No bracket data found. Please create a bracket first from Events.</div>';
      return;
    }

    titleEl.textContent = bracket.event_title ? (bracket.event_title + ' Bracket') : 'Event Bracket';
    subEl.textContent   = 'Click any match card to select teams, edit schedule/location, and report scores.';
    chipType.textContent     = 'Type: '            + String(bracket.tournament_type || '-').replace(/_/g, ' ');
    chipCategory.textContent = 'Category: '        + (bracket.category || '-');
    chipThird.textContent    = '3rd Place Match: ' + (bracket.third_place_match ? 'Yes' : 'No');
    chipTeams.textContent    = 'Teams: '           + ((bracket.teams || []).length || 0);

    if (bracket.ui_theme && (bracket.ui_theme === 'light' || bracket.ui_theme === 'dark')) {
      localStorage.setItem(themeStorageKey, bracket.ui_theme);
      applyTheme(bracket.ui_theme);
    }

    renderBoard();

    stageEl.addEventListener('click', function (e) {
      const card = e.target.closest('[data-match-id]');
      if (!card) return;
      openMatchModal(card.getAttribute('data-match-id'));
    });

    document.getElementById('closeMatchModal').addEventListener('click', closeMatchModal);
    modalEl.addEventListener('click', function (e) {
      if (e.target === modalEl) closeMatchModal();
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        setActiveTab(btn.getAttribute('data-tab'));
      });
    });

    document.getElementById('saveMatchInfoBtn').addEventListener('click',  saveMatchInfo);
    document.getElementById('clearMatchInfoBtn').addEventListener('click', clearMatchInfo);
    document.getElementById('saveMatchTeamsBtn').addEventListener('click', saveMatchTeams);
    document.getElementById('submitScoresBtn').addEventListener('click',   submitScores);
    document.getElementById('resetScoresBtn').addEventListener('click',    resetScores);
    if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);
  })(); // end init
})();
