<?php
/**
 * Save Bracket API
 * POST /api/brackets/save.php
 * Content-Type: application/json
 *
 * Inserts or replaces the tournament bracket and all its matches for an event.
 * Required body fields:
 *   event_id, tournament_type, third_place_match, teams (array), matches (array)
 * Optional: category, created_by
 *
 * Behaviour:
 *   - If a bracket row already exists for this event, it is deleted first (cascade
 *     deletes all tournament_matches rows) then re-inserted, so callers may call
 *     this endpoint both to create and to regenerate.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once '../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['success' => false, 'message' => 'Method not allowed. Use POST.']));
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Invalid JSON input.']));
}

function brackets_error(int $code, string $msg): void {
    http_response_code($code);
    die(json_encode(['success' => false, 'message' => $msg]));
}

// ── Validate required fields ───────────────────────────────────────────────
$eventId = intval($input['event_id'] ?? 0);
if ($eventId <= 0) brackets_error(400, 'event_id is required.');

$allowedTypes = ['single_elimination', 'double_elimination', 'round_robin'];
$tournamentType = trim((string)($input['tournament_type'] ?? 'single_elimination'));
if (!in_array($tournamentType, $allowedTypes, true)) brackets_error(400, 'Invalid tournament_type.');

$hasThirdPlace = empty($input['third_place_match']) ? 0 : 1;
$category      = trim((string)($input['category'] ?? ''));
$createdBy     = isset($input['created_by']) ? intval($input['created_by']) : null;
if ($createdBy !== null && $createdBy <= 0) $createdBy = null;
$uiThemeInput = strtolower(trim((string)($input['ui_theme'] ?? '')));
$uiTheme = in_array($uiThemeInput, ['dark', 'light'], true) ? $uiThemeInput : null;

$teams   = $input['teams']   ?? [];
$matches = $input['matches'] ?? [];
if (!is_array($teams))   brackets_error(400, 'teams must be an array.');
if (!is_array($matches)) brackets_error(400, 'matches must be an array.');

// ── Check event exists ─────────────────────────────────────────────────────
$chk = $conn->prepare('SELECT id FROM events WHERE id = ? LIMIT 1');
$chk->bind_param('i', $eventId);
$chk->execute();
if ($chk->get_result()->num_rows === 0) brackets_error(404, 'Event not found.');
$chk->close();

$hasUiThemeColumn = false;
$colChk = $conn->query("SHOW COLUMNS FROM tournament_brackets LIKE 'ui_theme'");
if ($colChk && $colChk->num_rows > 0) $hasUiThemeColumn = true;
if ($colChk instanceof mysqli_result) $colChk->free();

// Preserve previous theme on regenerate if client doesn't provide one.
if ($hasUiThemeColumn && $uiTheme === null) {
    $thStmt = $conn->prepare('SELECT ui_theme FROM tournament_brackets WHERE event_id = ? ORDER BY id DESC LIMIT 1');
    $thStmt->bind_param('i', $eventId);
    $thStmt->execute();
    $thRow = $thStmt->get_result()->fetch_assoc();
    $thStmt->close();
    $uiTheme = in_array(($thRow['ui_theme'] ?? ''), ['dark', 'light'], true) ? $thRow['ui_theme'] : 'dark';
}

// ── Delete existing bracket for this event (cascade deletes matches) ───────
$del = $conn->prepare('DELETE FROM tournament_brackets WHERE event_id = ?');
$del->bind_param('i', $eventId);
$del->execute();
$del->close();

// ── Insert bracket header ──────────────────────────────────────────────────
$bracketCode      = 'bk' . time() . mt_rand(100, 999);
$participantCount = count($teams);
$rrFormat         = 'once';
$bkStatus         = 'Generated';

// Build INSERT dynamically so created_by NULL is handled cleanly
if ($createdBy !== null && $hasUiThemeColumn) {
    $ins = $conn->prepare(
        'INSERT INTO tournament_brackets
           (event_id, bracket_code, tournament_type, round_robin_format,
            has_third_place_match, participant_count, status, ui_theme, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    // Types: i  s  s  s  i  i  s  s  i   — 9 params
    $ins->bind_param('isssiissi',
        $eventId, $bracketCode, $tournamentType, $rrFormat,
        $hasThirdPlace, $participantCount, $bkStatus, $uiTheme, $createdBy
    );
} elseif ($createdBy !== null) {
    $ins = $conn->prepare(
        'INSERT INTO tournament_brackets
           (event_id, bracket_code, tournament_type, round_robin_format,
            has_third_place_match, participant_count, status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    // Types: i  s  s  s  i  i  s  i   — 8 params
    $ins->bind_param('isssiisi',
        $eventId, $bracketCode, $tournamentType, $rrFormat,
        $hasThirdPlace, $participantCount, $bkStatus, $createdBy
    );
} elseif ($hasUiThemeColumn) {
    $ins = $conn->prepare(
        'INSERT INTO tournament_brackets
           (event_id, bracket_code, tournament_type, round_robin_format,
            has_third_place_match, participant_count, status, ui_theme)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    // Types: i  s  s  s  i  i  s  s   — 8 params
    $ins->bind_param('isssiiss',
        $eventId, $bracketCode, $tournamentType, $rrFormat,
        $hasThirdPlace, $participantCount, $bkStatus, $uiTheme
    );
} else {
    $ins = $conn->prepare(
        'INSERT INTO tournament_brackets
           (event_id, bracket_code, tournament_type, round_robin_format,
            has_third_place_match, participant_count, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    // Types: i  s  s  s  i  i  s   — 7 params
    $ins->bind_param('isssiis',
        $eventId, $bracketCode, $tournamentType, $rrFormat,
        $hasThirdPlace, $participantCount, $bkStatus
    );
}
if (!$ins->execute()) brackets_error(500, 'Failed to save bracket: ' . $ins->error);
$bracketId = (int)$conn->insert_id;
$ins->close();

// ── Build registration_id lookup (team id → registration id) ──────────────
// The teams array sent from the JS has {id: registration_id, name: ...}
// so team.id IS the team_registrations.id.

// ── Insert matches ─────────────────────────────────────────────────────────
// First pass: insert all matches and collect js_id → db_id mapping
$matchIdMap = []; // js match id → new db id

$stmtMatch = $conn->prepare(
    'INSERT INTO tournament_matches
       (bracket_id, match_no, bracket_stage, round_no, round_label,
        team1_registration_id, team2_registration_id,
        team1_score, team2_score, winner_registration_id,
        schedule_date, schedule_time, location, match_description,
        match_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);

$allowedStages = ['main', 'upper', 'lower', 'third_place', 'final', 'round_robin'];
$allowedStatuses = ['Pending', 'Scheduled', 'Ongoing', 'Completed'];

foreach ($matches as $idx => $m) {
    $matchNo    = $idx + 1;
    $stage      = in_array($m['bracket_stage'] ?? '', $allowedStages, true) ? $m['bracket_stage'] : ($tournamentType === 'round_robin' ? 'round_robin' : 'main');
    $roundNo    = intval($m['round'] ?? 1);
    $roundLabel = substr(trim((string)($m['label'] ?? 'Round ' . $roundNo)), 0, 80);

    $team1RegId  = ($m['team1'] && isset($m['team1']['id'])) ? intval($m['team1']['id']) : null;
    $team2RegId  = ($m['team2'] && isset($m['team2']['id'])) ? intval($m['team2']['id']) : null;
    $score1      = intval($m['score1'] ?? 0);
    $score2      = intval($m['score2'] ?? 0);
    $winnerRegId = isset($m['winner_team_id']) && $m['winner_team_id'] ? intval($m['winner_team_id']) : null;

    $schedDate   = !empty($m['date'])        ? $m['date']        : null;
    $schedTime   = !empty($m['time'])        ? $m['time']        : null;
    $location    = !empty($m['location'])    ? substr(trim($m['location']), 0, 180) : null;
    $description = !empty($m['description']) ? trim($m['description']) : null;
    $matchStatus = in_array($m['status'] ?? '', $allowedStatuses, true) ? $m['status'] : 'Pending';

    // 15 params — types: i i s i s  i i  i i i  s s s s  s
    $stmtMatch->bind_param(
        'iisisiiiiisssss',
        $bracketId, $matchNo, $stage, $roundNo, $roundLabel,
        $team1RegId, $team2RegId,
        $score1, $score2, $winnerRegId,
        $schedDate, $schedTime, $location, $description,
        $matchStatus
    );

    if (!$stmtMatch->execute()) {
        $stmtMatch->close();
        brackets_error(500, 'Failed to save match #' . $matchNo . ': ' . $stmtMatch->error);
    }

    $matchIdMap[intval($m['id'])] = (int)$conn->insert_id;
}
$stmtMatch->close();

// ── Second pass: update next_match_id / next_match_slot and loser_next ───────
$hasLoserNextColumns = false;
$colChk = $conn->query("SHOW COLUMNS FROM tournament_matches LIKE 'loser_next_match_id'");
if ($colChk && $colChk->num_rows > 0) $hasLoserNextColumns = true;
if ($colChk instanceof mysqli_result) $colChk->free();

$stmtNext = $hasLoserNextColumns
    ? $conn->prepare(
        'UPDATE tournament_matches SET next_match_id = ?, next_match_slot = ?,
         loser_next_match_id = ?, loser_next_match_slot = ? WHERE id = ?'
    )
    : $conn->prepare(
        'UPDATE tournament_matches SET next_match_id = ?, next_match_slot = ? WHERE id = ?'
    );
if (!$stmtNext) brackets_error(500, 'Failed to prepare bracket linking query: ' . $conn->error);
foreach ($matches as $idx => $m) {
    $jsId = intval($m['id']);
    $dbId = $matchIdMap[$jsId] ?? null;
    if (!$dbId) continue;

    $nextJsId = intval($m['next_match_id'] ?? 0);
    $nextDbId = ($nextJsId && isset($matchIdMap[$nextJsId])) ? $matchIdMap[$nextJsId] : null;
    $nextSlot = in_array($m['next_slot'] ?? '', ['team1', 'team2'], true) ? $m['next_slot'] : null;

    $loserJsId = intval($m['loser_next_match_id'] ?? 0);
    $loserDbId = ($loserJsId && isset($matchIdMap[$loserJsId])) ? $matchIdMap[$loserJsId] : null;
    $loserSlot = in_array($m['loser_next_slot'] ?? '', ['team1', 'team2'], true) ? $m['loser_next_slot'] : null;

    if ($hasLoserNextColumns) {
        if ($nextDbId || $loserDbId) {
            $stmtNext->bind_param('isisi', $nextDbId, $nextSlot, $loserDbId, $loserSlot, $dbId);
            if (!$stmtNext->execute()) {
                $stmtNext->close();
                brackets_error(500, 'Failed to link bracket matches: ' . $stmtNext->error);
            }
        }
    } else {
        if ($nextDbId) {
            $stmtNext->bind_param('isi', $nextDbId, $nextSlot, $dbId);
            if (!$stmtNext->execute()) {
                $stmtNext->close();
                brackets_error(500, 'Failed to link bracket matches: ' . $stmtNext->error);
            }
        }
    }
}
$stmtNext->close();

$conn->close();

echo json_encode([
    'success'    => true,
    'message'    => 'Bracket saved successfully.',
    'bracket_id' => $bracketId,
    'id_map'     => $matchIdMap,  // js match id → db match id
]);
