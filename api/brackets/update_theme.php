<?php
/**
 * Update Bracket Theme API
 * POST /api/brackets/update_theme.php
 * Body: { bracket_id?: number, event_id?: number, ui_theme: 'dark'|'light' }
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once '../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['success' => false, 'message' => 'Method not allowed. Use POST.']));
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Invalid JSON input.']));
}

$uiTheme = strtolower(trim((string)($input['ui_theme'] ?? '')));
if (!in_array($uiTheme, ['dark', 'light'], true)) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Invalid ui_theme. Use dark or light.']));
}

$hasUiThemeColumn = false;
$colChk = $conn->query("SHOW COLUMNS FROM tournament_brackets LIKE 'ui_theme'");
if ($colChk && $colChk->num_rows > 0) $hasUiThemeColumn = true;
if ($colChk instanceof mysqli_result) $colChk->free();

if (!$hasUiThemeColumn) {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'ui_theme column is not available in tournament_brackets.']));
}

$bracketId = intval($input['bracket_id'] ?? 0);
$eventId   = intval($input['event_id'] ?? 0);

if ($bracketId > 0) {
    $stmt = $conn->prepare('UPDATE tournament_brackets SET ui_theme = ? WHERE id = ?');
    $stmt->bind_param('si', $uiTheme, $bracketId);
} elseif ($eventId > 0) {
    $stmt = $conn->prepare('UPDATE tournament_brackets SET ui_theme = ? WHERE event_id = ? ORDER BY id DESC LIMIT 1');
    $stmt->bind_param('si', $uiTheme, $eventId);
} else {
    http_response_code(400);
    die(json_encode(['success' => false, 'message' => 'Provide bracket_id or event_id.']));
}

if (!$stmt->execute()) {
    $err = $stmt->error;
    $stmt->close();
    http_response_code(500);
    die(json_encode(['success' => false, 'message' => 'Failed to update theme: ' . $err]));
}

$affected = $stmt->affected_rows;
$stmt->close();
$conn->close();

echo json_encode([
    'success' => true,
    'message' => 'Theme updated.',
    'ui_theme' => $uiTheme,
    'affected_rows' => $affected
]);
