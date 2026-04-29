<?php
/**
 * Create User API
 * Inserts a new user into the database with bcrypt hashed password
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

// Validate required fields
$required_fields = ['username', 'password', 'full_name', 'email'];
foreach ($required_fields as $field) {
    if (!isset($input[$field]) || empty(trim($input[$field]))) {
        http_response_code(400);
        die(json_encode([
            'success' => false,
            'message' => "Field '$field' is required."
        ]));
    }
}

// Prepare input data
$username = trim($input['username']);
$password = trim($input['password']);
$full_name = trim($input['full_name']);
$email = trim($input['email']);
$phone = isset($input['phone']) ? trim($input['phone']) : null;
$role = isset($input['role']) ? trim($input['role']) : 'Organizer';
$status = isset($input['status']) ? trim($input['status']) : 'Active';

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'Invalid email format.'
    ]));
}

// Validate username length
if (strlen($username) < 3 || strlen($username) > 50) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'Username must be between 3 and 50 characters.'
    ]));
}

// Validate password length
if (strlen($password) < 6) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'Password must be at least 6 characters.'
    ]));
}

// Hash password using bcrypt
$password_hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

// Check if username already exists
$check_stmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
$check_stmt->bind_param('s', $username);
$check_stmt->execute();
if ($check_stmt->get_result()->num_rows > 0) {
    http_response_code(409);
    die(json_encode([
        'success' => false,
        'message' => 'Username already exists.'
    ]));
}
$check_stmt->close();

// Check if email already exists
$check_stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
$check_stmt->bind_param('s', $email);
$check_stmt->execute();
if ($check_stmt->get_result()->num_rows > 0) {
    http_response_code(409);
    die(json_encode([
        'success' => false,
        'message' => 'Email already exists.'
    ]));
}
$check_stmt->close();

// Insert new user
$stmt = $conn->prepare("INSERT INTO users (username, password_hash, full_name, email, phone, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)");

if (!$stmt) {
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'message' => 'Database error: ' . $conn->error
    ]));
}

$stmt->bind_param('sssssss', $username, $password_hash, $full_name, $email, $phone, $role, $status);

if ($stmt->execute()) {
    $user_id = $stmt->insert_id;
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'User created successfully.',
        'user_id' => $user_id,
        'user' => [
            'id' => $user_id,
            'username' => $username,
            'full_name' => $full_name,
            'email' => $email,
            'phone' => $phone,
            'role' => $role,
            'status' => $status
        ]
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error creating user: ' . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>
