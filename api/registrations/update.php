<?php
/**
 * Update Registration API (representative self-update of Pending registrations)
 * POST /api/registrations/update.php
 *
 * Only allowed when the registration status is 'Pending'.
 * The representative can update team/player/contact details but cannot
 * change the event or the status.
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
    die(json_encode(['success' => false, 'message' => 'Invalid JSON payload.']));
}

$id           = intval($input['id'] ?? 0);
$created_by_id = intval($input['created_by_id'] ?? 0);

if ($id <= 0) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'A valid registration ID is required.']));
}

if ($created_by_id <= 0) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'A valid user ID is required.']));
}

// ── Fetch existing record ──────────────────────────────────────────────────
$chk = $conn->prepare('SELECT id, status, created_by_id FROM team_registrations WHERE id = ? LIMIT 1');
if (!$chk) {
    http_response_code(500);
    die(json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]));
}
$chk->bind_param('i', $id);
$chk->execute();
$chkResult = $chk->get_result();
if ($chkResult->num_rows === 0) {
    $chk->close();
    http_response_code(404);
    die(json_encode(['success' => false, 'message' => 'Registration not found.']));
}
$existing = $chkResult->fetch_assoc();
$chk->close();

// ── Must be Pending ────────────────────────────────────────────────────────
if (strtolower($existing['status']) !== 'pending') {
    http_response_code(403);
    die(json_encode([
        'success' => false,
        'message' => 'Only Pending registrations can be updated.'
    ]));
}

// ── Must be owner ──────────────────────────────────────────────────────────
if ((int)$existing['created_by_id'] !== $created_by_id) {
    http_response_code(403);
    die(json_encode([
        'success' => false,
        'message' => 'You do not have permission to update this registration.'
    ]));
}

// ── Validate inputs ────────────────────────────────────────────────────────
$team_name                    = trim((string)($input['team_name'] ?? ''));
$representative_first_name    = trim((string)($input['representative_first_name'] ?? ''));
$representative_last_name     = trim((string)($input['representative_last_name'] ?? ''));
$representative_student_id    = trim((string)($input['representative_student_id'] ?? ''));
$representative_course_id     = intval($input['representative_course_id'] ?? 0);
$contact_number               = trim((string)($input['contact_number'] ?? ''));
$email_address                = trim((string)($input['email_address'] ?? ''));
$coach                        = is_array($input['coach'] ?? null) ? $input['coach'] : [];
$coach_first_name             = trim((string)($coach['first_name'] ?? ''));
$coach_last_name              = trim((string)($coach['last_name'] ?? ''));
$players                      = is_array($input['players'] ?? null) ? $input['players'] : [];
$documents                    = is_array($input['documents'] ?? null) ? $input['documents'] : [];
$notes                        = trim((string)($input['notes'] ?? ''));

if ($team_name === '') {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Team name is required.']));
}
if ($representative_first_name === '' || $representative_last_name === '' || $representative_student_id === '' || $representative_course_id <= 0) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Representative information is incomplete.']));
}
if ($contact_number === '' || $email_address === '') {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Contact number and email are required.']));
}
if (!filter_var($email_address, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Invalid email address.']));
}
if ($coach_first_name === '' || $coach_last_name === '') {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Coach/Manager first and last name are required.']));
}
if (count($players) === 0) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'At least one player is required.']));
}

$representative_name  = trim("$representative_first_name $representative_last_name");
$players_json         = json_encode($players, JSON_UNESCAPED_UNICODE);
$documents_json       = json_encode($documents, JSON_UNESCAPED_UNICODE);

// ── Update ─────────────────────────────────────────────────────────────────
$stmt = $conn->prepare(
    "UPDATE team_registrations
        SET team_name = ?,
            representative_name = ?,
            representative_first_name = ?,
            representative_last_name = ?,
            representative_student_id = ?,
            representative_course_id = ?,
            contact_number = ?,
            email_address = ?,
            coach_first_name = ?,
            coach_last_name = ?,
            players_json = ?,
            documents_json = ?,
            notes = ?
      WHERE id = ?"
);
if (!$stmt) {
    http_response_code(500);
    die(json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]));
}

$stmt->bind_param(
    'sssssississsi',
    $team_name,
    $representative_name,
    $representative_first_name,
    $representative_last_name,
    $representative_student_id,
    $representative_course_id,
    $contact_number,
    $email_address,
    $coach_first_name,
    $coach_last_name,
    $players_json,
    $documents_json,
    $notes,
    $id
);

if (!$stmt->execute()) {
    $err = $stmt->error;
    $stmt->close();
    http_response_code(500);
    die(json_encode(['success' => false, 'message' => 'Failed to update registration: ' . $err]));
}

$stmt->close();
$conn->close();

echo json_encode(['success' => true, 'message' => 'Registration updated successfully.']);
