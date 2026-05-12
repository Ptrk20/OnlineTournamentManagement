<?php
/**
 * Auto Match Reminder SMS API
 * GET/POST /api/sms/auto-match-reminders.php
 *
 * Designed for cron execution. Sends reminders around 3 hours before start time.
 * Query options:
 *   window_before_minutes (default: 190)
 *   window_after_minutes  (default: 170)
 *   event_id (optional)
 *   dry_run=1 (optional)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once '../../config/db.php';
require_once './sms-blaster-lib.php';

// Use PH local time for reminder window calculations.
if (!$conn->query("SET time_zone = '+08:00'")) {
    http_response_code(500);
    die(json_encode(['success' => false, 'message' => 'Failed to set DB timezone: ' . $conn->error]));
}

if (!in_array($_SERVER['REQUEST_METHOD'], ['GET', 'POST'], true)) {
    http_response_code(405);
    die(json_encode(['success' => false, 'message' => 'Method not allowed. Use GET or POST.']));
}

$input = $_SERVER['REQUEST_METHOD'] === 'POST'
    ? json_decode(file_get_contents('php://input'), true)
    : $_GET;
if (!is_array($input)) $input = [];

$windowBefore = isset($input['window_before_minutes']) ? intval($input['window_before_minutes']) : 190;
$windowAfter  = isset($input['window_after_minutes']) ? intval($input['window_after_minutes']) : 170;
$eventId = isset($input['event_id']) ? intval($input['event_id']) : 0;
$dryRun = !empty($input['dry_run']);

if ($windowBefore < $windowAfter) {
    $tmp = $windowBefore;
    $windowBefore = $windowAfter;
    $windowAfter = $tmp;
}

$gateway = sms_blaster_load_gateway($conn);

$sql = "SELECT tm.id AS match_id, tm.schedule_date, tm.schedule_time, tm.location,
               tm.team1_registration_id, tm.team2_registration_id,
               e.id AS event_id, e.title AS event_title, e.category,
               e.sms_reminder_template_id,
               t1.team_name AS team1_name, t1.contact_number AS team1_phone,
               t2.team_name AS team2_name, t2.contact_number AS team2_phone,
               atpl.message AS template_message
          FROM tournament_matches tm
          INNER JOIN tournament_brackets tb ON tb.id = tm.bracket_id
          INNER JOIN events e ON e.id = tb.event_id
          LEFT JOIN team_registrations t1 ON t1.id = tm.team1_registration_id
          LEFT JOIN team_registrations t2 ON t2.id = tm.team2_registration_id
          LEFT JOIN announcement_templates atpl ON atpl.id = e.sms_reminder_template_id
         WHERE e.auto_sms_reminder_enabled = 1
           AND e.sms_reminder_template_id IS NOT NULL
           AND tm.schedule_date IS NOT NULL
           AND tm.schedule_time IS NOT NULL
           AND tm.match_status IN ('Pending', 'Scheduled', 'Ongoing')
           AND TIMESTAMPDIFF(MINUTE, NOW(), CONCAT(tm.schedule_date, ' ', tm.schedule_time)) BETWEEN ? AND ?";

$types = 'ii';
$params = [$windowAfter, $windowBefore];
if ($eventId > 0) {
    $sql .= ' AND e.id = ?';
    $types .= 'i';
    $params[] = $eventId;
}

$stmt = $conn->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    die(json_encode(['success' => false, 'message' => 'DB prepare error: ' . $conn->error]));
}
$stmt->bind_param($types, ...$params);
$stmt->execute();
$rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

$ins = $conn->prepare(
    "INSERT INTO sms_match_notifications
        (match_id, event_id, team_id, recipient_phone, notification_type, message, status)
     VALUES (?, ?, ?, ?, 'reminder', ?, 'Queued')"
);
$upd = $conn->prepare(
    'UPDATE sms_match_notifications
        SET status = ?, error_message = ?, sent_at = NOW()
      WHERE id = ?'
);

if (!$ins || !$upd) {
    if ($ins) $ins->close();
    if ($upd) $upd->close();
    http_response_code(500);
    die(json_encode(['success' => false, 'message' => 'Unable to initialize SMS logs table writes.']));
}

$summary = [
    'matches_scanned' => count($rows),
    'queued' => 0,
    'sent' => 0,
    'failed' => 0,
    'skipped' => 0,
    'dry_run' => $dryRun
];

foreach ($rows as $ctx) {
    $template = trim((string)($ctx['template_message'] ?? ''));
    if ($template === '') {
        $summary['skipped']++;
        continue;
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

    foreach ($recipients as $r) {
        $normalizedPhone = normalize_sms_phone($r['phone']);
        if (!$normalizedPhone) {
            $summary['skipped']++;
            continue;
        }

        $vars = [
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
        $message = render_sms_template($template, $vars);

        if ($dryRun) {
            $summary['queued']++;
            continue;
        }

        $matchId = intval($ctx['match_id']);
        $eventIdLocal = intval($ctx['event_id']);
        $teamId = $r['team_id'];

        $ins->bind_param('iiiss', $matchId, $eventIdLocal, $teamId, $normalizedPhone, $message);
        if (!$ins->execute()) {
            $summary['skipped']++;
            continue;
        }

        $summary['queued']++;
        $logId = (int)$conn->insert_id;

        if (!$gateway['ok']) {
            $status = 'Failed';
            $errorText = $gateway['error'];
            $upd->bind_param('ssi', $status, $errorText, $logId);
            $upd->execute();
            $summary['failed']++;
            continue;
        }

        $sendResult = sms_blaster_send_single(
            $conn,
            $gateway,
            $normalizedPhone,
            $message,
            [
                'name' => (string)($r['team_name'] ?? ''),
                'source' => 'auto_reminder'
            ]
        );
        if ($sendResult['ok']) {
            $status = 'Sent';
            $errorText = null;
            $upd->bind_param('ssi', $status, $errorText, $logId);
            $upd->execute();
            $summary['sent']++;
        } else {
            $status = 'Failed';
            $errorText = $sendResult['error'];
            $upd->bind_param('ssi', $status, $errorText, $logId);
            $upd->execute();
            $summary['failed']++;
        }
    }
}

$ins->close();
$upd->close();
$conn->close();

echo json_encode([
    'success' => true,
    'message' => 'Auto reminder run completed.',
    'summary' => $summary
]);

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
