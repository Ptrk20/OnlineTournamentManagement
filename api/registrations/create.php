<?php
/**
 * Create Registration API
 * POST /api/registrations/create.php
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
if (!is_array($input)) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'Invalid JSON payload.'
    ]));
}

$required_fields = [
    'team_name',
    'sports_id',
    'event_id',
    'category',
    'representative_name',
    'representative_first_name',
    'representative_last_name',
    'representative_student_id',
    'representative_course_id',
    'contact_number',
    'email_address',
    'coach',
    'players',
    'submitted_by_name',
    'submitted_by_role',
    'created_by_id'
];

foreach ($required_fields as $field) {
    if (!array_key_exists($field, $input)) {
        http_response_code(400);
        die(json_encode([
            'success' => false,
            'message' => "Field '$field' is required."
        ]));
    }
}

$team_name = trim((string)$input['team_name']);
$sports_id = intval($input['sports_id']);
$event_id = intval($input['event_id']);
$category = trim((string)$input['category']);
$representative_name = trim((string)$input['representative_name']);
$representative_first_name = trim((string)$input['representative_first_name']);
$representative_last_name = trim((string)$input['representative_last_name']);
$representative_student_id = trim((string)$input['representative_student_id']);
$representative_course_id = intval($input['representative_course_id']);
$contact_number = trim((string)$input['contact_number']);
$email_address = trim((string)$input['email_address']);

$coach = is_array($input['coach']) ? $input['coach'] : [];
$coach_first_name = trim((string)($coach['first_name'] ?? ''));
$coach_last_name = trim((string)($coach['last_name'] ?? ''));

$players = is_array($input['players']) ? $input['players'] : [];
$documents = is_array($input['documents'] ?? null) ? $input['documents'] : [];

$notes = trim((string)($input['notes'] ?? ''));
$status = trim((string)($input['status'] ?? 'Pending'));
$submitted_by_name = trim((string)$input['submitted_by_name']);
$submitted_by_role = trim((string)$input['submitted_by_role']);
$created_by_id = intval($input['created_by_id']);
$reviewed_by_name = trim((string)($input['reviewed_by_name'] ?? ''));

if ($team_name === '' || $sports_id <= 0 || $event_id <= 0 || $category === '') {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'Team name, sport, category, and event are required.'
    ]));
}

if ($representative_first_name === '' || $representative_last_name === '' || $representative_student_id === '' || $representative_course_id <= 0 || $contact_number === '' || $email_address === '') {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'Representative information is incomplete.'
    ]));
}

if (!filter_var($email_address, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'Invalid email address.'
    ]));
}

if ($coach_first_name === '' || $coach_last_name === '') {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'Coach/Manager first and last name are required.'
    ]));
}

if (count($players) === 0) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'At least one player is required.'
    ]));
}

$valid_categories = ['Mens', 'Womens', 'Open'];
if (!in_array($category, $valid_categories, true)) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'Invalid category. Must be Mens, Womens, or Open.'
    ]));
}

$valid_statuses = ['Pending', 'Approved', 'Rejected'];
if (!in_array($status, $valid_statuses, true)) {
    $status = 'Pending';
}

$normalized_role = strtolower($submitted_by_role);
if ($normalized_role === 'administrator') {
    $submitted_by_role = 'Administrator';
} elseif ($normalized_role === 'representative') {
    $submitted_by_role = 'Representative';
} else {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'Invalid submitted_by_role.'
    ]));
}

if ($created_by_id <= 0) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'Invalid creator user ID.'
    ]));
}

$players_json = json_encode($players, JSON_UNESCAPED_UNICODE);
$documents_json = json_encode($documents, JSON_UNESCAPED_UNICODE);

if ($players_json === false || $documents_json === false) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'Unable to encode players/documents payload.'
    ]));
}

$sql = "INSERT INTO team_registrations (
    team_name,
    sports_id,
    event_id,
    category,
    representative_name,
    representative_first_name,
    representative_last_name,
    representative_student_id,
    representative_course_id,
    contact_number,
    email_address,
    coach_first_name,
    coach_last_name,
    players_json,
    documents_json,
    notes,
    status,
    submitted_by_name,
    submitted_by_role,
    created_by_id,
    reviewed_by_name
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'message' => 'Database error: ' . $conn->error
    ]));
}

$stmt->bind_param(
    'siisssssissssssssssis',
    $team_name,
    $sports_id,
    $event_id,
    $category,
    $representative_name,
    $representative_first_name,
    $representative_last_name,
    $representative_student_id,
    $representative_course_id,
    $contact_number,
    $email_address,
    $coach_first_name,
    $coach_last_name,
    $players_json,
    $documents_json,
    $notes,
    $status,
    $submitted_by_name,
    $submitted_by_role,
    $created_by_id,
    $reviewed_by_name
);

if ($stmt->execute()) {
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Registration created successfully.',
        'registration_id' => $stmt->insert_id
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error creating registration: ' . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>