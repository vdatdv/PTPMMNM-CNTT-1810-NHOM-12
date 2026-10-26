<?php
// api/dashboard.php - Dashboard API (Aggregated stats, recent activities, pending feedback, recent projects)
require_once __DIR__ . '/db.php';

$session = require_auth($pdo);
$userId = $session['userId'];

// Get project IDs user has access to
$stmtM = $pdo->prepare("SELECT project_id, role FROM project_members WHERE user_id = :uid");
$stmtM->execute([':uid' => $userId]);
$memberRows = $stmtM->fetchAll();
$projectIds = array_column($memberRows, 'project_id');

$emptyDashboard = [
    'stats' => [
        'totalProjects' => 0,
        'totalScreens' => 0,
        'openFeedback' => 0,
        'resolvedFeedback' => 0
    ],
    'recentActivities' => [],
    'pendingFeedback' => [],
    'recentProjects' => [],
    'pendingUsers' => []
];

// Check for unverified users if current user is manager
$pendingUsers = [];
if ($session['role'] === 'manager') {
    $stmtPu = $pdo->query("SELECT id, name, username, title, color, created_at FROM users WHERE is_verified = 0 OR role = 'pending' ORDER BY created_at ASC");
    $pendingUsers = $stmtPu->fetchAll();
}

if (empty($projectIds)) {
    $emptyDashboard['pendingUsers'] = $pendingUsers;
    json_response($emptyDashboard);
}

$placeholders = implode(',', array_fill(0, count($projectIds), '?'));

// 1. Stats
// Total Screens
$stmtScr = $pdo->prepare("SELECT count(*) FROM design_screens WHERE project_id IN ($placeholders)");
$stmtScr->execute($projectIds);
$totalScreens = (int)$stmtScr->fetchColumn();

// Feedback counts
$stmtFb = $pdo->prepare("SELECT 
    sum(case when status != 'resolved' then 1 else 0 end) as open_cnt,
    sum(case when status = 'resolved' then 1 else 0 end) as res_cnt
    FROM annotations WHERE project_id IN ($placeholders)");
$stmtFb->execute($projectIds);
$fbStats = $stmtFb->fetch();
$openFeedback = (int)($fbStats['open_cnt'] ?? 0);
$resolvedFeedback = (int)($fbStats['res_cnt'] ?? 0);

$stats = [
    'totalProjects' => count($projectIds),
    'totalScreens' => $totalScreens,
    'openFeedback' => $openFeedback,
    'resolvedFeedback' => $resolvedFeedback
];

// 2. Recent Activities (limit 15)
$stmtAct = $pdo->prepare("SELECT a.id, a.project_id, a.user_id, a.type, a.message, a.created_at, p.name as project_name 
    FROM activities a 
    JOIN projects p ON a.project_id = p.id 
    WHERE a.project_id IN ($placeholders) 
    ORDER BY a.created_at DESC 
    LIMIT 15");
$stmtAct->execute($projectIds);
$rawActivities = $stmtAct->fetchAll();

$recentActivities = [];
foreach ($rawActivities as $act) {
    $recentActivities[] = [
        'id' => $act['id'],
        'projectId' => $act['project_id'],
        'projectName' => $act['project_name'],
        'userId' => $act['user_id'],
        'user' => public_user($pdo, $act['user_id']),
        'type' => $act['type'],
        'message' => $act['message'],
        'createdAt' => $act['created_at'],
        'link' => "project.php?id=" . urlencode($act['project_id'])
    ];
}

// 3. Pending Feedback (Góp ý cần xử lý - limit 10)
$stmtAnn = $pdo->prepare("SELECT a.id, a.project_id, a.screen_id, a.image_version_id, a.author_id, a.body, a.status, a.created_at, a.updated_at,
    p.name as project_name, s.name as screen_name, v.number as version_number
    FROM annotations a
    JOIN projects p ON a.project_id = p.id
    JOIN design_screens s ON a.screen_id = s.id
    JOIN image_versions v ON a.image_version_id = v.id
    WHERE a.project_id IN ($placeholders) AND a.status != 'resolved'
    ORDER BY a.updated_at DESC, a.created_at DESC
    LIMIT 10");
$stmtAnn->execute($projectIds);
$rawPending = $stmtAnn->fetchAll();

$pendingFeedback = [];
foreach ($rawPending as $pAnn) {
    $pendingFeedback[] = [
        'id' => $pAnn['id'],
        'projectId' => $pAnn['project_id'],
        'projectName' => $pAnn['project_name'],
        'screenId' => $pAnn['screen_id'],
        'screenName' => $pAnn['screen_name'],
        'versionNumber' => (int)$pAnn['version_number'],
        'body' => $pAnn['body'],
        'status' => $pAnn['status'],
        'author' => public_user($pdo, $pAnn['author_id']),
        'createdAt' => $pAnn['created_at'],
        'reviewUrl' => "review.php?project=" . urlencode($pAnn['project_id']) . "&screen=" . urlencode($pAnn['screen_id']) . "&annotation=" . urlencode($pAnn['id'])
    ];
}

// 4. Recent Projects (Top 4 most recently updated)
$stmtProj = $pdo->prepare("SELECT * FROM projects WHERE id IN ($placeholders) ORDER BY updated_at DESC, created_at DESC LIMIT 4");
$stmtProj->execute($projectIds);
$rawRecentProj = $stmtProj->fetchAll();

$recentProjects = [];
foreach ($rawRecentProj as $proj) {
    $recentProjects[] = summarize_project($pdo, $proj, $userId);
}

json_response([
    'stats' => $stats,
    'recentActivities' => $recentActivities,
    'pendingFeedback' => $pendingFeedback,
    'recentProjects' => $recentProjects,
    'pendingUsers' => $pendingUsers
]);
