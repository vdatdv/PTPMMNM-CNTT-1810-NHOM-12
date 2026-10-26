#!/bin/bash
# backup_database.sh - Export current database from Supabase to database.sql
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_FILE="${1:-$DIR/database.sql}"
DB_URL="postgresql://postgres.qpdsjaxilorovzboexrq:%40Vinhdat123@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

echo "=========================================================="
echo "📦 Đang backup dữ liệu từ Supabase về $OUTPUT_FILE..."
echo "=========================================================="

php -r '
require_once "api/db.php";

$output = [];
$output[] = "-- ====================================================================";
$output[] = "-- DesignMark - Supabase PostgreSQL Database Schema & Seed Data";
$output[] = "-- Backup Date: " . date("Y-m-d H:i:s") . " UTC";
$output[] = "-- Compatible with: Supabase PostgreSQL (SQL Editor & psql)";
$output[] = "-- ====================================================================\n";

$output[] = "-- 1. CẤU TRÚC BẢNG (TABLE SCHEMAS)\n";

$schemaSql = <<<SQL
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN (\x27manager\x27, \x27reviewer\x27, \x27viewer\x27, \x27pending\x27)),
    title TEXT,
    color TEXT,
    password_hash TEXT,
    is_verified INTEGER DEFAULT 1,
    verification_code TEXT,
    verified_at TEXT,
    created_at TEXT NOT NULL
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
    role TEXT NOT NULL CHECK (role IN (\x27manager\x27, \x27reviewer\x27, \x27viewer\x27)),
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
    type TEXT NOT NULL CHECK (type IN (\x27point\x27, \x27rect\x27, \x27area\x27)),
    x REAL NOT NULL,
    y REAL NOT NULL,
    w REAL NOT NULL,
    h REAL NOT NULL,
    original_width INTEGER NOT NULL,
    original_height INTEGER NOT NULL,
    author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT \x27open\x27 CHECK (status IN (\x27open\x27, \x27resolved\x27, \x27rejected\x27)),
    revision INTEGER NOT NULL DEFAULT 1,
    check_note TEXT DEFAULT \x27\x27,
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

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_design_screens_project ON design_screens(project_id);
CREATE INDEX IF NOT EXISTS idx_image_versions_screen ON image_versions(screen_id);
CREATE INDEX IF NOT EXISTS idx_annotations_version ON annotations(image_version_id);
CREATE INDEX IF NOT EXISTS idx_annotations_screen ON annotations(screen_id);
CREATE INDEX IF NOT EXISTS idx_annotation_replies_ann ON annotation_replies(annotation_id);
CREATE INDEX IF NOT EXISTS idx_activities_project ON activities(project_id);
SQL;

$output[] = $schemaSql . "\n";
$output[] = "-- ====================================================================";
$output[] = "-- 2. DỮ LIỆU BAN ĐẦU (DATA INSERTS)";
$output[] = "-- ====================================================================\n";

$tables = [
    "users" => "id",
    "projects" => "id",
    "project_members" => "project_id, user_id",
    "design_screens" => "id",
    "image_versions" => "id",
    "annotations" => "id",
    "annotation_replies" => "id",
    "annotation_status_events" => "id",
    "activities" => "id"
];

foreach ($tables as $t => $conflictKey) {
    $rows = $pdo->query("SELECT * FROM $t ORDER BY created_at ASC, id ASC")->fetchAll(PDO::FETCH_ASSOC);
    $output[] = "-- Dữ liệu bảng `$t` (" . count($rows) . " bản ghi)";
    if (empty($rows)) {
        $output[] = "-- Không có bản ghi nào.\n";
        continue;
    }
    
    $cols = array_keys($rows[0]);
    $colList = implode(", ", array_map(fn($c) => "\"$c\"", $cols));
    
    $output[] = "INSERT INTO $t ($colList) VALUES";
    $valLines = [];
    foreach ($rows as $r) {
        $vals = [];
        foreach ($r as $val) {
            if ($val === null) {
                $vals[] = "NULL";
            } elseif (is_numeric($val) && !preg_match("/^[0-9]{4}-[0-9]{2}/", $val)) {
                $vals[] = $val;
            } else {
                $vals[] = "\x27" . str_replace("\x27", "\x27\x27", $val) . "\x27";
            }
        }
        $valLines[] = "  (" . implode(", ", $vals) . ")";
    }
    $output[] = implode(",\n", $valLines);
    $output[] = "ON CONFLICT ($conflictKey) DO NOTHING;\n";
}

$target = $argv[1] ?? "database.sql";
file_put_contents($target, implode("\n", $output));
echo "✅ Đã backup xong file $target (" . filesize($target) . " bytes)\n";
' "$OUTPUT_FILE"

cp "$OUTPUT_FILE" "$DIR/supabase_schema_and_data.sql"
echo "🎉 Sao lưu thành công!"
