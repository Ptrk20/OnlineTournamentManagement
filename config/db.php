<?php
/**
 * Database Connection Configuration
 * Online Tournament Management System
 * 
 * This file handles the connection to the otm_db MySQL database.
 */

// Database connection parameters
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', 'admin@2026'); // Change this to your MySQL password if needed
define('DB_NAME', 'otm_db');
define('DB_PORT', 3306);

// Create connection using mysqli
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);

// Check connection
if ($conn->connect_error) {
    die(json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . $conn->connect_error
    ]));
}

// Set charset to utf8mb4 for proper encoding
$conn->set_charset("utf8mb4");

// Set timezone (optional but recommended)
$conn->query("SET time_zone = '+00:00'");
?>
