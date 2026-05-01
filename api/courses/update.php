<?php
/**
 * Update Course API
 * PUT/POST /api/courses/update.php
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PUT, POST');

require_once '../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode([
        'success' => false,
        'message' => 'Method not allowed. Use PUT or POST.'
    ]));
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['id'])) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'Course ID is required.'
    ]));
}

$course_id = intval($input['id']);
$course_name = isset($input['course_name']) ? trim($input['course_name']) : '';

if ($course_id <= 0) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'Invalid course ID.'
    ]));
}

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

$exists_stmt = $conn->prepare('SELECT id FROM courses WHERE id = ?');
if (!$exists_stmt) {
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'message' => 'Database error: ' . $conn->error
    ]));
}

$exists_stmt->bind_param('i', $course_id);
$exists_stmt->execute();
if ($exists_stmt->get_result()->num_rows === 0) {
    http_response_code(404);
    die(json_encode([
        'success' => false,
        'message' => 'Course not found.'
    ]));
}
$exists_stmt->close();

$check_stmt = $conn->prepare('SELECT id FROM courses WHERE course_name = ? AND id != ?');
if (!$check_stmt) {
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'message' => 'Database error: ' . $conn->error
    ]));
}

$check_stmt->bind_param('si', $course_name, $course_id);
$check_stmt->execute();
if ($check_stmt->get_result()->num_rows > 0) {
    http_response_code(409);
    die(json_encode([
        'success' => false,
        'message' => 'Course already exists.'
    ]));
}
$check_stmt->close();

$stmt = $conn->prepare('UPDATE courses SET course_name = ? WHERE id = ?');
if (!$stmt) {
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'message' => 'Database error: ' . $conn->error
    ]));
}

$stmt->bind_param('si', $course_name, $course_id);

if ($stmt->execute()) {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Course updated successfully.',
        'affected_rows' => $stmt->affected_rows
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error updating course: ' . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>