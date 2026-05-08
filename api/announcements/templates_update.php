<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../config/db.php';

if (!$conn) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['id']) || !isset($data['template_name']) || !isset($data['title']) || !isset($data['message'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'ID, template name, title, and message are required']);
    $conn->close();
    exit;
}

$id = (int)$data['id'];
$templateName = trim($data['template_name']);
$title = trim($data['title']);
$message = trim($data['message']);

if (empty($templateName) || empty($title) || empty($message)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Template name, title, and message cannot be empty']);
    $conn->close();
    exit;
}

$stmt = $conn->prepare('UPDATE announcement_templates SET template_name = ?, title = ?, message = ? WHERE id = ?');

if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $conn->error]);
    $conn->close();
    exit;
}

$stmt->bind_param('sssi', $templateName, $title, $message, $id);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to update template: ' . $stmt->error]);
    $stmt->close();
    $conn->close();
    exit;
}

echo json_encode(['success' => true, 'message' => 'Template updated']);

$stmt->close();
$conn->close();
?>
