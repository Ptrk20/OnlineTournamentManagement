<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../config/db.php';

if (!$conn) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['template_name']) || !isset($data['title']) || !isset($data['message'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Template name, title, and message are required']);
    $conn->close();
    exit;
}

$templateName = trim($data['template_name']);
$title = trim($data['title']);
$message = trim($data['message']);
$userId = isset($data['created_by']) ? (int)$data['created_by'] : null;

if (empty($templateName) || empty($title) || empty($message)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Template name, title, and message cannot be empty']);
    $conn->close();
    exit;
}

$stmt = $conn->prepare('INSERT INTO announcement_templates (template_name, title, message, created_by) VALUES (?, ?, ?, ?)');

if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $conn->error]);
    $conn->close();
    exit;
}

$stmt->bind_param('sssi', $templateName, $title, $message, $userId);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to create template: ' . $stmt->error]);
    $stmt->close();
    $conn->close();
    exit;
}

echo json_encode([
    'success' => true,
    'message' => 'Template created',
    'template_id' => $stmt->insert_id
]);

$stmt->close();
$conn->close();
?>
