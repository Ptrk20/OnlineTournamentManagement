<?php
/**
 * Upload Organization Photo API
 * Accepts a multipart/form-data POST with a file field named "photo",
 * saves it under src/images/about/ and returns the relative path.
 * POST /api/about/upload-photo.php
 */

// Headers
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

// Verify a file was uploaded without errors
if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
    $errCode = isset($_FILES['photo']) ? $_FILES['photo']['error'] : 'no file';
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'No file uploaded or upload error (code: ' . $errCode . ').'
    ]));
}

$file = $_FILES['photo'];

// Validate file type. Prefer fileinfo when available, but fall back to the
// uploaded MIME type plus extension checks so the endpoint still works.
$allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
$allowed_exts  = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
$mime          = null;
$extension     = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

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

if (!in_array($mime, $allowed_types, true) || !in_array($extension, $allowed_exts, true)) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'Invalid file type. Allowed: JPG, PNG, WEBP, GIF.'
    ]));
}

// Enforce 5 MB limit
$max_size = 5 * 1024 * 1024;
if ($file['size'] > $max_size) {
    http_response_code(400);
    die(json_encode([
        'success' => false,
        'message' => 'File size exceeds 5 MB limit.'
    ]));
}

// Build unique filename
$ext_map  = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
$ext      = isset($ext_map[$mime]) ? $ext_map[$mime] : ($extension === 'jpeg' ? 'jpg' : $extension);
$filename = 'org_photo_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;

// Resolve uploads from this file's directory so it works regardless of server cwd.
$upload_dir = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'src' . DIRECTORY_SEPARATOR . 'images' . DIRECTORY_SEPARATOR . 'about' . DIRECTORY_SEPARATOR;
if (!is_dir($upload_dir)) {
    mkdir($upload_dir, 0755, true);
}

$destination = $upload_dir . $filename;
if (!move_uploaded_file($file['tmp_name'], $destination)) {
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'message' => 'Failed to save uploaded file.'
    ]));
}

// Return path relative to the project root (used as photo_path in DB)
$public_path = 'src/images/about/' . $filename;

http_response_code(200);
echo json_encode([
    'success' => true,
    'path'    => $public_path
]);
