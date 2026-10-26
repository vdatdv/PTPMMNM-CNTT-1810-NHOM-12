<?php
// api/db.php - Central Database connection & helpers (Supabase Postgres & SQLite)

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$dataDir = __DIR__ . '/../data';
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

$uploadsDir = __DIR__ . '/../uploads';
if (!is_dir($uploadsDir)) {
    mkdir($uploadsDir, 0755, true);
}

// 1. Simple .env / .env.local loader
function load_env_file_custom($path) {
    if (!file_exists($path)) return;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if (!$line || $line[0] === '#') continue;
        if (strpos($line, '=') !== false) {
            list($key, $val) = explode('=', $line, 2);
            $key = trim($key);
            $val = trim($val);
            if (!isset($_ENV[$key])) {
                $_ENV[$key] = $val;
                putenv("$key=$val");
            }
        }
    }
}
load_env_file_custom(__DIR__ . '/../.env.local');
load_env_file_custom(__DIR__ . '/../.env');

// 2. Determine database configuration & Network Resiliency
$dbPath = $dataDir . '/database.sqlite';
$dbDriver = 'sqlite';
$pdo = null;

$databaseUrl = getenv('DATABASE_URL') ?: ($_ENV['DATABASE_URL'] ?? null);
$supabaseHost = getenv('SUPABASE_DB_HOST') ?: ($_ENV['SUPABASE_DB_HOST'] ?? 'aws-0-ap-southeast-1.pooler.supabase.com');
$supabaseUser = getenv('SUPABASE_DB_USER') ?: ($_ENV['SUPABASE_DB_USER'] ?? 'postgres.qpdsjaxilorovzboexrq');
$supabasePass = getenv('SUPABASE_DB_PASS') ?: ($_ENV['SUPABASE_DB_PASS'] ?? '@Vinhdat123');
$supabasePort = getenv('SUPABASE_DB_PORT') ?: ($_ENV['SUPABASE_DB_PORT'] ?? 5432);
$supabaseName = getenv('SUPABASE_DB_NAME') ?: ($_ENV['SUPABASE_DB_NAME'] ?? 'postgres');

// Check if user or system requested local database priority (poor network mode)
$preferLocalHeader = $_SERVER['HTTP_X_PREFER_LOCAL'] ?? '';
$preferLocalParam = $_GET['prefer_local'] ?? '';
$preferLocalCookie = $_COOKIE['prefer_local'] ?? '';
$envPreferLocal = getenv('DB_PREFER_LOCAL') ?: ($_ENV['DB_PREFER_LOCAL'] ?? '0');
$preferLocal = ($preferLocalHeader === '1' || $preferLocalParam === '1' || $preferLocalCookie === '1' || $envPreferLocal === '1');

// Circuit Breaker: Avoid blocking requests if Supabase was recently unreachable
$breakerFile = $dataDir . '/.supabase_breaker';
$isBreakerActive = false;
if (file_exists($breakerFile)) {
    $lastFailed = (int)@file_get_contents($breakerFile);
    if ((time() - $lastFailed) < 60) {
        $isBreakerActive = true;
    } else {
        @unlink($breakerFile);
    }
}

// Try connecting to Supabase PostgreSQL only if not forced local and breaker is inactive
if (!$preferLocal && !$isBreakerActive && $supabaseHost && $supabaseUser && in_array('pgsql', PDO::getAvailableDrivers())) {
    try {
        // 10-second timeout: nếu quá 10s thì tự động chuyển sang đọc SQLite cục bộ
        $pgDsn = "pgsql:host={$supabaseHost};port={$supabasePort};dbname={$supabaseName};sslmode=require";
        $pdo = new PDO($pgDsn, $supabaseUser, $supabasePass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 10
        ]);
        $dbDriver = 'pgsql';
    } catch (Throwable $e) {
        // Tự động ngắt kết nối và đóng circuit breaker 60s để ưu tiên CSDL cục bộ SQLite siêu tốc
        @file_put_contents($breakerFile, (string)time());
        $isBreakerActive = true;
        error_log("Supabase connection timeout/error (>10s: " . $e->getMessage() . "). Tripped circuit breaker. Prioritizing local SQLite.");
        $pdo = null;
    }
}

// Fallback / Priority to local SQLite
if (!$pdo) {
    try {
        $pdo = new PDO('sqlite:' . $dbPath);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $pdo->exec("PRAGMA foreign_keys = ON;");
        $pdo->exec("PRAGMA journal_mode = WAL;");
        $dbDriver = 'sqlite';
    } catch (PDOException $e) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Không thể kết nối cơ sở dữ liệu.', 'code' => 'DB_ERROR']);
        exit;
    }
}

// Send diagnostic headers
if (!headers_sent()) {
    header("X-DB-Engine: " . ($dbDriver === 'sqlite' ? 'SQLite (Fast-Local / Poor Network Mode)' : 'PostgreSQL (Supabase Live)'));
    header("X-DB-Breaker: " . ($isBreakerActive ? 'tripped' : 'inactive'));
    header("X-DB-Prefer-Local: " . ($preferLocal ? 'true' : 'false'));
}

// Helper to mirror writes to local SQLite when operating in Supabase mode
function mirror_to_sqlite($sql, $params = []) {
    global $dataDir, $dbDriver;
    if ($dbDriver !== 'pgsql') return;
    try {
        static $localPdo = null;
        if ($localPdo === null) {
            $localPdo = new PDO('sqlite:' . $dataDir . '/database.sqlite');
            $localPdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $localPdo->exec("PRAGMA foreign_keys = ON;");
        }
        $stmt = $localPdo->prepare($sql);
        $stmt->execute($params);
    } catch (Throwable $e) {
        // Non-blocking mirror
    }
}

// 3. Ensure database schema tables exist (Compatible with PostgreSQL and SQLite)
$pdo->exec("
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    title TEXT,
    color TEXT,
    password_hash TEXT,
    is_verified INTEGER DEFAULT 1,
    verification_code TEXT,
    verified_at TEXT,
    created_at TEXT
);

CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_members (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    invited_by TEXT,
    created_at TEXT NOT NULL,
    UNIQUE(project_id, user_id)
);

CREATE TABLE IF NOT EXISTS design_screens (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS image_versions (
    id TEXT PRIMARY KEY,
    screen_id TEXT NOT NULL REFERENCES design_screens(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    number INTEGER NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    image_key TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    source TEXT NOT NULL,
    created_at TEXT NOT NULL,
    created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS annotations (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    screen_id TEXT NOT NULL REFERENCES design_screens(id) ON DELETE CASCADE,
    image_version_id TEXT NOT NULL REFERENCES image_versions(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    x REAL NOT NULL,
    y REAL NOT NULL,
    w REAL NOT NULL,
    h REAL NOT NULL,
    original_width INTEGER NOT NULL,
    original_height INTEGER NOT NULL,
    author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    revision INTEGER NOT NULL DEFAULT 1,
    check_note TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS annotation_replies (
    id TEXT PRIMARY KEY,
    annotation_id TEXT NOT NULL REFERENCES annotations(id) ON DELETE CASCADE,
    author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS annotation_status_events (
    id TEXT PRIMARY KEY,
    annotation_id TEXT NOT NULL REFERENCES annotations(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL
);
");

// Schema migration checks for SQLite if running SQLite driver
if ($dbDriver === 'sqlite') {
    $userCols = $pdo->query("PRAGMA table_info(users)")->fetchAll(PDO::FETCH_COLUMN, 1);
    if (!in_array('password_hash', $userCols, true)) {
        $pdo->exec("ALTER TABLE users ADD COLUMN password_hash TEXT");
    }
    if (!in_array('is_verified', $userCols, true)) {
        $pdo->exec("ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 1");
    }
    if (!in_array('verification_code', $userCols, true)) {
        $pdo->exec("ALTER TABLE users ADD COLUMN verification_code TEXT");
    }
    if (!in_array('verified_at', $userCols, true)) {
        $pdo->exec("ALTER TABLE users ADD COLUMN verified_at TEXT");
    }
    if (!in_array('created_at', $userCols, true)) {
        $pdo->exec("ALTER TABLE users ADD COLUMN created_at TEXT");
    }
}

// 4. Auto-seed if database is empty
$count = (int)$pdo->query("SELECT count(*) FROM users")->fetchColumn();
if ($count === 0) {
    require_once __DIR__ . '/seed.php';
    seed_database($pdo);
}

// Utilities & Helper functions
function json_response($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function json_error($message, $code = 'ERROR', $statusCode = 400, $extra = []) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    $res = array_merge(['error' => $message, 'code' => $code], $extra);
    echo json_encode($res, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function get_json_input() {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function generate_uuid($prefix = '') {
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40); // set version to 0100
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80); // set bits 6-7 to 10
    $uuid = vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    return $prefix ? ($prefix . '-' . $uuid) : $uuid;
}

function get_current_user_session(PDO $pdo) {
    $userId = $_SESSION['user_id'] ?? null;
    if (!$userId) {
        $authHeader = $_SERVER['HTTP_X_USER_ID'] ?? null;
        if (!$authHeader && function_exists('getallheaders')) {
            $headers = getallheaders();
            $authHeader = $headers['X-User-Id'] ?? $headers['x-user-id'] ?? null;
        }
        if ($authHeader) {
            $userId = $authHeader;
        }
    }
    if (!$userId) return null;
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id OR username = :uname");
    $stmt->execute([':id' => $userId, ':uname' => $userId]);
    $user = $stmt->fetch();
    if (!$user) return null;
    if (isset($user['is_verified']) && (int)$user['is_verified'] === 0) return null;
    if ($user['role'] === 'pending') return null;
    return [
        'userId' => $user['id'],
        'username' => $user['username'],
        'name' => $user['name'],
        'role' => $user['role'],
        'title' => $user['title'],
        'color' => $user['color'],
        'isVerified' => (int)($user['is_verified'] ?? 1),
        'remember' => true
    ];
}

function require_auth(PDO $pdo) {
    $user = get_current_user_session($pdo);
    if (!$user) {
        json_error('Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.', 'UNAUTHORIZED', 401);
    }
    return $user;
}

function require_member(PDO $pdo, $projectId, $allowedRoles = null) {
    $session = require_auth($pdo);
    $stmt = $pdo->prepare("SELECT role FROM project_members WHERE project_id = :pid AND user_id = :uid");
    $stmt->execute([':pid' => $projectId, ':uid' => $session['userId']]);
    $role = $stmt->fetchColumn();
    if (!$role) {
        json_error('Bạn không thuộc dự án này.', 'FORBIDDEN', 403);
    }
    if ($allowedRoles && !in_array($role, $allowedRoles, true)) {
        json_error('Bạn không có quyền thực hiện thao tác này.', 'FORBIDDEN', 403);
    }
    return ['session' => $session, 'role' => $role];
}

function public_user(PDO $pdo, $userId) {
    $stmt = $pdo->prepare("SELECT id, name, username, role, color, title, is_verified FROM users WHERE id = :id");
    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch();
    if (!$user) {
        return ['id' => $userId, 'name' => 'Người dùng đã xóa', 'username' => '', 'role' => '', 'color' => '#64748B', 'title' => '', 'isVerified' => 1];
    }
    $user['isVerified'] = (int)($user['is_verified'] ?? 1);
    unset($user['is_verified']);
    return $user;
}

function touch_project(PDO $pdo, $projectId, $iso = null) {
    $now = $iso ?: (new DateTime('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.000\Z');
    $stmt = $pdo->prepare("UPDATE projects SET updated_at = :now WHERE id = :id");
    $stmt->execute([':now' => $now, ':id' => $projectId]);
}

function push_activity(PDO $pdo, $projectId, $userId, $type, $message) {
    $now = (new DateTime('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.000\Z');
    $stmt = $pdo->prepare("INSERT INTO activities (id, project_id, user_id, type, message, created_at) VALUES (:id, :project_id, :user_id, :type, :message, :created_at)");
    $stmt->execute([
        ':id' => generate_uuid('act'),
        ':project_id' => $projectId,
        ':user_id' => $userId,
        ':type' => $type,
        ':message' => $message,
        ':created_at' => $now
    ]);
}

function present_version(PDO $pdo, $ver) {
    if (!$ver) return null;
    return [
        'id' => $ver['id'],
        'screenId' => $ver['screen_id'],
        'projectId' => $ver['project_id'],
        'number' => (int)$ver['number'],
        'label' => 'v' . $ver['number'],
        'width' => (int)$ver['width'],
        'height' => (int)$ver['height'],
        'imageKey' => $ver['image_key'],
        'mimeType' => $ver['mime_type'],
        'source' => $ver['source'],
        'createdAt' => $ver['created_at'],
        'createdBy' => $ver['created_by'],
        'author' => public_user($pdo, $ver['created_by'])
    ];
}

function present_annotation(PDO $pdo, $ann) {
    // Sibling order on the same version
    $stmtSib = $pdo->prepare("SELECT id FROM annotations WHERE image_version_id = :vid ORDER BY created_at ASC, id ASC");
    $stmtSib->execute([':vid' => $ann['image_version_id']]);
    $siblings = $stmtSib->fetchAll(PDO::FETCH_COLUMN);
    $idx = array_search($ann['id'], $siblings);
    $number = ($idx !== false) ? ($idx + 1) : 1;

    // Fetch version details
    $stmtVer = $pdo->prepare("SELECT * FROM image_versions WHERE id = :vid");
    $stmtVer->execute([':vid' => $ann['image_version_id']]);
    $version = $stmtVer->fetch();

    // Fetch screen details
    $stmtScr = $pdo->prepare("SELECT name FROM design_screens WHERE id = :sid");
    $stmtScr->execute([':sid' => $ann['screen_id']]);
    $screenName = $stmtScr->fetchColumn() ?: '';

    // Fetch project details
    $stmtProj = $pdo->prepare("SELECT name FROM projects WHERE id = :pid");
    $stmtProj->execute([':pid' => $ann['project_id']]);
    $projectName = $stmtProj->fetchColumn() ?: '';

    // Fetch replies
    $stmtRep = $pdo->prepare("SELECT * FROM annotation_replies WHERE annotation_id = :aid ORDER BY created_at ASC");
    $stmtRep->execute([':aid' => $ann['id']]);
    $rawReplies = $stmtRep->fetchAll();
    $replies = [];
    foreach ($rawReplies as $r) {
        $replies[] = [
            'id' => $r['id'],
            'annotationId' => $r['annotation_id'],
            'authorId' => $r['author_id'],
            'body' => $r['body'],
            'createdAt' => $r['created_at'],
            'author' => public_user($pdo, $r['author_id'])
        ];
    }

    // Fetch status history
    $stmtHis = $pdo->prepare("SELECT * FROM annotation_status_events WHERE annotation_id = :aid ORDER BY created_at ASC");
    $stmtHis->execute([':aid' => $ann['id']]);
    $rawHis = $stmtHis->fetchAll();
    $statusHistory = [];
    foreach ($rawHis as $h) {
        $statusHistory[] = [
            'id' => $h['id'],
            'annotationId' => $h['annotation_id'],
            'status' => $h['status'],
            'userId' => $h['user_id'],
            'at' => $h['created_at'],
            'note' => $h['note'],
            'user' => public_user($pdo, $h['user_id'])
        ];
    }

    return [
        'id' => $ann['id'],
        'projectId' => $ann['project_id'],
        'screenId' => $ann['screen_id'],
        'imageVersionId' => $ann['image_version_id'],
        'type' => $ann['type'],
        'x' => (float)$ann['x'],
        'y' => (float)$ann['y'],
        'w' => (float)$ann['w'],
        'h' => (float)$ann['h'],
        'originalWidth' => (int)($version ? $version['width'] : $ann['original_width']),
        'originalHeight' => (int)($version ? $version['height'] : $ann['original_height']),
        'authorId' => $ann['author_id'],
        'body' => $ann['body'],
        'status' => $ann['status'],
        'revision' => (int)$ann['revision'],
        'checkNote' => $ann['check_note'] ?: '',
        'createdAt' => $ann['created_at'],
        'updatedAt' => $ann['updated_at'],
        'number' => $number,
        'author' => public_user($pdo, $ann['author_id']),
        'replies' => $replies,
        'statusHistory' => $statusHistory,
        'versionNumber' => $version ? (int)$version['number'] : null,
        'versionLabel' => $version ? ('v' . $version['number']) : '',
        'screenName' => $screenName,
        'projectName' => $projectName,
        'imageWidth' => (int)($version ? $version['width'] : $ann['original_width']),
        'imageHeight' => (int)($version ? $version['height'] : $ann['original_height'])
    ];
}

function summarize_screen(PDO $pdo, $scr) {
    $stmtVer = $pdo->prepare("SELECT * FROM image_versions WHERE screen_id = :sid ORDER BY number ASC, created_at ASC");
    $stmtVer->execute([':sid' => $scr['id']]);
    $versions = $stmtVer->fetchAll();
    $latest = !empty($versions) ? $versions[count($versions) - 1] : null;

    $stmtAnn = $pdo->prepare("SELECT count(*) as total, sum(case when status = 'open' then 1 else 0 end) as open_cnt FROM annotations WHERE screen_id = :sid");
    $stmtAnn->execute([':sid' => $scr['id']]);
    $annStats = $stmtAnn->fetch();

    return [
        'id' => $scr['id'],
        'projectId' => $scr['project_id'],
        'name' => $scr['name'],
        'description' => $scr['description'] ?: '',
        'createdAt' => $scr['created_at'],
        'updatedAt' => $scr['updated_at'],
        'createdBy' => $scr['created_by'],
        'versionCount' => count($versions),
        'latestVersion' => present_version($pdo, $latest),
        'commentCount' => (int)($annStats['total'] ?? 0),
        'openCount' => (int)($annStats['open_cnt'] ?? 0)
    ];
}

function summarize_project(PDO $pdo, $proj, $userId) {
    // Screen count
    $stmtScr = $pdo->prepare("SELECT count(*) FROM design_screens WHERE project_id = :pid");
    $stmtScr->execute([':pid' => $proj['id']]);
    $screenCount = (int)$stmtScr->fetchColumn();

    // Annotation stats
    $stmtAnn = $pdo->prepare("SELECT count(*) as total, sum(case when status = 'open' then 1 else 0 end) as open_cnt, sum(case when status = 'resolved' then 1 else 0 end) as res_cnt FROM annotations WHERE project_id = :pid");
    $stmtAnn->execute([':pid' => $proj['id']]);
    $annStats = $stmtAnn->fetch();

    // Members
    $stmtMem = $pdo->prepare("SELECT u.id, u.name, u.username, pm.role, u.color, u.title, pm.id as membership_id, pm.created_at FROM project_members pm JOIN users u ON pm.user_id = u.id WHERE pm.project_id = :pid");
    $stmtMem->execute([':pid' => $proj['id']]);
    $members = $stmtMem->fetchAll();

    $myRole = null;
    foreach ($members as $m) {
        if ($m['id'] === $userId) {
            $myRole = $m['role'];
            break;
        }
    }

    return [
        'id' => $proj['id'],
        'name' => $proj['name'],
        'description' => $proj['description'] ?: '',
        'createdAt' => $proj['created_at'],
        'updatedAt' => $proj['updated_at'],
        'createdBy' => $proj['created_by'],
        'screenCount' => $screenCount,
        'commentCount' => (int)($annStats['total'] ?? 0),
        'openCount' => (int)($annStats['open_cnt'] ?? 0),
        'resolvedCount' => (int)($annStats['res_cnt'] ?? 0),
        'members' => array_map(function($m) {
            return [
                'id' => $m['id'],
                'name' => $m['name'],
                'username' => $m['username'],
                'role' => $m['role'],
                'color' => $m['color'],
                'title' => $m['title'],
                'membershipId' => $m['membership_id'],
                'createdAt' => $m['created_at']
            ];
        }, $members),
        'myRole' => $myRole
    ];
}
