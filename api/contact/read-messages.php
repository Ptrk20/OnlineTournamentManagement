<?php
/**
 * Online Tournament Management
 * api/contact/read-messages.php — Fetch all contact messages
 */

header('Content-Type: application/json');

require_once dirname(__DIR__, 2) . '/config/db.php';

try {
  $result = $conn->query(
    "SELECT id, full_name, email, subject, message, is_read,
            DATE_FORMAT(submitted_at, '%b %d, %Y %h:%i %p') AS submitted_at
     FROM contact_messages
     ORDER BY submitted_at DESC"
  );

  if (!$result) {
    throw new Exception('Query failed: ' . $conn->error);
  }

  $messages = [];
  while ($row = $result->fetch_assoc()) {
    $row['is_read'] = (bool) $row['is_read'];
    $messages[]     = $row;
  }

  $total  = count($messages);
  $unread = count(array_filter($messages, fn($m) => !$m['is_read']));

  echo json_encode([
    'success' => true,
    'data'    => $messages,
    'total'   => $total,
    'unread'  => $unread,
    'read'    => $total - $unread
  ]);

} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

$conn->close();
?>
