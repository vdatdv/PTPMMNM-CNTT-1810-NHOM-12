<?php
// dashboard.php - Overview Dashboard
require_once __DIR__ . '/api/db.php';

$session = get_current_user_session($pdo);
if (!$session) {
    header('Location: index.php?next=dashboard.php');
    exit;
}

$pageTitle = 'Tổng quan dự án — DesignMark';
?>
<!DOCTYPE html>
<html lang="vi">
<head>
  <?php include __DIR__ . '/includes/head.php'; ?>
</head>
<body data-page="dashboard">
  <a class="skip-link" href="#page">Bỏ qua điều hướng</a>
  <div class="app-shell">
    <aside id="sidebar" class="sidebar" aria-label="Điều hướng chính"></aside>
    <div id="sidebar-backdrop" class="sidebar-backdrop" hidden></div>
    <div class="app-main">
      <header id="topbar" class="topbar"></header>
      <main id="page" class="page" tabindex="-1"></main>
    </div>
  </div>
  <?php include __DIR__ . '/includes/footer.php'; ?>
  <script type="module" src="js/dashboard.js"></script>
</body>
</html>
