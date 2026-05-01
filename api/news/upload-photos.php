<?php
/**
 * Upload News Photos API (supports multiple files)
 * POST /api/news/upload-photos.php
 * multipart/form-data with field name "photos[]"
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  die(json_encode(['success' => false, 'message' => 'Method not allowed. Use POST.']));
}

if (!isset($_FILES['photos'])) {
  http_response_code(400);
  die(json_encode(['success' => false, 'message' => 'No files uploaded.']));
}

$allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
$allowedExts  = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
$maxSize      = 5 * 1024 * 1024; // 5 MB per image

$uploadDir = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'src' . DIRECTORY_SEPARATOR . 'images' . DIRECTORY_SEPARATOR . 'news' . DIRECTORY_SEPARATOR;
if (!is_dir($uploadDir)) {
  mkdir($uploadDir, 0755, true);
}

$files = $_FILES['photos'];
$uploaded = [];

$count = is_array($files['name']) ? count($files['name']) : 0;
if ($count < 1) {
  http_response_code(400);
  die(json_encode(['success' => false, 'message' => 'No files uploaded.']));
}

for ($i = 0; $i < $count; $i++) {
  if ($files['error'][$i] !== UPLOAD_ERR_OK) {
    continue;
  }

  $tmpName = $files['tmp_name'][$i];
  $origName = $files['name'][$i];
  $size = intval($files['size'][$i]);
  $extension = strtolower(pathinfo($origName, PATHINFO_EXTENSION));

  if ($size > $maxSize) {
    continue;
  }

  $mime = null;
  if (function_exists('finfo_open')) {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    if ($finfo) {
      $mime = finfo_file($finfo, $tmpName);
      finfo_close($finfo);
    }
  }

  if (!$mime && isset($files['type'][$i])) {
    $mime = strtolower(trim($files['type'][$i]));
  }

  if (!in_array($mime, $allowedTypes, true) || !in_array($extension, $allowedExts, true)) {
    continue;
  }

  $extMap = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
  $ext = isset($extMap[$mime]) ? $extMap[$mime] : ($extension === 'jpeg' ? 'jpg' : $extension);
  $filename = 'news_' . time() . '_' . $i . '_' . bin2hex(random_bytes(3)) . '.' . $ext;
  $destination = $uploadDir . $filename;

  if (move_uploaded_file($tmpName, $destination)) {
    $uploaded[] = 'src/images/news/' . $filename;
  }
}

if (count($uploaded) === 0) {
  http_response_code(400);
  die(json_encode(['success' => false, 'message' => 'No valid images were uploaded.']));
}

echo json_encode([
  'success' => true,
  'paths' => $uploaded
]);
?>
