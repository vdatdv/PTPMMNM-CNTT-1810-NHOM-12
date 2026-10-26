<?php
// api/auth.php - Authentication & Account Management API

require_once __DIR__ . '/db.php';

const ADMIN_SECRET_CODE = 'ADMIN2026';
$action = $_GET['action'] ?? $_POST['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// Helper to pick random avatar color
function pick_avatar_color() {
    $colors = ['#4F46E5', '#0F766E', '#B45309', '#2563EB', '#7C3AED', '#DB2777', '#059669', '#D97706'];
    return $colors[array_rand($colors)];
}

// 1. REGISTER
if ($action === 'register' && $method === 'POST') {
    $input = get_json_input();
    $username = trim($input['username'] ?? $_POST['username'] ?? '');
    $name = trim($input['name'] ?? $_POST['name'] ?? '');
    $password = trim($input['password'] ?? $_POST['password'] ?? '');
    $title = trim($input['title'] ?? $_POST['title'] ?? 'Thành viên');

    // Validations
    if (!$username) {
        json_error('Vui lòng nhập tên đăng nhập.', 'VALIDATION', 422);
    }
    if (!preg_match('/^[a-zA-Z0-9_\-\.]{3,30}$/', $username)) {
        json_error('Tên đăng nhập từ 3 đến 30 ký tự, chỉ chứa chữ cái, số, gạch dưới hoặc gạch ngang.', 'VALIDATION', 422);
    }
    if (!$name) {
        json_error('Vui lòng nhập họ và tên.', 'VALIDATION', 422);
    }
    if (mb_strlen($name, 'UTF-8') > 80) {
        json_error('Họ và tên tối đa 80 ký tự.', 'VALIDATION', 422);
    }
    if (!$password || strlen($password) < 4) {
        json_error('Mật khẩu tối thiểu 4 ký tự.', 'VALIDATION', 422);
    }

    // Check if username already exists
    $stmtCheck = $pdo->prepare("SELECT id FROM users WHERE lower(username) = lower(:uname)");
    $stmtCheck->execute([':uname' => $username]);
    if ($stmtCheck->fetch()) {
        json_error('Tên đăng nhập đã được sử dụng. Vui lòng chọn tên khác.', 'VALIDATION', 422);
    }

    $now = (new DateTime('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.000\Z');
    $userId = generate_uuid('user');
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    $color = pick_avatar_color();

    // Default status: Pending Admin role assignment & approval
    $role = 'pending';
    $isVerified = 0;
    $verificationCode = null;
    $verifiedAt = null;

    // Insert user into database
    $stmtIns = $pdo->prepare("INSERT INTO users (id, username, name, role, title, color, password_hash, is_verified, verification_code, verified_at, created_at) VALUES (:id, :uname, :name, :role, :title, :color, :phash, :is_ver, :vcode, :ver_at, :cat)");
    $stmtIns->execute([
        ':id' => $userId,
        ':uname' => strtolower($username),
        ':name' => $name,
        ':role' => $role,
        ':title' => $title,
        ':color' => $color,
        ':phash' => $passwordHash,
        ':is_ver' => $isVerified,
        ':vcode' => $verificationCode,
        ':ver_at' => $verifiedAt,
        ':cat' => $now
    ]);

    // Do NOT set $_SESSION['user_id'] - user must wait for Admin approval
    json_response([
        'success' => true,
        'userId' => $userId,
        'username' => strtolower($username),
        'name' => $name,
        'role' => 'pending',
        'isVerified' => 0,
        'message' => 'Đăng ký tài khoản thành công! Tài khoản của bạn đang ở trạng thái chờ Quản trị viên (Admin) xét duyệt và phân cấp vai trò.'
    ], 201);
}

// 2. VERIFY ADMIN ACCOUNT
if ($action === 'verify' && $method === 'POST') {
    $input = get_json_input();
    $username = trim($input['username'] ?? $_POST['username'] ?? '');
    $code = trim($input['code'] ?? $_POST['code'] ?? '');

    if (!$username) {
        json_error('Vui lòng cung cấp tên đăng nhập cần xác minh.', 'VALIDATION', 422);
    }
    if (!$code) {
        json_error('Vui lòng nhập mã xác minh.', 'VALIDATION', 422);
    }

    $stmt = $pdo->prepare("SELECT * FROM users WHERE lower(username) = lower(:uname) OR id = :id");
    $stmt->execute([':uname' => $username, ':id' => $username]);
    $user = $stmt->fetch();

    if (!$user) {
        json_error('Không tìm thấy tài khoản người dùng.', 'NOT_FOUND', 404);
    }

    if ((int)$user['is_verified'] === 1) {
        $_SESSION['user_id'] = $user['id'];
        json_response([
            'success' => true,
            'message' => 'Tài khoản đã được xác minh trước đó.',
            'userId' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role']
        ]);
    }

    // Check code matches OTP or Master Admin Secret Code
    $isMatch = ($user['verification_code'] && $code === $user['verification_code']) || (strtoupper($code) === ADMIN_SECRET_CODE);

    if (!$isMatch) {
        json_error('Mã xác minh không chính xác. Hãy nhập lại mã OTP hoặc mã Admin demo (ADMIN2026).', 'VALIDATION', 422);
    }

    $now = (new DateTime('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.000\Z');
    $stmtUp = $pdo->prepare("UPDATE users SET is_verified = 1, verified_at = :now, verification_code = NULL WHERE id = :id");
    $stmtUp->execute([':now' => $now, ':id' => $user['id']]);

    $_SESSION['user_id'] = $user['id'];

    json_response([
        'success' => true,
        'message' => 'Xác minh tài khoản Quản trị (Admin) thành công!',
        'userId' => $user['id'],
        'username' => $user['username'],
        'name' => $user['name'],
        'role' => $user['role'],
        'title' => $user['title'],
        'color' => $user['color'],
        'isVerified' => 1
    ]);
}

// 3. LIST UNVERIFIED & PENDING ACCOUNTS (Admin approval panel)
if ($action === 'unverified_users' && $method === 'GET') {
    $session = require_auth($pdo);
    if ($session['role'] !== 'manager') {
        json_error('Chỉ Quản trị viên mới được xem danh sách này.', 'FORBIDDEN', 403);
    }
    $stmt = $pdo->query("SELECT id, username, name, role, title, color, created_at as \"createdAt\" FROM users WHERE is_verified = 0 OR role = 'pending' ORDER BY created_at DESC");
    json_response($stmt->fetchAll());
}

// 4. APPROVE & ASSIGN ROLE TO PENDING ACCOUNT (Admin assigns role)
if ($action === 'approve_user' && $method === 'POST') {
    $session = require_auth($pdo);
    if ($session['role'] !== 'manager') {
        json_error('Chỉ Quản trị viên mới được phê duyệt và phân cấp tài khoản.', 'FORBIDDEN', 403);
    }
    $input = get_json_input();
    $targetId = trim($input['userId'] ?? $input['id'] ?? $_POST['userId'] ?? '');
    $role = trim($input['role'] ?? $_POST['role'] ?? 'reviewer');

    if (!in_array($role, ['manager', 'reviewer', 'viewer'], true)) {
        json_error('Vai trò phân cấp không hợp lệ. Vui lòng chọn Quản lý, Góp ý hoặc Chỉ xem.', 'VALIDATION', 422);
    }

    $stmtCheck = $pdo->prepare("SELECT id, username, name FROM users WHERE id = :id OR lower(username) = lower(:uname)");
    $stmtCheck->execute([':id' => $targetId, ':uname' => $targetId]);
    $target = $stmtCheck->fetch();

    if (!$target) {
        json_error('Không tìm thấy tài khoản người dùng.', 'NOT_FOUND', 404);
    }

    $now = (new DateTime('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.000\Z');
    $stmtUp = $pdo->prepare("UPDATE users SET role = :role, is_verified = 1, verified_at = :now, verification_code = NULL WHERE id = :id");
    $stmtUp->execute([
        ':role' => $role,
        ':now' => $now,
        ':id' => $target['id']
    ]);

    // Add member to all current projects with the assigned role
    $projects = $pdo->query("SELECT id FROM projects")->fetchAll(PDO::FETCH_COLUMN);
    $stmtAddMem = $pdo->prepare("INSERT INTO project_members (id, project_id, user_id, role, invited_by, created_at) VALUES (:id, :pid, :uid, :role, :inv, :cat) ON CONFLICT (project_id, user_id) DO NOTHING");
    foreach ($projects as $pid) {
        $stmtAddMem->execute([
            ':id' => generate_uuid('mem'),
            ':pid' => $pid,
            ':uid' => $target['id'],
            ':role' => $role,
            ':inv' => $session['userId'],
            ':cat' => $now
        ]);
    }

    $roleLabels = [
        'manager' => 'Quản trị viên (Admin)',
        'reviewer' => 'Góp ý (Reviewer)',
        'viewer' => 'Chỉ xem (Viewer)'
    ];
    $label = $roleLabels[$role] ?? $role;

    json_response([
        'success' => true,
        'message' => "Đã phân cấp vai trò {$label} và kích hoạt tài khoản {$target['name']} (@{$target['username']}) thành công.",
        'userId' => $target['id'],
        'role' => $role
    ]);
}

// 4b. REJECT PENDING ACCOUNT
if ($action === 'reject_user' && $method === 'POST') {
    $session = require_auth($pdo);
    if ($session['role'] !== 'manager') {
        json_error('Chỉ Quản trị viên mới được từ chối tài khoản.', 'FORBIDDEN', 403);
    }
    $input = get_json_input();
    $targetId = trim($input['userId'] ?? $input['id'] ?? $_POST['userId'] ?? '');

    $stmtCheck = $pdo->prepare("SELECT id, username, name FROM users WHERE (is_verified = 0 OR role = 'pending') AND (id = :id OR lower(username) = lower(:uname))");
    $stmtCheck->execute([':id' => $targetId, ':uname' => $targetId]);
    $target = $stmtCheck->fetch();

    if (!$target) {
        json_error('Không tìm thấy tài khoản chờ duyệt.', 'NOT_FOUND', 404);
    }

    $stmtDel = $pdo->prepare("DELETE FROM users WHERE id = :id");
    $stmtDel->execute([':id' => $target['id']]);

    json_response([
        'success' => true,
        'message' => "Đã từ chối và xóa yêu cầu đăng ký của {$target['name']} (@{$target['username']})."
    ]);
}

// 4c. LIST ALL USERS (Manager only)
if ($action === 'list_all_users' && $method === 'GET') {
    $session = require_auth($pdo);
    if ($session['role'] !== 'manager') {
        json_error('Chỉ Quản trị viên mới được xem danh sách thành viên.', 'FORBIDDEN', 403);
    }
    $stmt = $pdo->query("SELECT id, username, name, role, title, color, is_verified as \"isVerified\", created_at as \"createdAt\", verified_at as \"verifiedAt\" FROM users ORDER BY (role = 'pending' OR is_verified = 0) DESC, created_at DESC");
    json_response($stmt->fetchAll());
}

// 4d. UPDATE USER ROLE (Manager only)
if ($action === 'update_user_role' && $method === 'POST') {
    $session = require_auth($pdo);
    if ($session['role'] !== 'manager') {
        json_error('Chỉ Quản trị viên mới được đổi vai trò người dùng.', 'FORBIDDEN', 403);
    }
    $input = get_json_input();
    $targetId = trim($input['userId'] ?? '');
    $role = trim($input['role'] ?? '');
    if (!in_array($role, ['manager', 'reviewer', 'viewer'], true)) {
        json_error('Vai trò không hợp lệ.', 'VALIDATION', 422);
    }
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id");
    $stmt->execute([':id' => $targetId]);
    $target = $stmt->fetch();
    if (!$target) {
        json_error('Không tìm thấy người dùng.', 'NOT_FOUND', 404);
    }
    $stmtUp = $pdo->prepare("UPDATE users SET role = :role, is_verified = 1 WHERE id = :id");
    $stmtUp->execute([':role' => $role, ':id' => $targetId]);

    // Sync role in all project memberships
    $stmtPm = $pdo->prepare("UPDATE project_members SET role = :role WHERE user_id = :uid");
    $stmtPm->execute([':role' => $role, ':uid' => $targetId]);

    $roleLabels = ['manager' => 'Quản lý', 'reviewer' => 'Góp ý', 'viewer' => 'Chỉ xem'];
    json_response(['success' => true, 'message' => "Đã cập nhật vai trò của {$target['name']} thành {$roleLabels[$role]}."]);
}

// 4e. DELETE USER (Manager only)
if ($action === 'delete_user' && $method === 'POST') {
    $session = require_auth($pdo);
    if ($session['role'] !== 'manager') {
        json_error('Chỉ Quản trị viên mới được xóa người dùng.', 'FORBIDDEN', 403);
    }
    $input = get_json_input();
    $targetId = trim($input['userId'] ?? '');
    if ($targetId === $session['userId']) {
        json_error('Bạn không thể xóa tài khoản của chính mình.', 'VALIDATION', 422);
    }
    $stmt = $pdo->prepare("SELECT id, name, username FROM users WHERE id = :id");
    $stmt->execute([':id' => $targetId]);
    $target = $stmt->fetch();
    if (!$target) {
        json_error('Không tìm thấy tài khoản người dùng.', 'NOT_FOUND', 404);
    }
    $stmtDel = $pdo->prepare("DELETE FROM users WHERE id = :id");
    $stmtDel->execute([':id' => $targetId]);
    json_response(['success' => true, 'message' => "Đã xóa tài khoản {$target['name']} (@{$target['username']}) thành công."]);
}

// 4f. ADMIN DIRECTLY CREATE USER (Manager only)
if ($action === 'admin_create_user' && $method === 'POST') {
    $session = require_auth($pdo);
    if ($session['role'] !== 'manager') {
        json_error('Chỉ Quản trị viên mới được tạo tài khoản trực tiếp.', 'FORBIDDEN', 403);
    }
    $input = get_json_input();
    $username = trim($input['username'] ?? '');
    $name = trim($input['name'] ?? '');
    $password = trim($input['password'] ?? '');
    $title = trim($input['title'] ?? 'Thành viên');
    $role = trim($input['role'] ?? 'reviewer');

    if (!$username || !preg_match('/^[a-zA-Z0-9_\-\.]{3,30}$/', $username)) {
        json_error('Tên đăng nhập không hợp lệ (3-30 ký tự, chữ, số, gạch ngang/dưới).', 'VALIDATION', 422);
    }
    if (!$name) {
        json_error('Vui lòng nhập họ và tên.', 'VALIDATION', 422);
    }
    if (!$password || strlen($password) < 4) {
        json_error('Mật khẩu tối thiểu 4 ký tự.', 'VALIDATION', 422);
    }
    if (!in_array($role, ['manager', 'reviewer', 'viewer'], true)) {
        json_error('Vai trò không hợp lệ.', 'VALIDATION', 422);
    }

    $stmtCheck = $pdo->prepare("SELECT id FROM users WHERE lower(username) = lower(:uname)");
    $stmtCheck->execute([':uname' => $username]);
    if ($stmtCheck->fetch()) {
        json_error('Tên đăng nhập đã tồn tại trên hệ thống.', 'VALIDATION', 422);
    }

    $now = (new DateTime('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.000\Z');
    $userId = generate_uuid('user');
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    $color = pick_avatar_color();

    $stmtIns = $pdo->prepare("INSERT INTO users (id, username, name, role, title, color, password_hash, is_verified, verification_code, verified_at, created_at) VALUES (:id, :uname, :name, :role, :title, :color, :phash, 1, NULL, :now, :now)");
    $stmtIns->execute([
        ':id' => $userId,
        ':uname' => strtolower($username),
        ':name' => $name,
        ':role' => $role,
        ':title' => $title,
        ':color' => $color,
        ':phash' => $passwordHash,
        ':now' => $now
    ]);

    // Add to all projects
    $projects = $pdo->query("SELECT id FROM projects")->fetchAll(PDO::FETCH_COLUMN);
    $stmtAddMem = $pdo->prepare("INSERT INTO project_members (id, project_id, user_id, role, invited_by, created_at) VALUES (:id, :pid, :uid, :role, :inv, :cat) ON CONFLICT (project_id, user_id) DO NOTHING");
    foreach ($projects as $pid) {
        $stmtAddMem->execute([
            ':id' => generate_uuid('mem'),
            ':pid' => $pid,
            ':uid' => $userId,
            ':role' => $role,
            ':inv' => $session['userId'],
            ':cat' => $now
        ]);
    }

    json_response([
        'success' => true,
        'message' => "Đã tạo tài khoản cho {$name} (@{$username}) thành công.",
        'userId' => $userId,
        'username' => strtolower($username),
        'name' => $name,
        'role' => $role
    ], 201);
}

// 4g. RESET USER PASSWORD (Manager only)
if ($action === 'reset_user_password' && $method === 'POST') {
    $session = require_auth($pdo);
    if ($session['role'] !== 'manager') {
        json_error('Chỉ Quản trị viên mới được đặt lại mật khẩu.', 'FORBIDDEN', 403);
    }
    $input = get_json_input();
    $targetId = trim($input['userId'] ?? '');
    $newPassword = trim($input['newPassword'] ?? '');

    if (!$newPassword || strlen($newPassword) < 4) {
        json_error('Mật khẩu mới tối thiểu 4 ký tự.', 'VALIDATION', 422);
    }

    $stmt = $pdo->prepare("SELECT id, name, username FROM users WHERE id = :id");
    $stmt->execute([':id' => $targetId]);
    $target = $stmt->fetch();
    if (!$target) {
        json_error('Không tìm thấy tài khoản người dùng.', 'NOT_FOUND', 404);
    }

    $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);
    $stmtUp = $pdo->prepare("UPDATE users SET password_hash = :phash WHERE id = :id");
    $stmtUp->execute([':phash' => $passwordHash, ':id' => $targetId]);

    json_response([
        'success' => true,
        'message' => "Đã đặt lại mật khẩu cho tài khoản {$target['name']} (@{$target['username']}) thành công."
    ]);
}

// 5. LOGIN
if ($action === 'login' && $method === 'POST') {
    $input = get_json_input();
    $username = trim($input['username'] ?? $_POST['username'] ?? '');
    $password = trim($input['password'] ?? $_POST['password'] ?? '');
    $remember = !empty($input['remember']) || !empty($_POST['remember']);

    if (!$username) {
        json_error('Vui lòng nhập tên đăng nhập.', 'VALIDATION', 422);
    }
    if (!$password) {
        json_error('Vui lòng nhập mật khẩu. Mật khẩu không được để trống.', 'VALIDATION', 422);
    }

    $stmt = $pdo->prepare("SELECT * FROM users WHERE lower(username) = lower(:uname)");
    $stmt->execute([':uname' => $username]);
    $user = $stmt->fetch();

    if (!$user) {
        json_error('Tài khoản không tồn tại. Vui lòng kiểm tra lại tên đăng nhập hoặc đăng ký tài khoản mới.', 'AUTH', 401);
    }

    // Verify password if hash exists
    if (!empty($user['password_hash'])) {
        if (!password_verify($password, $user['password_hash'])) {
            // For convenience with seeded demo accounts
            if (!in_array($user['username'], ['an', 'binh', 'chi'], true)) {
                json_error('Mật khẩu không chính xác.', 'AUTH', 401);
            }
        }
    }

    // Block pending or unverified accounts
    if ($user['role'] === 'pending' || (isset($user['is_verified']) && (int)$user['is_verified'] === 0)) {
        json_error(
            'Tài khoản của bạn đang chờ Quản trị viên (Admin) phê duyệt và phân cấp vai trò. Vui lòng liên hệ Admin để được cấp quyền sử dụng.',
            'PENDING_APPROVAL',
            403,
            [
                'username' => $user['username'],
                'name' => $user['name'],
                'role' => $user['role'],
                'isVerified' => 0
            ]
        );
    }

    $_SESSION['user_id'] = $user['id'];

    json_response([
        'userId' => $user['id'],
        'username' => $user['username'],
        'name' => $user['name'],
        'role' => $user['role'],
        'title' => $user['title'],
        'color' => $user['color'],
        'isVerified' => (int)($user['is_verified'] ?? 1),
        'remember' => $remember
    ]);
}

// 6. SESSION
if ($action === 'session' || ($method === 'GET' && empty($action))) {
    $session = get_current_user_session($pdo);
    if (!$session) {
        json_response(null);
    }
    json_response($session);
}

// 7. LOGOUT
if ($action === 'logout' && $method === 'POST') {
    unset($_SESSION['user_id']);
    session_destroy();
    json_response(['success' => true]);
}

// 8. SWITCH ACCOUNT (Demo feature)
if ($action === 'switch' && $method === 'POST') {
    $input = get_json_input();
    $username = trim($input['username'] ?? $_POST['username'] ?? '');
    $stmt = $pdo->prepare("SELECT * FROM users WHERE lower(username) = lower(:uname) OR id = :id");
    $stmt->execute([':uname' => $username, ':id' => $username]);
    $user = $stmt->fetch();
    if ($user) {
        if ($user['role'] === 'manager' && (int)($user['is_verified'] ?? 1) === 0) {
            json_error('Tài khoản Admin này chưa được xác minh.', 'UNVERIFIED', 403);
        }
        $_SESSION['user_id'] = $user['id'];
        json_response([
            'userId' => $user['id'],
            'username' => $user['username'],
            'name' => $user['name'],
            'role' => $user['role'],
            'title' => $user['title'],
            'color' => $user['color'],
            'isVerified' => (int)($user['is_verified'] ?? 1)
        ]);
    }
    json_error('Không tìm thấy người dùng để chuyển đổi.', 'NOT_FOUND', 404);
}

json_error('Thao tác không hợp lệ.', 'NOT_FOUND', 404);
