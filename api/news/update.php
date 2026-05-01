<?php
/**
 * Update News API
 * POST /api/news/update.php
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
$title = trim($input['title'] ?? '');
$category = trim($input['category'] ?? 'General');
$excerpt = trim($input['excerpt'] ?? '');
$content = trim($input['content'] ?? '');
$publishDate = trim($input['publish_date'] ?? '');
$photoPath = trim($input['photo_path'] ?? '');

if ($id <= 0 || $title === '' || $excerpt === '' || $publishDate === '') {
  http_response_code(400);
  die(json_encode(['success' => false, 'message' => 'ID, title, excerpt, and publish date are required.']));
}

$dateObj = DateTime::createFromFormat('Y-m-d', $publishDate);
if (!$dateObj || $dateObj->format('Y-m-d') !== $publishDate) {
  http_response_code(400);
  die(json_encode(['success' => false, 'message' => 'Invalid publish date format. Use YYYY-MM-DD.']));
}

if ($category === '') $category = 'General';
if ($photoPath === '') $photoPath = null;
if ($content === '') $content = null;

$stmt = $conn->prepare(
  "UPDATE news_articles
   SET title = ?, category = ?, excerpt = ?, content = ?, publish_date = ?, photo_path = ?
   WHERE id = ?"
);

if (!$stmt) {
  http_response_code(500);
  die(json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]));
}

$stmt->bind_param('ssssssi', $title, $category, $excerpt, $content, $publishDate, $photoPath, $id);

if ($stmt->execute()) {
  echo json_encode([
    'success' => true,
    'message' => 'Article updated successfully.',
    'affected' => $stmt->affected_rows
  ]);
} else {
  http_response_code(500);
  echo json_encode(['success' => false, 'message' => 'Error updating article: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
