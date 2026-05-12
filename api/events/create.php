<?php
/**
 * Create Event API
 * POST /api/events/create.php
 * Content-Type: application/json
 *
 * Required: title, sports_id, category, event_start_date, event_end_date, location
 * Optional: teams_count, description, status, created_by
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

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

$hasAutoSmsReminderEnabled = events_column_exists($conn, 'events', 'auto_sms_reminder_enabled');
$hasAutoSmsWinnerEnabled = events_column_exists($conn, 'events', 'auto_sms_winner_enabled');
$hasSmsReminderTemplateId = events_column_exists($conn, 'events', 'sms_reminder_template_id');
$hasSmsWinnerTemplateId = events_column_exists($conn, 'events', 'sms_winner_template_id');
$hasAutoSmsColumns = $hasAutoSmsReminderEnabled && $hasAutoSmsWinnerEnabled && $hasSmsReminderTemplateId && $hasSmsWinnerTemplateId;

// ── Required fields ────────────────────────────────────────────────────────
$title = trim((string)($input['title'] ?? ''));
if ($title === '') events_error(400, 'Event title is required.');
if (strlen($title) > 180) events_error(400, 'Title must not exceed 180 characters.');

$sportsId = intval($input['sports_id'] ?? 0);
if ($sportsId <= 0) events_error(400, 'A valid sport is required.');

$category = trim((string)($input['category'] ?? ''));
if ($category === '') events_error(400, 'Category is required.');
if (strlen($category) > 80) events_error(400, 'Category must not exceed 80 characters.');

$startDate = trim((string)($input['event_start_date'] ?? ''));
$endDate   = trim((string)($input['event_end_date'] ?? ''));
if ($startDate === '') events_error(400, 'Start date is required.');
if ($endDate   === '') events_error(400, 'End date is required.');
if (strtotime($endDate) < strtotime($startDate)) {
    events_error(400, 'End date must not be before start date.');
}

$location = trim((string)($input['location'] ?? ''));
if ($location === '') events_error(400, 'Location is required.');
if (strlen($location) > 180) events_error(400, 'Location must not exceed 180 characters.');

// ── Optional fields ────────────────────────────────────────────────────────
// teams_count is auto-calculated from approved registrations; ignore manual input
$description = trim((string)($input['description'] ?? ''));
$description = $description !== '' ? $description : null;
$allowedTournamentTypes = ['single_elimination', 'double_elimination', 'round_robin'];
$tournamentType = trim((string)($input['tournament_type'] ?? 'single_elimination'));
if (!in_array($tournamentType, $allowedTournamentTypes, true)) $tournamentType = 'single_elimination';
$roundRobinFormat = 'once';
$hasThirdPlaceMatch = !empty($input['has_third_place_match']) ? 1 : 0;
$allowedStatuses = ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'];
$status      = in_array($input['status'] ?? '', $allowedStatuses, true) ? $input['status'] : 'Upcoming';
$registrationOpen = isset($input['registration_open']) ? (intval($input['registration_open']) ? 1 : 0) : 1;
$autoSmsReminderEnabled = !empty($input['auto_sms_reminder_enabled']) ? 1 : 0;
$autoSmsWinnerEnabled = !empty($input['auto_sms_winner_enabled']) ? 1 : 0;
$smsReminderTemplateId = isset($input['sms_reminder_template_id']) && intval($input['sms_reminder_template_id']) > 0
    ? intval($input['sms_reminder_template_id'])
    : null;
$smsWinnerTemplateId = isset($input['sms_winner_template_id']) && intval($input['sms_winner_template_id']) > 0
    ? intval($input['sms_winner_template_id'])
    : null;

if ($hasAutoSmsColumns && $autoSmsReminderEnabled && $smsReminderTemplateId === null) {
    events_error(400, 'Reminder template is required when auto reminder is enabled.');
}
if ($hasAutoSmsColumns && $autoSmsWinnerEnabled && $smsWinnerTemplateId === null) {
    events_error(400, 'Winner template is required when auto winner SMS is enabled.');
}

$createdBy   = isset($input['created_by']) ? intval($input['created_by']) : null;
if ($createdBy !== null && $createdBy <= 0) $createdBy = null;

// ── Verify sport exists ────────────────────────────────────────────────────
$chk = $conn->prepare('SELECT id FROM sports WHERE id = ? LIMIT 1');
$chk->bind_param('i', $sportsId);
$chk->execute();
if ($chk->get_result()->num_rows === 0) events_error(404, 'Sport not found.');
$chk->close();

if ($hasAutoSmsColumns && $smsReminderTemplateId !== null) {
    $tplChk = $conn->prepare('SELECT id FROM announcement_templates WHERE id = ? LIMIT 1');
    $tplChk->bind_param('i', $smsReminderTemplateId);
    $tplChk->execute();
    if ($tplChk->get_result()->num_rows === 0) {
        $tplChk->close();
        events_error(404, 'Reminder template not found.');
    }
    $tplChk->close();
}

if ($hasAutoSmsColumns && $smsWinnerTemplateId !== null) {
    $tplChk = $conn->prepare('SELECT id FROM announcement_templates WHERE id = ? LIMIT 1');
    $tplChk->bind_param('i', $smsWinnerTemplateId);
    $tplChk->execute();
    if ($tplChk->get_result()->num_rows === 0) {
        $tplChk->close();
        events_error(404, 'Winner template not found.');
    }
    $tplChk->close();
}

// ── Generate public_id ─────────────────────────────────────────────────────
$publicId = 'ev' . time() . substr((string)mt_rand(100, 999), 0, 3);

// ── Insert ─────────────────────────────────────────────────────────────────
$teamsCount = 0; // Auto-calculated from registrations; always start at 0

if ($hasAutoSmsColumns) {
    $stmt = $conn->prepare(
        "INSERT INTO events
           (public_id, title, sports_id, category, event_start_date, event_end_date,
            location, teams_count, tournament_type, round_robin_format,
            has_third_place_match, auto_sms_reminder_enabled, auto_sms_winner_enabled,
            sms_reminder_template_id, sms_winner_template_id,
            description, status, registration_open, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    if (!$stmt) events_error(500, 'Database error: ' . $conn->error);

    $stmt->bind_param(
        'ssissssissiiiiissii',
        $publicId, $title, $sportsId, $category,
        $startDate, $endDate, $location,
        $teamsCount, $tournamentType, $roundRobinFormat,
        $hasThirdPlaceMatch, $autoSmsReminderEnabled, $autoSmsWinnerEnabled,
        $smsReminderTemplateId, $smsWinnerTemplateId,
        $description, $status, $registrationOpen, $createdBy
    );
} else {
    $stmt = $conn->prepare(
        "INSERT INTO events
           (public_id, title, sports_id, category, event_start_date, event_end_date,
            location, teams_count, tournament_type, round_robin_format,
            has_third_place_match,
            description, status, registration_open, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    if (!$stmt) events_error(500, 'Database error: ' . $conn->error);

    $stmt->bind_param(
        'ssissssississii',
        $publicId, $title, $sportsId, $category,
        $startDate, $endDate, $location,
        $teamsCount, $tournamentType, $roundRobinFormat,
        $hasThirdPlaceMatch,
        $description, $status, $registrationOpen, $createdBy
    );
}

if (!$stmt->execute()) {
    $err = $stmt->error;
    $stmt->close();
    events_error(500, 'Failed to create event: ' . $err);
}

$newId = (int)$conn->insert_id;
$stmt->close();
$conn->close();

$smsConfigPersisted = $hasAutoSmsColumns;
$responseMessage = $smsConfigPersisted
    ? 'Event created successfully.'
    : 'Event created, but Auto SMS settings were not saved because required database columns are missing.';

http_response_code(201);
echo json_encode([
    'success'   => true,
    'message'   => $responseMessage,
    'id'        => $newId,
    'public_id' => $publicId,
    'auto_sms_config_persisted' => $smsConfigPersisted
]);

function events_error(int $code, string $msg): void {
    http_response_code($code);
    die(json_encode(['success' => false, 'message' => $msg]));
}

function events_column_exists(mysqli $conn, string $table, string $column): bool {
        $stmt = $conn->prepare(
                'SELECT 1
                     FROM information_schema.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE()
                        AND TABLE_NAME = ?
                        AND COLUMN_NAME = ?
                    LIMIT 1'
        );
    if (!$stmt) return false;

        $stmt->bind_param('ss', $table, $column);
    $stmt->execute();
    $res = $stmt->get_result();
    $exists = $res && $res->num_rows > 0;
    if ($res instanceof mysqli_result) {
        $res->free();
    }
    $stmt->close();

    return $exists;
}
