<?php
/**
 * Update Event API
 * POST /api/events/update.php
 * Content-Type: application/json
 *
 * Required: id
 * Updatable: title, sports_id, category, event_start_date, event_end_date,
 *            location, teams_count, description, status
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

$id = intval($input['id'] ?? 0);
if ($id <= 0) events_error(400, 'A valid event ID is required.');

// ── Verify event exists ────────────────────────────────────────────────────
$chk = $conn->prepare('SELECT id FROM events WHERE id = ? LIMIT 1');
$chk->bind_param('i', $id);
$chk->execute();
if ($chk->get_result()->num_rows === 0) events_error(404, 'Event not found.');
$chk->close();

// ── Validate fields ────────────────────────────────────────────────────────
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

$description = trim((string)($input['description'] ?? ''));
$description = $description !== '' ? $description : null;
$allowedStatuses = ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'];
$status      = in_array($input['status'] ?? '', $allowedStatuses, true) ? $input['status'] : 'Upcoming';

// ── Verify sport exists ────────────────────────────────────────────────────
$chkSport = $conn->prepare('SELECT id FROM sports WHERE id = ? LIMIT 1');
$chkSport->bind_param('i', $sportsId);
$chkSport->execute();
if ($chkSport->get_result()->num_rows === 0) events_error(404, 'Sport not found.');
$chkSport->close();

// ── Update ─────────────────────────────────────────────────────────────────
$stmt = $conn->prepare(
    "UPDATE events
        SET title = ?, sports_id = ?, category = ?,
            event_start_date = ?, event_end_date = ?,
            location = ?, teams_count = ?, description = ?, status = ?
      WHERE id = ?"
);
if (!$stmt) events_error(500, 'Database error: ' . $conn->error);

$teamsCount = 0; // Auto-calculated from registrations; always set to 0
$stmt->bind_param(
    'sissssissi',
    $title, $sportsId, $category,
    $startDate, $endDate,
    $location, $teamsCount, $description, $status,
    $id
);

if (!$stmt->execute()) {
    $err = $stmt->error;
    $stmt->close();
    events_error(500, 'Failed to update event: ' . $err);
}

$stmt->close();
$conn->close();

echo json_encode(['success' => true, 'message' => 'Event updated successfully.']);

function events_error(int $code, string $msg): void {
    http_response_code($code);
    die(json_encode(['success' => false, 'message' => $msg]));
}
