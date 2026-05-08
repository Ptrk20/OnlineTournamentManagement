<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../config/db.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['title']) || !isset($data['message'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Title and message are required']);
    exit;
}

$title = trim($data['title']);
$message = trim($data['message']);
$smsSent = isset($data['sms_sent']) ? (int)$data['sms_sent'] : 0;
$smsStatus = isset($data['sms_status']) ? $data['sms_status'] : 'Not Sent';
$userId = isset($data['created_by']) ? (int)$data['created_by'] : null;

if (empty($title) || empty($message)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Title and message cannot be empty']);
    exit;
}

$stmt = $conn->prepare('
    INSERT INTO announcements (title, message, sms_sent, sms_status, created_by)
    VALUES (?, ?, ?, ?, ?)
');

if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $conn->error]);
    exit;
}

$stmt->bind_param('ssiss', $title, $message, $smsSent, $smsStatus, $userId);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Announcement created',
        'announcement_id' => $stmt->insert_id
    ]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to create announcement']);
}

$stmt->close();
$conn->close();
?>
