<?php
/**
 * Online Tournament Management
 * api/contact/update-info.php — Update contact page information
 */

header('Content-Type: application/json');

require_once dirname(__DIR__, 2) . '/config/db.php';

// Check if user is authenticated
session_start();
if (!isset($_SESSION['user_id'])) {
  http_response_code(401);
  echo json_encode(['success' => false, 'error' => 'Unauthorized']);
  exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
  http_response_code(400);
  echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
  exit;
}

$address = $data['address'] ?? '';
$phone   = $data['phone'] ?? '';
$email   = $data['email'] ?? '';
$userId  = $_SESSION['user_id'];

try {
  // Check if record exists
  $check = $conn->query("SELECT id FROM contact_page_info WHERE id = 1 LIMIT 1");

  if ($check->num_rows === 0) {
    // INSERT
    $query = "INSERT INTO contact_page_info (id, address, phone, email, updated_by, updated_at)
              VALUES (1, ?, ?, ?, ?, NOW())";
  } else {
    // UPDATE
    $query = "UPDATE contact_page_info 
              SET address = ?, phone = ?, email = ?, updated_by = ?, updated_at = NOW()
              WHERE id = 1";
  }

  $stmt = $conn->prepare($query);
  if (!$stmt) {
    throw new Exception('Prepare failed: ' . $conn->error);
  }

  $stmt->bind_param('sssi', $address, $phone, $email, $userId);

  if (!$stmt->execute()) {
    throw new Exception('Execute failed: ' . $stmt->error);
  }

  echo json_encode(['success' => true]);
  $stmt->close();

} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

$conn->close();
?>
