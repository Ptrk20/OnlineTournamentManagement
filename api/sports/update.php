<?php
/**
 * Update Sport API
 * POST/PUT /api/sports/update.php
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PUT, POST');

require_once '../../config/db.php';
require_once __DIR__ . '/_helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
    sports_error(405, 'Method not allowed. Use POST or PUT.');
}

$schema = sports_load_schema($conn);
$input = sports_get_json_input();

if (!isset($input['id'])) {
    sports_error(400, 'Sport ID is required.');
}

$id = intval($input['id']);
if ($id <= 0) {
    sports_error(400, 'Invalid sport ID.');
}

$exists = $conn->prepare('SELECT id FROM sports WHERE id = ? LIMIT 1');
if (!$exists) {
    sports_error(500, 'Database error: ' . $conn->error);
}
$exists->bind_param('i', $id);
$exists->execute();
if ($exists->get_result()->num_rows === 0) {
    sports_error(404, 'Sport not found.');
}
$exists->close();

$updates = [];
$types = '';
$params = [];

if (isset($input['sport_name']) || isset($input['sports_name'])) {
    $sportName = isset($input['sport_name']) && trim((string)$input['sport_name']) !== ''
        ? trim((string)$input['sport_name'])
        : trim((string)($input['sports_name'] ?? ''));

    if ($sportName === '') {
        sports_error(400, 'Sport name cannot be empty.');
    }

    if (strlen($sportName) > 180) {
        sports_error(400, 'Sport name must not exceed 180 characters.');
    }

    $checkName = $conn->prepare('SELECT id FROM sports WHERE ' . $schema['name'] . ' = ? AND id != ? LIMIT 1');
    if (!$checkName) {
        sports_error(500, 'Database error: ' . $conn->error);
    }
    $checkName->bind_param('si', $sportName, $id);
    $checkName->execute();
    if ($checkName->get_result()->num_rows > 0) {
        sports_error(409, 'Sport name already exists.');
    }
    $checkName->close();

    $updates[] = $schema['name'] . ' = ?';
    $types .= 's';
    $params[] = $sportName;
}

if ($schema['code'] && array_key_exists('sport_code', $input)) {
    $sportCode = trim((string)($input['sport_code'] ?? ''));
    if ($sportCode !== '' && strlen($sportCode) > 20) {
        sports_error(400, 'Sport code must not exceed 20 characters.');
    }

    if ($sportCode !== '') {
        $checkCode = $conn->prepare('SELECT id FROM sports WHERE ' . $schema['code'] . ' = ? AND id != ? LIMIT 1');
        if (!$checkCode) {
            sports_error(500, 'Database error: ' . $conn->error);
        }
        $checkCode->bind_param('si', $sportCode, $id);
        $checkCode->execute();
        if ($checkCode->get_result()->num_rows > 0) {
            sports_error(409, 'Sport code already exists.');
        }
        $checkCode->close();
    }

    $updates[] = $schema['code'] . ' = ?';
    $types .= 's';
    $params[] = ($sportCode !== '' ? $sportCode : null);
}

if ($schema['photo'] && array_key_exists('photo_path', $input)) {
    $photoPath = trim((string)($input['photo_path'] ?? ''));
    if ($photoPath !== '' && strlen($photoPath) > 255) {
        sports_error(400, 'Photo path must not exceed 255 characters.');
    }

    $updates[] = $schema['photo'] . ' = ?';
    $types .= 's';
    $params[] = ($photoPath !== '' ? $photoPath : null);
}

if ($schema['is_active'] && array_key_exists('is_active', $input)) {
    $isActive = intval($input['is_active']) === 1 ? 1 : 0;
    $updates[] = $schema['is_active'] . ' = ?';
    $types .= 'i';
    $params[] = $isActive;
}

if (empty($updates)) {
    sports_error(400, 'No fields to update.');
}

$sql = 'UPDATE sports SET ' . implode(', ', $updates) . ' WHERE id = ?';
$types .= 'i';
$params[] = $id;

$stmt = $conn->prepare($sql);
if (!$stmt) {
    sports_error(500, 'Database error: ' . $conn->error);
}

$stmt->bind_param($types, ...$params);
if (!$stmt->execute()) {
    sports_error(500, 'Error updating sport: ' . $stmt->error);
}
$stmt->close();

$select = sports_select_sql($schema);
$getStmt = $conn->prepare("SELECT $select FROM sports WHERE id = ? LIMIT 1");
$getStmt->bind_param('i', $id);
$getStmt->execute();
$updated = $getStmt->get_result()->fetch_assoc();
$getStmt->close();

http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Sport updated successfully.',
    'data' => $updated
]);

$conn->close();
