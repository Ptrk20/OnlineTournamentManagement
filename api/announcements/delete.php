<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../config/db.php';

if (!$conn) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'ID is required']);
    $conn->close();
    exit;
}

$id = (int)$data['id'];

$stmt = $conn->prepare('DELETE FROM announcements WHERE id = ?');
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $conn->error]);
    $conn->close();
    exit;
}

$stmt->bind_param('i', $id);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to delete announcement: ' . $stmt->error]);
    $stmt->close();
    $conn->close();
    exit;
}

echo json_encode(['success' => true, 'message' => 'Announcement deleted']);

$stmt->close();
$conn->close();
?>
