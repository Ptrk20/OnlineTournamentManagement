<?php
/**
 * Delete Event API
 * POST /api/events/delete.php
 * Content-Type: application/json
 *
 * Required: id
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
if ($id <= 0) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'A valid event ID is required.']));
}

// ── Verify event exists ────────────────────────────────────────────────────
$chk = $conn->prepare('SELECT id FROM events WHERE id = ? LIMIT 1');
if (!$chk) {
    http_response_code(500);
    die(json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]));
}
$chk->bind_param('i', $id);
$chk->execute();
if ($chk->get_result()->num_rows === 0) {
    http_response_code(404);
    die(json_encode(['success' => false, 'message' => 'Event not found.']));
}
$chk->close();

// ── Delete (cascade handles child rows) ───────────────────────────────────
$stmt = $conn->prepare('DELETE FROM events WHERE id = ?');
if (!$stmt) {
    http_response_code(500);
    die(json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]));
}
$stmt->bind_param('i', $id);

if (!$stmt->execute()) {
    $errMsg = $stmt->error;
    $stmt->close();
    // Check FK violation (bracket_matches, etc. defined as CASCADE so shouldn't happen,
    // but guard gracefully)
    if (strpos($errMsg, '1451') !== false || strpos($errMsg, 'foreign key') !== false) {
        http_response_code(409);
        die(json_encode([
            'success' => false,
            'message' => 'Cannot delete this event because it has related records. Remove them first.'
        ]));
    }
    http_response_code(500);
    die(json_encode(['success' => false, 'message' => 'Failed to delete event: ' . $errMsg]));
}

$stmt->close();
$conn->close();

echo json_encode(['success' => true, 'message' => 'Event deleted successfully.']);
