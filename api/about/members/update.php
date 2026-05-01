<?php
/**
 * Update Team Member API
 * Updates an existing row in about_team_members
 * PUT /api/about/members/update.php
 */

// Headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PUT, POST');

// Include database connection
require_once '../../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode([
        'success' => false,
        'message' => 'Method not allowed. Use PUT or POST.'
    ]));
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Validate ID
if (!isset($input['id'])) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Member ID is required.']));
}

$id = intval($input['id']);
if ($id <= 0) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Invalid member ID.']));
}

// Check the member exists
$check = $conn->prepare("SELECT id FROM about_team_members WHERE id = ?");
$check->bind_param('i', $id);
$check->execute();
if ($check->get_result()->num_rows === 0) {
    http_response_code(404);
    die(json_encode(['success' => false, 'message' => 'Member not found.']));
}
$check->close();

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
$bio           = isset($input['bio'])        && !empty(trim($input['bio']))
                  ? trim($input['bio']) : null;
$photo_path    = isset($input['photo_path']) && !empty(trim($input['photo_path']))
                  ? trim($input['photo_path']) : null;
$new_order     = isset($input['display_order']) ? intval($input['display_order']) : 1;
if ($new_order < 1) $new_order = 1;

// ── Fetch current display_order ───────────────────────────────────────────
$old_stmt = $conn->prepare("SELECT display_order FROM about_team_members WHERE id = ?");
$old_stmt->bind_param('i', $id);
$old_stmt->execute();
$old_row   = $old_stmt->get_result()->fetch_assoc();
$old_stmt->close();
$old_order = $old_row ? intval($old_row['display_order']) : $new_order;

// ── Clamp new_order to valid range ────────────────────────────────────────
$count_stmt = $conn->prepare("SELECT COUNT(*) AS cnt FROM about_team_members");
$count_stmt->execute();
$count_row  = $count_stmt->get_result()->fetch_assoc();
$count_stmt->close();
$total      = intval($count_row['cnt']);
if ($new_order > $total) $new_order = $total;

// ── Shift other rows to keep order contiguous ─────────────────────────────
if ($new_order !== $old_order) {
    if ($new_order < $old_order) {
        // Moving up: push rows in [$new_order, $old_order) down by 1
        $shift = $conn->prepare(
            "UPDATE about_team_members
             SET display_order = display_order + 1
             WHERE id != ? AND display_order >= ? AND display_order < ?"
        );
        $shift->bind_param('iii', $id, $new_order, $old_order);
    } else {
        // Moving down: pull rows in ($old_order, $new_order] up by 1
        $shift = $conn->prepare(
            "UPDATE about_team_members
             SET display_order = display_order - 1
             WHERE id != ? AND display_order > ? AND display_order <= ?"
        );
        $shift->bind_param('iii', $id, $old_order, $new_order);
    }

    if (!$shift->execute()) {
        http_response_code(500);
        die(json_encode(['success' => false, 'message' => 'Failed to reorder members: ' . $shift->error]));
    }
    $shift->close();
}

// ── Apply the update to the target member ────────────────────────────────
$stmt = $conn->prepare(
    "UPDATE about_team_members
     SET full_name = ?, role_title = ?, bio = ?, photo_path = ?, display_order = ?
     WHERE id = ?"
);

if (!$stmt) {
    http_response_code(500);
    die(json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]));
}

$stmt->bind_param('ssssii', $full_name, $role_title, $bio, $photo_path, $new_order, $id);

if (!$stmt->execute()) {
    http_response_code(500);
    die(json_encode(['success' => false, 'message' => 'Failed to update member: ' . $stmt->error]));
}

$stmt->close();

http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Team member updated successfully.'
]);
