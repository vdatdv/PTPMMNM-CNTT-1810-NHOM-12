<?php
// api/svg_seeds.php - SVG generators for demo seed designs

function svg_esc($str) {
    return htmlspecialchars((string)$str, ENT_QUOTES | ENT_XML1, 'UTF-8');
}

function svg_txt($x, $y, $value, $size = 14, $fill = '#0F172A', $weight = 500, $anchor = 'start') {
    $font = 'Inter, Segoe UI, sans-serif';
    return sprintf('<text x="%s" y="%s" fill="%s" font-size="%s" font-weight="%s" font-family="%s" text-anchor="%s">%s</text>',
        $x, $y, $fill, $size, $weight, $font, $anchor, svg_esc($value)
    );
}

function svg_rect($x, $y, $w, $h, $fill, $stroke = 'none', $radius = 0) {
    $strokeAttr = ($stroke && $stroke !== 'none') ? sprintf(' stroke="%s"', $stroke) : '';
    return sprintf('<rect x="%s" y="%s" width="%s" height="%s" rx="%s" fill="%s"%s/>',
        $x, $y, $w, $h, $radius, $fill, $strokeAttr
    );
}

function svg_line($x1, $y1, $x2, $y2, $stroke = '#E2E8F0') {
    return sprintf('<line x1="%s" y1="%s" x2="%s" y2="%s" stroke="%s"/>',
        $x1, $y1, $x2, $y2, $stroke
    );
}

function svg_wrap($body) {
    return sprintf('<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="500" viewBox="0 0 1000 500">%s</svg>', $body);
}

function svg_chrome($brand, $links, $activeIndex = 0) {
    $nav = '';
    foreach ($links as $index => $label) {
        $color = ($index === $activeIndex) ? '#4F46E5' : '#64748B';
        $weight = ($index === $activeIndex) ? 700 : 500;
        $nav .= svg_txt(188 + $index * 108, 34, $label, 13, $color, $weight);
    }
    return implode('', [
        svg_rect(0, 0, 1000, 500, '#F1F5F9'),
        svg_rect(0, 0, 1000, 56, '#FFFFFF'),
        svg_line(0, 56, 1000, 56),
        svg_rect(16, 16, 24, 24, '#4F46E5', 'none', 6),
        svg_txt(28, 33, 'D', 12, '#FFFFFF', 700, 'middle'),
        svg_txt(48, 34, $brand, 15, '#0F172A', 700),
        $nav
    ]);
}

function svg_field($x, $y, $w, $label, $placeholder) {
    return implode('', [
        svg_txt($x, $y, $label, 13, '#334155', 600),
        svg_rect($x, $y + 8, $w, 36, '#FFFFFF', '#CBD5E1', 8),
        svg_txt($x + 12, $y + 31, $placeholder, 13, '#94A3B8', 400)
    ]);
}

function svg_cta($x, $y, $w, $h, $label, $fill = '#4F46E5') {
    return implode('', [
        svg_rect($x, $y, $w, $h, $fill, 'none', 8),
        svg_txt($x + $w / 2, $y + $h / 2 + 5, $label, 15, '#FFFFFF', 700, 'middle')
    ]);
}

function svg_chip($x, $y, $label) {
    $width = max(72, mb_strlen($label, 'UTF-8') * 7 + 20);
    return implode('', [
        svg_rect($x, $y, $width, 26, '#EEF2FF', 'none', 13),
        svg_txt($x + $width / 2, $y + 17, $label, 12, '#4338CA', 700, 'middle')
    ]);
}

function svg_card($x, $y, $w, $h) {
    return svg_rect($x, $y, $w, $h, '#FFFFFF', '#E2E8F0', 12);
}

function render_seed_signup_v1() {
    return svg_wrap(implode('', [
        svg_chrome('DM Shop', ['Sản phẩm', 'Giải pháp', 'Bảng giá'], 1),
        svg_txt(860, 34, 'Đăng nhập', 13, '#334155', 600),
        svg_card(40, 80, 580, 370),
        svg_txt(64, 118, 'Tạo tài khoản', 22, '#0F172A', 700),
        svg_txt(64, 144, 'Nhập thông tin để bắt đầu dùng thử 14 ngày.', 13, '#64748B', 400),
        svg_field(64, 172, 250, 'Họ và tên', 'Nguyễn An'),
        svg_field(334, 172, 250, 'Email công việc', 'an@congty.vn'),
        svg_field(64, 252, 250, 'Mật khẩu', '••••••••'),
        svg_field(334, 252, 250, 'Xác nhận mật khẩu', '••••••••'),
        svg_rect(64, 340, 18, 18, '#FFFFFF', '#CBD5E1', 4),
        svg_txt(92, 354, 'Tôi đồng ý với điều khoản sử dụng', 13, '#334155', 500),
        svg_card(640, 80, 320, 250),
        svg_txt(664, 112, 'Hoàn tất đăng ký', 14, '#0F172A', 700),
        svg_cta(668, 124, 164, 52, 'Đăng ký'),
        svg_txt(664, 204, 'Nút chính nằm ở thẻ bên phải.', 12, '#64748B', 400),
        svg_txt(664, 226, 'Góp ý trên nút chỉ thuộc phiên bản này.', 12, '#64748B', 400),
        svg_rect(664, 248, 272, 58, '#F8FAFC', '#E2E8F0', 8),
        svg_txt(680, 274, 'Đã có tài khoản? Đăng nhập', 13, '#334155', 500),
        svg_txt(680, 294, 'Hỗ trợ: hello@dmshop.vn', 12, '#64748B', 400),
        svg_chip(40, 460, 'Phiên bản 1')
    ]));
}

function render_seed_signup_v2() {
    return svg_wrap(implode('', [
        svg_chrome('DM Shop', ['Trang chủ', 'Đăng ký', 'Hỗ trợ'], 1),
        svg_rect(0, 64, 1000, 40, '#EEF2FF'),
        svg_txt(40, 89, 'Phiên bản 2 — bố cục một cột, nút Đăng ký đã chuyển xuống cuối form', 14, '#4338CA', 600),
        svg_card(250, 124, 500, 250),
        svg_txt(274, 160, 'Đăng ký tài khoản', 22, '#0F172A', 700),
        svg_field(274, 184, 452, 'Email', 'ban@congty.vn'),
        svg_field(274, 260, 452, 'Mật khẩu', 'Tối thiểu 8 ký tự'),
        svg_card(640, 124, 280, 78),
        svg_txt(656, 154, 'Nút Đăng ký không còn ở đây', 13, '#334155', 700),
        svg_txt(656, 176, 'Vị trí cũ của phiên bản 1', 12, '#64748B', 400),
        svg_cta(148, 392, 200, 52, 'Đăng ký'),
        svg_txt(364, 424, 'Tạo tài khoản', 13, '#64748B', 500),
        svg_chip(860, 460, 'Phiên bản 2')
    ]));
}

function render_seed_home_v1() {
    return svg_wrap(implode('', [
        svg_chrome('DM Shop', ['Sản phẩm', 'Bộ sưu tập', 'Giỏ hàng'], 1),
        svg_txt(860, 34, 'Tài khoản', 13, '#334155', 600),
        svg_card(40, 80, 920, 150),
        svg_txt(64, 124, 'Mùa mới', 13, '#4F46E5', 700),
        svg_txt(360, 172, 'Bộ sưu tập mùa mới', 28, '#0F172A', 700),
        svg_txt(64, 200, 'Tiêu đề đang lệch khỏi cột nội dung bên trái.', 14, '#64748B', 400),
        svg_card(48, 250, 280, 180),
        svg_rect(68, 270, 240, 78, '#EEF2FF', 'none', 8),
        svg_txt(68, 372, 'Áo linen', 16, '#0F172A', 700),
        svg_txt(68, 396, 'Thiếu giá và nút xem', 13, '#64748B', 400),
        svg_card(348, 250, 280, 180),
        svg_rect(368, 270, 240, 78, '#F8FAFC', 'none', 8),
        svg_txt(368, 372, 'Túi canvas', 16, '#0F172A', 700),
        svg_txt(368, 396, '890.000đ', 13, '#334155', 600),
        svg_card(648, 250, 280, 180),
        svg_rect(668, 270, 240, 78, '#F8FAFC', 'none', 8),
        svg_txt(668, 372, 'Giày thể thao', 16, '#0F172A', 700),
        svg_txt(668, 396, '1.250.000đ', 13, '#334155', 600),
        svg_chip(40, 460, 'Phiên bản 1')
    ]));
}

function render_seed_home_v2() {
    return svg_wrap(implode('', [
        svg_chrome('DM Shop', ['Sản phẩm', 'Bộ sưu tập', 'Giỏ hàng'], 0),
        svg_rect(0, 64, 1000, 44, '#4F46E5'),
        svg_txt(40, 91, 'Giảm 20% trong tuần này — mã NEW20', 15, '#FFFFFF', 700),
        svg_card(40, 128, 440, 200),
        svg_txt(64, 176, 'Bộ sưu tập đã căn lại', 26, '#0F172A', 700),
        svg_txt(64, 208, 'Tiêu đề nằm trong cột trái.', 14, '#64748B', 400),
        svg_cta(64, 236, 150, 42, 'Mua ngay'),
        svg_card(520, 240, 200, 160),
        svg_txt(540, 276, 'Áo linen', 15, '#0F172A', 700),
        svg_txt(540, 300, '890.000đ', 13, '#334155', 600),
        svg_card(740, 240, 200, 160),
        svg_txt(760, 276, 'Túi canvas', 15, '#0F172A', 700),
        svg_txt(760, 300, '640.000đ', 13, '#334155', 600),
        svg_chip(40, 460, 'Phiên bản 2')
    ]));
}

function render_seed_pay_v1() {
    return svg_wrap(implode('', [
        svg_chrome('Thanh toán', ['Giỏ hàng', 'Thông tin', 'Thanh toán'], 2),
        svg_card(48, 88, 460, 280),
        svg_txt(72, 124, 'Tóm tắt đơn hàng', 18, '#0F172A', 700),
        svg_txt(72, 164, 'Áo linen × 1', 14, '#334155', 500),
        svg_txt(430, 164, '890.000đ', 14, '#334155', 600, 'end'),
        svg_line(72, 188, 484, 188),
        svg_txt(72, 220, 'Vận chuyển', 14, '#334155', 500),
        svg_txt(430, 220, '30.000đ', 14, '#334155', 600, 'end'),
        svg_txt(72, 260, 'Tổng', 16, '#0F172A', 700),
        svg_txt(430, 260, '920.000đ', 16, '#0F172A', 700, 'end'),
        svg_txt(72, 312, 'Mã giảm giá NEW20 đã áp dụng', 13, '#059669', 600),
        svg_card(540, 88, 420, 250),
        svg_txt(564, 124, 'Thẻ tín dụng', 16, '#0F172A', 700),
        svg_field(564, 148, 372, 'Số thẻ', '•••• 4242'),
        svg_field(564, 224, 176, 'Ngày', '12/28'),
        svg_field(760, 224, 176, 'CVC', '123'),
        svg_cta(740, 376, 180, 48, 'Thanh toán'),
        svg_chip(48, 460, 'Phiên bản 1')
    ]));
}

function render_seed_pay_v2() {
    return svg_wrap(implode('', [
        svg_chrome('Thanh toán', ['Giỏ hàng', 'Thông tin', 'Thanh toán'], 2),
        svg_txt(48, 96, 'Chọn phương thức', 20, '#0F172A', 700),
        svg_card(48, 116, 280, 150),
        svg_rect(48, 116, 6, 150, '#4F46E5', 'none', 0),
        svg_txt(72, 156, 'Ví điện tử', 16, '#0F172A', 700),
        svg_txt(72, 182, 'Đang được chọn', 13, '#4F46E5', 600),
        svg_card(348, 116, 280, 150),
        svg_txt(372, 156, 'Thẻ nội địa', 16, '#0F172A', 700),
        svg_txt(372, 182, 'Chưa chọn', 13, '#64748B', 500),
        svg_card(648, 116, 304, 150),
        svg_txt(672, 156, 'Chuyển khoản', 16, '#0F172A', 700),
        svg_txt(672, 182, 'Phí 0đ', 13, '#64748B', 500),
        svg_cta(48, 392, 200, 48, 'Thanh toán'),
        svg_txt(268, 420, 'Nút đã chuyển sang trái', 13, '#64748B', 500),
        svg_chip(860, 460, 'Phiên bản 2')
    ]));
}

function render_seed_dash_v1() {
    return svg_wrap(implode('', [
        svg_rect(0, 0, 1000, 500, '#F1F5F9'),
        svg_rect(0, 0, 180, 500, '#FFFFFF'),
        svg_line(180, 0, 180, 500),
        svg_rect(16, 16, 24, 24, '#4F46E5', 'none', 6),
        svg_txt(48, 34, 'Nội bộ', 14, '#0F172A', 700),
        svg_txt(24, 88, 'Tổng quan', 13, '#4F46E5', 700),
        svg_txt(24, 122, 'Đơn hàng', 13, '#64748B', 500),
        svg_txt(24, 156, 'Cài đặt', 13, '#64748B', 500),
        svg_card(200, 80, 180, 110),
        svg_txt(216, 108, 'Doanh thu', 13, '#64748B', 600),
        svg_txt(216, 146, '128', 28, '#0F172A', 700),
        svg_card(400, 80, 180, 110),
        svg_txt(416, 108, 'Đơn mới', 13, '#64748B', 600),
        svg_txt(416, 146, '46', 28, '#0F172A', 700),
        svg_card(520, 96, 440, 200),
        svg_txt(544, 132, 'Biểu đồ 7 ngày', 15, '#0F172A', 700),
        svg_line(560, 250, 620, 210, '#4F46E5'),
        svg_line(620, 210, 700, 230, '#4F46E5'),
        svg_line(700, 230, 790, 170, '#4F46E5'),
        svg_line(790, 170, 900, 190, '#4F46E5'),
        svg_chip(200, 460, 'Phiên bản 1')
    ]));
}

function render_seed_dash_v2() {
    return svg_wrap(implode('', [
        svg_rect(0, 0, 1000, 500, '#F8FAFC'),
        svg_rect(0, 0, 72, 500, '#FFFFFF'),
        svg_line(72, 0, 72, 500),
        svg_rect(24, 16, 24, 24, '#4F46E5', 'none', 6),
        svg_card(96, 24, 860, 56),
        svg_rect(96, 24, 6, 56, '#DC2626', 'none', 0),
        svg_txt(120, 48, 'Cảnh báo: đồng bộ kho chậm 12 phút', 15, '#0F172A', 700),
        svg_txt(120, 68, 'Cần có nút đóng và liên kết xem chi tiết', 12, '#64748B', 400),
        svg_txt(900, 56, '×', 22, '#64748B', 500, 'middle'),
        svg_card(96, 104, 200, 100),
        svg_txt(112, 136, 'Doanh thu', 13, '#64748B', 600),
        svg_txt(112, 172, '128 tr', 24, '#0F172A', 700),
        svg_card(312, 104, 200, 100),
        svg_txt(328, 136, 'Đơn mới', 13, '#64748B', 600),
        svg_txt(328, 172, '46', 24, '#0F172A', 700),
        svg_card(528, 104, 200, 100),
        svg_txt(544, 136, 'Hoàn', 13, '#64748B', 600),
        svg_txt(544, 172, '3', 24, '#0F172A', 700),
        svg_chip(96, 460, 'Phiên bản 2')
    ]));
}

function render_seed_orders_v1() {
    return svg_wrap(implode('', [
        svg_chrome('Đơn hàng', ['Tất cả', 'Đang xử lý', 'Hoàn tất'], 0),
        svg_cta(860, 16, 112, 28, 'Xuất', '#334155'),
        svg_rect(40, 96, 920, 48, '#FFFFFF', '#E2E8F0', 0),
        svg_txt(56, 126, 'Mã', 13, '#64748B', 700),
        svg_txt(180, 126, 'Khách', 13, '#64748B', 700),
        svg_txt(420, 126, 'Trạng thái', 13, '#64748B', 700),
        svg_txt(680, 126, 'Tổng', 13, '#64748B', 700),
        svg_rect(40, 144, 920, 52, '#FFFFFF', '#E2E8F0', 0),
        svg_txt(56, 176, 'DH-1042', 14, '#0F172A', 600),
        svg_txt(180, 176, 'Mai Phạm', 14, '#334155', 500),
        svg_txt(420, 176, 'Đang giao', 14, '#334155', 500),
        svg_txt(680, 176, '920.000đ', 14, '#334155', 600),
        svg_rect(40, 196, 920, 52, '#F8FAFC', '#E2E8F0', 0),
        svg_txt(56, 228, 'DH-1043', 14, '#0F172A', 600),
        svg_txt(180, 228, 'Hùng Lê', 14, '#334155', 500),
        svg_txt(420, 228, 'Chờ thanh toán', 14, '#334155', 500),
        svg_txt(680, 228, '450.000đ', 14, '#334155', 600),
        svg_chip(40, 460, 'Phiên bản 1')
    ]));
}

function render_seed_orders_v2() {
    return svg_wrap(implode('', [
        svg_chrome('Đơn hàng', ['Tất cả', 'Đang xử lý', 'Hoàn tất'], 0),
        svg_txt(700, 34, 'Bộ lọc', 13, '#334155', 600),
        svg_rect(40, 80, 140, 32, '#FFFFFF', '#CBD5E1', 8),
        svg_txt(52, 101, 'Trạng thái', 13, '#64748B', 500),
        svg_rect(192, 80, 140, 32, '#FFFFFF', '#CBD5E1', 8),
        svg_txt(204, 101, 'Khoản tiền', 13, '#64748B', 500),
        svg_rect(40, 132, 920, 44, '#EEF2FF', '#C7D2FE', 0),
        svg_txt(56, 160, 'Mã', 13, '#4338CA', 700),
        svg_txt(180, 160, 'Khách', 13, '#4338CA', 700),
        svg_txt(420, 160, 'Trạng thái', 13, '#4338CA', 700),
        svg_rect(40, 176, 920, 88, '#FFFFFF', '#4F46E5', 0),
        svg_txt(56, 214, 'DH-1048', 14, '#0F172A', 700),
        svg_txt(180, 214, 'An Nguyễn', 14, '#334155', 500),
        svg_txt(420, 214, 'Đã chọn — thiếu chú thích', 14, '#4F46E5', 700),
        svg_txt(56, 240, 'Hàng đang chọn chưa giải thích trạng thái sau khi mở lại.', 13, '#64748B', 400),
        svg_chip(860, 460, 'Phiên bản 2')
    ]));
}

function render_seed_settings_v1() {
    return svg_wrap(implode('', [
        svg_chrome('Cài đặt', ['Hồ sơ', 'Bảo mật', 'Thông báo'], 2),
        svg_card(180, 90, 640, 320),
        svg_txt(208, 130, 'Thông báo', 22, '#0F172A', 700),
        svg_txt(208, 176, 'Email đơn mới', 15, '#0F172A', 600),
        svg_rect(720, 156, 44, 24, '#4F46E5', 'none', 12),
        svg_rect(742, 160, 16, 16, '#FFFFFF', 'none', 8),
        svg_txt(208, 230, 'Báo cáo tuần', 15, '#0F172A', 600),
        svg_rect(720, 210, 44, 24, '#E2E8F0', 'none', 12),
        svg_rect(724, 214, 16, 16, '#FFFFFF', 'none', 8),
        svg_txt(208, 284, 'Cảnh báo kho', 15, '#0F172A', 600),
        svg_rect(720, 264, 44, 24, '#4F46E5', 'none', 12),
        svg_rect(742, 268, 16, 16, '#FFFFFF', 'none', 8),
        svg_chip(180, 430, 'Phiên bản 1')
    ]));
}

function render_seed_settings_v2() {
    return svg_wrap(implode('', [
        svg_chrome('Cài đặt', ['Hồ sơ', 'Bảo mật', 'Thông báo'], 0),
        svg_card(40, 80, 440, 300),
        svg_txt(64, 116, 'Hồ sơ cửa hàng', 18, '#0F172A', 700),
        svg_field(64, 140, 392, 'Tên hiển thị', 'DM Shop'),
        svg_field(64, 220, 392, 'Múi giờ', 'Asia/Ho_Chi_Minh'),
        svg_card(520, 80, 440, 220),
        svg_txt(544, 116, 'Bảo mật', 18, '#0F172A', 700),
        svg_txt(544, 156, 'Xác thực hai lớp đang tắt', 14, '#334155', 500),
        svg_cta(544, 188, 160, 40, 'Bật 2FA'),
        svg_txt(544, 260, 'Nút lưu đã tách khỏi nhóm thông báo.', 13, '#64748B', 400),
        svg_chip(40, 460, 'Phiên bản 2')
    ]));
}

function render_seed_svg($key) {
    switch ($key) {
        case 'seed:signup-v1': return render_seed_signup_v1();
        case 'seed:signup-v2': return render_seed_signup_v2();
        case 'seed:home-v1': return render_seed_home_v1();
        case 'seed:home-v2': return render_seed_home_v2();
        case 'seed:pay-v1': return render_seed_pay_v1();
        case 'seed:pay-v2': return render_seed_pay_v2();
        case 'seed:dash-v1': return render_seed_dash_v1();
        case 'seed:dash-v2': return render_seed_dash_v2();
        case 'seed:orders-v1': return render_seed_orders_v1();
        case 'seed:orders-v2': return render_seed_orders_v2();
        case 'seed:settings-v1': return render_seed_settings_v1();
        case 'seed:settings-v2': return render_seed_settings_v2();
        default:
            return svg_wrap(svg_txt(40, 80, 'Không có ảnh mẫu', 18, '#0F172A', 700));
    }
}
