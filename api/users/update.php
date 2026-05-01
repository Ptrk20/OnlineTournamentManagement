<?php
/**
 * Update User API
 * Updates an existing user in the database
 */

// Headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PUT, POST');

// Include database connection
require_once '../../config/db.php';

// Handle PUT/POST request
if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode([
        'success' => false,
        'message' => 'Method not allowed. Use PUT or POST.'
    ]));
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Validate user ID
if (!isset($input['id'])) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'User ID is required.'
    ]));
}

$user_id = intval($input['id']);

if ($user_id <= 0) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'Invalid user ID.'
    ]));
}

// Check if user exists
$check_stmt = $conn->prepare("SELECT id FROM users WHERE id = ?");
$check_stmt->bind_param('i', $user_id);
$check_stmt->execute();
if ($check_stmt->get_result()->num_rows === 0) {
    http_response_code(404);
    die(json_encode([
        'success' => false,
        'message' => 'User not found.'
    ]));
}
$check_stmt->close();

// Prepare update fields
$updates = [];
$types = '';
$params = [];

// Update password if provided
if (isset($input['password']) && !empty($input['password'])) {
    $password = trim($input['password']);
    if (strlen($password) < 6) {
        http_response_code(400);
        die(json_encode([
            'success' => false,
            'message' => 'Password must be at least 6 characters.'
        ]));
    }
    $password_hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    $updates[] = 'password_hash = ?';
    $types .= 's';
    $params[] = $password_hash;
}

// Update email if provided
if (isset($input['email']) && !empty($input['email'])) {
    $email = trim($input['email']);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        die(json_encode([
            'success' => false,
            'message' => 'Invalid email format.'
        ]));
    }
    
    // Check if email is already taken by another user
    $check_stmt = $conn->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
    $check_stmt->bind_param('si', $email, $user_id);
    $check_stmt->execute();
    if ($check_stmt->get_result()->num_rows > 0) {
        http_response_code(409);
        die(json_encode([
            'success' => false,
            'message' => 'Email already exists.'
        ]));
    }
    $check_stmt->close();
    
    $updates[] = 'email = ?';
    $types .= 's';
    $params[] = $email;
}

// Update full_name if provided
if (isset($input['full_name']) && !empty($input['full_name'])) {
    $full_name = trim($input['full_name']);
    $updates[] = 'full_name = ?';
    $types .= 's';
    $params[] = $full_name;
}

// Update phone if provided
if (isset($input['phone'])) {
    $phone = !empty($input['phone']) ? trim($input['phone']) : null;
    $updates[] = 'phone = ?';
    $types .= 's';
    $params[] = $phone;
}

// Update role if provided
if (isset($input['role']) && !empty($input['role'])) {
    $role = trim($input['role']);
    $valid_roles = ['Administrator', 'Organizer', 'Staff'];
    if (!in_array($role, $valid_roles)) {
        http_response_code(400);
        die(json_encode([
            'success' => false,
            'message' => 'Invalid role. Must be Administrator, Organizer, or Staff.'
        ]));
    }
    $updates[] = 'role = ?';
    $types .= 's';
    $params[] = $role;
}

// Update status if provided
if (isset($input['status']) && !empty($input['status'])) {
    $status = trim($input['status']);
    $valid_statuses = ['Active', 'Inactive'];
    if (!in_array($status, $valid_statuses)) {
        http_response_code(400);
        die(json_encode([
            'success' => false,
            'message' => 'Invalid status. Must be Active or Inactive.'
        ]));
    }
    $updates[] = 'status = ?';
    $types .= 's';
    $params[] = $status;
}

// Check if any fields to update
if (empty($updates)) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'No fields to update.'
    ]));
}

// Build and execute update query
$query = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?";
$types .= 'i';
$params[] = $user_id;

$stmt = $conn->prepare($query);

if (!$stmt) {
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'message' => 'Database error: ' . $conn->error
    ]));
}

$stmt->bind_param($types, ...$params);

if ($stmt->execute()) {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'User updated successfully.',
        'affected_rows' => $stmt->affected_rows
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error updating user: ' . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>
