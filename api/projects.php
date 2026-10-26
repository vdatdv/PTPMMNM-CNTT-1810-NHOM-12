<?php
// api/projects.php - Projects API

require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? $_POST['action'] ?? '';
$projectId = $_GET['id'] ?? $_POST['id'] ?? $_GET['project_id'] ?? null;

// GET single or list
if ($method === 'GET') {
    if ($projectId) {
        $memberInfo = require_member($pdo, $projectId);
        $session = $memberInfo['session'];

        if ($action === 'members') {
            $stmt = $pdo->prepare("SELECT u.id, u.name, u.username, pm.role, u.color, u.title, pm.id as \"membershipId\", pm.created_at as \"createdAt\" FROM project_members pm JOIN users u ON pm.user_id = u.id WHERE pm.project_id = :pid");
            $stmt->execute([':pid' => $projectId]);
            json_response($stmt->fetchAll());
        }

        if ($action === 'invite_candidates') {
            require_member($pdo, $projectId, ['manager']);
            $stmt = $pdo->prepare("SELECT id, name, username, role, color, title FROM users WHERE (is_verified = 1 AND role != 'pending') AND id NOT IN (SELECT user_id FROM project_members WHERE project_id = :pid)");
            $stmt->execute([':pid' => $projectId]);
            json_response($stmt->fetchAll());
        }

        if ($action === 'activities') {
            $stmt = $pdo->prepare("SELECT id, project_id as \"projectId\", user_id as \"userId\", type, message, created_at as \"createdAt\" FROM activities WHERE project_id = :pid ORDER BY created_at DESC");
            $stmt->execute([':pid' => $projectId]);
            $acts = $stmt->fetchAll();
            foreach ($acts as &$act) {
                $act['user'] = public_user($pdo, $act['userId']);
            }
            json_response($acts);
        }

        if ($action === 'role') {
            json_response($memberInfo['role']);
        }

        $stmt = $pdo->prepare("SELECT * FROM projects WHERE id = :id");
        $stmt->execute([':id' => $projectId]);
        $proj = $stmt->fetch();
        if (!$proj) {
            json_error('Không tìm thấy dự án.', 'NOT_FOUND', 404);
        }
        json_response(summarize_project($pdo, $proj, $session['userId']));
    }

    // List all projects user belongs to
    $session = require_auth($pdo);
    $stmt = $pdo->prepare("SELECT p.* FROM projects p JOIN project_members pm ON p.id = pm.project_id WHERE pm.user_id = :uid ORDER BY p.updated_at DESC, p.created_at DESC");
    $stmt->execute([':uid' => $session['userId']]);
    $projects = $stmt->fetchAll();
    $result = [];
    foreach ($projects as $p) {
        $result[] = summarize_project($pdo, $p, $session['userId']);
    }
    json_response($result);
}

// POST actions
if ($method === 'POST') {
    $session = require_auth($pdo);
    $input = get_json_input();

    // Create project
    if ($action === 'create' || (!$action && !$projectId)) {
        if ($session['role'] !== 'manager') {
            json_error('Chỉ Quản lý được tạo dự án.', 'FORBIDDEN', 403);
        }
        $name = trim($input['name'] ?? $_POST['name'] ?? '');
        $description = trim($input['description'] ?? $_POST['description'] ?? '');

        if (!$name) {
            json_error('Tên dự án không được để trống.', 'VALIDATION', 422);
        }
        if (mb_strlen($name, 'UTF-8') > 120) {
            json_error('Tên dự án tối đa 120 ký tự.', 'VALIDATION', 422);
        }
        if (mb_strlen($description, 'UTF-8') > 500) {
            json_error('Mô tả tối đa 500 ký tự.', 'VALIDATION', 422);
        }

        $now = (new DateTime('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.000\Z');
        $id = generate_uuid('proj');

        $stmt = $pdo->prepare("INSERT INTO projects (id, name, description, created_at, updated_at, created_by) VALUES (:id, :name, :description, :created_at, :updated_at, :created_by)");
        $stmt->execute([
            ':id' => $id,
            ':name' => $name,
            ':description' => $description,
            ':created_at' => $now,
            ':updated_at' => $now,
            ':created_by' => $session['userId']
        ]);

        $stmtMem = $pdo->prepare("INSERT INTO project_members (id, project_id, user_id, role, invited_by, created_at) VALUES (:id, :pid, :uid, 'manager', :inv, :created_at)");
        $stmtMem->execute([
            ':id' => generate_uuid('mem'),
            ':pid' => $id,
            ':uid' => $session['userId'],
            ':inv' => $session['userId'],
            ':created_at' => $now
        ]);

        push_activity($pdo, $id, $session['userId'], 'project.created', "đã tạo dự án $name");

        $stmtFetch = $pdo->prepare("SELECT * FROM projects WHERE id = :id");
        $stmtFetch->execute([':id' => $id]);
        $newProj = $stmtFetch->fetch();
        json_response(summarize_project($pdo, $newProj, $session['userId']), 201);
    }

    // Project sub-actions require projectId
    if (!$projectId) {
        json_error('Thiếu mã dự án.', 'VALIDATION', 422);
    }

    if ($action === 'invite') {
        require_member($pdo, $projectId, ['manager']);
        $userId = trim($input['userId'] ?? $_POST['userId'] ?? '');
        $role = trim($input['role'] ?? $_POST['role'] ?? '');

        if (!in_array($role, ['viewer', 'reviewer', 'manager'], true)) {
            json_error('Vai trò không hợp lệ.', 'VALIDATION', 422);
        }

        $user = public_user($pdo, $userId);
        if (!$user || empty($user['username'])) {
            json_error('Chỉ có thể mời tài khoản mẫu đã có sẵn.', 'VALIDATION', 422);
        }

        $stmtCheck = $pdo->prepare("SELECT id FROM project_members WHERE project_id = :pid AND user_id = :uid");
        $stmtCheck->execute([':pid' => $projectId, ':uid' => $userId]);
        if ($stmtCheck->fetch()) {
            json_error('Tài khoản này đã ở trong dự án.', 'VALIDATION', 422);
        }

        $now = (new DateTime('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.000\Z');
        $stmtInsert = $pdo->prepare("INSERT INTO project_members (id, project_id, user_id, role, invited_by, created_at) VALUES (:id, :pid, :uid, :role, :inv, :cat)");
        $stmtInsert->execute([
            ':id' => generate_uuid('mem'),
            ':pid' => $projectId,
            ':uid' => $userId,
            ':role' => $role,
            ':inv' => $session['userId'],
            ':cat' => $now
        ]);

        $roleLabel = ($role === 'manager') ? 'Quản lý' : (($role === 'reviewer') ? 'Góp ý' : 'Chỉ xem');
        push_activity($pdo, $projectId, $session['userId'], 'member.invited', "đã thêm {$user['name']} vào dự án với vai trò $roleLabel");
        touch_project($pdo, $projectId, $now);

        $stmtMems = $pdo->prepare("SELECT u.id, u.name, u.username, pm.role, u.color, u.title, pm.id as \"membershipId\", pm.created_at as \"createdAt\" FROM project_members pm JOIN users u ON pm.user_id = u.id WHERE pm.project_id = :pid");
        $stmtMems->execute([':pid' => $projectId]);
        json_response($stmtMems->fetchAll());
    }

    if ($action === 'update_role') {
        require_member($pdo, $projectId, ['manager']);
        $userId = trim($input['userId'] ?? $_POST['userId'] ?? '');
        $role = trim($input['role'] ?? $_POST['role'] ?? '');

        if (!in_array($role, ['viewer', 'reviewer', 'manager'], true)) {
            json_error('Vai trò không hợp lệ.', 'VALIDATION', 422);
        }

        $stmtCheck = $pdo->prepare("SELECT * FROM project_members WHERE project_id = :pid AND user_id = :uid");
        $stmtCheck->execute([':pid' => $projectId, ':uid' => $userId]);
        $member = $stmtCheck->fetch();
        if (!$member) {
            json_error('Không tìm thấy thành viên.', 'NOT_FOUND', 404);
        }

        if ($member['role'] === 'manager' && $role !== 'manager') {
            $stmtMgrs = $pdo->prepare("SELECT count(*) FROM project_members WHERE project_id = :pid AND role = 'manager'");
            $stmtMgrs->execute([':pid' => $projectId]);
            if ((int)$stmtMgrs->fetchColumn() <= 1) {
                json_error('Dự án cần ít nhất một Quản lý.', 'VALIDATION', 422);
            }
        }

        $stmtUp = $pdo->prepare("UPDATE project_members SET role = :role WHERE project_id = :pid AND user_id = :uid");
        $stmtUp->execute([':role' => $role, ':pid' => $projectId, ':uid' => $userId]);

        $user = public_user($pdo, $userId);
        $roleLabel = ($role === 'manager') ? 'Quản lý' : (($role === 'reviewer') ? 'Góp ý' : 'Chỉ xem');
        push_activity($pdo, $projectId, $session['userId'], 'member.role', "đã đổi vai trò của {$user['name']} thành $roleLabel");
        touch_project($pdo, $projectId);

        $stmtMems = $pdo->prepare("SELECT u.id, u.name, u.username, pm.role, u.color, u.title, pm.id as \"membershipId\", pm.created_at as \"createdAt\" FROM project_members pm JOIN users u ON pm.user_id = u.id WHERE pm.project_id = :pid");
        $stmtMems->execute([':pid' => $projectId]);
        json_response($stmtMems->fetchAll());
    }
}

json_error('Thao tác không hợp lệ.', 'NOT_FOUND', 404);
