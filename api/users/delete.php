<?php
/**
 * Delete User API
 * Deletes a user from the database
 */

// Headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: DELETE, POST');

// Include database connection
require_once '../../config/db.php';

// Handle DELETE/POST request
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode([
        'success' => false,
        'message' => 'Method not allowed. Use DELETE or POST.'
    ]));
}

// Get JSON input (for DELETE requests)
// or form data (for POST requests with method override)
$input = json_decode(file_get_contents('php://input'), true);

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

// Optional: Prevent deletion of first admin user (ID = 1)
// Uncomment this block if you want this protection
/*
if ($user_id === 1) {
    http_response_code(403);
    die(json_encode([
        'success' => false,
        'message' => 'Cannot delete the system administrator.'
    ]));
}
*/

// Check if user exists
$check_stmt = $conn->prepare("SELECT username FROM users WHERE id = ?");
$check_stmt->bind_param('i', $user_id);
$check_stmt->execute();
$result = $check_stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(404);
    die(json_encode([
        'success' => false,
        'message' => 'User not found.'
    ]));
}

$user = $result->fetch_assoc();
$username = $user['username'];
$check_stmt->close();

// Delete user
$stmt = $conn->prepare("DELETE FROM users WHERE id = ?");

if (!$stmt) {
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'message' => 'Database error: ' . $conn->error
    ]));
}

$stmt->bind_param('i', $user_id);

if ($stmt->execute()) {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'User deleted successfully.',
        'deleted_user' => [
            'id' => $user_id,
            'username' => $username
        ]
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error deleting user: ' . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>
