<?php
require_once __DIR__ . '/../config/db.php';

$sql = "ALTER TABLE tournament_brackets ADD COLUMN ui_theme ENUM('dark','light') NOT NULL DEFAULT 'dark' AFTER status";

try {
    if ($conn->query($sql)) {
        echo "OK: ui_theme column added to tournament_brackets\n";
    } else {
        echo "ERROR ({$conn->errno}): {$conn->error}\n";
    }
} catch (Throwable $e) {
    $msg = $e->getMessage();
    if (stripos($msg, 'Duplicate column') !== false) {
        echo "ALREADY EXISTS: ui_theme column already present\n";
    } else {
        echo "ERROR: {$msg}\n";
    }
}

$conn->close();
