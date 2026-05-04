<?php
require_once __DIR__ . '/../config/db.php';

$queries = [
    "ALTER TABLE about_page_content ADD COLUMN mission TEXT NULL AFTER description",
    "ALTER TABLE about_page_content ADD COLUMN vision TEXT NULL AFTER mission",
];

$errors = [];

foreach ($queries as $sql) {
    if (!$conn->query($sql)) {
        $msg = $conn->error;
        if (stripos($msg, 'Duplicate column name') === false) {
            $errors[] = $msg;
        }
    }
}

if (!empty($errors)) {
    echo 'ERROR: ' . implode(' | ', $errors);
} else {
    echo 'OK: mission and vision columns are ready in about_page_content';
}

$conn->close();
