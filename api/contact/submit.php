<?php
/**
 * Online Tournament Management
 * api/contact/submit.php — Submit a contact form message (public)
 */

header('Content-Type: application/json');

require_once dirname(__DIR__, 2) . '/config/db.php';

$data = json_decode(file_get_contents('php://input'), true);

$full_name = trim($data['name']    ?? '');
$email     = trim($data['email']   ?? '');
$subject   = trim($data['subject'] ?? '');
$message   = trim($data['message'] ?? '');

if (!$full_name || !$email || !$subject || !$message) {
  http_response_code(400);
  echo json_encode(['success' => false, 'error' => 'All fields are required']);
  exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  echo json_encode(['success' => false, 'error' => 'Invalid email address']);
  exit;
}

try {
  $stmt = $conn->prepare(
    "INSERT INTO contact_messages (full_name, email, subject, message)
     VALUES (?, ?, ?, ?)"
  );
  if (!$stmt) throw new Exception('Prepare failed: ' . $conn->error);

  $stmt->bind_param('ssss', $full_name, $email, $subject, $message);
  if (!$stmt->execute()) throw new Exception('Execute failed: ' . $stmt->error);

  echo json_encode(['success' => true, 'id' => $conn->insert_id]);
  $stmt->close();

} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

$conn->close();
?>
