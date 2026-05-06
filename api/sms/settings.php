<?php
/**
 * SMS Settings API (PhilSMS)
 * GET  /api/sms/settings.php
 * POST /api/sms/settings.php
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');

require_once '../../config/db.php';

function normalize_philsms_api_url($url) {
  $url = trim((string)$url);
  if ($url === '') return $url;

  if (!preg_match('#^https?://#i', $url)) {
    $url = 'https://' . ltrim($url, '/');
  }

  $parts = parse_url($url);
  if ($parts === false || empty($parts['host'])) {
    return $url;
  }

  $host = strtolower((string)$parts['host']);
  // Accept both dashboard.philsms.com and app.philsms.com as valid endpoints

  $scheme = !empty($parts['scheme']) ? strtolower((string)$parts['scheme']) : 'https';
  $path = isset($parts['path']) ? (string)$parts['path'] : '/api/v3/sms/send';
  $path = rtrim($path, '/');
  if ($path === '' || $path === '/api') {
    $path = '/api/v3/sms/send';
  }

  $query = isset($parts['query']) ? ('?' . $parts['query']) : '';
  return $scheme . '://' . $host . $path . $query;
}

function ensure_sms_settings_table($conn) {
    $sql = "
      CREATE TABLE IF NOT EXISTS sms_gateway_settings (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        provider VARCHAR(40) NOT NULL DEFAULT 'philsms',
        api_url VARCHAR(255) NOT NULL,
        api_token TEXT NOT NULL,
        sender_id VARCHAR(40) NULL,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_sms_gateway_provider (provider)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ";
    $conn->query($sql);
}

ensure_sms_settings_table($conn);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $conn->prepare("SELECT provider, api_url, api_token, sender_id, updated_at FROM sms_gateway_settings WHERE provider = 'philsms' LIMIT 1");
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
        exit;
    }
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row) {
      echo json_encode([
        'success' => true,
        'data' => [
          'provider' => 'philsms',
          'api_url' => 'https://app.philsms.com/api/v3/sms/send',
          'api_token' => '',
          'sender_id' => '',
          'updated_at' => null,
        ]
      ]);
      exit;
    }

    echo json_encode(['success' => true, 'data' => $row]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input.']);
    exit;
}

$apiUrl = trim((string)($input['api_url'] ?? ''));
$apiToken = trim((string)($input['api_token'] ?? ''));
$senderId = trim((string)($input['sender_id'] ?? ''));

$apiUrl = normalize_philsms_api_url($apiUrl);

if ($apiUrl === '' || !filter_var($apiUrl, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'A valid API URL is required.']);
    exit;
}
if ($apiToken === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'API token is required.']);
    exit;
}

$stmt = $conn->prepare(
  "INSERT INTO sms_gateway_settings (provider, api_url, api_token, sender_id)
   VALUES ('philsms', ?, ?, ?)
   ON DUPLICATE KEY UPDATE api_url = VALUES(api_url), api_token = VALUES(api_token), sender_id = VALUES(sender_id)"
);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
    exit;
}
$stmt->bind_param('sss', $apiUrl, $apiToken, $senderId);
$ok = $stmt->execute();
$stmt->close();

if (!$ok) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to save SMS settings.']);
    exit;
}

echo json_encode(['success' => true, 'message' => 'SMS settings saved successfully.']);
