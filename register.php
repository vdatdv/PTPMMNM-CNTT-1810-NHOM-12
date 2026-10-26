<?php
// register.php - Register new account & Admin verification
require_once __DIR__ . '/api/db.php';

$session = get_current_user_session($pdo);
if ($session) {
    header('Location: projects.php');
    exit;
}

$pageTitle = 'Tạo tài khoản — DesignMark';
$pageDescription = 'Tạo tài khoản mới trên hệ thống DesignMark. Hỗ trợ xác minh tài khoản Quản trị (Admin).';
?>
<!DOCTYPE html>
<html lang="vi">
<head>
  <?php include __DIR__ . '/includes/head.php'; ?>
</head>
<body>
  <a class="skip-link" href="#register-form">Bỏ qua giới thiệu</a>
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
        <h1>Khởi tạo tài khoản làm việc cùng đội ngũ.</h1>
        <p>Tham gia đánh giá, đóng góp ý kiến hoặc quản lý các dự án thiết kế giao diện một cách trực quan, chính xác.</p>
        <div class="hero-points">
          <div>Tùy chọn vai trò phù hợp: Quản trị, Góp ý hoặc Chỉ xem.</div>
          <div>Bảo mật tài khoản Quản trị viên với cơ chế xác minh bảo mật.</div>
          <div>Lưu trữ trực tiếp và tức thời trên cơ sở dữ liệu hệ thống.</div>
        </div>
      </div>
      <p>Hệ thống hỗ trợ cơ chế xác minh riêng biệt cho tài khoản Quản trị (Admin).</p>
    </section>
    <main class="login-panel">
      <section class="login-card">
        <h2>Đăng ký tài khoản</h2>
        <p class="lede">Điền thông tin bên dưới để gửi yêu cầu đăng ký tài khoản.</p>
        
        <div id="register-success-card" class="registration-success-card" style="display: none; text-align: center; padding: 24px 16px; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; margin-top: 12px;">
          <div style="width: 52px; height: 52px; border-radius: 50%; background: #10B981; color: white; display: inline-flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 14px;">✓</div>
          <h3 style="margin: 0 0 8px 0; color: var(--color-text-strong, #111827); font-size: 1.25rem;">Đăng ký thành công!</h3>
          <p id="success-message" style="color: var(--color-text-muted, #4B5563); font-size: 0.925rem; line-height: 1.6; margin-bottom: 20px;">
            Tài khoản của bạn đã được ghi nhận vào hệ thống.<br>
            Hiện tài khoản đang ở trạng thái <strong>Chờ Quản trị viên (Admin) phân cấp vai trò</strong>.<br>
            Sau khi Admin phê duyệt, bạn sẽ có thể đăng nhập để sử dụng hệ thống.
          </p>
          <a href="index.php" class="btn btn-primary" style="display: inline-block; text-decoration: none; padding: 10px 24px;">Về trang Đăng nhập</a>
        </div>

        <form id="register-form" novalidate>
          <div class="field">
            <label class="field-label" for="reg-username">Tên đăng nhập <span class="role-manager">*</span></label>
            <input class="field-input" id="reg-username" name="username" autocomplete="username" placeholder="Ví dụ: hoang_design" required>
            <p class="help">3 đến 30 ký tự, chỉ gồm chữ cái, số, dấu gạch dưới hoặc gạch ngang.</p>
          </div>
          <div class="field">
            <label class="field-label" for="reg-name">Họ và tên <span class="role-manager">*</span></label>
            <input class="field-input" id="reg-name" name="name" placeholder="Ví dụ: Hoàng Nguyễn" required>
          </div>
          <div class="field">
            <label class="field-label" for="reg-title">Chức danh / Vị trí</label>
            <input class="field-input" id="reg-title" name="title" placeholder="Ví dụ: Chuyên viên thiết kế UI/UX">
          </div>
          <div class="field">
            <label class="field-label" for="reg-password">Mật khẩu <span class="role-manager">*</span></label>
            <input class="field-input" id="reg-password" name="password" type="password" autocomplete="new-password" placeholder="Tối thiểu 4 ký tự" required>
          </div>
          <div class="field">
            <label class="field-label" for="reg-confirm">Xác nhận mật khẩu <span class="role-manager">*</span></label>
            <input class="field-input" id="reg-confirm" name="confirm" type="password" autocomplete="new-password" placeholder="Nhập lại mật khẩu" required>
          </div>

          <div class="admin-badge-notice" style="margin-bottom: 16px;">
            <strong>Quy trình phân cấp tài khoản:</strong>
            <span>Sau khi đăng ký, tài khoản cần được Quản trị viên (Admin) xét duyệt và phân cấp vai trò sử dụng trước khi đăng nhập.</span>
          </div>

          <p id="register-error" class="field-error" role="alert"></p>
          <button id="register-button" class="btn btn-primary" type="submit" style="width: 100%;">Gửi yêu cầu đăng ký</button>
        </form>

        <p id="login-link-container" class="auth-switch-link">
          Đã có tài khoản? <a href="index.php">Đăng nhập tại đây</a>
        </p>
      </section>
    </main>
  </div>
  <?php include __DIR__ . '/includes/footer.php'; ?>
  <script type="module">
    import { registerAccount } from './js/auth.js';

    const form = document.getElementById('register-form');
    const successCard = document.getElementById('register-success-card');
    const successMsg = document.getElementById('success-message');
    const loginLinkContainer = document.getElementById('login-link-container');
    const usernameInput = document.getElementById('reg-username');
    const nameInput = document.getElementById('reg-name');
    const titleInput = document.getElementById('reg-title');
    const passwordInput = document.getElementById('reg-password');
    const confirmInput = document.getElementById('reg-confirm');
    const errorEl = document.getElementById('register-error');
    const submitBtn = document.getElementById('register-button');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.textContent = '';

      const username = usernameInput.value.trim();
      const name = nameInput.value.trim();
      const title = titleInput.value.trim();
      const password = passwordInput.value;
      const confirm = confirmInput.value;

      // Client-side validations
      if (!username) {
        errorEl.textContent = 'Vui lòng nhập tên đăng nhập.';
        usernameInput.focus();
        return;
      }
      if (!/^[a-zA-Z0-9_\-\.]{3,30}$/.test(username)) {
        errorEl.textContent = 'Tên đăng nhập từ 3 đến 30 ký tự, chỉ gồm chữ cái, số, gạch dưới hoặc gạch ngang.';
        usernameInput.focus();
        return;
      }
      if (!name) {
        errorEl.textContent = 'Vui lòng nhập họ và tên.';
        nameInput.focus();
        return;
      }
      if (password.length < 4) {
        errorEl.textContent = 'Mật khẩu phải có tối thiểu 4 ký tự.';
        passwordInput.focus();
        return;
      }
      if (password !== confirm) {
        errorEl.textContent = 'Mật khẩu xác nhận không khớp.';
        confirmInput.focus();
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Đang gửi yêu cầu...';

      try {
        const data = await registerAccount({
          username,
          name,
          title,
          password
        });

        // Hide form and show pending approval success card
        form.style.display = 'none';
        if (loginLinkContainer) loginLinkContainer.style.display = 'none';
        if (successMsg) {
          successMsg.innerHTML = `
            Tài khoản <strong>${data.username || username}</strong> (${name}) đã được tạo thành công trên hệ thống.<br><br>
            Hiện tài khoản đang ở trạng thái <strong>Chờ Quản trị viên (Admin) xét duyệt & phân cấp vai trò</strong>.<br>
            Sau khi Admin phân quyền (Quản lý, Góp ý hoặc Chỉ xem) và kích hoạt, bạn có thể đăng nhập bình thường.
          `;
        }
        successCard.style.display = 'block';
      } catch (err) {
        errorEl.textContent = err.message || 'Lỗi khi tạo tài khoản.';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Gửi yêu cầu đăng ký';
      }
    });
  </script>
</body>
</html>
