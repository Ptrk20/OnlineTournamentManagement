<?php
/**
 * Read About Page Content API
 * Returns the single-row about_page_content record (id = 1)
 * GET /api/about/read-content.php
 */

// Headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// Include database connection
require_once '../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    die(json_encode([
        'success' => false,
        'message' => 'Method not allowed. Use GET.'
    ]));
}

$stmt = $conn->prepare(
    "SELECT id, organization_name, description, photo_path, updated_at
     FROM about_page_content
     WHERE id = 1"
);

if (!$stmt) {
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'message' => 'Database error: ' . $conn->error
    ]));
}

$stmt->execute();
$result = $stmt->get_result();
$data   = $result->num_rows > 0 ? $result->fetch_assoc() : null;
$stmt->close();

http_response_code(200);
echo json_encode([
    'success' => true,
    'data'    => $data
]);
