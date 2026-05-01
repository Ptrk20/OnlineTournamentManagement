<?php
/**
 * Read Sports API
 * GET /api/sports/read.php
 * GET /api/sports/read.php?id=1
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

require_once '../../config/db.php';
require_once __DIR__ . '/_helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sports_error(405, 'Method not allowed. Use GET.');
}

$schema = sports_load_schema($conn);
$select = sports_select_sql($schema);

if (isset($_GET['id'])) {
    $id = intval($_GET['id']);
    if ($id <= 0) {
        sports_error(400, 'Invalid sport ID.');
    }

    $stmt = $conn->prepare("SELECT $select FROM sports WHERE id = ? LIMIT 1");
    if (!$stmt) {
        sports_error(500, 'Database error: ' . $conn->error);
    }

    $stmt->bind_param('i', $id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        sports_error(404, 'Sport not found.');
    }

    $row = $result->fetch_assoc();
    echo json_encode([
        'success' => true,
        'data' => $row
    ]);

    $stmt->close();
    $conn->close();
    exit;
}

$query = "SELECT $select FROM sports ORDER BY id DESC";
$result = $conn->query($query);
if (!$result) {
    sports_error(500, 'Database error: ' . $conn->error);
}

$rows = $result->fetch_all(MYSQLI_ASSOC);

http_response_code(200);
echo json_encode([
    'success' => true,
    'data' => $rows,
    'total' => count($rows)
]);

$conn->close();
