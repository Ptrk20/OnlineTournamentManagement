<?php
require_once __DIR__ . '/../config/db.php';

$sql = "ALTER TABLE contact_page_info ADD COLUMN facebook_url VARCHAR(255) NULL AFTER email";

if ($conn->query($sql) === TRUE) {
    echo 'OK: facebook_url column added to contact_page_info';
} else {
    echo 'ERROR: ' . $conn->error;
}

$conn->close();
