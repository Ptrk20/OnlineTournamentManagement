<?php
/**
 * Delete Course API
 * DELETE/POST /api/courses/delete.php
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: DELETE, POST');

require_once '../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode([
        'success' => false,
        'message' => 'Method not allowed. Use DELETE or POST.'
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
if ($course_id <= 0) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'Invalid course ID.'
    ]));
}

$check_stmt = $conn->prepare('SELECT course_name FROM courses WHERE id = ?');
if (!$check_stmt) {
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'message' => 'Database error: ' . $conn->error
    ]));
}

$check_stmt->bind_param('i', $course_id);
$check_stmt->execute();
$result = $check_stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(404);
    die(json_encode([
        'success' => false,
        'message' => 'Course not found.'
    ]));
}

$course = $result->fetch_assoc();
$check_stmt->close();

$stmt = $conn->prepare('DELETE FROM courses WHERE id = ?');
if (!$stmt) {
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'message' => 'Database error: ' . $conn->error
    ]));
}

$stmt->bind_param('i', $course_id);

if ($stmt->execute()) {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Course deleted successfully.',
        'deleted_course' => [
            'id' => $course_id,
            'course_name' => $course['course_name']
        ]
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error deleting course: ' . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>