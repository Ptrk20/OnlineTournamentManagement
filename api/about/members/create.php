<?php
/**
 * Create Team Member API
 * Inserts a new row into about_team_members
 * POST /api/about/members/create.php
 */

// Headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

// Include database connection
require_once '../../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode([
        'success' => false,
        'message' => 'Method not allowed. Use POST.'
    ]));
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
if (!isset($input['full_name']) || empty(trim($input['full_name']))) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Full name is required.']));
}

if (!isset($input['role_title']) || empty(trim($input['role_title']))) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Role/Title is required.']));
}

// Sanitize inputs
$full_name     = trim($input['full_name']);
$role_title    = trim($input['role_title']);
$bio           = isset($input['bio'])           && !empty(trim($input['bio']))
                  ? trim($input['bio']) : null;
$photo_path    = isset($input['photo_path'])    && !empty(trim($input['photo_path']))
                  ? trim($input['photo_path']) : null;
$display_order = isset($input['display_order']) ? intval($input['display_order']) : 1;

if ($display_order < 1) $display_order = 1;

$stmt = $conn->prepare(
    "INSERT INTO about_team_members (full_name, role_title, bio, photo_path, display_order)
     VALUES (?, ?, ?, ?, ?)"
);

if (!$stmt) {
    http_response_code(500);
    die(json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]));
}

$stmt->bind_param('ssssi', $full_name, $role_title, $bio, $photo_path, $display_order);

if (!$stmt->execute()) {
    http_response_code(500);
    die(json_encode(['success' => false, 'message' => 'Failed to create member: ' . $stmt->error]));
}

$new_id = $stmt->insert_id;
$stmt->close();

http_response_code(201);
echo json_encode([
    'success' => true,
    'message' => 'Team member added successfully.',
    'id'      => $new_id
]);
