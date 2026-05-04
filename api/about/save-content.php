<?php
/**
 * Save About Page Content API
 * Upserts the single-row about_page_content record (id = 1)
 * POST /api/about/save-content.php
 */

// Headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, PUT, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Include database connection
require_once '../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    die(json_encode([
        'success' => false,
        'message' => 'Method not allowed. Use POST or PUT.'
    ]));
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Validate required field
if (!isset($input['organization_name']) || empty(trim($input['organization_name']))) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'Organization name is required.'
    ]));
}

$org_name    = trim($input['organization_name']);
$description = isset($input['description']) ? trim($input['description']) : null;
$mission     = isset($input['mission']) ? trim($input['mission']) : null;
$vision      = isset($input['vision']) ? trim($input['vision']) : null;
$photo_path  = isset($input['photo_path'])  && !empty($input['photo_path'])
                ? trim($input['photo_path']) : null;
$updated_by  = isset($input['updated_by'])  && $input['updated_by']
                ? intval($input['updated_by']) : null;

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

// UPSERT — always id = 1 (single config row)
if ($hasMissionColumn && $hasVisionColumn) {
    $stmt = $conn->prepare(
        "INSERT INTO about_page_content (id, organization_name, description, mission, vision, photo_path, updated_by)
         VALUES (1, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           organization_name = VALUES(organization_name),
           description       = VALUES(description),
           mission           = VALUES(mission),
           vision            = VALUES(vision),
           photo_path        = VALUES(photo_path),
           updated_by        = VALUES(updated_by)"
    );
} else {
    $stmt = $conn->prepare(
        "INSERT INTO about_page_content (id, organization_name, description, photo_path, updated_by)
         VALUES (1, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           organization_name = VALUES(organization_name),
           description       = VALUES(description),
           photo_path        = VALUES(photo_path),
           updated_by        = VALUES(updated_by)"
    );
}

if (!$stmt) {
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'message' => 'Database error: ' . $conn->error
    ]));
}

if ($hasMissionColumn && $hasVisionColumn) {
    $stmt->bind_param('sssssi', $org_name, $description, $mission, $vision, $photo_path, $updated_by);
} else {
    $stmt->bind_param('sssi', $org_name, $description, $photo_path, $updated_by);
}

if (!$stmt->execute()) {
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'message' => 'Failed to save about content: ' . $stmt->error
    ]));
}

$stmt->close();

http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'About Us content saved successfully.'
]);
