<?php
/**
 * PhilSMS Blast API
 * POST /api/sms/philsms-blast.php
 * Content-Type: application/json
 *
 * Required:
 * - message
 * - api_url
 * - api_token
 * Optional:
 * - sender_id
 * - recipients (array)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

require_once '../../config/db.php';

function ensure_sms_tables($conn) {
    $conn->query(
        "CREATE TABLE IF NOT EXISTS sms_gateway_settings (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            provider VARCHAR(40) NOT NULL DEFAULT 'philsms',
            api_url VARCHAR(255) NOT NULL,
            api_token TEXT NOT NULL,
            sender_id VARCHAR(40) NULL,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_sms_gateway_provider (provider)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );

    $conn->query(
        "CREATE TABLE IF NOT EXISTS sms_blast_logs (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            provider VARCHAR(40) NOT NULL DEFAULT 'philsms',
            message_text VARCHAR(160) NOT NULL,
            sender_id VARCHAR(40) NULL,
            total_recipients INT UNSIGNED NOT NULL DEFAULT 0,
            sent_count INT UNSIGNED NOT NULL DEFAULT 0,
            failed_count INT UNSIGNED NOT NULL DEFAULT 0,
            status VARCHAR(40) NOT NULL DEFAULT 'queued',
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_sms_blast_logs_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );

    $conn->query(
        "CREATE TABLE IF NOT EXISTS sms_blast_recipients (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            blast_id BIGINT UNSIGNED NOT NULL,
            recipient_phone VARCHAR(20) NOT NULL,
            recipient_name VARCHAR(140) NULL,
            recipient_source VARCHAR(40) NULL,
            status VARCHAR(40) NOT NULL DEFAULT 'pending',
            provider_http_code INT NULL,
            provider_response TEXT NULL,
            error_message TEXT NULL,
            sent_at DATETIME NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_sms_blast_recipients_blast (blast_id),
            CONSTRAINT fk_sms_blast_recipients_blast
              FOREIGN KEY (blast_id) REFERENCES sms_blast_logs(id)
              ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
}

ensure_sms_tables($conn);

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
$apiUrl = trim((string)($input['api_url'] ?? ''));
$apiToken = trim((string)($input['api_token'] ?? ''));
$senderId = trim((string)($input['sender_id'] ?? ''));
$recipientsInput = $input['recipients'] ?? null;
$recipientDetails = $input['recipient_details'] ?? [];

function normalize_philsms_api_url($url) {
    $url = trim((string)$url);
    if ($url === '') return $url;

    // If admin pasted host/path without scheme, assume HTTPS.
    if (!preg_match('#^https?://#i', $url)) {
        $url = 'https://' . ltrim($url, '/');
    }

    $parts = parse_url($url);
    if ($parts === false || empty($parts['host'])) {
        return $url;
    }

    $host = strtolower((string)$parts['host']);
    // Use dashboard.philsms.com if specified (it works per documentation)
    // or app.philsms.com as alternative
    
    $scheme = !empty($parts['scheme']) ? strtolower((string)$parts['scheme']) : 'https';
    $path = isset($parts['path']) ? (string)$parts['path'] : '/api/v3/sms/send';
    $path = rtrim($path, '/');
    if ($path === '' || $path === '/api') {
        $path = '/api/v3/sms/send';
    }

    $query = isset($parts['query']) ? ('?' . $parts['query']) : '';
    return $scheme . '://' . $host . $path . $query;
}

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
if ($apiUrl === '' || $apiToken === '') {
    $cfgStmt = $conn->prepare("SELECT api_url, api_token, sender_id FROM sms_gateway_settings WHERE provider='philsms' LIMIT 1");
    if ($cfgStmt) {
        $cfgStmt->execute();
        $cfg = $cfgStmt->get_result()->fetch_assoc();
        $cfgStmt->close();
        if ($cfg) {
            if ($apiUrl === '') $apiUrl = (string)$cfg['api_url'];
            if ($apiToken === '') $apiToken = (string)$cfg['api_token'];
            if ($senderId === '') $senderId = (string)($cfg['sender_id'] ?? '');
        }
    }
}

$apiUrl = normalize_philsms_api_url($apiUrl);

if ($apiUrl === '' || !filter_var($apiUrl, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'A valid PhilSMS API URL is required. Please configure settings.']);
    exit;
}
if ($apiToken === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'PhilSMS API token is required. Please configure settings.']);
    exit;
}

function normalize_phone($raw) {
    $digits = preg_replace('/\D+/', '', (string)$raw);
    if (preg_match('/^09\d{9}$/', $digits)) return '63' . substr($digits, 1);
    if (preg_match('/^639\d{9}$/', $digits)) return $digits;
    return null;
}

function socket_http_post_json($url, $headers, $jsonBody, $timeout = 25) {
    $parts = parse_url($url);
    if ($parts === false || empty($parts['host'])) {
        return [false, 0, '', 'Invalid URL for socket fallback.'];
    }

    $scheme = strtolower((string)($parts['scheme'] ?? 'https'));
    $host = (string)$parts['host'];
    $port = (int)($parts['port'] ?? ($scheme === 'https' ? 443 : 80));
    $path = (string)($parts['path'] ?? '/');
    if (!empty($parts['query'])) {
        $path .= '?' . $parts['query'];
    }

    $availableTransports = function_exists('stream_get_transports') ? array_map('strtolower', stream_get_transports()) : [];
    $transport = 'tcp';
    if ($scheme === 'https') {
        if (in_array('ssl', $availableTransports, true)) {
            $transport = 'ssl';
        } elseif (in_array('tls', $availableTransports, true)) {
            $transport = 'tls';
        } else {
            return [false, 0, '', 'HTTPS socket transport unavailable. Enable OpenSSL (ssl/tls) in PHP.'];
        }
    }
    $context = stream_context_create([
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
            'SNI_enabled' => true,
            'peer_name' => $host,
        ]
    ]);

    $errno = 0;
    $errstr = '';
    $fp = @stream_socket_client(
        $transport . '://' . $host . ':' . $port,
        $errno,
        $errstr,
        $timeout,
        STREAM_CLIENT_CONNECT,
        $context
    );

    if (!$fp) {
        $msg = 'Socket connect failed';
        if ($errstr !== '') $msg .= ': ' . $errstr;
        if ($errno) $msg .= ' (' . $errno . ')';
        return [false, 0, '', $msg];
    }

    stream_set_timeout($fp, $timeout);

    $hostHeader = $host;
    if (!empty($parts['port'])) {
        $hostHeader .= ':' . $port;
    }

    $requestHeaders = [
        'POST ' . $path . ' HTTP/1.1',
        'Host: ' . $hostHeader,
        'Connection: close',
        'Content-Length: ' . strlen($jsonBody),
    ];
    foreach ($headers as $h) {
        $requestHeaders[] = $h;
    }

    $rawRequest = implode("\r\n", $requestHeaders) . "\r\n\r\n" . $jsonBody;
    @fwrite($fp, $rawRequest);

    $rawResponse = '';
    while (!feof($fp)) {
        $rawResponse .= (string)fgets($fp, 8192);
    }
    fclose($fp);

    if ($rawResponse === '') {
        return [false, 0, '', 'Empty response from socket transport.'];
    }

    $partsResp = preg_split("/\r\n\r\n/", $rawResponse, 2);
    $head = $partsResp[0] ?? '';
    $body = $partsResp[1] ?? '';
    $httpCode = 0;
    if (preg_match('#HTTP/\S+\s+(\d{3})#', $head, $m)) {
        $httpCode = (int)$m[1];
    }

    return [true, $httpCode, $body, ''];
}

function is_ssl_cert_error($curlError) {
    $msg = strtolower((string)$curlError);
    return strpos($msg, 'unable to get local issuer certificate') !== false
        || strpos($msg, 'ssl certificate problem') !== false
        || strpos($msg, 'ssl certificate openssl verify result') !== false
        || strpos($msg, 'peer certificate') !== false;
}

$recipients = [];
if (is_array($recipientsInput) && count($recipientsInput) > 0) {
    foreach ($recipientsInput as $num) {
        $normalized = normalize_phone($num);
        if ($normalized !== null) $recipients[$normalized] = true;
    }
} else {
    $userSql = "SELECT phone FROM users WHERE status = 'Active' AND phone IS NOT NULL AND TRIM(phone) <> ''";
    $userResult = $conn->query($userSql);
    if ($userResult) {
        while ($row = $userResult->fetch_assoc()) {
            $normalized = normalize_phone($row['phone']);
            if ($normalized !== null) $recipients[$normalized] = true;
        }
    }

    $regSql = "SELECT contact_number FROM team_registrations WHERE contact_number IS NOT NULL AND TRIM(contact_number) <> ''";
    $regResult = $conn->query($regSql);
    if ($regResult) {
        while ($row = $regResult->fetch_assoc()) {
            $normalized = normalize_phone($row['contact_number']);
            if ($normalized !== null) $recipients[$normalized] = true;
        }
    }
}

$recipientList = array_keys($recipients);
if (count($recipientList) === 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No valid recipients found.']);
    exit;
}

$recipientMetaMap = [];
if (is_array($recipientDetails)) {
    foreach ($recipientDetails as $d) {
        if (!is_array($d)) continue;
        $phone = normalize_phone($d['phone'] ?? '');
        if ($phone === null) continue;
        $recipientMetaMap[$phone] = [
            'name' => trim((string)($d['name'] ?? '')),
            'source' => trim((string)($d['source'] ?? '')),
        ];
    }
}

$blastId = 0;
$blastStatus = 'queued';
$insBlast = $conn->prepare(
  "INSERT INTO sms_blast_logs (provider, message_text, sender_id, total_recipients, sent_count, failed_count, status)
   VALUES ('philsms', ?, ?, ?, 0, 0, ?)"
);
if ($insBlast) {
    $totalRecipients = count($recipientList);
    $insBlast->bind_param('ssis', $message, $senderId, $totalRecipients, $blastStatus);
    if ($insBlast->execute()) {
        $blastId = (int)$conn->insert_id;
    }
    $insBlast->close();
}

$hasCurl = function_exists('curl_init');
$hasStreamHttp = function_exists('stream_context_create') && ini_get('allow_url_fopen');
$hasSocketHttp = function_exists('stream_socket_client');
if (!$hasCurl && !$hasStreamHttp && !$hasSocketHttp) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'No HTTP client available on the server (enable cURL, allow_url_fopen, or stream_socket_client).'
    ]);
    exit;
}

$headers = [
    'Content-Type: application/json',
    'Accept: application/json',
    'Authorization: Bearer ' . $apiToken,
    'X-Authorization: ' . $apiToken,
];

$sent = 0;
$failed = 0;
$errors = [];
$debugInfo = [
    'endpoint' => $apiUrl,
    'request_payload' => null,
    'response_body' => null,
    'http_code' => null,
    'recipients_input_count' => is_array($recipientsInput) ? count($recipientsInput) : 0,
    'recipients_normalized_count' => count($recipientList),
    'recipients_normalized_list' => $recipientList,
    'normalization_details' => [],
];

// Log normalization process for debugging
if (is_array($recipientsInput)) {
    foreach ($recipientsInput as $num) {
        $normalized = normalize_phone($num);
        $debugInfo['normalization_details'][] = [
            'input' => $num,
            'normalized' => $normalized,
            'valid' => $normalized !== null
        ];
    }
}

// Send all recipients in a single API call (comma-separated format per PhilSMS docs)
$recipientString = implode(',', $recipientList);

// PhilSMS required fields per documentation
$payload = [
    'recipient' => $recipientString,
    'sender_id' => $senderId !== '' ? $senderId : 'OTM',
    'type' => 'plain',  // REQUIRED: 'plain' or 'unicode'
    'message' => $message,
];

$debugInfo['request_payload'] = json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

$responseBody = '';
$httpCode = 0;
$sendErr = '';

// Send all recipients in a single API call with comma-separated format
if ($hasCurl) {
    $ch = curl_init($apiUrl);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => 25,
    ]);

    $responseBody = (string)curl_exec($ch);
    $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $sendErr = (string)curl_error($ch);

    // Retry once with relaxed verification for environments missing CA bundles.
    if ($sendErr !== '' && is_ssl_cert_error($sendErr)) {
        curl_setopt_array($ch, [
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
        ]);
        $retryBody = (string)curl_exec($ch);
        $retryCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $retryErr = (string)curl_error($ch);
        if ($retryErr === '') {
            $responseBody = $retryBody;
            $httpCode = $retryCode;
            $sendErr = '';
        }
    }
    $ch = null;
} else {
    $httpOptions = [
        'method' => 'POST',
        'header' => implode("\r\n", $headers) . "\r\n",
        'content' => json_encode($payload),
        'timeout' => 25,
        'ignore_errors' => true,
    ];

    $ctx = stream_context_create([
        'http' => [
            'method' => $httpOptions['method'],
            'header' => $httpOptions['header'],
            'content' => $httpOptions['content'],
            'timeout' => $httpOptions['timeout'],
            'ignore_errors' => $httpOptions['ignore_errors'],
        ]
    ]);

    $responseBody = @file_get_contents($apiUrl, false, $ctx);
    if ($responseBody === false) {
        $lastErr = error_get_last();
        $sendErr = !empty($lastErr['message'])
            ? 'Failed to connect to PhilSMS API: ' . $lastErr['message']
            : 'Failed to connect to PhilSMS API.';

        // Some PHP installs have missing CA bundles for HTTPS stream requests.
        // Retry with relaxed SSL verification as a compatibility fallback.
        if (stripos($apiUrl, 'https://') === 0) {
            $ctxInsecure = stream_context_create([
                'http' => [
                    'method' => $httpOptions['method'],
                    'header' => $httpOptions['header'],
                    'content' => $httpOptions['content'],
                    'timeout' => $httpOptions['timeout'],
                    'ignore_errors' => $httpOptions['ignore_errors'],
                ],
                'ssl' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true,
                ],
            ]);

            $retryBody = @file_get_contents($apiUrl, false, $ctxInsecure);
            if ($retryBody !== false) {
                $responseBody = $retryBody;
                $sendErr = '';
            } else {
                $retryErr = error_get_last();
                if (!empty($retryErr['message'])) {
                    $sendErr = 'Failed to connect to PhilSMS API: ' . $retryErr['message'];
                }
            }
        }

        // Final fallback: raw socket HTTPS POST for environments where URL wrappers are broken.
        if ($sendErr !== '' && $hasSocketHttp) {
            $jsonBody = json_encode($payload);
            [$okSock, $codeSock, $bodySock, $errSock] = socket_http_post_json($apiUrl, $headers, $jsonBody, 25);
            if ($okSock) {
                $responseBody = $bodySock;
                $httpCode = $codeSock;
                $sendErr = '';
            } else {
                $sendErr = 'Failed to connect to PhilSMS API: ' . $errSock;
            }
        }
    }

    $responseHeaders = [];
    if (function_exists('http_get_last_response_headers')) {
        $responseHeaders = http_get_last_response_headers() ?: [];
    }
    if (!empty($responseHeaders) && preg_match('#HTTP/\S+\s+(\d{3})#', (string)$responseHeaders[0], $m)) {
        $httpCode = (int)$m[1];
    }
}

// Store response for debugging
$debugInfo['response_body'] = $responseBody;
$debugInfo['http_code'] = $httpCode;

// Process result: mark all recipients with same status
if ($sendErr !== '') {
    // Connection/network error
    $failed = count($recipientList);
    $errors[] = ['recipients' => implode(',', $recipientList), 'error' => $sendErr];
    
    if ($blastId > 0) {
        foreach ($recipientList as $to) {
            $meta = $recipientMetaMap[$to] ?? ['name' => '', 'source' => ''];
            $st = 'failed'; $code = null; $resp = null; $err = $sendErr; $sentAt = null;
            $insRec = $conn->prepare(
              "INSERT INTO sms_blast_recipients
               (blast_id, recipient_phone, recipient_name, recipient_source, status, provider_http_code, provider_response, error_message, sent_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
            );
            if ($insRec) {
                $insRec->bind_param('issssisss', $blastId, $to, $meta['name'], $meta['source'], $st, $code, $resp, $err, $sentAt);
                $insRec->execute();
                $insRec->close();
            }
        }
    }
} else if ($httpCode >= 200 && $httpCode < 300) {
    // Success: all recipients sent
    $sent = count($recipientList);
    
    if ($blastId > 0) {
        foreach ($recipientList as $to) {
            $meta = $recipientMetaMap[$to] ?? ['name' => '', 'source' => ''];
            $st = 'sent'; $code = $httpCode; $resp = $responseBody; $err = ''; $sentAt = date('Y-m-d H:i:s');
            $insRec = $conn->prepare(
              "INSERT INTO sms_blast_recipients
               (blast_id, recipient_phone, recipient_name, recipient_source, status, provider_http_code, provider_response, error_message, sent_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
            );
            if ($insRec) {
                $insRec->bind_param('issssisss', $blastId, $to, $meta['name'], $meta['source'], $st, $code, $resp, $err, $sentAt);
                $insRec->execute();
                $insRec->close();
            }
        }
    }
} else {
    // API returned error status
    $failed = count($recipientList);
    $errors[] = [
        'recipients' => implode(',', $recipientList),
        'http_code' => $httpCode,
        'response' => $responseBody,
    ];
    
    if ($blastId > 0) {
        foreach ($recipientList as $to) {
            $meta = $recipientMetaMap[$to] ?? ['name' => '', 'source' => ''];
            $st = 'failed'; $code = $httpCode; $resp = $responseBody; $err = ''; $sentAt = null;
            $insRec = $conn->prepare(
              "INSERT INTO sms_blast_recipients
               (blast_id, recipient_phone, recipient_name, recipient_source, status, provider_http_code, provider_response, error_message, sent_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
            );
            if ($insRec) {
                $insRec->bind_param('issssisss', $blastId, $to, $meta['name'], $meta['source'], $st, $code, $resp, $err, $sentAt);
                $insRec->execute();
                $insRec->close();
            }
        }
    }
}

$ok = $sent > 0 && $failed === 0;
$partial = $sent > 0 && $failed > 0;
if (!$ok && !$partial) http_response_code(502);

if ($blastId > 0) {
    $statusFinal = $ok ? 'sent' : ($partial ? 'partial' : 'failed');
    $updBlast = $conn->prepare("UPDATE sms_blast_logs SET sent_count=?, failed_count=?, status=? WHERE id=?");
    if ($updBlast) {
        $updBlast->bind_param('iisi', $sent, $failed, $statusFinal, $blastId);
        $updBlast->execute();
        $updBlast->close();
    }
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
    'blast_id' => $blastId,
    'recipients' => $recipientList,
    'errors' => $errors,
    'debug' => $debugInfo,
]);
