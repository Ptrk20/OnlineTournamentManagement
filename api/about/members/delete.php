<?php
/**
 * Delete Team Member API
 * Deletes a row from about_team_members
 * DELETE /api/about/members/delete.php
 */

// Headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: DELETE, POST');

// Include database connection
require_once '../../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode([
        'success' => false,
        'message' => 'Method not allowed. Use DELETE or POST.'
    ]));
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['id'])) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Member ID is required.']));
}

$id = intval($input['id']);
if ($id <= 0) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Invalid member ID.']));
}

// Check member exists
$check = $conn->prepare("SELECT full_name FROM about_team_members WHERE id = ?");
$check->bind_param('i', $id);
$check->execute();
if ($check->get_result()->num_rows === 0) {
    http_response_code(404);
    die(json_encode(['success' => false, 'message' => 'Member not found.']));
}
$check->close();

// Delete the member
$stmt = $conn->prepare("DELETE FROM about_team_members WHERE id = ?");
if (!$stmt) {
    http_response_code(500);
    die(json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]));
}

$stmt->bind_param('i', $id);
if (!$stmt->execute()) {
    http_response_code(500);
    die(json_encode(['success' => false, 'message' => 'Failed to delete member: ' . $stmt->error]));
}

$stmt->close();

http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Team member deleted successfully.'
]);
