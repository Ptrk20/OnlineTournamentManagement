<?php
/**
 * Read Courses API
 * GET /api/courses/read.php        -> list all courses
 * GET /api/courses/read.php?id=1   -> get single course
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

require_once '../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    die(json_encode([
        'success' => false,
        'message' => 'Method not allowed. Use GET.'
    ]));
}

if (isset($_GET['id'])) {
    $course_id = intval($_GET['id']);

    if ($course_id <= 0) {
        http_response_code(400);
        die(json_encode([
            'success' => false,
            'message' => 'Invalid course ID.'
        ]));
    }

    $stmt = $conn->prepare('SELECT id, course_name, created_at, updated_at FROM courses WHERE id = ?');
    if (!$stmt) {
        http_response_code(500);
        die(json_encode([
            'success' => false,
            'message' => 'Database error: ' . $conn->error
        ]));
    }

    $stmt->bind_param('i', $course_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        http_response_code(404);
        die(json_encode([
            'success' => false,
            'message' => 'Course not found.'
        ]));
    }

    $course = $result->fetch_assoc();

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $course
    ]);

    $stmt->close();
    $conn->close();
    exit;
}

$stmt = $conn->prepare('SELECT id, course_name, created_at, updated_at FROM courses ORDER BY course_name ASC');
if (!$stmt) {
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'message' => 'Database error: ' . $conn->error
    ]));
}

$stmt->execute();
$result = $stmt->get_result();
$courses = $result->fetch_all(MYSQLI_ASSOC);

http_response_code(200);
echo json_encode([
    'success' => true,
    'data' => $courses,
    'total' => count($courses)
]);

$stmt->close();
$conn->close();
?>