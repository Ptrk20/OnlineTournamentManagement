<?php
/**
 * Create Course API
 * POST /api/courses/create.php
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

require_once '../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode([
        'success' => false,
        'message' => 'Method not allowed. Use POST.'
    ]));
}

$input = json_decode(file_get_contents('php://input'), true);
$course_name = isset($input['course_name']) ? trim($input['course_name']) : '';

if ($course_name === '') {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'Course name is required.'
    ]));
}

if (strlen($course_name) > 180) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'Course name must not exceed 180 characters.'
    ]));
}

$check_stmt = $conn->prepare('SELECT id FROM courses WHERE course_name = ?');
if (!$check_stmt) {
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'message' => 'Database error: ' . $conn->error
    ]));
}

$check_stmt->bind_param('s', $course_name);
$check_stmt->execute();
if ($check_stmt->get_result()->num_rows > 0) {
    http_response_code(409);
    die(json_encode([
        'success' => false,
        'message' => 'Course already exists.'
    ]));
}
$check_stmt->close();

$stmt = $conn->prepare('INSERT INTO courses (course_name) VALUES (?)');
if (!$stmt) {
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'message' => 'Database error: ' . $conn->error
    ]));
}

$stmt->bind_param('s', $course_name);

if ($stmt->execute()) {
    $course_id = $stmt->insert_id;
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Course created successfully.',
        'course_id' => $course_id,
        'data' => [
            'id' => $course_id,
            'course_name' => $course_name
        ]
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error creating course: ' . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>