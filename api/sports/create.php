<?php
/**
 * Create Sport API
 * POST /api/sports/create.php
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

require_once '../../config/db.php';
require_once __DIR__ . '/_helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sports_error(405, 'Method not allowed. Use POST.');
}

$schema = sports_load_schema($conn);
$input = sports_get_json_input();

$sportName = '';
if (isset($input['sport_name']) && trim((string)$input['sport_name']) !== '') {
    $sportName = trim((string)$input['sport_name']);
} elseif (isset($input['sports_name']) && trim((string)$input['sports_name']) !== '') {
    $sportName = trim((string)$input['sports_name']);
}

if ($sportName === '') {
    sports_error(400, 'Sport name is required.');
}

if (strlen($sportName) > 180) {
    sports_error(400, 'Sport name must not exceed 180 characters.');
}

$sportCode = isset($input['sport_code']) ? trim((string)$input['sport_code']) : '';
if ($sportCode !== '' && strlen($sportCode) > 20) {
    sports_error(400, 'Sport code must not exceed 20 characters.');
}

$photoPath = isset($input['photo_path']) ? trim((string)$input['photo_path']) : '';
if ($photoPath !== '' && strlen($photoPath) > 255) {
    sports_error(400, 'Photo path must not exceed 255 characters.');
}

$isActive = isset($input['is_active']) ? (intval($input['is_active']) === 1 ? 1 : 0) : 1;

$check = $conn->prepare('SELECT id FROM sports WHERE ' . $schema['name'] . ' = ? LIMIT 1');
if (!$check) {
    sports_error(500, 'Database error: ' . $conn->error);
}
$check->bind_param('s', $sportName);
$check->execute();
if ($check->get_result()->num_rows > 0) {
    sports_error(409, 'Sport name already exists.');
}
$check->close();

if ($schema['code'] && $sportCode !== '') {
    $checkCode = $conn->prepare('SELECT id FROM sports WHERE ' . $schema['code'] . ' = ? LIMIT 1');
    if (!$checkCode) {
        sports_error(500, 'Database error: ' . $conn->error);
    }
    $checkCode->bind_param('s', $sportCode);
    $checkCode->execute();
    if ($checkCode->get_result()->num_rows > 0) {
        sports_error(409, 'Sport code already exists.');
    }
    $checkCode->close();
}

$columns = [$schema['name']];
$placeholders = ['?'];
$types = 's';
$params = [$sportName];

if ($schema['code']) {
    $columns[] = $schema['code'];
    $placeholders[] = '?';
    $types .= 's';
    $params[] = ($sportCode !== '' ? $sportCode : null);
}

if ($schema['photo']) {
    $columns[] = $schema['photo'];
    $placeholders[] = '?';
    $types .= 's';
    $params[] = ($photoPath !== '' ? $photoPath : null);
}

if ($schema['is_active']) {
    $columns[] = $schema['is_active'];
    $placeholders[] = '?';
    $types .= 'i';
    $params[] = $isActive;
}

$sql = 'INSERT INTO sports (' . implode(', ', $columns) . ') VALUES (' . implode(', ', $placeholders) . ')';
$stmt = $conn->prepare($sql);
if (!$stmt) {
    sports_error(500, 'Database error: ' . $conn->error);
}

$stmt->bind_param($types, ...$params);
if (!$stmt->execute()) {
    sports_error(500, 'Error creating sport: ' . $stmt->error);
}

$newId = $stmt->insert_id;
$stmt->close();

$select = sports_select_sql($schema);
$getStmt = $conn->prepare("SELECT $select FROM sports WHERE id = ? LIMIT 1");
$getStmt->bind_param('i', $newId);
$getStmt->execute();
$created = $getStmt->get_result()->fetch_assoc();
$getStmt->close();

http_response_code(201);
echo json_encode([
    'success' => true,
    'message' => 'Sport created successfully.',
    'data' => $created
]);

$conn->close();
