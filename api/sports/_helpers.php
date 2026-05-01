<?php
/**
 * Sports API Helpers
 */

function sports_error(int $statusCode, string $message): void {
    http_response_code($statusCode);
    die(json_encode([
        'success' => false,
        'message' => $message
    ]));
}

function sports_load_schema(mysqli $conn): array {
    $res = $conn->query("SHOW COLUMNS FROM sports");
    if (!$res) {
        sports_error(500, 'Table \"sports\" not found or inaccessible.');
    }

    $columns = [];
    while ($row = $res->fetch_assoc()) {
        $columns[] = $row['Field'];
    }

    if (empty($columns)) {
        sports_error(500, 'Table \"sports\" has no columns.');
    }

    $nameCol = in_array('sport_name', $columns, true)
        ? 'sport_name'
        : (in_array('sports_name', $columns, true) ? 'sports_name' : null);

    if (!$nameCol) {
        sports_error(500, 'Table \"sports\" must contain sport_name or sports_name column.');
    }

    return [
        'columns' => $columns,
        'name' => $nameCol,
        'code' => in_array('sport_code', $columns, true) ? 'sport_code' : null,
        'photo' => in_array('photo_path', $columns, true)
            ? 'photo_path'
            : (in_array('icon_path', $columns, true) ? 'icon_path' : null),
        'is_active' => in_array('is_active', $columns, true) ? 'is_active' : null,
        'created_at' => in_array('created_at', $columns, true) ? 'created_at' : null,
        'updated_at' => in_array('updated_at', $columns, true) ? 'updated_at' : null
    ];
}

function sports_select_sql(array $schema): string {
    $parts = ['id'];

    if ($schema['code']) {
        $parts[] = $schema['code'] . ' AS sport_code';
    } else {
        $parts[] = "'' AS sport_code";
    }

    $parts[] = $schema['name'] . ' AS sport_name';

    if ($schema['photo']) {
        $parts[] = $schema['photo'] . ' AS photo_path';
    } else {
        $parts[] = 'NULL AS photo_path';
    }

    if ($schema['is_active']) {
        $parts[] = $schema['is_active'] . ' AS is_active';
    } else {
        $parts[] = '1 AS is_active';
    }

    if ($schema['created_at']) {
        $parts[] = $schema['created_at'] . ' AS created_at';
    }

    if ($schema['updated_at']) {
        $parts[] = $schema['updated_at'] . ' AS updated_at';
    }

    return implode(', ', $parts);
}

function sports_get_json_input(): array {
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $data = json_decode($raw, true);
    if (!is_array($data)) {
        sports_error(400, 'Invalid JSON payload.');
    }

    return $data;
}
