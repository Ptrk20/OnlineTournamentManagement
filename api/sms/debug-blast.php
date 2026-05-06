<?php
header('Content-Type: text/plain');
require_once '../../config/db.php';

$res = $conn->query("SELECT id, message_text, sender_id, total_recipients, sent_count, failed_count, status, created_at FROM sms_blast_logs ORDER BY id DESC LIMIT 1");
if ($res && $row = $res->fetch_assoc()) {
    echo "=== Latest SMS Blast ===\n";
    echo "ID: " . $row['id'] . "\n";
    echo "Message: " . $row['message_text'] . "\n";
    echo "Sender ID: " . $row['sender_id'] . "\n";
    echo "Total: " . $row['total_recipients'] . ", Sent: " . $row['sent_count'] . ", Failed: " . $row['failed_count'] . "\n";
    echo "Status: " . $row['status'] . "\n";
    echo "Created: " . $row['created_at'] . "\n\n";

    $bid = $row['id'];
    $rres = $conn->query("SELECT recipient_phone, recipient_name, status, provider_http_code, provider_response, error_message FROM sms_blast_recipients WHERE blast_id = $bid ORDER BY id");
    if ($rres) {
        echo "=== Recipients ===\n";
        while ($rr = $rres->fetch_assoc()) {
            echo "Phone: " . $rr['recipient_phone'] . " | Name: " . $rr['recipient_name'] . "\n";
            echo "  Status: " . $rr['status'] . " | HTTP: " . $rr['provider_http_code'] . "\n";
            if ($rr['provider_response']) {
                echo "  Response: " . substr($rr['provider_response'], 0, 200) . "...\n";
            }
            if ($rr['error_message']) {
                echo "  Error: " . $rr['error_message'] . "\n";
            }
            echo "\n";
        }
    }
}
