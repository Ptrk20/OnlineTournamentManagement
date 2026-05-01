<?php
/**
 * Read News API
 * GET /api/news/read.php
 * GET /api/news/read.php?id=1
 * GET /api/news/read.php?search=keyword
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

require_once '../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  http_response_code(405);
  die(json_encode(['success' => false, 'message' => 'Method not allowed. Use GET.']));
}

if (isset($_GET['id'])) {
  $id = intval($_GET['id']);
  if ($id <= 0) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Invalid article ID.']));
  }

  $stmt = $conn->prepare(
    "SELECT id, title, category, excerpt, content, publish_date, photo_path, created_at, updated_at
     FROM news_articles
     WHERE id = ?
     LIMIT 1"
  );

  if (!$stmt) {
    http_response_code(500);
    die(json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]));
  }

  $stmt->bind_param('i', $id);
  $stmt->execute();
  $result = $stmt->get_result();

  if ($result->num_rows === 0) {
    http_response_code(404);
    die(json_encode(['success' => false, 'message' => 'Article not found.']));
  }

  echo json_encode(['success' => true, 'data' => $result->fetch_assoc()]);
  $stmt->close();
  $conn->close();
  exit;
}

$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$limit  = isset($_GET['limit']) ? max(1, intval($_GET['limit'])) : 200;
$offset = isset($_GET['offset']) ? max(0, intval($_GET['offset'])) : 0;

$query = "SELECT id, title, category, excerpt, content, publish_date, photo_path, created_at, updated_at
          FROM news_articles
          WHERE 1=1";
$types = '';
$params = [];

if ($search !== '') {
  $query .= " AND (title LIKE ? OR category LIKE ? OR excerpt LIKE ? OR content LIKE ? )";
  $like = '%' . $search . '%';
  $types .= 'ssss';
  $params[] = $like;
  $params[] = $like;
  $params[] = $like;
  $params[] = $like;
}

$query .= " ORDER BY publish_date DESC, id DESC LIMIT ? OFFSET ?";
$types .= 'ii';
$params[] = $limit;
$params[] = $offset;

$stmt = $conn->prepare($query);
if (!$stmt) {
  http_response_code(500);
  die(json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]));
}

$stmt->bind_param($types, ...$params);
$stmt->execute();
$result = $stmt->get_result();
$rows = $result->fetch_all(MYSQLI_ASSOC);

$countQuery = "SELECT COUNT(*) AS total FROM news_articles WHERE 1=1";
$countTypes = '';
$countParams = [];
if ($search !== '') {
  $countQuery .= " AND (title LIKE ? OR category LIKE ? OR excerpt LIKE ? OR content LIKE ? )";
  $countTypes = 'ssss';
  $like = '%' . $search . '%';
  $countParams = [$like, $like, $like, $like];
}

$countStmt = $conn->prepare($countQuery);
if (!$countStmt) {
  http_response_code(500);
  die(json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]));
}
if ($countTypes !== '') {
  $countStmt->bind_param($countTypes, ...$countParams);
}
$countStmt->execute();
$total = intval($countStmt->get_result()->fetch_assoc()['total'] ?? 0);

http_response_code(200);
echo json_encode([
  'success' => true,
  'data' => $rows,
  'total' => $total,
  'limit' => $limit,
  'offset' => $offset
]);

$stmt->close();
$countStmt->close();
$conn->close();
?>
