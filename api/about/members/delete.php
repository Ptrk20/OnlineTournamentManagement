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

// Check member exists and get its display_order
$check = $conn->prepare("SELECT display_order FROM about_team_members WHERE id = ?");
$check->bind_param('i', $id);
$check->execute();
$checkResult = $check->get_result();
if ($checkResult->num_rows === 0) {
    http_response_code(404);
    die(json_encode(['success' => false, 'message' => 'Member not found.']));
}
$deletedOrder = (int)$checkResult->fetch_assoc()['display_order'];
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

// Re-sequence display_order for rows that come after the deleted one
$reseq = $conn->prepare(
    "UPDATE about_team_members SET display_order = display_order - 1 WHERE display_order > ?"
);
if ($reseq) {
    $reseq->bind_param('i', $deletedOrder);
    $reseq->execute();
    $reseq->close();
}

echo json_encode([
    'success' => true,
    'message' => 'Team member deleted successfully.'
]);
