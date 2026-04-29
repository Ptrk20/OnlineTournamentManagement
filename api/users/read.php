<?php
/**
 * Read Users API
 * Retrieves user(s) from the database
 * GET /api/users/read.php - Get all users
 * GET /api/users/read.php?id=1 - Get specific user by ID
 */

// Headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// Include database connection
require_once '../../config/db.php';

// Handle GET request
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    die(json_encode([
        'success' => false,
        'message' => 'Method not allowed. Use GET.'
    ]));
}

// Check if specific user ID is requested
if (isset($_GET['id'])) {
    $user_id = intval($_GET['id']);
    
    if ($user_id <= 0) {
        http_response_code(400);
        die(json_encode([
            'success' => false,
            'message' => 'Invalid user ID.'
        ]));
    }
    
    // Get specific user
    $stmt = $conn->prepare("SELECT id, username, full_name, email, phone, role, status, created_at, updated_at FROM users WHERE id = ?");
    
    if (!$stmt) {
        http_response_code(500);
        die(json_encode([
            'success' => false,
            'message' => 'Database error: ' . $conn->error
        ]));
    }
    
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        http_response_code(404);
        die(json_encode([
            'success' => false,
            'message' => 'User not found.'
        ]));
    }
    
    $user = $result->fetch_assoc();
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $user
    ]);
    
} else {
    // Get all users with optional filtering
    $role = isset($_GET['role']) ? trim($_GET['role']) : null;
    $status = isset($_GET['status']) ? trim($_GET['status']) : null;
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;
    $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
    
    // Build query
    $query = "SELECT id, username, full_name, email, phone, role, status, created_at, updated_at FROM users WHERE 1=1";
    $types = '';
    $params = [];
    
    if ($role) {
        $query .= " AND role = ?";
        $types .= 's';
        $params[] = $role;
    }
    
    if ($status) {
        $query .= " AND status = ?";
        $types .= 's';
        $params[] = $status;
    }
    
    $query .= " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    $types .= 'ii';
    $params[] = $limit;
    $params[] = $offset;
    
    // Execute query
    $stmt = $conn->prepare($query);
    
    if (!$stmt) {
        http_response_code(500);
        die(json_encode([
            'success' => false,
            'message' => 'Database error: ' . $conn->error
        ]));
    }
    
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    $users = $result->fetch_all(MYSQLI_ASSOC);
    
    // Get total count
    $count_query = "SELECT COUNT(*) as total FROM users WHERE 1=1";
    if ($role) $count_query .= " AND role = '$role'";
    if ($status) $count_query .= " AND status = '$status'";
    
    $count_result = $conn->query($count_query);
    $count_row = $count_result->fetch_assoc();
    $total = $count_row['total'];
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $users,
        'total' => $total,
        'limit' => $limit,
        'offset' => $offset
    ]);
}

$stmt->close();
$conn->close();
?>
