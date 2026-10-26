<?php
// api/feedback.php - Feedback list API

require_once __DIR__ . '/db.php';

$session = require_auth($pdo);
$projectId = $_GET['project'] ?? $_GET['project_id'] ?? null;

// Get project IDs user is member of
$stmtM = $pdo->prepare("SELECT project_id FROM project_members WHERE user_id = :uid");
$stmtM->execute([':uid' => $session['userId']]);
$userProjectIds = $stmtM->fetchAll(PDO::FETCH_COLUMN);

if (empty($userProjectIds)) {
    json_response([]);
}

if ($projectId) {
    if (!in_array($projectId, $userProjectIds, true)) {
        json_error('Bạn không thuộc dự án này.', 'FORBIDDEN', 403);
    }
    $targetProjects = [$projectId];
} else {
    $targetProjects = $userProjectIds;
}

$placeholders = implode(',', array_fill(0, count($targetProjects), '?'));
$stmt = $pdo->prepare("SELECT * FROM annotations WHERE project_id IN ($placeholders) ORDER BY created_at ASC, id ASC");
$stmt->execute($targetProjects);
$anns = $stmt->fetchAll();

$result = [];
foreach ($anns as $a) {
    $result[] = present_annotation($pdo, $a);
}

json_response($result);
