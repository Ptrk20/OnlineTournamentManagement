<?php
require_once __DIR__ . '/../config/db.php';

$errors = [];
$actions = [];

function column_exists(mysqli $conn, string $table, string $column): bool {
    $stmt = $conn->prepare("SELECT COUNT(*) AS cnt FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?");
    if (!$stmt) return false;
    $stmt->bind_param('ss', $table, $column);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    return (int)($row['cnt'] ?? 0) > 0;
}

$table = 'tournament_matches';
$columnsToDrop = [
    'schedule_end_date',
    'schedule_end_time',
];

foreach ($columnsToDrop as $column) {
    if (!column_exists($conn, $table, $column)) {
        $actions[] = "SKIP: {$column} does not exist";
        continue;
    }

    $sql = "ALTER TABLE {$table} DROP COLUMN {$column}";
    if (!$conn->query($sql)) {
        $errors[] = "{$column}: {$conn->error}";
    } else {
        $actions[] = "DROP: {$column}";
    }
}

if (!empty($errors)) {
    echo 'ERROR: ' . implode(' | ', $errors);
} else {
    echo 'OK: ' . implode(' ; ', $actions);
}

$conn->close();
