<?php
// review.php - Review and annotate designs
require_once __DIR__ . '/api/db.php';

$session = get_current_user_session($pdo);
if (!$session) {
    header('Location: index.php?next=' . urlencode($_SERVER['REQUEST_URI'] ?? 'review.php'));
    exit;
}

$pageTitle = 'Góp ý — DesignMark';
?>
<!DOCTYPE html>
<html lang="vi">
<head>
  <?php include __DIR__ . '/includes/head.php'; ?>
</head>
<body data-page="review">
  <a class="skip-link" href="#review-toolbar">Bỏ qua điều hướng</a>
  <div class="app-shell">
    <aside id="sidebar" class="sidebar" aria-label="Điều hướng chính"></aside>
    <div id="sidebar-backdrop" class="sidebar-backdrop" hidden></div>
    <div class="app-main">
      <header id="topbar" class="topbar"></header>
      <main id="page" class="page page-review" tabindex="-1" data-preserve="true">
        <div class="review-toolbar" id="review-toolbar" data-testid="review-toolbar">
          <div class="toolbar-group">
            <a id="back-link" class="btn btn-secondary btn-sm" href="projects.php">Dự án</a>
            <strong id="screen-name">Đang tải màn hình</strong>
            <label class="field-label" for="version-select">Phiên bản</label>
            <select id="version-select" data-testid="version-select" aria-label="Chọn phiên bản ảnh"></select>
            <a id="compare-link" class="btn btn-secondary btn-sm" href="compare.php">So sánh</a>
          </div>
          <div class="toolbar-group" role="toolbar" aria-label="Phóng to và công cụ góp ý">
            <button type="button" id="zoom-out" class="btn btn-secondary btn-sm" data-testid="zoom-out" aria-label="Thu nhỏ">−</button>
            <span id="zoom-label" class="zoom-label">100%</span>
            <button type="button" id="zoom-in" class="btn btn-secondary btn-sm" data-testid="zoom-in" aria-label="Phóng to">+</button>
            <button type="button" id="zoom-fit" class="btn btn-secondary btn-sm" data-testid="zoom-fit">Vừa khung</button>
            <button type="button" id="tool-select" class="tool-btn is-active" data-testid="tool-select" aria-pressed="true">Chọn</button>
            <button type="button" id="tool-point" class="tool-btn" data-testid="tool-point" aria-pressed="false">Đặt điểm</button>
            <button type="button" id="tool-rectangle" class="tool-btn" data-testid="tool-rectangle" aria-pressed="false">Khoanh vùng</button>
            <button type="button" id="coord-btn" class="btn btn-secondary btn-sm">Nhập tọa độ</button>
          </div>
        </div>
        <p id="tool-hint" class="sr-only" aria-live="polite"></p>
        <p id="permission-note" class="permission-note" hidden>Bạn chỉ có quyền xem.</p>
        <p id="version-banner" class="version-banner" role="status" hidden></p>
        <div class="review-layout">
          <div class="canvas-column">
            <div id="canvas-viewport" class="canvas-viewport">
              <div class="canvas-pad">
                <div id="image-stage" class="image-stage" data-testid="image-stage" tabindex="0" aria-label="Vùng ảnh thiết kế. Dùng phím mũi tên và Enter để đặt điểm khi công cụ tương ứng đang bật.">
                  <img id="review-image" alt="Ảnh thiết kế đang tải">
                  <div id="image-overlay" class="overlay" data-testid="image-overlay"></div>
                </div>
              </div>
            </div>
          </div>
          <aside id="comment-panel" class="comment-panel" data-testid="comment-panel" aria-label="Danh sách góp ý"></aside>
        </div>
      </main>
    </div>
  </div>
  <?php include __DIR__ . '/includes/footer.php'; ?>
  <script type="module" src="js/review.js"></script>
</body>
</html>
