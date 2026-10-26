<?php
// api/versions.php - Versions API

require_once __DIR__ . '/db.php';

$screenId = $_GET['screen_id'] ?? null;
$versionId = $_GET['id'] ?? null;

if ($versionId) {
    $stmt = $pdo->prepare("SELECT * FROM image_versions WHERE id = :id");
    $stmt->execute([':id' => $versionId]);
    $ver = $stmt->fetch();
    if (!$ver) {
        json_error('Không tìm thấy phiên bản thiết kế.', 'NOT_FOUND', 404);
    }
    require_member($pdo, $ver['project_id']);
    json_response(present_version($pdo, $ver));
}

if ($screenId) {
    $stmtScr = $pdo->prepare("SELECT project_id FROM design_screens WHERE id = :sid");
    $stmtScr->execute([':sid' => $screenId]);
    $pid = $stmtScr->fetchColumn();
    if (!$pid) {
        json_error('Không tìm thấy màn hình thiết kế.', 'NOT_FOUND', 404);
    }
    require_member($pdo, $pid);

    $stmt = $pdo->prepare("SELECT * FROM image_versions WHERE screen_id = :sid ORDER BY number ASC, created_at ASC");
    $stmt->execute([':sid' => $screenId]);
    $vers = $stmt->fetchAll();
    $result = [];
    foreach ($vers as $v) {
        $result[] = present_version($pdo, $v);
    }
    json_response($result);
}

json_error('Thiếu mã phiên bản hoặc màn hình.', 'VALIDATION', 422);
