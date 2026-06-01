<?php
/**
 * Delete Registration API
 * DELETE/POST /api/registrations/delete.php
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: DELETE, POST');

require_once '../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode([
        'success' => false,
        'message' => 'Method not allowed. Use DELETE or POST.'
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
if ($id <= 0) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'Invalid registration ID.'
    ]));
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
    $exists_stmt->close();
    http_response_code(404);
    die(json_encode([
        'success' => false,
        'message' => 'Registration not found.'
    ]));
}
$exists_stmt->close();

$stmt = $conn->prepare('DELETE FROM team_registrations WHERE id = ?');
if (!$stmt) {
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'message' => 'Database error: ' . $conn->error
    ]));
}

$stmt->bind_param('i', $id);

if ($stmt->execute()) {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Registration deleted successfully.',
        'affected_rows' => $stmt->affected_rows
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error deleting registration: ' . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>