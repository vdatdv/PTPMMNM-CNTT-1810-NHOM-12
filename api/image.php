<?php
// api/image.php - Image serving API

require_once __DIR__ . '/svg_seeds.php';

$key = $_GET['key'] ?? $_GET['id'] ?? '';
if (!$key) {
    http_response_code(400);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Thiếu khóa hình ảnh.';
    exit;
}

// 1. Seed SVG images
if (str_starts_with($key, 'seed:')) {
    header('Content-Type: image/svg+xml; charset=utf-8');
    header('Cache-Control: public, max-age=86400');
    echo render_seed_svg($key);
    exit;
}

// 2. Uploaded image files
$fileName = $key;
if (str_starts_with($fileName, 'upload:')) {
    $fileName = substr($fileName, 7);
}

// Prevent directory traversal
$fileName = basename($fileName);
$filePath = __DIR__ . '/../uploads/' . $fileName;

if (file_exists($filePath) && is_file($filePath)) {
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($filePath);
    if (str_ends_with(strtolower($fileName), '.svg')) {
        $mime = 'image/svg+xml';
    }
    header('Content-Type: ' . $mime);
    header('Content-Length: ' . filesize($filePath));
    header('Cache-Control: public, max-age=86400');
    readfile($filePath);
    exit;
}

http_response_code(404);
header('Content-Type: text/plain; charset=utf-8');
echo 'Không tìm thấy tệp ảnh.';
