<?php
/**
 * Read Registrations API
 * GET /api/registrations/read.php
 * GET /api/registrations/read.php?id=1
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

$select = "
  r.id,
  r.team_name,
  r.sports_id,
  s.sport_name,
  r.event_id,
  e.title AS event_name,
  r.category,
  r.representative_name,
  r.representative_first_name,
  r.representative_last_name,
  r.representative_student_id,
  r.representative_course_id,
  c.course_name AS representative_course_name,
  r.contact_number,
  r.email_address,
  r.coach_first_name,
  r.coach_last_name,
  r.players_json,
  r.documents_json,
  r.notes,
  r.status,
  r.submitted_by_name,
  r.submitted_by_role,
  r.created_by_id,
  r.reviewed_by_name,
  r.reviewed_at,
  r.submitted_at,
  r.created_at,
  r.updated_at
";

$from = "
  FROM team_registrations r
  LEFT JOIN sports s ON s.id = r.sports_id
  LEFT JOIN events e ON e.id = r.event_id
  LEFT JOIN courses c ON c.id = r.representative_course_id
";

function decode_registration_row($row) {
    $players = [];
    if (!empty($row['players_json'])) {
        $decoded = json_decode($row['players_json'], true);
        if (is_array($decoded)) {
            $players = $decoded;
        }
    }

    $documents = [];
    if (!empty($row['documents_json'])) {
        $decoded = json_decode($row['documents_json'], true);
        if (is_array($decoded)) {
            $documents = $decoded;
        }
    }

    $row['coach'] = [
        'first_name' => $row['coach_first_name'] ?? '',
        'last_name' => $row['coach_last_name'] ?? ''
    ];

    $row['players'] = $players;
    $row['documents'] = $documents;
    $row['players_count'] = count($players);

    unset($row['players_json'], $row['documents_json']);
    return $row;
}

if (isset($_GET['id'])) {
    $id = intval($_GET['id']);
    if ($id <= 0) {
        http_response_code(400);
        die(json_encode([
            'success' => false,
            'message' => 'Invalid registration ID.'
        ]));
    }

    $sql = "SELECT $select $from WHERE r.id = ? LIMIT 1";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        http_response_code(500);
        die(json_encode([
            'success' => false,
            'message' => 'Database error: ' . $conn->error
        ]));
    }

    $stmt->bind_param('i', $id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        http_response_code(404);
        die(json_encode([
            'success' => false,
            'message' => 'Registration not found.'
        ]));
    }

    $row = decode_registration_row($result->fetch_assoc());

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $row
    ]);

    $stmt->close();
    $conn->close();
    exit;
}

$sql = "SELECT $select $from ORDER BY r.submitted_at DESC";
$result = $conn->query($sql);
if (!$result) {
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'message' => 'Database error: ' . $conn->error
    ]));
}

$rows = [];
while ($row = $result->fetch_assoc()) {
    $rows[] = decode_registration_row($row);
}

http_response_code(200);
echo json_encode([
    'success' => true,
    'data' => $rows,
    'total' => count($rows)
]);

$conn->close();
?>