<?php
/**
 * Android SMS Gateway Blast API
 * POST /api/sms/android-blast.php
 * Content-Type: application/json
 *
 * Required:
 * - message
 * - gateway_url
 * Optional:
 * - gateway_token
 * - recipients (array of mobile numbers)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

require_once '../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed. Use POST.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input.']);
    exit;
}

$message = trim((string)($input['message'] ?? ''));
$gatewayUrl = trim((string)($input['gateway_url'] ?? ''));
$gatewayToken = trim((string)($input['gateway_token'] ?? ''));
$recipientsInput = $input['recipients'] ?? null;

if ($message === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Message is required.']);
    exit;
}

if (strlen($message) > 160) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Message exceeds 160 characters.']);
    exit;
}

// Accept plain host/IP (e.g. 192.168.1.10:3000/send) by auto-prepending http://
if ($gatewayUrl !== '' && !preg_match('/^https?:\/\//i', $gatewayUrl)) {
    $gatewayUrl = 'http://' . $gatewayUrl;
}

if ($gatewayUrl === '' || !filter_var($gatewayUrl, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'A valid gateway_url is required.']);
    exit;
}

function normalize_phone($raw) {
    $digits = preg_replace('/\D+/', '', (string)$raw);
    if (preg_match('/^09\d{9}$/', $digits)) {
        return '63' . substr($digits, 1);
    }
    if (preg_match('/^639\d{9}$/', $digits)) {
        return $digits;
    }
    return null;
}

$recipients = [];
if (is_array($recipientsInput) && count($recipientsInput) > 0) {
    foreach ($recipientsInput as $num) {
        $normalized = normalize_phone($num);
        if ($normalized !== null) {
            $recipients[$normalized] = true;
        }
    }
} else {
    // Default blast target: active users + team registration contacts
    $userSql = "SELECT phone FROM users WHERE status = 'Active' AND phone IS NOT NULL AND TRIM(phone) <> ''";
    $userResult = $conn->query($userSql);
    if ($userResult) {
        while ($row = $userResult->fetch_assoc()) {
            $normalized = normalize_phone($row['phone']);
            if ($normalized !== null) {
                $recipients[$normalized] = true;
            }
        }
    }

    $regSql = "SELECT contact_number FROM team_registrations WHERE contact_number IS NOT NULL AND TRIM(contact_number) <> ''";
    $regResult = $conn->query($regSql);
    if ($regResult) {
        while ($row = $regResult->fetch_assoc()) {
            $normalized = normalize_phone($row['contact_number']);
            if ($normalized !== null) {
                $recipients[$normalized] = true;
            }
        }
    }
}

$recipientList = array_keys($recipients);
if (count($recipientList) === 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No valid recipients found.']);
    exit;
}

$hasCurl = function_exists('curl_init');
$hasStreamHttp = function_exists('stream_context_create') && ini_get('allow_url_fopen');
if (!$hasCurl && !$hasStreamHttp) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'No HTTP client is available on the server (enable cURL or allow_url_fopen).'
    ]);
    exit;
}

$sent = 0;
$failed = 0;
$errors = [];

foreach ($recipientList as $to) {
    $payload = json_encode([
        'to' => $to,
        'message' => $message
    ]);

    $headers = ['Content-Type: application/json'];
    if ($gatewayToken !== '') {
        $headers[] = 'Authorization: Bearer ' . $gatewayToken;
        $headers[] = 'X-API-Key: ' . $gatewayToken;
    }

    $responseBody = null;
    $httpCode = 0;
    $sendErr = '';

    if ($hasCurl) {
        $ch = curl_init($gatewayUrl);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_TIMEOUT => 20,
        ]);

        $responseBody = curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $sendErr = (string)curl_error($ch);
        curl_close($ch);
    } else {
        $ctx = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => implode("\r\n", $headers) . "\r\n",
                'content' => $payload,
                'timeout' => 20,
                'ignore_errors' => true,
            ]
        ]);

        $responseBody = @file_get_contents($gatewayUrl, false, $ctx);
        if ($responseBody === false) {
            $sendErr = 'Failed to connect to Android gateway.';
        }

        $responseHeaders = [];
        if (function_exists('http_get_last_response_headers')) {
            $responseHeaders = http_get_last_response_headers() ?: [];
        }

        if (!empty($responseHeaders) && preg_match('#HTTP/\S+\s+(\d{3})#', (string)$responseHeaders[0], $m)) {
            $httpCode = (int)$m[1];
        }
    }

    if ($sendErr !== '') {
        $failed++;
        $errors[] = ['to' => $to, 'error' => $sendErr];
        continue;
    }

    if ($httpCode >= 200 && $httpCode < 300) {
        $sent++;
    } else {
        $failed++;
        $errors[] = ['to' => $to, 'http_code' => $httpCode, 'response' => $responseBody];
    }
}

$ok = $sent > 0 && $failed === 0;
$partial = $sent > 0 && $failed > 0;

if (!$ok && !$partial) {
    http_response_code(502);
}

echo json_encode([
    'success' => $ok || $partial,
    'partial' => $partial,
    'message' => $partial
        ? "SMS sent to {$sent} recipient(s), failed for {$failed}."
        : ($ok
            ? "SMS sent successfully to {$sent} recipient(s)."
            : 'SMS sending failed for all recipients.'),
    'sent' => $sent,
    'failed' => $failed,
    'recipients' => $recipientList,
    'errors' => $errors,
]);
