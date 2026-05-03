<?php
/**
 * Read Bracket API
 * GET /api/brackets/read.php?event_id=1    — bracket + all matches for an event
 * GET /api/brackets/read.php?bracket_id=1  — same, by bracket primary key
 *
 * Returns the bracket header and a full matches array shaped to match the
 * client-side payload so the frontend can use it directly.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

require_once '../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    die(json_encode(['success' => false, 'message' => 'Method not allowed. Use GET.']));
}

function brackets_read_error(int $code, string $msg): void {
    http_response_code($code);
    die(json_encode(['success' => false, 'message' => $msg]));
}

// ── Resolve which bracket to load ─────────────────────────────────────────
if (!empty($_GET['event_id'])) {
    $eventId = intval($_GET['event_id']);
    if ($eventId <= 0) brackets_read_error(400, 'Invalid event_id.');

    $stmt = $conn->prepare(
        'SELECT id, event_id, bracket_code, tournament_type, round_robin_format,
                has_third_place_match, participant_count, status, created_by, created_at
           FROM tournament_brackets
          WHERE event_id = ?
          ORDER BY id DESC LIMIT 1'
    );
    $stmt->bind_param('i', $eventId);
} elseif (!empty($_GET['bracket_id'])) {
    $bracketId = intval($_GET['bracket_id']);
    if ($bracketId <= 0) brackets_read_error(400, 'Invalid bracket_id.');

    $stmt = $conn->prepare(
        'SELECT id, event_id, bracket_code, tournament_type, round_robin_format,
                has_third_place_match, participant_count, status, created_by, created_at
           FROM tournament_brackets
          WHERE id = ?
          LIMIT 1'
    );
    $stmt->bind_param('i', $bracketId);
} else {
    brackets_read_error(400, 'Provide event_id or bracket_id.');
}

$stmt->execute();
$bracket = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$bracket) {
    echo json_encode(['success' => true, 'data' => null]);
    $conn->close();
    exit;
}

$bracketId = (int)$bracket['id'];

// ── Load event metadata for UI labels ─────────────────────────────────────
$eventMeta = [
    'title'    => '',
    'category' => ''
];
$evId = (int)$bracket['event_id'];
$evStmt = $conn->prepare('SELECT title, category FROM events WHERE id = ? LIMIT 1');
$evStmt->bind_param('i', $evId);
$evStmt->execute();
$evRow = $evStmt->get_result()->fetch_assoc();
$evStmt->close();
if ($evRow) {
    $eventMeta['title'] = (string)($evRow['title'] ?? '');
    $eventMeta['category'] = (string)($evRow['category'] ?? '');
}

// ── Load matches ──────────────────────────────────────────────────────────
$hasLoserNextColumns = false;
$colChk = $conn->query("SHOW COLUMNS FROM tournament_matches LIKE 'loser_next_match_id'");
if ($colChk && $colChk->num_rows > 0) $hasLoserNextColumns = true;
if ($colChk instanceof mysqli_result) $colChk->free();

$matchSql = $hasLoserNextColumns
        ? 'SELECT
                 tm.id, tm.match_no, tm.bracket_stage, tm.round_no AS round,
                 tm.round_label AS label,
                 tm.team1_registration_id, tm.team2_registration_id,
                 t1.team_name AS team1_name, t2.team_name AS team2_name,
                 tm.team1_score AS score1, tm.team2_score AS score2,
                 tm.winner_registration_id AS winner_team_id,
                 tm.next_match_id, tm.next_match_slot AS next_slot,
                 tm.loser_next_match_id, tm.loser_next_match_slot AS loser_next_slot,
                 tm.schedule_date AS `date`, tm.schedule_time AS `time`,
                 tm.location, tm.match_description AS description,
                 tm.match_status AS status
             FROM tournament_matches tm
             LEFT JOIN team_registrations t1 ON t1.id = tm.team1_registration_id
             LEFT JOIN team_registrations t2 ON t2.id = tm.team2_registration_id
             WHERE tm.bracket_id = ?
             ORDER BY tm.round_no, tm.match_no'
        : 'SELECT
                 tm.id, tm.match_no, tm.bracket_stage, tm.round_no AS round,
                 tm.round_label AS label,
                 tm.team1_registration_id, tm.team2_registration_id,
                 t1.team_name AS team1_name, t2.team_name AS team2_name,
                 tm.team1_score AS score1, tm.team2_score AS score2,
                 tm.winner_registration_id AS winner_team_id,
                 tm.next_match_id, tm.next_match_slot AS next_slot,
                 NULL AS loser_next_match_id, NULL AS loser_next_slot,
                 tm.schedule_date AS `date`, tm.schedule_time AS `time`,
                 tm.location, tm.match_description AS description,
                 tm.match_status AS status
             FROM tournament_matches tm
             LEFT JOIN team_registrations t1 ON t1.id = tm.team1_registration_id
             LEFT JOIN team_registrations t2 ON t2.id = tm.team2_registration_id
             WHERE tm.bracket_id = ?
             ORDER BY tm.round_no, tm.match_no';

$mStmt = $conn->prepare($matchSql);
if (!$mStmt) brackets_read_error(500, 'Failed to prepare matches query: ' . $conn->error);
$mStmt->bind_param('i', $bracketId);
$mStmt->execute();
$rows = $mStmt->get_result()->fetch_all(MYSQLI_ASSOC);
$mStmt->close();

// ── Load participants (teams list for dropdowns) ───────────────────────────
// Collect all registration IDs referenced in matches
$regIds = [];
foreach ($rows as $r) {
    if ($r['team1_registration_id']) $regIds[(int)$r['team1_registration_id']] = true;
    if ($r['team2_registration_id']) $regIds[(int)$r['team2_registration_id']] = true;
}
// Also load all approved registrations for this event so the team picker has a full list
$eventId = (int)$bracket['event_id'];
$apStmt = $conn->prepare(
    'SELECT id, team_name FROM team_registrations WHERE event_id = ? AND status = ?'
);
$approved = 'Approved';
$apStmt->bind_param('is', $eventId, $approved);
$apStmt->execute();
$apRows = $apStmt->get_result()->fetch_all(MYSQLI_ASSOC);
$apStmt->close();

$teamsArr = array_map(fn($t) => ['id' => (int)$t['id'], 'name' => $t['team_name']], $apRows);

// ── Shape matches into client-side format ─────────────────────────────────
$matchesArr = array_map(function ($r) {
    $t1 = $r['team1_registration_id']
        ? ['id' => (int)$r['team1_registration_id'], 'name' => $r['team1_name'] ?? '']
        : null;
    $t2 = $r['team2_registration_id']
        ? ['id' => (int)$r['team2_registration_id'], 'name' => $r['team2_name'] ?? '']
        : null;

    return [
        'id'              => (int)$r['id'],
        'round'           => (int)$r['round'],
        'label'           => $r['label'] ?? 'Round ' . $r['round'],
        'bracket_stage'   => $r['bracket_stage'] ?? 'main',
        'team1'           => $t1,
        'team2'           => $t2,
        'score1'          => (int)$r['score1'],
        'score2'          => (int)$r['score2'],
        'winner_team_id'  => $r['winner_team_id'] ? (int)$r['winner_team_id'] : null,
        'next_match_id'   => $r['next_match_id']  ? (int)$r['next_match_id']  : null,
        'next_slot'       => $r['next_slot'] ?? null,
        'loser_next_match_id' => $r['loser_next_match_id'] ? (int)$r['loser_next_match_id'] : null,
        'loser_next_slot'    => $r['loser_next_slot'] ?? null,
        'date'            => $r['date']        ?? '',
        'time'            => $r['time']        ?? '',
        'location'        => $r['location']    ?? '',
        'description'     => $r['description'] ?? '',
        'status'          => $r['status']      ?? 'Pending',
    ];
}, $rows);

$conn->close();

echo json_encode([
    'success' => true,
    'data'    => [
        'bracket_id'          => $bracketId,
        'event_id'            => (int)$bracket['event_id'],
        'event_title'         => $eventMeta['title'],
        'category'            => $eventMeta['category'],
        'bracket_code'        => $bracket['bracket_code'],
        'tournament_type'     => $bracket['tournament_type'],
        'has_third_place_match' => (bool)$bracket['has_third_place_match'],
        'participant_count'   => (int)$bracket['participant_count'],
        'status'              => $bracket['status'],
        'created_at'          => $bracket['created_at'],
        'teams'               => $teamsArr,
        'matches'             => $matchesArr,
    ],
]);
