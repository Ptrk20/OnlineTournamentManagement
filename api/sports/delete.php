<?php
/**
 * Delete Sport API
 * POST/DELETE /api/sports/delete.php
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: DELETE, POST');

require_once '../../config/db.php';
require_once __DIR__ . '/_helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    sports_error(405, 'Method not allowed. Use DELETE or POST.');
}

$input = sports_get_json_input();
if (!isset($input['id'])) {
    sports_error(400, 'Sport ID is required.');
}

$id = intval($input['id']);
if ($id <= 0) {
    sports_error(400, 'Invalid sport ID.');
}

$checkStmt = $conn->prepare('SELECT id FROM sports WHERE id = ? LIMIT 1');
if (!$checkStmt) {
    sports_error(500, 'Database error: ' . $conn->error);
}
$checkStmt->bind_param('i', $id);
$checkStmt->execute();
if ($checkStmt->get_result()->num_rows === 0) {
    sports_error(404, 'Sport not found.');
}
$checkStmt->close();

$deleteStmt = $conn->prepare('DELETE FROM sports WHERE id = ?');
if (!$deleteStmt) {
    sports_error(500, 'Database error: ' . $conn->error);
}
$deleteStmt->bind_param('i', $id);

if (!$deleteStmt->execute()) {
    $message = 'Failed to delete sport: ' . $deleteStmt->error;
    if ($conn->errno === 1451) {
        $message = 'Cannot delete sport because it is used by existing events.';
    }
    sports_error(400, $message);
}

$deleteStmt->close();

http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Sport deleted successfully.'
]);

$conn->close();
