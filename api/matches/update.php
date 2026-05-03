<?php
/**
 * Update Match API
 * POST /api/matches/update.php
 * Content-Type: application/json
 *
 * Updates a single tournament match.  Caller may send any combination of fields.
 * Always required: id (tournament_matches.id)
 *
 * Supported writable fields:
 *   team1_registration_id, team2_registration_id,
 *   team1_score, team2_score,
 *   winner_registration_id, match_status,
 *   schedule_date, schedule_time, location, match_description
 *
 * When a winner is recorded this endpoint also propagates the winner to the
 * next_match_id row's appropriate slot (team1 / team2), mirroring the
 * client-side assignWinnerToNext logic.
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

function matches_error(int $code, string $msg): void {
    http_response_code($code);
    die(json_encode(['success' => false, 'message' => $msg]));
}

// ── Require match id ──────────────────────────────────────────────────────
$matchId = intval($input['id'] ?? 0);
if ($matchId <= 0) matches_error(400, 'Match id is required.');

// ── Load current match ────────────────────────────────────────────────────
$cur = $conn->prepare(
    'SELECT id, bracket_id, next_match_id, next_match_slot,
            team1_registration_id, team2_registration_id,
            winner_registration_id, match_status
       FROM tournament_matches WHERE id = ? LIMIT 1'
);
$cur->bind_param('i', $matchId);
$cur->execute();
$match = $cur->get_result()->fetch_assoc();
$cur->close();
if (!$match) matches_error(404, 'Match not found.');

// ── Build SET clause from provided fields ─────────────────────────────────
$setClauses = [];
$params     = [];
$types      = '';

if (array_key_exists('team1_registration_id', $input)) {
    $v = $input['team1_registration_id'] !== null ? intval($input['team1_registration_id']) : null;
    $setClauses[] = 'team1_registration_id = ?';
    $params[] = $v;
    $types   .= 'i';
}
if (array_key_exists('team2_registration_id', $input)) {
    $v = $input['team2_registration_id'] !== null ? intval($input['team2_registration_id']) : null;
    $setClauses[] = 'team2_registration_id = ?';
    $params[] = $v;
    $types   .= 'i';
}
if (array_key_exists('team1_score', $input)) {
    $setClauses[] = 'team1_score = ?';
    $params[] = intval($input['team1_score']);
    $types   .= 'i';
}
if (array_key_exists('team2_score', $input)) {
    $setClauses[] = 'team2_score = ?';
    $params[] = intval($input['team2_score']);
    $types   .= 'i';
}
if (array_key_exists('winner_registration_id', $input)) {
    $v = $input['winner_registration_id'] !== null ? intval($input['winner_registration_id']) : null;
    $setClauses[] = 'winner_registration_id = ?';
    $params[] = $v;
    $types   .= 'i';
}
$allowedStatuses = ['Pending', 'Scheduled', 'Ongoing', 'Completed'];
if (array_key_exists('match_status', $input)) {
    $v = in_array($input['match_status'], $allowedStatuses, true) ? $input['match_status'] : 'Pending';
    $setClauses[] = 'match_status = ?';
    $params[] = $v;
    $types   .= 's';
}
if (array_key_exists('schedule_date', $input)) {
    $v = !empty($input['schedule_date']) ? $input['schedule_date'] : null;
    $setClauses[] = 'schedule_date = ?';
    $params[] = $v;
    $types   .= 's';
}
if (array_key_exists('schedule_time', $input)) {
    $v = !empty($input['schedule_time']) ? $input['schedule_time'] : null;
    $setClauses[] = 'schedule_time = ?';
    $params[] = $v;
    $types   .= 's';
}
if (array_key_exists('location', $input)) {
    $v = !empty($input['location']) ? substr(trim($input['location']), 0, 180) : null;
    $setClauses[] = 'location = ?';
    $params[] = $v;
    $types   .= 's';
}
if (array_key_exists('match_description', $input)) {
    $v = !empty($input['match_description']) ? trim($input['match_description']) : null;
    $setClauses[] = 'match_description = ?';
    $params[] = $v;
    $types   .= 's';
}

if (empty($setClauses)) matches_error(400, 'No updatable fields provided.');

$params[] = $matchId;
$types   .= 'i';

$sql  = 'UPDATE tournament_matches SET ' . implode(', ', $setClauses) . ' WHERE id = ?';
$stmt = $conn->prepare($sql);
if (!$stmt) matches_error(500, 'DB prepare error: ' . $conn->error);

$stmt->bind_param($types, ...$params);
if (!$stmt->execute()) {
    $err = $stmt->error;
    $stmt->close();
    matches_error(500, 'Failed to update match: ' . $err);
}
$stmt->close();

// ── Propagate winner to next match ────────────────────────────────────────
$newWinnerId    = array_key_exists('winner_registration_id', $input)
    ? ($input['winner_registration_id'] !== null ? intval($input['winner_registration_id']) : null)
    : null;
$nextMatchId   = intval($match['next_match_id'] ?? 0);
$nextMatchSlot = $match['next_match_slot'] ?? null;

if ($newWinnerId && $nextMatchId > 0 && in_array($nextMatchSlot, ['team1', 'team2'], true)) {
    $col = $nextMatchSlot === 'team1' ? 'team1_registration_id' : 'team2_registration_id';
    $upNext = $conn->prepare("UPDATE tournament_matches SET {$col} = ? WHERE id = ?");
    $upNext->bind_param('ii', $newWinnerId, $nextMatchId);
    $upNext->execute();
    $upNext->close();
}

// ── If winner cleared (reset), also clear propagated slot in next match ───
if (array_key_exists('winner_registration_id', $input) && $input['winner_registration_id'] === null
    && $nextMatchId > 0 && in_array($nextMatchSlot, ['team1', 'team2'], true)) {

    $col = $nextMatchSlot === 'team1' ? 'team1_registration_id' : 'team2_registration_id';
    $clearNext = $conn->prepare("UPDATE tournament_matches SET {$col} = NULL WHERE id = ?");
    $clearNext->bind_param('i', $nextMatchId);
    $clearNext->execute();
    $clearNext->close();
}

$conn->close();

echo json_encode(['success' => true, 'message' => 'Match updated.']);
