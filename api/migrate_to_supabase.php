<?php
// api/migrate_to_supabase.php - Create schema and migrate data to Supabase Postgres

$sqlitePath = __DIR__ . '/../data/database.sqlite';
if (!file_exists($sqlitePath)) {
    echo "SQLite database not found at $sqlitePath\n";
    exit(1);
}

// Supabase Postgres config
$host = 'aws-0-ap-southeast-1.pooler.supabase.com';
$port = 5432;
$dbname = 'postgres';
$user = 'postgres.qpdsjaxilorovzboexrq';
$pass = '@Vinhdat123';

echo "1. Connecting to SQLite...\n";
$sqlite = new PDO('sqlite:' . $sqlitePath);
$sqlite->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$sqlite->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

echo "2. Connecting to Supabase PostgreSQL ($host)...\n";
$pgDsn = "pgsql:host=$host;port=$port;dbname=$dbname;sslmode=require";
$pg = new PDO($pgDsn, $user, $pass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
]);

echo "3. Creating tables on Supabase if not exist...\n";
$schemaSql = "
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
";

$pg->exec($schemaSql);
echo "   -> Tables created successfully.\n";

echo "4. Migrating data from SQLite to Supabase...\n";

// Order matters due to foreign keys:
$tables = [
    'users',
    'projects',
    'project_members',
    'design_screens',
    'image_versions',
    'annotations',
    'annotation_replies',
    'annotation_status_events',
    'activities'
];

foreach ($tables as $table) {
    $rows = $sqlite->query("SELECT * FROM $table")->fetchAll();
    echo "   Migrating table '$table' (" . count($rows) . " rows)... ";
    if (empty($rows)) {
        echo "0 migrated.\n";
        continue;
    }

    $cols = array_keys($rows[0]);
    $colList = implode(', ', $cols);
    $paramList = implode(', ', array_map(fn($c) => ':' . $c, $cols));
    
    // For upsert:
    $updateList = implode(', ', array_map(fn($c) => "$c = EXCLUDED.$c", array_filter($cols, fn($c) => $c !== 'id')));
    
    $upsertSql = "INSERT INTO $table ($colList) VALUES ($paramList) ";
    if ($table === 'project_members') {
        $upsertSql .= "ON CONFLICT (project_id, user_id) DO NOTHING";
    } else {
        $upsertSql .= "ON CONFLICT (id) DO UPDATE SET $updateList";
    }

    $stmt = $pg->prepare($upsertSql);
    $migratedCount = 0;
    foreach ($rows as $row) {
        $stmt->execute($row);
        $migratedCount++;
    }
    echo "$migratedCount migrated.\n";
}

echo "\nMigration complete! All tables and data are now live in Supabase PostgreSQL.\n";
