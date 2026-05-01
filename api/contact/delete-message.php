<?php
/**
 * Online Tournament Management
 * api/contact/delete-message.php — Delete a contact message
 */

header('Content-Type: application/json');

require_once dirname(__DIR__, 2) . '/config/db.php';

$data = json_decode(file_get_contents('php://input'), true);
$id   = isset($data['id']) ? (int) $data['id'] : 0;

if ($id <= 0) {
  http_response_code(400);
  echo json_encode(['success' => false, 'error' => 'Invalid message ID']);
  exit;
}

try {
  $stmt = $conn->prepare("DELETE FROM contact_messages WHERE id = ?");
  if (!$stmt) throw new Exception('Prepare failed: ' . $conn->error);

  $stmt->bind_param('i', $id);
  if (!$stmt->execute()) throw new Exception('Execute failed: ' . $stmt->error);

  echo json_encode(['success' => true, 'affected' => $stmt->affected_rows]);
  $stmt->close();

} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

$conn->close();
?>
