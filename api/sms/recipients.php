<?php
/**
 * SMS Recipients API
 * GET /api/sms/recipients.php
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

require_once '../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

function normalize_phone($raw) {
    $digits = preg_replace('/\D+/', '', (string)$raw);
    if (preg_match('/^09\d{9}$/', $digits)) return '63' . substr($digits, 1);
    if (preg_match('/^639\d{9}$/', $digits)) return $digits;
    return null;
}

$items = [];

$userSql = "SELECT id, full_name, phone, role, status FROM users WHERE phone IS NOT NULL AND TRIM(phone) <> ''";
$userResult = $conn->query($userSql);
if ($userResult) {
    while ($row = $userResult->fetch_assoc()) {
        $rawPhone = trim((string)($row['phone'] ?? ''));
        $phone = normalize_phone($rawPhone);
        if ($phone === null) continue;
        $key = $phone;
        $name = trim((string)($row['full_name'] ?? ''));
        if (!isset($items[$key])) {
            $items[$key] = [
                'phone' => $phone,
                'phone_display' => $rawPhone !== '' ? $rawPhone : $phone,
                'name' => $name !== '' ? $name : 'User #' . $row['id'],
                'source' => 'users',
                'status' => $row['status'] ?? null,
                'meta' => ['role' => $row['role'] ?? null]
            ];
        }
    }
}

$regSql = "SELECT id, representative_name, submitted_by_name, team_name, contact_number, status FROM team_registrations WHERE contact_number IS NOT NULL AND TRIM(contact_number) <> ''";
$regResult = $conn->query($regSql);
if ($regResult) {
    while ($row = $regResult->fetch_assoc()) {
        $rawPhone = trim((string)($row['contact_number'] ?? ''));
        $phone = normalize_phone($rawPhone);
        if ($phone === null) continue;
        $name = trim((string)($row['representative_name'] ?? ''));
        if ($name === '') $name = trim((string)($row['submitted_by_name'] ?? ''));
        if ($name === '') $name = trim((string)($row['team_name'] ?? 'Registration #' . $row['id']));

        if (!isset($items[$phone])) {
            $items[$phone] = [
                'phone' => $phone,
                'phone_display' => $rawPhone !== '' ? $rawPhone : $phone,
                'name' => $name,
                'source' => 'registrations',
                'status' => $row['status'] ?? null,
                'meta' => ['team_name' => $row['team_name'] ?? null]
            ];
        }
    }
}

$list = array_values($items);
usort($list, function ($a, $b) {
    return strcasecmp((string)$a['name'], (string)$b['name']);
});

echo json_encode([
    'success' => true,
    'data' => $list,
    'total' => count($list)
]);
