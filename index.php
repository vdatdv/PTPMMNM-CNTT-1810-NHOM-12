<?php
// index.php - Login page
require_once __DIR__ . '/api/db.php';

$session = get_current_user_session($pdo);
if ($session) {
    $next = $_GET['next'] ?? 'dashboard.php';
    if (!str_contains($next, '://') && !str_starts_with($next, '//')) {
        header('Location: ' . $next);
        exit;
    }
    header('Location: dashboard.php');
    exit;
}

$pageTitle = 'Đăng nhập — DesignMark';
$pageDescription = 'DesignMark — góp ý trực tiếp trên ảnh và bản thiết kế giao diện.';
?>
<!DOCTYPE html>
<html lang="vi">
<head>
  <?php include __DIR__ . '/includes/head.php'; ?>
</head>
<body>
  <a class="skip-link" href="#login-form">Bỏ qua giới thiệu</a>
  <div class="login-shell">
    <section class="login-hero">
      <div>
        <div class="brand">
          <span class="login-mark" aria-hidden="true">D</span>
          <span class="brand-text">
            <strong>DesignMark</strong>
            <small>Góp ý trên thiết kế</small>
          </span>
        </div>
        <h1>Góp ý đúng vị trí trên từng phiên bản giao diện.</h1>
        <p>Đặt điểm, khoanh vùng và trao đổi ngay trên ảnh thiết kế. DesignMark không chỉnh sửa nội dung ảnh.</p>
        <div class="hero-points">
          <div>Quản lý màn hình và nhiều phiên bản ảnh.</div>
          <div>Góp ý theo tọa độ ảnh gốc, không lệch khi phóng to.</div>
          <div>So sánh hai phiên bản và xuất danh sách góp ý.</div>
        </div>
      </div>
      <p>Hệ thống chạy trên nền tảng PHP và lưu trữ cơ sở dữ liệu SQLite.</p>
    </section>
    <main class="login-panel">
      <section class="login-card">
        <h2>Chào mừng trở lại</h2>
        <p class="lede">Đăng nhập để xem dự án và góp ý thiết kế.</p>
        <form id="login-form" data-testid="login-form" novalidate>
          <div class="field">
            <label class="field-label" for="username">Tên đăng nhập</label>
            <input class="field-input" id="username" name="username" autocomplete="username" required>
          </div>
          <div class="field">
            <label class="field-label" for="password">Mật khẩu</label>
            <input class="field-input" id="password" name="password" type="password" autocomplete="current-password" required>
          </div>
          <label class="checkline" for="remember">
            <input id="remember" type="checkbox" checked>
            Ghi nhớ phiên trên trình duyệt này
          </label>
          <p id="login-error" class="field-error" role="alert"></p>
          <button id="login-button" data-testid="login-button" class="btn btn-primary" type="submit">Đăng nhập</button>
        </form>

        <p class="auth-switch-link">
          Chưa có tài khoản? <a href="register.php">Tạo tài khoản mới</a>
        </p>
      </section>
    </main>
  </div>
  <?php include __DIR__ . '/includes/footer.php'; ?>
  <script type="module">
    import { clearSession, getSession, login, redirectAfterLogin } from './js/auth.js';

    // If PHP session is not active, clear any stale client storage
    if (!window.DESIGNMARK_SESSION) {
      clearSession();
    } else if (getSession()) {
      redirectAfterLogin();
    }

    const form = document.getElementById('login-form');
    const username = document.getElementById('username');
    const password = document.getElementById('password');
    const error = document.getElementById('login-error');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      error.textContent = '';
      const button = document.getElementById('login-button');
      button.disabled = true;
      try {
        await login(username.value, password.value, document.getElementById('remember').checked);
        redirectAfterLogin();
      } catch (err) {
        if (err.code === 'PENDING_APPROVAL') {
          error.innerHTML = `<div class="pending-approval-box" style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 8px; padding: 12px 14px; color: #b45309; font-size: 0.875rem; line-height: 1.5; text-align: left; margin-top: 8px;">
            <strong style="display: block; margin-bottom: 4px; font-weight: 600;">⏳ Tài khoản đang chờ duyệt</strong>
            Tài khoản này chưa được Quản trị viên (Admin) phân cấp vai trò. Vui lòng liên hệ Admin để được xét duyệt và kích hoạt trước khi sử dụng.
          </div>`;
        } else {
          error.textContent = err.message || 'Không đăng nhập được.';
        }
        button.disabled = false;
        (err.message && err.message.includes('mật khẩu') ? password : username).focus();
      }
    });
  </script>
</body>
</html>
