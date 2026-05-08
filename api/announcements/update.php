<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../config/db.php';

if (!$conn) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['id']) || !isset($data['title']) || !isset($data['message'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'ID, title, and message are required']);
    $conn->close();
    exit;
}

$id = (int)$data['id'];
$title = trim($data['title']);
$message = trim($data['message']);
$smsSent = isset($data['sms_sent']) ? (int)$data['sms_sent'] : null;
$smsStatus = isset($data['sms_status']) ? $data['sms_status'] : null;

if (empty($title) || empty($message)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Title and message cannot be empty']);
    $conn->close();
    exit;
}

$updateFields = ['title = ?', 'message = ?'];
$params = [$title, $message];
$types = 'ss';

if ($smsSent !== null) {
    $updateFields[] = 'sms_sent = ?';
    $params[] = $smsSent;
    $types .= 'i';
}

if ($smsStatus !== null) {
    $updateFields[] = 'sms_status = ?';
    $params[] = $smsStatus;
    $types .= 's';
}

$params[] = $id;
$types .= 'i';

$query = 'UPDATE announcements SET ' . implode(', ', $updateFields) . ' WHERE id = ?';
$stmt = $conn->prepare($query);

if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $conn->error]);
    $conn->close();
    exit;
}

$stmt->bind_param($types, ...$params);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to update announcement: ' . $stmt->error]);
    $stmt->close();
    $conn->close();
    exit;
}

echo json_encode(['success' => true, 'message' => 'Announcement updated']);

$stmt->close();
$conn->close();
?>
