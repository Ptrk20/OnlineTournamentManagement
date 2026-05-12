<?php

function sms_blaster_truncate_message(string $message, int $length): string {
    if ($length <= 0) return '';

    if (function_exists('mb_substr')) {
        return mb_substr($message, 0, $length);
    }

    return substr($message, 0, $length);
}

function sms_blaster_is_ssl_cert_error(string $curlError): bool {
    $msg = strtolower(trim($curlError));
    if ($msg === '') return false;

    return strpos($msg, 'unable to get local issuer certificate') !== false
        || strpos($msg, 'ssl certificate problem') !== false
        || strpos($msg, 'ssl certificate openssl verify result') !== false
        || strpos($msg, 'peer certificate') !== false;
}

function sms_blaster_socket_http_post_json(string $url, array $headers, string $jsonBody, int $timeout = 25): array {
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

    $availableTransports = function_exists('stream_get_transports')
        ? array_map('strtolower', stream_get_transports())
        : [];
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

function sms_blaster_post_json(array $gateway, array $payload): array {
    $headers = [
        'Authorization: Bearer ' . $gateway['api_token'],
        'X-Authorization: ' . $gateway['api_token'],
        'Content-Type: application/json',
        'Accept: application/json'
    ];

    $jsonPayload = json_encode($payload);
    if ($jsonPayload === false) {
        return ['ok' => false, 'http_code' => 0, 'response_body' => '', 'error' => 'Failed to encode SMS payload.'];
    }

    $responseBody = '';
    $httpCode = 0;
    $sendErr = '';

    if (function_exists('curl_init')) {
        $ch = curl_init($gateway['api_url']);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $jsonPayload,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 25,
        ]);

        $responseBody = (string)curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $sendErr = (string)curl_error($ch);

        if ($sendErr !== '' && sms_blaster_is_ssl_cert_error($sendErr)) {
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

        curl_close($ch);
    } else {
        $httpOptions = [
            'method' => 'POST',
            'header' => implode("\r\n", $headers) . "\r\n",
            'content' => $jsonPayload,
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

        $responseBody = @file_get_contents($gateway['api_url'], false, $ctx);
        if ($responseBody === false) {
            $lastErr = error_get_last();
            $sendErr = !empty($lastErr['message'])
                ? 'Failed to connect to PhilSMS API: ' . $lastErr['message']
                : 'Failed to connect to PhilSMS API.';

            if (stripos((string)$gateway['api_url'], 'https://') === 0) {
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

                $retryBody = @file_get_contents($gateway['api_url'], false, $ctxInsecure);
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

            if ($sendErr !== '' && function_exists('stream_socket_client')) {
                [$okSock, $codeSock, $bodySock, $errSock] = sms_blaster_socket_http_post_json(
                    (string)$gateway['api_url'],
                    $headers,
                    $jsonPayload,
                    25
                );
                if ($okSock) {
                    $responseBody = $bodySock;
                    $httpCode = $codeSock;
                    $sendErr = '';
                } else {
                    $sendErr = 'Failed to connect to PhilSMS API: ' . $errSock;
                }
            }
        }

        $responseHeaders = function_exists('http_get_last_response_headers')
            ? (http_get_last_response_headers() ?: [])
            : [];
        if (!empty($responseHeaders) && preg_match('#HTTP/\S+\s+(\d{3})#', (string)$responseHeaders[0], $m)) {
            $httpCode = (int)$m[1];
        }
    }

    if ($sendErr !== '') {
        return ['ok' => false, 'http_code' => $httpCode, 'response_body' => (string)$responseBody, 'error' => $sendErr];
    }

    if ($httpCode >= 200 && $httpCode < 300) {
        return ['ok' => true, 'http_code' => $httpCode, 'response_body' => (string)$responseBody, 'error' => ''];
    }

    $parsed = json_decode((string)$responseBody, true);
    $errorMsg = is_array($parsed) && !empty($parsed['message'])
        ? (string)$parsed['message']
        : ('Gateway HTTP ' . $httpCode . '.');

    return ['ok' => false, 'http_code' => $httpCode, 'response_body' => (string)$responseBody, 'error' => $errorMsg];
}

function sms_blaster_normalize_api_url(string $url): string {
    $url = trim($url);
    if ($url === '') return $url;

    if (!preg_match('#^https?://#i', $url)) {
        $url = 'https://' . ltrim($url, '/');
    }

    $parts = parse_url($url);
    if ($parts === false || empty($parts['host'])) {
        return $url;
    }

    $scheme = !empty($parts['scheme']) ? strtolower((string)$parts['scheme']) : 'https';
    $host = strtolower((string)$parts['host']);
    $path = isset($parts['path']) ? (string)$parts['path'] : '/api/v3/sms/send';
    $path = rtrim($path, '/');
    if ($path === '' || $path === '/api') {
        $path = '/api/v3/sms/send';
    }

    $query = isset($parts['query']) ? ('?' . $parts['query']) : '';
    return $scheme . '://' . $host . $path . $query;
}

function sms_blaster_ensure_tables(mysqli $conn): void {
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

function sms_blaster_load_gateway(mysqli $conn): array {
    sms_blaster_ensure_tables($conn);

    $stmt = $conn->prepare(
        "SELECT provider, api_url, api_token, sender_id
           FROM sms_gateway_settings
          WHERE provider = 'philsms'
          LIMIT 1"
    );
    if (!$stmt) {
        return ['ok' => false, 'error' => 'Failed to load SMS settings: ' . $conn->error];
    }

    $stmt->execute();
    $cfg = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$cfg) {
        return ['ok' => false, 'error' => 'No SMS gateway settings found. Configure SMS Blaster first.'];
    }

    $apiUrl = sms_blaster_normalize_api_url((string)($cfg['api_url'] ?? ''));
    $apiToken = trim((string)($cfg['api_token'] ?? ''));
    $senderId = trim((string)($cfg['sender_id'] ?? ''));

    if ($apiUrl === '' || !filter_var($apiUrl, FILTER_VALIDATE_URL)) {
        return ['ok' => false, 'error' => 'Invalid SMS API URL in SMS Blaster settings.'];
    }
    if ($apiToken === '') {
        return ['ok' => false, 'error' => 'Missing SMS API token in SMS Blaster settings.'];
    }

    return [
        'ok' => true,
        'provider' => 'philsms',
        'api_url' => $apiUrl,
        'api_token' => $apiToken,
        'sender_id' => $senderId !== '' ? $senderId : 'OTM'
    ];
}

function sms_blaster_send_single(mysqli $conn, array $gateway, string $phone, string $message, array $meta = []): array {
    if (trim($message) === '') {
        return ['ok' => false, 'error' => 'Cannot send empty SMS message.', 'http_code' => 0, 'response_body' => ''];
    }

    $recipientName = trim((string)($meta['name'] ?? ''));
    $recipientSource = trim((string)($meta['source'] ?? ''));

    $blastId = 0;
    $insBlast = $conn->prepare(
      "INSERT INTO sms_blast_logs (provider, message_text, sender_id, total_recipients, sent_count, failed_count, status)
       VALUES (?, ?, ?, 1, 0, 0, 'queued')"
    );
    if ($insBlast) {
        $msg160 = sms_blaster_truncate_message($message, 160);
        $insBlast->bind_param('sss', $gateway['provider'], $msg160, $gateway['sender_id']);
        if ($insBlast->execute()) {
            $blastId = (int)$conn->insert_id;
        }
        $insBlast->close();
    }

    $recipientLogId = 0;
    if ($blastId > 0) {
        $insRecipient = $conn->prepare(
          "INSERT INTO sms_blast_recipients
             (blast_id, recipient_phone, recipient_name, recipient_source, status)
           VALUES (?, ?, ?, ?, 'pending')"
        );
        if ($insRecipient) {
            $insRecipient->bind_param('isss', $blastId, $phone, $recipientName, $recipientSource);
            if ($insRecipient->execute()) {
                $recipientLogId = (int)$conn->insert_id;
            }
            $insRecipient->close();
        }
    }

    $payload = [
        'recipient' => $phone,
        'sender_id' => $gateway['sender_id'],
        'type' => 'plain',
        'message' => $message
    ];

    $sendResult = sms_blaster_post_json($gateway, $payload);
    sms_blaster_finalize_logs(
        $conn,
        $blastId,
        $recipientLogId,
        (bool)$sendResult['ok'],
        (int)$sendResult['http_code'],
        (string)$sendResult['response_body'],
        (string)$sendResult['error']
    );

    return [
        'ok' => (bool)$sendResult['ok'],
        'error' => (string)$sendResult['error'],
        'http_code' => (int)$sendResult['http_code'],
        'response_body' => (string)$sendResult['response_body']
    ];
}

function sms_blaster_finalize_logs(mysqli $conn, int $blastId, int $recipientLogId, bool $ok, int $httpCode, string $responseBody, string $errorMessage): void {
    if ($recipientLogId > 0) {
        $status = $ok ? 'sent' : 'failed';
        if ($ok) {
            $stmt = $conn->prepare(
                "UPDATE sms_blast_recipients
                    SET status = ?, provider_http_code = ?, provider_response = ?, error_message = NULL, sent_at = NOW()
                  WHERE id = ?"
            );
            if ($stmt) {
                $stmt->bind_param('sisi', $status, $httpCode, $responseBody, $recipientLogId);
                $stmt->execute();
                $stmt->close();
            }
        } else {
            $stmt = $conn->prepare(
                "UPDATE sms_blast_recipients
                    SET status = ?, provider_http_code = ?, provider_response = ?, error_message = ?, sent_at = NULL
                  WHERE id = ?"
            );
            if ($stmt) {
                $stmt->bind_param('sissi', $status, $httpCode, $responseBody, $errorMessage, $recipientLogId);
                $stmt->execute();
                $stmt->close();
            }
        }
    }

    if ($blastId > 0) {
        $blastStatus = $ok ? 'sent' : 'failed';
        $sentCount = $ok ? 1 : 0;
        $failedCount = $ok ? 0 : 1;
        $stmt = $conn->prepare(
            'UPDATE sms_blast_logs
                SET sent_count = ?, failed_count = ?, status = ?
              WHERE id = ?'
        );
        if ($stmt) {
            $stmt->bind_param('iisi', $sentCount, $failedCount, $blastStatus, $blastId);
            $stmt->execute();
            $stmt->close();
        }
    }
 }
