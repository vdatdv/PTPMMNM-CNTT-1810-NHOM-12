<?php
// api/reset.php - Reset Demo Database API

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/seed.php';

$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'POST') {
    json_error('Phương thức không hợp lệ.', 'NOT_FOUND', 404);
}

$session = require_auth($pdo);

// Delete uploaded images in uploads/
$uploadsDir = __DIR__ . '/../uploads';
if (is_dir($uploadsDir)) {
    $files = glob($uploadsDir . '/*');
    foreach ($files as $f) {
        if (is_file($f)) {
            @unlink($f);
        }
    }
}

// Reseed database
seed_database($pdo);

json_response(['success' => true]);
