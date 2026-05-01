<?php
/**
 * Upload Sport Photo API
 * POST /api/sports/upload-photo.php
 * multipart/form-data with field: photo
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode([
        'success' => false,
        'message' => 'Method not allowed. Use POST.'
    ]));
}

if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
    $errCode = isset($_FILES['photo']) ? $_FILES['photo']['error'] : 'no file';
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'No file uploaded or upload error (code: ' . $errCode . ').'
    ]));
}

$file = $_FILES['photo'];
$allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
$allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
$maxSize = 5 * 1024 * 1024;

$mime = null;
$extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

if (function_exists('finfo_open')) {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    if ($finfo) {
        $mime = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
    }
}

if (!$mime && isset($file['type']) && is_string($file['type'])) {
    $mime = strtolower(trim($file['type']));
}

if (!in_array($mime, $allowedTypes, true) || !in_array($extension, $allowedExts, true)) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'Invalid file type. Allowed: JPG, PNG, WEBP, GIF.'
    ]));
}

if ($file['size'] > $maxSize) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'File size exceeds 5 MB limit.'
    ]));
}

$extMap = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
    'image/gif' => 'gif'
];
$ext = isset($extMap[$mime]) ? $extMap[$mime] : ($extension === 'jpeg' ? 'jpg' : $extension);
$filename = 'sport_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;

$uploadDir = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'src' . DIRECTORY_SEPARATOR . 'images' . DIRECTORY_SEPARATOR . 'sports' . DIRECTORY_SEPARATOR;
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$destination = $uploadDir . $filename;
if (!move_uploaded_file($file['tmp_name'], $destination)) {
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'message' => 'Failed to save uploaded file.'
    ]));
}

$publicPath = 'src/images/sports/' . $filename;

http_response_code(200);
echo json_encode([
    'success' => true,
    'path' => $publicPath
]);
