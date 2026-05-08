<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../config/db.php';

if (!$conn) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

$stmt = $conn->prepare('
    SELECT id, template_name, title, message, created_by, created_at, updated_at
    FROM announcement_templates
    ORDER BY created_at DESC
');

if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $conn->error]);
    $conn->close();
    exit;
}

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Query execution failed: ' . $stmt->error]);
    $stmt->close();
    $conn->close();
    exit;
}

$result = $stmt->get_result();
if (!$result) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to get results: ' . $stmt->error]);
    $stmt->close();
    $conn->close();
    exit;
}

$templates = [];
while ($row = $result->fetch_assoc()) {
    $templates[] = $row;
}

echo json_encode([
    'success' => true,
    'data' => $templates,
    'total' => count($templates)
]);

$stmt->close();
$conn->close();
?>
