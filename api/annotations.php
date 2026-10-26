<?php
// api/annotations.php - Annotations API

require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? $_POST['action'] ?? '';
$annotationId = $_GET['id'] ?? $_POST['id'] ?? null;
$versionId = $_GET['version_id'] ?? $_POST['version_id'] ?? $_GET['imageVersionId'] ?? null;

// GET
if ($method === 'GET') {
    if ($versionId) {
        $stmtVer = $pdo->prepare("SELECT * FROM image_versions WHERE id = :vid");
        $stmtVer->execute([':vid' => $versionId]);
        $version = $stmtVer->fetch();
        if (!$version) {
            json_error('Không tìm thấy phiên bản thiết kế.', 'NOT_FOUND', 404);
        }
        require_member($pdo, $version['project_id']);

        $stmt = $pdo->prepare("SELECT * FROM annotations WHERE image_version_id = :vid ORDER BY created_at ASC, id ASC");
        $stmt->execute([':vid' => $versionId]);
        $anns = $stmt->fetchAll();
        $result = [];
        foreach ($anns as $a) {
            $result[] = present_annotation($pdo, $a);
        }
        json_response($result);
    }

    if ($annotationId) {
        $stmt = $pdo->prepare("SELECT * FROM annotations WHERE id = :id");
        $stmt->execute([':id' => $annotationId]);
        $ann = $stmt->fetch();
        if (!$ann) {
            json_error('Không tìm thấy góp ý.', 'NOT_FOUND', 404);
        }
        require_member($pdo, $ann['project_id']);

        if ($action === 'history') {
            $presented = present_annotation($pdo, $ann);
            json_response($presented['statusHistory']);
        }

        json_response(present_annotation($pdo, $ann));
    }

    json_error('Thiếu mã phiên bản hoặc mã góp ý.', 'VALIDATION', 422);
}

// POST
if ($method === 'POST') {
    $input = get_json_input();

    // Create annotation
    if ($action === 'create') {
        $vid = $versionId ?: ($input['imageVersionId'] ?? $input['version_id'] ?? '');
        if (!$vid) {
            json_error('Thiếu mã phiên bản ảnh.', 'VALIDATION', 422);
        }
        $stmtVer = $pdo->prepare("SELECT * FROM image_versions WHERE id = :vid");
        $stmtVer->execute([':vid' => $vid]);
        $version = $stmtVer->fetch();
        if (!$version) {
            json_error('Không tìm thấy phiên bản ảnh.', 'NOT_FOUND', 404);
        }

        $memberInfo = require_member($pdo, $version['project_id'], ['reviewer', 'manager']);
        $session = $memberInfo['session'];

        $body = trim($input['body'] ?? '');
        if (!$body) {
            json_error('Nhận xét không được để trống.', 'VALIDATION', 422);
        }
        if (mb_strlen($body, 'UTF-8') > 2000) {
            json_error('Nhận xét tối đa 2000 ký tự.', 'VALIDATION', 422);
        }

        $type = ($input['type'] === 'rect') ? 'rect' : (($input['type'] === 'point') ? 'point' : '');
        if (!$type) {
            json_error('Loại đánh dấu không hợp lệ.', 'VALIDATION', 422);
        }

        $x = (float)($input['x'] ?? 0);
        $y = (float)($input['y'] ?? 0);
        $w = ($type === 'point') ? 0 : (float)($input['w'] ?? 0);
        $h = ($type === 'point') ? 0 : (float)($input['h'] ?? 0);

        if ($x < 0 || $y < 0 || $x > $version['width'] || $y > $version['height']) {
            json_error('Tọa độ nằm ngoài ảnh gốc.', 'VALIDATION', 422);
        }
        if ($type === 'rect' && ($w <= 0 || $h <= 0 || $x + $w > $version['width'] + 0.01 || $y + $h > $version['height'] + 0.01)) {
            json_error('Vùng khoanh không hợp lệ trên ảnh gốc.', 'VALIDATION', 422);
        }

        $now = (new DateTime('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.000\Z');
        $annId = generate_uuid('ann');

        $stmtInsert = $pdo->prepare("INSERT INTO annotations (id, project_id, screen_id, image_version_id, type, x, y, w, h, original_width, original_height, author_id, body, status, revision, check_note, created_at, updated_at) VALUES (:id, :pid, :sid, :vid, :type, :x, :y, :w, :h, :ow, :oh, :aid, :body, 'open', 1, '', :cat, :uat)");
        $stmtInsert->execute([
            ':id' => $annId,
            ':pid' => $version['project_id'],
            ':sid' => $version['screen_id'],
            ':vid' => $version['id'],
            ':type' => $type,
            ':x' => $x,
            ':y' => $y,
            ':w' => max(0, $w),
            ':h' => max(0, $h),
            ':ow' => $version['width'],
            ':oh' => $version['height'],
            ':aid' => $session['userId'],
            ':body' => $body,
            ':cat' => $now,
            ':uat' => $now
        ]);

        $stmtSh = $pdo->prepare("INSERT INTO annotation_status_events (id, annotation_id, status, user_id, note, created_at) VALUES (:id, :aid, 'open', :uid, 'Tạo góp ý', :cat)");
        $stmtSh->execute([
            ':id' => generate_uuid('sh'),
            ':aid' => $annId,
            ':uid' => $session['userId'],
            ':cat' => $now
        ]);

        $stmtScr = $pdo->prepare("SELECT name FROM design_screens WHERE id = :sid");
        $stmtScr->execute([':sid' => $version['screen_id']]);
        $screenName = $stmtScr->fetchColumn() ?: 'màn hình';

        touch_project($pdo, $version['project_id'], $now);
        push_activity($pdo, $version['project_id'], $session['userId'], 'comment.created', "đã thêm nhận xét trên {$screenName} v{$version['number']}");

        $stmtFetch = $pdo->prepare("SELECT * FROM annotations WHERE id = :id");
        $stmtFetch->execute([':id' => $annId]);
        json_response(present_annotation($pdo, $stmtFetch->fetch()), 201);
    }

    if (!$annotationId) {
        $annotationId = $input['id'] ?? null;
    }
    if (!$annotationId) {
        json_error('Thiếu mã góp ý.', 'VALIDATION', 422);
    }

    $stmt = $pdo->prepare("SELECT * FROM annotations WHERE id = :id");
    $stmt->execute([':id' => $annotationId]);
    $ann = $stmt->fetch();
    if (!$ann) {
        json_error('Không tìm thấy góp ý.', 'NOT_FOUND', 404);
    }

    if ($action === 'update_body') {
        $memberInfo = require_member($pdo, $ann['project_id'], ['reviewer', 'manager']);
        $session = $memberInfo['session'];

        if ($ann['author_id'] !== $session['userId']) {
            json_error('Bạn chỉ sửa được nhận xét của chính mình.', 'FORBIDDEN', 403);
        }

        $body = trim($input['body'] ?? '');
        if (!$body) {
            json_error('Nhận xét không được để trống.', 'VALIDATION', 422);
        }
        if (mb_strlen($body, 'UTF-8') > 2000) {
            json_error('Nhận xét tối đa 2000 ký tự.', 'VALIDATION', 422);
        }

        $now = (new DateTime('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.000\Z');
        $reqRevision = isset($input['revision']) ? (int)$input['revision'] : null;
        $simulateConflict = !empty($input['simulateConflict']);

        if ($simulateConflict) {
            $conflictBody = "Nội dung mới nhất được ghi bởi một phiên khác lúc " . (new DateTime())->format('H:i:s') . ".";
            $newRev = ((int)$ann['revision']) + 1;
            $stmtUp = $pdo->prepare("UPDATE annotations SET body = :b, revision = :rev, updated_at = :uat WHERE id = :id");
            $stmtUp->execute([':b' => $conflictBody, ':rev' => $newRev, ':uat' => $now, ':id' => $ann['id']]);

            push_activity($pdo, $ann['project_id'], $session['userId'], 'comment.updated', 'đã mô phỏng xung đột khi sửa nhận xét');
            json_error('Nội dung đã được thay đổi ở một phiên khác.', 'CONFLICT', 409, [
                'latest' => ['body' => $conflictBody, 'revision' => $newRev],
                'mine' => $body
            ]);
        }

        if ($reqRevision !== null && $reqRevision !== (int)$ann['revision']) {
            json_error('Nội dung đã được thay đổi ở một phiên khác.', 'CONFLICT', 409, [
                'latest' => ['body' => $ann['body'], 'revision' => (int)$ann['revision']],
                'mine' => $body
            ]);
        }

        $newRev = ((int)$ann['revision']) + 1;
        $stmtUp = $pdo->prepare("UPDATE annotations SET body = :b, revision = :rev, updated_at = :uat WHERE id = :id");
        $stmtUp->execute([':b' => $body, ':rev' => $newRev, ':uat' => $now, ':id' => $ann['id']]);

        push_activity($pdo, $ann['project_id'], $session['userId'], 'comment.updated', 'đã sửa một nhận xét');

        $stmtFetch = $pdo->prepare("SELECT * FROM annotations WHERE id = :id");
        $stmtFetch->execute([':id' => $ann['id']]);
        json_response(present_annotation($pdo, $stmtFetch->fetch()));
    }

    if ($action === 'reply') {
        $memberInfo = require_member($pdo, $ann['project_id'], ['reviewer', 'manager']);
        $session = $memberInfo['session'];

        $body = trim($input['body'] ?? '');
        if (!$body) {
            json_error('Trả lời không được để trống.', 'VALIDATION', 422);
        }
        if (mb_strlen($body, 'UTF-8') > 2000) {
            json_error('Trả lời tối đa 2000 ký tự.', 'VALIDATION', 422);
        }

        $now = (new DateTime('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.000\Z');
        $stmtRep = $pdo->prepare("INSERT INTO annotation_replies (id, annotation_id, author_id, body, created_at) VALUES (:id, :aid, :author, :body, :cat)");
        $stmtRep->execute([
            ':id' => generate_uuid('rep'),
            ':aid' => $ann['id'],
            ':author' => $session['userId'],
            ':body' => $body,
            ':cat' => $now
        ]);

        $stmtUp = $pdo->prepare("UPDATE annotations SET updated_at = :uat WHERE id = :id");
        $stmtUp->execute([':uat' => $now, ':id' => $ann['id']]);

        touch_project($pdo, $ann['project_id'], $now);
        push_activity($pdo, $ann['project_id'], $session['userId'], 'comment.replied', 'đã trả lời một góp ý');

        $stmtFetch = $pdo->prepare("SELECT * FROM annotations WHERE id = :id");
        $stmtFetch->execute([':id' => $ann['id']]);
        json_response(present_annotation($pdo, $stmtFetch->fetch()));
    }

    if ($action === 'status') {
        $memberInfo = require_member($pdo, $ann['project_id'], ['reviewer', 'manager']);
        $session = $memberInfo['session'];

        $status = trim($input['status'] ?? '');
        if ($status !== 'open' && $status !== 'resolved') {
            json_error('Trạng thái không hợp lệ.', 'VALIDATION', 422);
        }

        if ($ann['status'] === $status) {
            json_response(present_annotation($pdo, $ann));
        }

        $now = (new DateTime('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.000\Z');
        $newRev = ((int)$ann['revision']) + 1;

        $stmtUp = $pdo->prepare("UPDATE annotations SET status = :st, revision = :rev, updated_at = :uat WHERE id = :id");
        $stmtUp->execute([':st' => $status, ':rev' => $newRev, ':uat' => $now, ':id' => $ann['id']]);

        $stmtSh = $pdo->prepare("INSERT INTO annotation_status_events (id, annotation_id, status, user_id, note, created_at) VALUES (:id, :aid, :st, :uid, :note, :cat)");
        $stmtSh->execute([
            ':id' => generate_uuid('sh'),
            ':aid' => $ann['id'],
            ':st' => $status,
            ':uid' => $session['userId'],
            ':note' => ($status === 'resolved' ? 'Đã xử lý' : 'Mở lại'),
            ':cat' => $now
        ]);

        touch_project($pdo, $ann['project_id'], $now);
        $statusMsg = ($status === 'resolved') ? 'đã đánh dấu một góp ý là đã xử lý' : 'đã mở lại một góp ý';
        push_activity($pdo, $ann['project_id'], $session['userId'], 'comment.status', $statusMsg);

        $stmtFetch = $pdo->prepare("SELECT * FROM annotations WHERE id = :id");
        $stmtFetch->execute([':id' => $ann['id']]);
        json_response(present_annotation($pdo, $stmtFetch->fetch()));
    }

    if ($action === 'check_note') {
        require_member($pdo, $ann['project_id'], ['reviewer', 'manager']);
        $note = trim($input['note'] ?? '');
        if (mb_strlen($note, 'UTF-8') > 500) {
            json_error('Ghi chú kiểm tra tối đa 500 ký tự.', 'VALIDATION', 422);
        }
        $now = (new DateTime('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.000\Z');

        $stmtUp = $pdo->prepare("UPDATE annotations SET check_note = :note, updated_at = :uat WHERE id = :id");
        $stmtUp->execute([':note' => $note, ':uat' => $now, ':id' => $ann['id']]);

        $stmtFetch = $pdo->prepare("SELECT * FROM annotations WHERE id = :id");
        $stmtFetch->execute([':id' => $ann['id']]);
        json_response(present_annotation($pdo, $stmtFetch->fetch()));
    }
}

json_error('Thao tác không hợp lệ.', 'NOT_FOUND', 404);
