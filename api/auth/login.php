<?php
/**
 * User Login API
 * Authenticates user credentials and returns success/failure response
 */

// Headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

// Include database connection
require_once '../../config/db.php';

// Handle POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode([
        'success' => false,
        'message' => 'Method not allowed. Use POST.'
    ]));
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['username']) || !isset($input['password'])) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'Username and password are required.'
    ]));
}

$username = trim($input['username']);
$password = $input['password'];

// Validate input
if (empty($username) || empty($password)) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'Username and password cannot be empty.'
    ]));
}

// Query database for user
$stmt = $conn->prepare("SELECT id, username, password_hash, full_name, email, role, status FROM users WHERE username = ? AND status = 'Active'");

if (!$stmt) {
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'message' => 'Database error: ' . $conn->error
    ]));
}

$stmt->bind_param('s', $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(401);
    die(json_encode([
        'success' => false,
        'message' => 'Invalid username or password.'
    ]));
}

$user = $result->fetch_assoc();

// Verify password using bcrypt
if (!password_verify($password, $user['password_hash'])) {
    http_response_code(401);
    die(json_encode([
        'success' => false,
        'message' => 'Invalid username or password.'
    ]));
}

// Login successful
// Start session and set user data
session_start();
$_SESSION['user_id'] = $user['id'];
$_SESSION['username'] = $user['username'];
$_SESSION['full_name'] = $user['full_name'];
$_SESSION['email'] = $user['email'];
$_SESSION['role'] = $user['role'];

http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Login successful.',
    'user' => [
        'id' => $user['id'],
        'username' => $user['username'],
        'full_name' => $user['full_name'],
        'email' => $user['email'],
        'role' => $user['role']
    ]
]);

$stmt->close();
$conn->close();
?>
