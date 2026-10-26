<?php
// api/screens.php - Screens API

require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? $_POST['action'] ?? '';
$screenId = $_GET['id'] ?? $_POST['id'] ?? $_GET['screen_id'] ?? $_POST['screen_id'] ?? null;
$projectId = $_GET['project_id'] ?? $_POST['project_id'] ?? null;

function process_uploaded_image($fileKey = 'file') {
    if (!isset($_FILES[$fileKey]) || $_FILES[$fileKey]['error'] !== UPLOAD_ERR_OK) {
        json_error('Vui lòng chọn tệp ảnh hợp lệ.', 'VALIDATION', 422);
    }
    $file = $_FILES[$fileKey];
    if ($file['size'] > 10 * 1024 * 1024) {
        json_error('Ảnh vượt quá dung lượng tối đa 10 MB.', 'VALIDATION', 422);
    }
    $tmpPath = $file['tmp_name'];
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($tmpPath);

    if (str_ends_with(strtolower($file['name']), '.svg')) {
        $mime = 'image/svg+xml';
    }

    $allowedMimes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
    if (!in_array($mime, $allowedMimes, true)) {
        json_error('Định dạng ảnh không được hỗ trợ. Chỉ chấp nhận PNG, JPEG, SVG hoặc WebP.', 'VALIDATION', 422);
    }

    $width = 0;
    $height = 0;
    if ($mime === 'image/svg+xml') {
        $content = file_get_contents($tmpPath);
        if (preg_match('/viewBox\s*=\s*["\']\s*[\d\.\-]+\s+[\d\.\-]+\s+([\d\.]+)\s+([\d\.]+)/i', $content, $m)) {
            $width = (int)$m[1];
            $height = (int)$m[2];
        } elseif (preg_match('/width\s*=\s*["\']([\d\.]+)["\']/i', $content, $mw) && preg_match('/height\s*=\s*["\']([\d\.]+)["\']/i', $content, $mh)) {
            $width = (int)$mw[1];
            $height = (int)$mh[1];
        }
        if ($width <= 0) $width = 1000;
        if ($height <= 0) $height = 500;
    } else {
        $info = @getimagesize($tmpPath);
        if (!$info) {
            json_error('Không thể đọc kích thước tệp ảnh.', 'VALIDATION', 422);
        }
        $width = $info[0];
        $height = $info[1];
    }

    $ext = pathinfo($file['name'], PATHINFO_EXTENSION) ?: 'png';
    $newFileName = generate_uuid('img') . '.' . strtolower($ext);
    $destPath = __DIR__ . '/../uploads/' . $newFileName;
    if (!move_uploaded_file($tmpPath, $destPath)) {
        json_error('Không thể lưu ảnh lên máy chủ.', 'SAVE_FAILED', 500);
    }

    return [
        'width' => $width,
        'height' => $height,
        'mime' => $mime,
        'imageKey' => 'upload:' . $newFileName
    ];
}

// GET
if ($method === 'GET') {
    if ($screenId) {
        $stmt = $pdo->prepare("SELECT * FROM design_screens WHERE id = :id");
        $stmt->execute([':id' => $screenId]);
        $screen = $stmt->fetch();
        if (!$screen) {
            json_error('Không tìm thấy màn hình thiết kế.', 'NOT_FOUND', 404);
        }
        require_member($pdo, $screen['project_id']);
        json_response(summarize_screen($pdo, $screen));
    }

    if ($projectId) {
        require_member($pdo, $projectId);
        $stmt = $pdo->prepare("SELECT * FROM design_screens WHERE project_id = :pid ORDER BY created_at ASC");
        $stmt->execute([':pid' => $projectId]);
        $screens = $stmt->fetchAll();
        $result = [];
        foreach ($screens as $s) {
            $result[] = summarize_screen($pdo, $s);
        }
        json_response($result);
    }

    json_error('Thiếu mã dự án hoặc màn hình.', 'VALIDATION', 422);
}

// POST
if ($method === 'POST') {
    if ($action === 'create') {
        $pid = $projectId ?: ($_POST['projectId'] ?? $_POST['project_id'] ?? '');
        if (!$pid) {
            json_error('Thiếu mã dự án.', 'VALIDATION', 422);
        }
        $memberInfo = require_member($pdo, $pid, ['manager']);
        $session = $memberInfo['session'];

        $name = trim($_POST['name'] ?? '');
        if (!$name) {
            json_error('Tên màn hình không được để trống.', 'VALIDATION', 422);
        }
        if (mb_strlen($name, 'UTF-8') > 80) {
            json_error('Tên màn hình tối đa 80 ký tự.', 'VALIDATION', 422);
        }

        $uploaded = process_uploaded_image('file');
        $now = (new DateTime('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.000\Z');

        $scrId = generate_uuid('scr');
        $verId = generate_uuid('ver');

        $stmtScr = $pdo->prepare("INSERT INTO design_screens (id, project_id, name, description, created_at, updated_at, created_by) VALUES (:id, :pid, :name, '', :created_at, :updated_at, :uid)");
        $stmtScr->execute([
            ':id' => $scrId,
            ':pid' => $pid,
            ':name' => $name,
            ':created_at' => $now,
            ':updated_at' => $now,
            ':uid' => $session['userId']
        ]);

        $stmtVer = $pdo->prepare("INSERT INTO image_versions (id, screen_id, project_id, number, width, height, image_key, mime_type, source, created_at, created_by) VALUES (:id, :sid, :pid, 1, :w, :h, :ikey, :mime, 'upload', :cat, :uid)");
        $stmtVer->execute([
            ':id' => $verId,
            ':sid' => $scrId,
            ':pid' => $pid,
            ':w' => $uploaded['width'],
            ':h' => $uploaded['height'],
            ':ikey' => $uploaded['imageKey'],
            ':mime' => $uploaded['mime'],
            ':cat' => $now,
            ':uid' => $session['userId']
        ]);

        touch_project($pdo, $pid, $now);
        push_activity($pdo, $pid, $session['userId'], 'screen.created', "đã tải màn hình $name, phiên bản v1");

        $stmtFetch = $pdo->prepare("SELECT * FROM design_screens WHERE id = :id");
        $stmtFetch->execute([':id' => $scrId]);
        json_response(summarize_screen($pdo, $stmtFetch->fetch()), 201);
    }

    if ($action === 'add_version') {
        $sid = $screenId ?: ($_POST['screenId'] ?? $_POST['screen_id'] ?? '');
        if (!$sid) {
            json_error('Thiếu mã màn hình.', 'VALIDATION', 422);
        }
        $stmtScr = $pdo->prepare("SELECT * FROM design_screens WHERE id = :id");
        $stmtScr->execute([':id' => $sid]);
        $screen = $stmtScr->fetch();
        if (!$screen) {
            json_error('Không tìm thấy màn hình thiết kế.', 'NOT_FOUND', 404);
        }

        $memberInfo = require_member($pdo, $screen['project_id'], ['manager']);
        $session = $memberInfo['session'];

        $uploaded = process_uploaded_image('file');
        $now = (new DateTime('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.000\Z');

        $stmtMax = $pdo->prepare("SELECT max(number) FROM image_versions WHERE screen_id = :sid");
        $stmtMax->execute([':sid' => $sid]);
        $nextNumber = ((int)$stmtMax->fetchColumn()) + 1;

        $verId = generate_uuid('ver');
        $stmtVer = $pdo->prepare("INSERT INTO image_versions (id, screen_id, project_id, number, width, height, image_key, mime_type, source, created_at, created_by) VALUES (:id, :sid, :pid, :num, :w, :h, :ikey, :mime, 'upload', :cat, :uid)");
        $stmtVer->execute([
            ':id' => $verId,
            ':sid' => $sid,
            ':pid' => $screen['project_id'],
            ':num' => $nextNumber,
            ':w' => $uploaded['width'],
            ':h' => $uploaded['height'],
            ':ikey' => $uploaded['imageKey'],
            ':mime' => $uploaded['mime'],
            ':cat' => $now,
            ':uid' => $session['userId']
        ]);

        $stmtUpScr = $pdo->prepare("UPDATE design_screens SET updated_at = :now WHERE id = :sid");
        $stmtUpScr->execute([':now' => $now, ':sid' => $sid]);

        touch_project($pdo, $screen['project_id'], $now);
        push_activity($pdo, $screen['project_id'], $session['userId'], 'version.created', "đã tải phiên bản v$nextNumber cho màn hình {$screen['name']}");

        $stmtFetch = $pdo->prepare("SELECT * FROM image_versions WHERE id = :id");
        $stmtFetch->execute([':id' => $verId]);
        json_response(present_version($pdo, $stmtFetch->fetch()), 201);
    }
}

json_error('Thao tác không hợp lệ.', 'NOT_FOUND', 404);
