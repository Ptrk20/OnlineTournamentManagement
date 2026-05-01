<?php
/**
 * Read Team Members API
 * GET /api/about/members/read.php        — all members
 * GET /api/about/members/read.php?id=1   — single member
 */

// Headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// Include database connection
require_once '../../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    die(json_encode([
        'success' => false,
        'message' => 'Method not allowed. Use GET.'
    ]));
}

$select_cols = "id, full_name, role_title, bio, photo_path, display_order, created_at, updated_at";

// Single member by ID
if (isset($_GET['id'])) {
    $id = intval($_GET['id']);

    if ($id <= 0) {
        http_response_code(400);
        die(json_encode([
            'success' => false,
            'message' => 'Invalid member ID.'
        ]));
    }

    $stmt = $conn->prepare(
        "SELECT $select_cols FROM about_team_members WHERE id = ?"
    );

    if (!$stmt) {
        http_response_code(500);
        die(json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]));
    }

    $stmt->bind_param('i', $id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        http_response_code(404);
        die(json_encode([
            'success' => false,
            'message' => 'Member not found.'
        ]));
    }

    $member = $result->fetch_assoc();
    $stmt->close();

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data'    => $member
    ]);

} else {
    // All members ordered by display_order
    $stmt = $conn->prepare(
        "SELECT $select_cols FROM about_team_members ORDER BY display_order ASC, id ASC"
    );

    if (!$stmt) {
        http_response_code(500);
        die(json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]));
    }

    $stmt->execute();
    $result  = $stmt->get_result();
    $members = [];

    while ($row = $result->fetch_assoc()) {
        $members[] = $row;
    }

    $stmt->close();

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data'    => $members
    ]);
}
