<?php
// api/health.php - Health check and Database Engine status
require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

$start = microtime(true);
$dbOk = false;
$error = null;

try {
    $stmt = $pdo->query("SELECT 1");
    $dbOk = $stmt !== false;
} catch (Throwable $e) {
    $error = $e->getMessage();
}
$latencyMs = round((microtime(true) - $start) * 1000, 2);

echo json_encode([
    'status' => $dbOk ? 'ok' : 'degraded',
    'engine' => $dbDriver, // 'pgsql' (Supabase) or 'sqlite' (Local)
    'engine_name' => $dbDriver === 'sqlite' ? 'SQLite (Cục bộ / Mạng yếu)' : 'PostgreSQL (Supabase Live)',
    'breaker_active' => $isBreakerActive,
    'prefer_local' => $preferLocal,
    'latency_ms' => $latencyMs,
    'error' => $error,
    'server_time' => date('Y-m-d H:i:s')
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
