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
 *   schedule_date, schedule_time,
 *   location, match_description
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
require_once '../sms/sms-blaster-lib.php';

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

$allowedStatuses = ['Pending', 'Scheduled', 'Ongoing', 'Completed'];
$statusCol = $conn->query("SHOW COLUMNS FROM tournament_matches LIKE 'match_status'");
if ($statusCol && $statusCol->num_rows > 0) {
    $row = $statusCol->fetch_assoc();
    $type = (string)($row['Type'] ?? '');
    if (preg_match_all("/'([^']+)'/", $type, $matchesEnum) && !empty($matchesEnum[1])) {
        $allowedStatuses = $matchesEnum[1];
    }
}
if ($statusCol instanceof mysqli_result) $statusCol->free();

$hasLoserNextColumns = false;
$loserCol = $conn->query("SHOW COLUMNS FROM tournament_matches LIKE 'loser_next_match_id'");
if ($loserCol && $loserCol->num_rows > 0) $hasLoserNextColumns = true;
if ($loserCol instanceof mysqli_result) $loserCol->free();

// ── Load current match ────────────────────────────────────────────────────
$curSql = $hasLoserNextColumns
    ? 'SELECT id, bracket_id, next_match_id, next_match_slot,
            loser_next_match_id, loser_next_match_slot,
            team1_registration_id, team2_registration_id,
            winner_registration_id, match_status
        FROM tournament_matches WHERE id = ? LIMIT 1'
    : 'SELECT id, bracket_id, next_match_id, next_match_slot,
            NULL AS loser_next_match_id, NULL AS loser_next_match_slot,
            team1_registration_id, team2_registration_id,
            winner_registration_id, match_status
        FROM tournament_matches WHERE id = ? LIMIT 1';
$cur = $conn->prepare($curSql);
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
if (array_key_exists('match_status', $input)) {
    $requested = (string)($input['match_status'] ?? '');
    if (!in_array($requested, $allowedStatuses, true)) {
        $requested = in_array('Scheduled', $allowedStatuses, true)
            ? 'Scheduled'
            : (in_array('Pending', $allowedStatuses, true) ? 'Pending' : $allowedStatuses[0]);
    }
    $setClauses[] = 'match_status = ?';
    $params[] = $requested;
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
$loserNextMatchId = intval($match['loser_next_match_id'] ?? 0);
$loserNextMatchSlot = $match['loser_next_match_slot'] ?? null;

$team1RegId = isset($input['team1_registration_id'])
    ? ($input['team1_registration_id'] !== null ? intval($input['team1_registration_id']) : null)
    : ($match['team1_registration_id'] !== null ? intval($match['team1_registration_id']) : null);
$team2RegId = isset($input['team2_registration_id'])
    ? ($input['team2_registration_id'] !== null ? intval($input['team2_registration_id']) : null)
    : ($match['team2_registration_id'] !== null ? intval($match['team2_registration_id']) : null);

$newLoserId = null;
if ($newWinnerId && $team1RegId && $team2RegId) {
    if ($newWinnerId === $team1RegId) $newLoserId = $team2RegId;
    elseif ($newWinnerId === $team2RegId) $newLoserId = $team1RegId;
}

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

// ── Propagate loser to lower bracket (double elimination path) ───────────
if ($hasLoserNextColumns && $loserNextMatchId > 0 && in_array($loserNextMatchSlot, ['team1', 'team2'], true)) {
    $loserColName = $loserNextMatchSlot === 'team1' ? 'team1_registration_id' : 'team2_registration_id';

    if ($newLoserId) {
        $upLoser = $conn->prepare("UPDATE tournament_matches SET {$loserColName} = ? WHERE id = ?");
        $upLoser->bind_param('ii', $newLoserId, $loserNextMatchId);
        $upLoser->execute();
        $upLoser->close();
    } elseif (array_key_exists('winner_registration_id', $input) && $input['winner_registration_id'] === null) {
        $clearLoser = $conn->prepare("UPDATE tournament_matches SET {$loserColName} = NULL WHERE id = ?");
        $clearLoser->bind_param('i', $loserNextMatchId);
        $clearLoser->execute();
        $clearLoser->close();
    }
}

$winnerSmsSummary = null;
if (array_key_exists('winner_registration_id', $input) && $newWinnerId) {
    $winnerSmsSummary = send_winner_sms_notifications($conn, $matchId);
}

$conn->close();

echo json_encode([
    'success' => true,
    'message' => 'Match updated.',
    'winner_sms' => $winnerSmsSummary
]);

function send_winner_sms_notifications(mysqli $conn, int $matchId): array {
    $sql = "SELECT tm.id, tm.schedule_date, tm.schedule_time, tm.location,
                   tm.team1_registration_id, tm.team2_registration_id, tm.winner_registration_id,
                   e.id AS event_id, e.title AS event_title, e.category,
                   e.auto_sms_winner_enabled, e.sms_winner_template_id,
                   t1.team_name AS team1_name, t1.contact_number AS team1_phone,
                   t2.team_name AS team2_name, t2.contact_number AS team2_phone,
                   tw.team_name AS winner_name,
                   CASE
                     WHEN tm.winner_registration_id = tm.team1_registration_id THEN t2.team_name
                     WHEN tm.winner_registration_id = tm.team2_registration_id THEN t1.team_name
                     ELSE ''
                   END AS loser_name
              FROM tournament_matches tm
              INNER JOIN tournament_brackets tb ON tb.id = tm.bracket_id
              INNER JOIN events e ON e.id = tb.event_id
              LEFT JOIN team_registrations t1 ON t1.id = tm.team1_registration_id
              LEFT JOIN team_registrations t2 ON t2.id = tm.team2_registration_id
              LEFT JOIN team_registrations tw ON tw.id = tm.winner_registration_id
             WHERE tm.id = ?
             LIMIT 1";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        return ['queued' => 0, 'sent' => 0, 'failed' => 0, 'message' => 'Unable to load match context.'];
    }
    $stmt->bind_param('i', $matchId);
    $stmt->execute();
    $ctx = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$ctx) return ['queued' => 0, 'sent' => 0, 'failed' => 0, 'message' => 'Match context not found.'];
    if ((int)($ctx['auto_sms_winner_enabled'] ?? 0) !== 1) {
        return ['queued' => 0, 'sent' => 0, 'failed' => 0, 'message' => 'Winner SMS automation disabled for event.'];
    }

    $templateId = intval($ctx['sms_winner_template_id'] ?? 0);
    if ($templateId <= 0) {
        return ['queued' => 0, 'sent' => 0, 'failed' => 0, 'message' => 'No winner template selected for event.'];
    }

    $tplStmt = $conn->prepare('SELECT message FROM announcement_templates WHERE id = ? LIMIT 1');
    if (!$tplStmt) {
        return ['queued' => 0, 'sent' => 0, 'failed' => 0, 'message' => 'Unable to load winner SMS template.'];
    }
    $tplStmt->bind_param('i', $templateId);
    $tplStmt->execute();
    $tplRow = $tplStmt->get_result()->fetch_assoc();
    $tplStmt->close();
    $templateMessage = trim((string)($tplRow['message'] ?? ''));
    if ($templateMessage === '') {
        return ['queued' => 0, 'sent' => 0, 'failed' => 0, 'message' => 'Winner SMS template is empty.'];
    }

    $recipients = [
        [
            'team_id' => $ctx['team1_registration_id'] !== null ? intval($ctx['team1_registration_id']) : null,
            'team_name' => (string)($ctx['team1_name'] ?? ''),
            'opponent' => (string)($ctx['team2_name'] ?? ''),
            'phone' => (string)($ctx['team1_phone'] ?? '')
        ],
        [
            'team_id' => $ctx['team2_registration_id'] !== null ? intval($ctx['team2_registration_id']) : null,
            'team_name' => (string)($ctx['team2_name'] ?? ''),
            'opponent' => (string)($ctx['team1_name'] ?? ''),
            'phone' => (string)($ctx['team2_phone'] ?? '')
        ]
    ];

    $gateway = sms_blaster_load_gateway($conn);
    $queued = 0;
    $sent = 0;
    $failed = 0;

    $ins = $conn->prepare(
        "INSERT INTO sms_match_notifications
            (match_id, event_id, team_id, recipient_phone, notification_type, message, status)
         VALUES (?, ?, ?, ?, 'winner', ?, 'Queued')"
    );
    if (!$ins) {
        return ['queued' => 0, 'sent' => 0, 'failed' => 0, 'message' => 'Unable to write SMS log.'];
    }

    $upd = $conn->prepare(
        'UPDATE sms_match_notifications
            SET status = ?, error_message = ?, sent_at = NOW()
          WHERE id = ?'
    );
    if (!$upd) {
        $ins->close();
        return ['queued' => 0, 'sent' => 0, 'failed' => 0, 'message' => 'Unable to update SMS log.'];
    }

    foreach ($recipients as $r) {
        $normalizedPhone = normalize_sms_phone($r['phone']);
        if (!$normalizedPhone) continue;

        $vars = [
            'winner' => (string)($ctx['winner_name'] ?? ''),
            'loser' => (string)($ctx['loser_name'] ?? ''),
            'event' => (string)($ctx['event_title'] ?? ''),
            'category' => (string)($ctx['category'] ?? ''),
            'team' => (string)($r['team_name'] ?? ''),
            'opponent' => (string)($r['opponent'] ?? ''),
            'team1' => (string)($ctx['team1_name'] ?? ''),
            'team2' => (string)($ctx['team2_name'] ?? ''),
            'date' => (string)($ctx['schedule_date'] ?? ''),
            'time' => (string)($ctx['schedule_time'] ?? ''),
            'location' => (string)($ctx['location'] ?? '')
        ];
        $message = render_sms_template($templateMessage, $vars);

        $teamId = $r['team_id'];
        $eventId = intval($ctx['event_id'] ?? 0);
        $ins->bind_param('iiiss', $matchId, $eventId, $teamId, $normalizedPhone, $message);
        if (!$ins->execute()) {
            continue;
        }

        $queued++;
        $logId = (int)$conn->insert_id;

        if (!$gateway['ok']) {
            $status = 'Failed';
            $errorText = $gateway['error'];
            $upd->bind_param('ssi', $status, $errorText, $logId);
            $upd->execute();
            $failed++;
            continue;
        }

        $sendResult = sms_blaster_send_single(
            $conn,
            $gateway,
            $normalizedPhone,
            $message,
            [
                'name' => (string)($r['team_name'] ?? ''),
                'source' => 'auto_winner'
            ]
        );
        if ($sendResult['ok']) {
            $status = 'Sent';
            $errorText = null;
            $upd->bind_param('ssi', $status, $errorText, $logId);
            $upd->execute();
            $sent++;
        } else {
            $status = 'Failed';
            $errorText = $sendResult['error'];
            $upd->bind_param('ssi', $status, $errorText, $logId);
            $upd->execute();
            $failed++;
        }
    }

    $ins->close();
    $upd->close();

    return [
        'queued' => $queued,
        'sent' => $sent,
        'failed' => $failed,
        'message' => $queued > 0 ? 'Winner SMS processed.' : 'No eligible recipients for winner SMS.'
    ];
}

function normalize_sms_phone(?string $phone): ?string {
    $digits = preg_replace('/\D+/', '', (string)$phone);
    if (!$digits) return null;

    if (strpos($digits, '63') === 0 && strlen($digits) === 12) return $digits;
    if (strpos($digits, '09') === 0 && strlen($digits) === 11) return '63' . substr($digits, 1);
    if (strlen($digits) === 10 && strpos($digits, '9') === 0) return '63' . $digits;

    return null;
}

function render_sms_template(string $template, array $vars): string {
    $normalized = [];
    foreach ($vars as $k => $v) {
        $normalized[strtolower((string)$k)] = (string)$v;
    }

    return preg_replace_callback('/\{([a-zA-Z0-9_]+)\}/', function ($m) use ($normalized) {
        $key = strtolower((string)($m[1] ?? ''));
        return array_key_exists($key, $normalized) ? $normalized[$key] : $m[0];
    }, $template);
}
