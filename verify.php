<?php
// verify.php - Admin Account Verification Page
require_once __DIR__ . '/api/db.php';

$presetUsername = trim($_GET['username'] ?? '');
$presetCode = trim($_GET['code'] ?? '');

$pageTitle = 'Xác minh tài khoản Admin — DesignMark';
$pageDescription = 'Trang xác minh quyền Quản trị viên (Admin) cho hệ thống DesignMark.';
?>
<!DOCTYPE html>
<html lang="vi">
<head>
  <?php include __DIR__ . '/includes/head.php'; ?>
</head>
<body>
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
        <h1>Xác minh quyền Quản trị viên (Admin).</h1>
        <p>Bảo mật hệ thống yêu cầu xác nhận danh tính trước khi cấp quyền tạo dự án, quản lý thành viên và phê duyệt phiên bản thiết kế.</p>
        <div class="hero-points">
          <div>Nhập mã xác minh OTP 6 số được cấp khi đăng ký.</div>
          <div>Hoặc sử dụng mã xác minh Quản trị viên cấp cao.</div>
          <div>Tài khoản sẽ được kích hoạt tức thì ngay sau khi xác nhận.</div>
        </div>
      </div>
      <p>Cơ chế xác minh an toàn bảo vệ quyền Quản trị trên hệ thống.</p>
    </section>
    <main class="login-panel">
      <section class="login-card">
        <h2>Xác minh tài khoản Admin</h2>
        <p class="lede">Nhập mã xác minh để kích hoạt quyền Quản trị viên.</p>

        <div class="admin-badge-notice" style="margin-bottom: 20px;">
          <strong>Hướng dẫn xác minh:</strong>
          <span>• Dùng mã OTP 6 số được cấp khi đăng ký</span>
          <span>• Hoặc dùng mã xác minh Quản trị viên: <span class="code-display">ADMIN2026</span></span>
        </div>

        <form id="verify-form" novalidate>
          <div class="field">
            <label class="field-label" for="verify-username">Tên đăng nhập Admin</label>
            <input class="field-input" id="verify-username" name="username" value="<?= htmlspecialchars($presetUsername, ENT_QUOTES, 'UTF-8') ?>" placeholder="Nhập tên đăng nhập" required>
          </div>
          <div class="field">
            <label class="field-label" for="verify-code">Mã xác minh (OTP hoặc Mã Admin)</label>
            <input class="field-input" id="verify-code" name="code" value="<?= htmlspecialchars($presetCode, ENT_QUOTES, 'UTF-8') ?>" placeholder="Ví dụ: 123456 hoặc ADMIN2026" required style="font-family: monospace; font-size: 16px; letter-spacing: 1px;">
          </div>

          <p id="verify-error" class="field-error" role="alert"></p>
          <button id="verify-button" class="btn btn-primary" type="submit" style="width: 100%;">Kích hoạt tài khoản Admin</button>
        </form>

        <p class="auth-switch-link">
          <a href="index.php">Quay lại đăng nhập</a> · <a href="register.php">Tạo tài khoản khác</a>
        </p>
      </section>
    </main>
  </div>
  <?php include __DIR__ . '/includes/footer.php'; ?>
  <script type="module">
    import { setSession } from './js/auth.js';
    import { toast } from './js/ui.js';

    const form = document.getElementById('verify-form');
    const usernameInput = document.getElementById('verify-username');
    const codeInput = document.getElementById('verify-code');
    const errorEl = document.getElementById('verify-error');
    const submitBtn = document.getElementById('verify-button');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.textContent = '';

      const username = usernameInput.value.trim();
      const code = codeInput.value.trim();

      if (!username) {
        errorEl.textContent = 'Vui lòng nhập tên đăng nhập.';
        usernameInput.focus();
        return;
      }
      if (!code) {
        errorEl.textContent = 'Vui lòng nhập mã xác minh.';
        codeInput.focus();
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Đang xác minh...';

      try {
        const res = await fetch('api/auth.php?action=verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, code })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Xác minh không thành công.');
        }

        setSession({
          userId: data.userId,
          username: data.username,
          name: data.name,
          role: data.role,
          title: data.title || 'Quản lý thiết kế',
          color: data.color || '#4F46E5',
          remember: true
        }, true);

        toast('Xác minh tài khoản Admin thành công! Đang chuyển hướng...', 'success');
        setTimeout(() => {
          location.href = 'projects.php';
        }, 800);
      } catch (err) {
        errorEl.textContent = err.message || 'Lỗi xác minh tài khoản.';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Kích hoạt tài khoản Admin';
      }
    });
  </script>
</body>
</html>
