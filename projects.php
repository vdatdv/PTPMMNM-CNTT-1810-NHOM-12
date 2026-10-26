<?php
// projects.php - Projects Dashboard
require_once __DIR__ . '/api/db.php';

$session = get_current_user_session($pdo);
if (!$session) {
    header('Location: index.php?next=projects.php');
    exit;
}

$pageTitle = 'Dự án — DesignMark';
?>
<!DOCTYPE html>
<html lang="vi">
<head>
  <?php include __DIR__ . '/includes/head.php'; ?>
</head>
<body data-page="projects">
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
  <script type="module" src="js/projects.js"></script>
</body>
</html>
