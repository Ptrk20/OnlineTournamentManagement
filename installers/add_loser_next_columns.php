<?php
require_once __DIR__ . '/../config/db.php';

$sqls = [
    "ALTER TABLE tournament_matches ADD COLUMN loser_next_match_id BIGINT UNSIGNED NULL AFTER next_match_slot",
    "ALTER TABLE tournament_matches ADD COLUMN loser_next_match_slot ENUM('team1','team2') NULL AFTER loser_next_match_id",
    "ALTER TABLE tournament_matches ADD CONSTRAINT fk_tm_loser_next FOREIGN KEY (loser_next_match_id) REFERENCES tournament_matches(id) ON DELETE SET NULL ON UPDATE CASCADE",
];

foreach ($sqls as $sql) {
    if ($conn->query($sql)) {
        echo "OK: $sql\n";
    } else {
        // Duplicate column/constraint is acceptable (already exists)
        echo ($conn->errno === 1060 || $conn->errno === 1826 || strpos($conn->error, 'Duplicate') !== false)
            ? "ALREADY EXISTS (skip): $sql\n"
            : "ERROR ({$conn->errno}): {$conn->error}\n  SQL: $sql\n";
    }
}

$conn->close();
echo "\nDone.\n";
