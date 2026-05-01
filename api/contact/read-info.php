<?php
/**
 * Online Tournament Management
 * api/contact/read-info.php — Fetch contact page information
 */

header('Content-Type: application/json');

require_once dirname(__DIR__, 2) . '/config/db.php';

try {
  $query = "SELECT id, address, phone, email FROM contact_page_info WHERE id = 1 LIMIT 1";
  $result = $conn->query($query);

  if (!$result) {
    throw new Exception('Query failed: ' . $conn->error);
  }

  if ($result->num_rows === 0) {
    // Initialize with default empty values if row doesn't exist
    echo json_encode([
      'success' => true,
      'id'      => 1,
      'address' => '',
      'phone'   => '',
      'email'   => ''
    ]);
    exit;
  }

  $row = $result->fetch_assoc();
  echo json_encode([
    'success' => true,
    'id'      => $row['id'],
    'address' => $row['address'] ?? '',
    'phone'   => $row['phone'] ?? '',
    'email'   => $row['email'] ?? ''
  ]);

} catch (Exception $e) {
  http_response_code(500);
  echo json_encode([
    'success' => false,
    'error'   => $e->getMessage()
  ]);
}

$conn->close();
?>
