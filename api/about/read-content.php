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

$hasMissionColumn = false;
$hasVisionColumn = false;

$missionCol = $conn->query("SHOW COLUMNS FROM about_page_content LIKE 'mission'");
if ($missionCol && $missionCol->num_rows > 0) {
    $hasMissionColumn = true;
}

$visionCol = $conn->query("SHOW COLUMNS FROM about_page_content LIKE 'vision'");
if ($visionCol && $visionCol->num_rows > 0) {
    $hasVisionColumn = true;
}

$missionSelect = $hasMissionColumn ? 'mission' : "'' AS mission";
$visionSelect = $hasVisionColumn ? 'vision' : "'' AS vision";

$stmt = $conn->prepare(
    "SELECT id, organization_name, description, photo_path, $missionSelect, $visionSelect, updated_at
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
