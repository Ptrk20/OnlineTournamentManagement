<?php
/**
 * Delete News API
 * POST /api/news/delete.php
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

require_once '../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  die(json_encode(['success' => false, 'message' => 'Method not allowed. Use POST.']));
}

$input = json_decode(file_get_contents('php://input'), true);
$id = intval($input['id'] ?? 0);

if ($id <= 0) {
  http_response_code(400);
  die(json_encode(['success' => false, 'message' => 'Invalid article ID.']));
}

$stmt = $conn->prepare("DELETE FROM news_articles WHERE id = ?");
if (!$stmt) {
  http_response_code(500);
  die(json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]));
}

$stmt->bind_param('i', $id);

if ($stmt->execute()) {
  echo json_encode([
    'success' => true,
    'message' => 'Article deleted successfully.',
    'affected' => $stmt->affected_rows
  ]);
} else {
  http_response_code(500);
  echo json_encode(['success' => false, 'message' => 'Error deleting article: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
