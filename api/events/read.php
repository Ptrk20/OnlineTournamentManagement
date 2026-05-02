<?php
/**
 * Read Events API
 * GET /api/events/read.php          — all events
 * GET /api/events/read.php?id=1     — single event
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

require_once '../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    die(json_encode(['success' => false, 'message' => 'Method not allowed. Use GET.']));
}

$cols = "e.id, e.public_id, e.title, e.sports_id, s.sport_name,
         e.category, e.event_start_date, e.event_end_date,
         e.location, e.description, e.status,
         e.created_at, e.updated_at,
         COALESCE(COUNT(DISTINCT CASE WHEN tr.status='Approved' THEN tr.id END), 0) AS teams_count";

if (isset($_GET['id'])) {
    $id = intval($_GET['id']);
    if ($id <= 0) {
        http_response_code(400);
        die(json_encode(['success' => false, 'message' => 'Invalid event ID.']));
    }

    $stmt = $conn->prepare(
        "SELECT $cols
           FROM events e
      LEFT JOIN sports s ON s.id = e.sports_id
      LEFT JOIN team_registrations tr ON tr.event_id = e.id
          WHERE e.id = ?
       GROUP BY e.id
          LIMIT 1"
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
        die(json_encode(['success' => false, 'message' => 'Event not found.']));
    }

    echo json_encode(['success' => true, 'data' => $result->fetch_assoc()]);
    $stmt->close();
    $conn->close();
    exit;
}

// Optional filters: status, sports_id
$where = [];
$params = [];
$types  = '';

if (!empty($_GET['status'])) {
    $where[]  = 'e.status = ?';
    $params[] = trim($_GET['status']);
    $types   .= 's';
}

if (!empty($_GET['sports_id'])) {
    $where[]  = 'e.sports_id = ?';
    $params[] = intval($_GET['sports_id']);
    $types   .= 'i';
}

$sql = "SELECT $cols FROM events e LEFT JOIN sports s ON s.id = e.sports_id LEFT JOIN team_registrations tr ON tr.event_id = e.id";
if ($where) {
    $sql .= ' WHERE ' . implode(' AND ', $where);
}
$sql .= ' GROUP BY e.id ORDER BY e.event_start_date DESC';

$stmt = $conn->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    die(json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]));
}

if ($params) {
    $stmt->bind_param($types, ...$params);
}

$stmt->execute();
$rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

http_response_code(200);
echo json_encode(['success' => true, 'data' => $rows, 'total' => count($rows)]);

$stmt->close();
$conn->close();
