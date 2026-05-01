<?php
/**
 * Update Registration Status API
 * PUT/POST /api/registrations/update-status.php
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PUT, POST');

require_once '../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode([
        'success' => false,
        'message' => 'Method not allowed. Use PUT or POST.'
    ]));
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'Invalid JSON payload.'
    ]));
}

$id = intval($input['id'] ?? 0);
$status = trim((string)($input['status'] ?? ''));
$reviewed_by_name = trim((string)($input['reviewed_by_name'] ?? ''));

if ($id <= 0) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'Invalid registration ID.'
    ]));
}

$valid_statuses = ['Pending', 'Approved', 'Rejected'];
if (!in_array($status, $valid_statuses, true)) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'Invalid status. Must be Pending, Approved, or Rejected.'
    ]));
}

if ($reviewed_by_name === '') {
    $reviewed_by_name = 'Administrator';
}

$exists_stmt = $conn->prepare('SELECT id FROM team_registrations WHERE id = ?');
if (!$exists_stmt) {
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'message' => 'Database error: ' . $conn->error
    ]));
}

$exists_stmt->bind_param('i', $id);
$exists_stmt->execute();
if ($exists_stmt->get_result()->num_rows === 0) {
    http_response_code(404);
    die(json_encode([
        'success' => false,
        'message' => 'Registration not found.'
    ]));
}
$exists_stmt->close();

$stmt = $conn->prepare('UPDATE team_registrations SET status = ?, reviewed_by_name = ?, reviewed_at = NOW() WHERE id = ?');
if (!$stmt) {
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'message' => 'Database error: ' . $conn->error
    ]));
}

$stmt->bind_param('ssi', $status, $reviewed_by_name, $id);

if ($stmt->execute()) {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Registration status updated successfully.',
        'affected_rows' => $stmt->affected_rows
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error updating registration status: ' . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>