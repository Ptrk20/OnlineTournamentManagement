<?php
/**
 * Database Connection Configuration
 * Online Tournament Management System
 * 
 * This file handles the connection to the otm_db MySQL database.
 */

// Enable error reporting for debugging
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Database connection parameters
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', 'admin@2026'); // Change this to your MySQL password if needed
define('DB_NAME', 'otm_db');
define('DB_PORT', 3306);

// Disable MySQLi exception throwing so error-check patterns (if (!$stmt)) work correctly
mysqli_report(MYSQLI_REPORT_OFF);

// Create connection using mysqli
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);

// Check connection
if ($conn->connect_error) {
    header('Content-Type: application/json');
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'error' => 'Database connection failed: ' . $conn->connect_error
    ]));
}

// Set charset to utf8mb4 for proper encoding
$conn->set_charset("utf8mb4");

// Set timezone (optional but recommended)
$conn->query("SET time_zone = '+00:00'");

// Register shutdown function to catch fatal errors
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== null && ($error['type'] === E_ERROR || $error['type'] === E_PARSE)) {
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Server error: ' . $error['message'],
            'file' => $error['file'],
            'line' => $error['line']
        ]);
        exit;
    }
});
?>
