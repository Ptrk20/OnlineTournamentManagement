(function () {
  const params    = new URLSearchParams(window.location.search);
  const eventId   = Number(params.get('event_id') || 0);
  const eventName = params.get('event') || '';
  const gender    = params.get('gender') || 'Mens';

  const eventTag      = document.getElementById('selectedEventTag');
  const genderTag     = document.getElementById('selectedGenderTag');
  const bracketState  = document.getElementById('bracketState');
  const seedGrid      = document.getElementById('seedGrid');
  const pairingsWrap  = document.getElementById('pairingsWrap');
  const pairingsList  = document.getElementById('pairingsList');

  eventTag.textContent  = 'Event: '    + (eventName || 'All');
  genderTag.textContent = 'Category: ' + gender;

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#39;');
  }

  function renderPairings(teams) {
    pairingsList.innerHTML = '';
    const pairings = [];
    for (let i = 0; i < teams.length; i += 2) {
      const a = teams[i];
      const b = teams[i + 1] || null;
      pairings.push({ a, b });
    }

    pairings.forEach((p, idx) => {
      const left  = p.a ? escapeHtml(p.a.team_name || p.a.representative_name || 'Team ' + (idx * 2 + 1)) : 'TBD';
      const right = p.b ? escapeHtml(p.b.team_name || p.b.representative_name || 'Team ' + (idx * 2 + 2)) : 'BYE';
      pairingsList.innerHTML += '<div class="pairing-item">Match ' + (idx + 1) + ': <strong>' + left + '</strong> vs <strong>' + right + '</strong></div>';
    });

    pairingsWrap.style.display = pairings.length ? 'block' : 'none';
  }

  function renderSeeds(teams) {
    seedGrid.innerHTML = '';
    teams.forEach((team, idx) => {
      const label    = idx + 1;
      const teamName = escapeHtml(team.team_name || team.representative_name || 'Unnamed Team');
      const sport    = escapeHtml(team.sport_name || '-');
      const rep      = escapeHtml(team.representative_name || '-');
      seedGrid.innerHTML +=
        '<div class="seed-card">' +
          '<div><span class="seed-label">' + label + '</span><span class="seed-name">' + teamName + '</span></div>' +
          '<div class="seed-meta">Sport: ' + sport + '</div>' +
          '<div class="seed-meta">Representative: ' + rep + '</div>' +
        '</div>';
    });
  }

  async function loadBracketTeams() {
    if (!eventId) {
      bracketState.textContent = 'No event selected. Please open bracketing from the Events module action button.';
      return;
    }

    try {
      const res  = await fetch('../api/registrations/read.php');
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to load registrations.');

      const rows         = Array.isArray(json.data) ? json.data : [];
      const approvedTeams = rows.filter(r =>
        Number(r.event_id) === eventId && String(r.status).toLowerCase() === 'approved'
      );

      if (!approvedTeams.length) {
        bracketState.textContent = 'No approved teams yet for this event.';
        return;
      }

      bracketState.textContent    = 'Approved teams seeded: ' + approvedTeams.length;
      seedGrid.style.display      = 'grid';
      renderSeeds(approvedTeams);
      renderPairings(approvedTeams);
    } catch (error) {
      bracketState.textContent = error.message || 'Unable to load bracket teams.';
    }
  }

  loadBracketTeams();
})();
