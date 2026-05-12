<?php
/**
 * Read Events API
 * GET /api/events/read.php          — all events
 * GET /api/events/read.php?id=1     — single event
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

require_once '../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    die(json_encode(['success' => false, 'message' => 'Method not allowed. Use GET.']));
}

$hasAutoSmsReminderEnabled = events_column_exists($conn, 'events', 'auto_sms_reminder_enabled');
$hasAutoSmsWinnerEnabled = events_column_exists($conn, 'events', 'auto_sms_winner_enabled');
$hasSmsReminderTemplateId = events_column_exists($conn, 'events', 'sms_reminder_template_id');
$hasSmsWinnerTemplateId = events_column_exists($conn, 'events', 'sms_winner_template_id');

$autoSmsReminderExpr = $hasAutoSmsReminderEnabled
    ? 'e.auto_sms_reminder_enabled AS auto_sms_reminder_enabled'
    : '0 AS auto_sms_reminder_enabled';
$autoSmsWinnerExpr = $hasAutoSmsWinnerEnabled
    ? 'e.auto_sms_winner_enabled AS auto_sms_winner_enabled'
    : '0 AS auto_sms_winner_enabled';
$smsReminderTemplateExpr = $hasSmsReminderTemplateId
    ? 'e.sms_reminder_template_id AS sms_reminder_template_id'
    : 'NULL AS sms_reminder_template_id';
$smsWinnerTemplateExpr = $hasSmsWinnerTemplateId
    ? 'e.sms_winner_template_id AS sms_winner_template_id'
    : 'NULL AS sms_winner_template_id';

$cols = "e.id, e.public_id, e.title, e.sports_id, s.sport_name,
         e.category, e.event_start_date, e.event_end_date,
         e.location, e.tournament_type, e.round_robin_format,
         e.has_third_place_match,
         {$autoSmsReminderExpr}, {$autoSmsWinnerExpr},
         {$smsReminderTemplateExpr}, {$smsWinnerTemplateExpr},
         e.description, e.status, e.registration_open,
         e.created_at, e.updated_at,
         COALESCE((
           SELECT COUNT(*)
             FROM team_registrations tr
            WHERE tr.event_id = e.id
              AND tr.status = 'Approved'
         ), 0) AS teams_count";

if (isset($_GET['id'])) {
    $id = intval($_GET['id']);
    if ($id <= 0) {
        http_response_code(400);
        die(json_encode(['success' => false, 'message' => 'Invalid event ID.']));
    }

    $stmt = $conn->prepare(
        "SELECT $cols
           FROM events e
      LEFT JOIN sports s ON s.id = e.sports_id
          WHERE e.id = ?
          LIMIT 1"
    );
    if (!$stmt) {
        http_response_code(500);
        die(json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]));
    }

    $stmt->bind_param('i', $id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        http_response_code(404);
        die(json_encode(['success' => false, 'message' => 'Event not found.']));
    }

    echo json_encode(['success' => true, 'data' => $result->fetch_assoc()]);
    $stmt->close();
    $conn->close();
    exit;
}

// Optional filters: status, sports_id
$where = [];
$params = [];
$types  = '';

if (!empty($_GET['status'])) {
    $where[]  = 'e.status = ?';
    $params[] = trim($_GET['status']);
    $types   .= 's';
}

if (!empty($_GET['sports_id'])) {
    $where[]  = 'e.sports_id = ?';
    $params[] = intval($_GET['sports_id']);
    $types   .= 'i';
}

$sql = "SELECT $cols FROM events e LEFT JOIN sports s ON s.id = e.sports_id";
if ($where) {
    $sql .= ' WHERE ' . implode(' AND ', $where);
}
$sql .= ' ORDER BY e.event_start_date DESC';

$stmt = $conn->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    die(json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]));
}

if ($params) {
    $stmt->bind_param($types, ...$params);
}

$stmt->execute();
$rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

http_response_code(200);
echo json_encode(['success' => true, 'data' => $rows, 'total' => count($rows)]);

$stmt->close();
$conn->close();

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
