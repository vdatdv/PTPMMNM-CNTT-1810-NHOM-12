/**
 * Dữ liệu mẫu DesignMark. Ảnh giao diện được vẽ bằng SVG nội bộ, không tải tài nguyên ngoài.
 * Điểm (750, 150) của màn hình Đăng ký v1 phải nằm trên nút "Đăng ký".
 * Bản v2 chuyển nút đi chỗ khác và không kế thừa annotation.
 */

export const SCHEMA = 1;

export const HOTSPOTS = {
  signupV1Button: { x: 668, y: 124, w: 164, h: 52 },
  signupV2Button: { x: 148, y: 392, w: 200, h: 52 },
  samplePoint: { x: 750, y: 150 }
};

export const USERS = [
  {
    id: 'user-an',
    username: 'an',
    name: 'An Nguyễn',
    role: 'manager',
    title: 'Quản lý thiết kế',
    color: '#4F46E5'
  },
  {
    id: 'user-binh',
    username: 'binh',
    name: 'Bình Trần',
    role: 'reviewer',
    title: 'Người góp ý',
    color: '#0F766E'
  },
  {
    id: 'user-chi',
    username: 'chi',
    name: 'Chi Lê',
    role: 'viewer',
    title: 'Bên liên quan',
    color: '#B45309'
  }
];

export const ROLE_LABELS = {
  manager: 'Quản lý',
  reviewer: 'Góp ý',
  viewer: 'Chỉ xem'
};

const FONT = 'Inter, Segoe UI, sans-serif';

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function txt(x, y, value, size = 14, fill = '#0F172A', weight = 500, anchor = 'start') {
  return `<text x="${x}" y="${y}" fill="${fill}" font-size="${size}" font-weight="${weight}" font-family="${FONT}" text-anchor="${anchor}">${esc(value)}</text>`;
}

function rect(x, y, w, h, fill, stroke = 'none', radius = 0) {
  const strokeAttr = stroke && stroke !== 'none' ? ` stroke="${stroke}"` : '';
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}"${strokeAttr}/>`;
}

function line(x1, y1, x2, y2, stroke = '#E2E8F0') {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}"/>`;
}

function wrap(body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="500" viewBox="0 0 1000 500">${body}</svg>`;
}

function chrome(brand, links, activeIndex = 0) {
  const nav = links.map((label, index) => txt(
    188 + index * 108,
    34,
    label,
    13,
    index === activeIndex ? '#4F46E5' : '#64748B',
    index === activeIndex ? 700 : 500
  )).join('');
  return [
    rect(0, 0, 1000, 500, '#F1F5F9'),
    rect(0, 0, 1000, 56, '#FFFFFF'),
    line(0, 56, 1000, 56),
    rect(16, 16, 24, 24, '#4F46E5', 'none', 6),
    txt(28, 33, 'D', 12, '#FFFFFF', 700, 'middle'),
    txt(48, 34, brand, 15, '#0F172A', 700),
    nav
  ].join('');
}

function field(x, y, w, label, placeholder) {
  return [
    txt(x, y, label, 13, '#334155', 600),
    rect(x, y + 8, w, 36, '#FFFFFF', '#CBD5E1', 8),
    txt(x + 12, y + 31, placeholder, 13, '#94A3B8', 400)
  ].join('');
}

function cta(x, y, w, h, label, fill = '#4F46E5') {
  return [
    rect(x, y, w, h, fill, 'none', 8),
    txt(x + w / 2, y + h / 2 + 5, label, 15, '#FFFFFF', 700, 'middle')
  ].join('');
}

function chip(x, y, label) {
  const width = Math.max(72, label.length * 7 + 20);
  return [
    rect(x, y, width, 26, '#EEF2FF', 'none', 13),
    txt(x + width / 2, y + 17, label, 12, '#4338CA', 700, 'middle')
  ].join('');
}

function card(x, y, w, h) {
  return rect(x, y, w, h, '#FFFFFF', '#E2E8F0', 12);
}

function signupV1() {
  const button = HOTSPOTS.signupV1Button;
  return wrap([
    chrome('DM Shop', ['Sản phẩm', 'Giải pháp', 'Bảng giá'], 1),
    txt(860, 34, 'Đăng nhập', 13, '#334155', 600),
    card(40, 80, 580, 370),
    txt(64, 118, 'Tạo tài khoản', 22, '#0F172A', 700),
    txt(64, 144, 'Nhập thông tin để bắt đầu dùng thử 14 ngày.', 13, '#64748B', 400),
    field(64, 172, 250, 'Họ và tên', 'Nguyễn An'),
    field(334, 172, 250, 'Email công việc', 'an@congty.vn'),
    field(64, 252, 250, 'Mật khẩu', '••••••••'),
    field(334, 252, 250, 'Xác nhận mật khẩu', '••••••••'),
    rect(64, 340, 18, 18, '#FFFFFF', '#CBD5E1', 4),
    txt(92, 354, 'Tôi đồng ý với điều khoản sử dụng', 13, '#334155', 500),
    card(640, 80, 320, 250),
    txt(664, 112, 'Hoàn tất đăng ký', 14, '#0F172A', 700),
    cta(button.x, button.y, button.w, button.h, 'Đăng ký'),
    txt(664, 204, 'Nút chính nằm ở thẻ bên phải.', 12, '#64748B', 400),
    txt(664, 226, 'Góp ý trên nút chỉ thuộc phiên bản này.', 12, '#64748B', 400),
    rect(664, 248, 272, 58, '#F8FAFC', '#E2E8F0', 8),
    txt(680, 274, 'Đã có tài khoản? Đăng nhập', 13, '#334155', 500),
    txt(680, 294, 'Hỗ trợ: hello@dmshop.vn', 12, '#64748B', 400),
    chip(40, 460, 'Phiên bản 1')
  ].join(''));
}

function signupV2() {
  const button = HOTSPOTS.signupV2Button;
  return wrap([
    chrome('DM Shop', ['Trang chủ', 'Đăng ký', 'Hỗ trợ'], 1),
    rect(0, 64, 1000, 40, '#EEF2FF'),
    txt(40, 89, 'Phiên bản 2 — bố cục một cột, nút Đăng ký đã chuyển xuống cuối form', 14, '#4338CA', 600),
    card(250, 124, 500, 250),
    txt(274, 160, 'Đăng ký tài khoản', 22, '#0F172A', 700),
    field(274, 184, 452, 'Email', 'ban@congty.vn'),
    field(274, 260, 452, 'Mật khẩu', 'Tối thiểu 8 ký tự'),
    card(640, 124, 280, 78),
    txt(656, 154, 'Nút Đăng ký không còn ở đây', 13, '#334155', 700),
    txt(656, 176, 'Vị trí cũ của phiên bản 1', 12, '#64748B', 400),
    cta(button.x, button.y, button.w, button.h, 'Đăng ký'),
    txt(364, 424, 'Tạo tài khoản', 13, '#64748B', 500),
    chip(860, 460, 'Phiên bản 2')
  ].join(''));
}

function homeV1() {
  return wrap([
    chrome('DM Shop', ['Sản phẩm', 'Bộ sưu tập', 'Giỏ hàng'], 1),
    txt(860, 34, 'Tài khoản', 13, '#334155', 600),
    card(40, 80, 920, 150),
    txt(64, 124, 'Mùa mới', 13, '#4F46E5', 700),
    txt(360, 172, 'Bộ sưu tập mùa mới', 28, '#0F172A', 700),
    txt(64, 200, 'Tiêu đề đang lệch khỏi cột nội dung bên trái.', 14, '#64748B', 400),
    card(48, 250, 280, 180),
    rect(68, 270, 240, 78, '#EEF2FF', 'none', 8),
    txt(68, 372, 'Áo linen', 16, '#0F172A', 700),
    txt(68, 396, 'Thiếu giá và nút xem', 13, '#64748B', 400),
    card(348, 250, 280, 180),
    rect(368, 270, 240, 78, '#F8FAFC', 'none', 8),
    txt(368, 372, 'Túi canvas', 16, '#0F172A', 700),
    txt(368, 396, '890.000đ', 13, '#334155', 600),
    card(648, 250, 280, 180),
    rect(668, 270, 240, 78, '#F8FAFC', 'none', 8),
    txt(668, 372, 'Giày thể thao', 16, '#0F172A', 700),
    txt(668, 396, '1.250.000đ', 13, '#334155', 600),
    chip(40, 460, 'Phiên bản 1')
  ].join(''));
}

function homeV2() {
  return wrap([
    chrome('DM Shop', ['Sản phẩm', 'Bộ sưu tập', 'Giỏ hàng'], 0),
    rect(0, 64, 1000, 44, '#4F46E5'),
    txt(40, 91, 'Giảm 20% trong tuần này — mã NEW20', 15, '#FFFFFF', 700),
    card(40, 128, 440, 200),
    txt(64, 176, 'Bộ sưu tập đã căn lại', 26, '#0F172A', 700),
    txt(64, 208, 'Tiêu đề nằm trong cột trái.', 14, '#64748B', 400),
    cta(64, 236, 150, 42, 'Mua ngay'),
    card(520, 240, 200, 160),
    txt(540, 276, 'Áo linen', 15, '#0F172A', 700),
    txt(540, 300, '890.000đ', 13, '#334155', 600),
    card(740, 240, 200, 160),
    txt(760, 276, 'Túi canvas', 15, '#0F172A', 700),
    txt(760, 300, '640.000đ', 13, '#334155', 600),
    chip(40, 460, 'Phiên bản 2')
  ].join(''));
}

function payV1() {
  return wrap([
    chrome('Thanh toán', ['Giỏ hàng', 'Thông tin', 'Thanh toán'], 2),
    card(48, 88, 460, 280),
    txt(72, 124, 'Tóm tắt đơn hàng', 18, '#0F172A', 700),
    txt(72, 164, 'Áo linen × 1', 14, '#334155', 500),
    txt(430, 164, '890.000đ', 14, '#334155', 600, 'end'),
    line(72, 188, 484, 188),
    txt(72, 220, 'Vận chuyển', 14, '#334155', 500),
    txt(430, 220, '30.000đ', 14, '#334155', 600, 'end'),
    txt(72, 260, 'Tổng', 16, '#0F172A', 700),
    txt(430, 260, '920.000đ', 16, '#0F172A', 700, 'end'),
    txt(72, 312, 'Mã giảm giá NEW20 đã áp dụng', 13, '#059669', 600),
    card(540, 88, 420, 250),
    txt(564, 124, 'Thẻ tín dụng', 16, '#0F172A', 700),
    field(564, 148, 372, 'Số thẻ', '•••• 4242'),
    field(564, 224, 176, 'Ngày', '12/28'),
    field(760, 224, 176, 'CVC', '123'),
    cta(740, 376, 180, 48, 'Thanh toán'),
    chip(48, 460, 'Phiên bản 1')
  ].join(''));
}

function payV2() {
  return wrap([
    chrome('Thanh toán', ['Giỏ hàng', 'Thông tin', 'Thanh toán'], 2),
    txt(48, 96, 'Chọn phương thức', 20, '#0F172A', 700),
    card(48, 116, 280, 150),
    rect(48, 116, 6, 150, '#4F46E5', 'none', 0),
    txt(72, 156, 'Ví điện tử', 16, '#0F172A', 700),
    txt(72, 182, 'Đang được chọn', 13, '#4F46E5', 600),
    card(348, 116, 280, 150),
    txt(372, 156, 'Thẻ nội địa', 16, '#0F172A', 700),
    txt(372, 182, 'Chưa chọn', 13, '#64748B', 500),
    card(648, 116, 304, 150),
    txt(672, 156, 'Chuyển khoản', 16, '#0F172A', 700),
    txt(672, 182, 'Phí 0đ', 13, '#64748B', 500),
    cta(48, 392, 200, 48, 'Thanh toán'),
    txt(268, 420, 'Nút đã chuyển sang trái', 13, '#64748B', 500),
    chip(860, 460, 'Phiên bản 2')
  ].join(''));
}

function dashV1() {
  return wrap([
    rect(0, 0, 1000, 500, '#F1F5F9'),
    rect(0, 0, 180, 500, '#FFFFFF'),
    line(180, 0, 180, 500),
    rect(16, 16, 24, 24, '#4F46E5', 'none', 6),
    txt(48, 34, 'Nội bộ', 14, '#0F172A', 700),
    txt(24, 88, 'Tổng quan', 13, '#4F46E5', 700),
    txt(24, 122, 'Đơn hàng', 13, '#64748B', 500),
    txt(24, 156, 'Cài đặt', 13, '#64748B', 500),
    card(200, 80, 180, 110),
    txt(216, 108, 'Doanh thu', 13, '#64748B', 600),
    txt(216, 146, '128', 28, '#0F172A', 700),
    card(400, 80, 180, 110),
    txt(416, 108, 'Đơn mới', 13, '#64748B', 600),
    txt(416, 146, '46', 28, '#0F172A', 700),
    card(520, 96, 440, 200),
    txt(544, 132, 'Biểu đồ 7 ngày', 15, '#0F172A', 700),
    line(560, 250, 620, 210, '#4F46E5'),
    line(620, 210, 700, 230, '#4F46E5'),
    line(700, 230, 790, 170, '#4F46E5'),
    line(790, 170, 900, 190, '#4F46E5'),
    chip(200, 460, 'Phiên bản 1')
  ].join(''));
}

function dashV2() {
  return wrap([
    rect(0, 0, 1000, 500, '#F8FAFC'),
    rect(0, 0, 72, 500, '#FFFFFF'),
    line(72, 0, 72, 500),
    rect(24, 16, 24, 24, '#4F46E5', 'none', 6),
    card(96, 24, 860, 56),
    rect(96, 24, 6, 56, '#DC2626', 'none', 0),
    txt(120, 48, 'Cảnh báo: đồng bộ kho chậm 12 phút', 15, '#0F172A', 700),
    txt(120, 68, 'Cần có nút đóng và liên kết xem chi tiết', 12, '#64748B', 400),
    txt(900, 56, '×', 22, '#64748B', 500, 'middle'),
    card(96, 104, 200, 100),
    txt(112, 136, 'Doanh thu', 13, '#64748B', 600),
    txt(112, 172, '128 tr', 24, '#0F172A', 700),
    card(312, 104, 200, 100),
    txt(328, 136, 'Đơn mới', 13, '#64748B', 600),
    txt(328, 172, '46', 24, '#0F172A', 700),
    card(528, 104, 200, 100),
    txt(544, 136, 'Hoàn', 13, '#64748B', 600),
    txt(544, 172, '3', 24, '#0F172A', 700),
    chip(96, 460, 'Phiên bản 2')
  ].join(''));
}

function ordersV1() {
  return wrap([
    chrome('Đơn hàng', ['Tất cả', 'Đang xử lý', 'Hoàn tất'], 0),
    cta(860, 16, 112, 28, 'Xuất', '#334155'),
    rect(40, 96, 920, 48, '#FFFFFF', '#E2E8F0', 0),
    txt(56, 126, 'Mã', 13, '#64748B', 700),
    txt(180, 126, 'Khách', 13, '#64748B', 700),
    txt(420, 126, 'Trạng thái', 13, '#64748B', 700),
    txt(680, 126, 'Tổng', 13, '#64748B', 700),
    rect(40, 144, 920, 52, '#FFFFFF', '#E2E8F0', 0),
    txt(56, 176, 'DH-1042', 14, '#0F172A', 600),
    txt(180, 176, 'Mai Phạm', 14, '#334155', 500),
    txt(420, 176, 'Đang giao', 14, '#334155', 500),
    txt(680, 176, '920.000đ', 14, '#334155', 600),
    rect(40, 196, 920, 52, '#F8FAFC', '#E2E8F0', 0),
    txt(56, 228, 'DH-1043', 14, '#0F172A', 600),
    txt(180, 228, 'Hùng Lê', 14, '#334155', 500),
    txt(420, 228, 'Chờ thanh toán', 14, '#334155', 500),
    txt(680, 228, '450.000đ', 14, '#334155', 600),
    chip(40, 460, 'Phiên bản 1')
  ].join(''));
}

function ordersV2() {
  return wrap([
    chrome('Đơn hàng', ['Tất cả', 'Đang xử lý', 'Hoàn tất'], 0),
    txt(700, 34, 'Bộ lọc', 13, '#334155', 600),
    rect(40, 80, 140, 32, '#FFFFFF', '#CBD5E1', 8),
    txt(52, 101, 'Trạng thái', 13, '#64748B', 500),
    rect(192, 80, 140, 32, '#FFFFFF', '#CBD5E1', 8),
    txt(204, 101, 'Khoản tiền', 13, '#64748B', 500),
    rect(40, 132, 920, 44, '#EEF2FF', '#C7D2FE', 0),
    txt(56, 160, 'Mã', 13, '#4338CA', 700),
    txt(180, 160, 'Khách', 13, '#4338CA', 700),
    txt(420, 160, 'Trạng thái', 13, '#4338CA', 700),
    rect(40, 176, 920, 88, '#FFFFFF', '#4F46E5', 0),
    txt(56, 214, 'DH-1048', 14, '#0F172A', 700),
    txt(180, 214, 'An Nguyễn', 14, '#334155', 500),
    txt(420, 214, 'Đã chọn — thiếu chú thích', 14, '#4F46E5', 700),
    txt(56, 240, 'Hàng đang chọn chưa giải thích trạng thái sau khi mở lại.', 13, '#64748B', 400),
    chip(860, 460, 'Phiên bản 2')
  ].join(''));
}

function settingsV1() {
  return wrap([
    chrome('Cài đặt', ['Hồ sơ', 'Bảo mật', 'Thông báo'], 2),
    card(180, 90, 640, 320),
    txt(208, 130, 'Thông báo', 22, '#0F172A', 700),
    txt(208, 176, 'Email đơn mới', 15, '#0F172A', 600),
    rect(720, 156, 44, 24, '#4F46E5', 'none', 12),
    rect(742, 160, 16, 16, '#FFFFFF', 'none', 8),
    txt(208, 230, 'Báo cáo tuần', 15, '#0F172A', 600),
    rect(720, 210, 44, 24, '#E2E8F0', 'none', 12),
    rect(724, 214, 16, 16, '#FFFFFF', 'none', 8),
    txt(208, 284, 'Cảnh báo kho', 15, '#0F172A', 600),
    rect(720, 264, 44, 24, '#4F46E5', 'none', 12),
    rect(742, 268, 16, 16, '#FFFFFF', 'none', 8),
    chip(180, 430, 'Phiên bản 1')
  ].join(''));
}

function settingsV2() {
  return wrap([
    chrome('Cài đặt', ['Hồ sơ', 'Bảo mật', 'Thông báo'], 0),
    card(40, 80, 440, 300),
    txt(64, 116, 'Hồ sơ cửa hàng', 18, '#0F172A', 700),
    field(64, 140, 392, 'Tên hiển thị', 'DM Shop'),
    field(64, 220, 392, 'Múi giờ', 'Asia/Ho_Chi_Minh'),
    card(520, 80, 440, 220),
    txt(544, 116, 'Bảo mật', 18, '#0F172A', 700),
    txt(544, 156, 'Xác thực hai lớp đang tắt', 14, '#334155', 500),
    cta(544, 188, 160, 40, 'Bật 2FA'),
    txt(544, 260, 'Nút lưu đã tách khỏi nhóm thông báo.', 13, '#64748B', 400),
    chip(40, 460, 'Phiên bản 2')
  ].join(''));
}

const RENDERERS = {
  'seed:signup-v1': signupV1,
  'seed:signup-v2': signupV2,
  'seed:home-v1': homeV1,
  'seed:home-v2': homeV2,
  'seed:pay-v1': payV1,
  'seed:pay-v2': payV2,
  'seed:dash-v1': dashV1,
  'seed:dash-v2': dashV2,
  'seed:orders-v1': ordersV1,
  'seed:orders-v2': ordersV2,
  'seed:settings-v1': settingsV1,
  'seed:settings-v2': settingsV2
};

export function renderSeedSvg(key) {
  const render = RENDERERS[key];
  if (!render) {
    return wrap(txt(40, 80, 'Không có ảnh mẫu', 18, '#0F172A', 700));
  }
  return render();
}

export function svgToDataUri(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function seedImageSrc(key) {
  return svgToDataUri(renderSeedSvg(key));
}

function pointInside(point, box) {
  return point.x >= box.x && point.x <= box.x + box.w && point.y >= box.y && point.y <= box.y + box.h;
}

if (!pointInside(HOTSPOTS.samplePoint, HOTSPOTS.signupV1Button)) {
  throw new Error('Điểm mẫu phải nằm trên nút Đăng ký của phiên bản 1.');
}
if (pointInside(HOTSPOTS.samplePoint, HOTSPOTS.signupV2Button)) {
  throw new Error('Nút Đăng ký phiên bản 2 không được giữ vị trí phiên bản 1.');
}

function ann(partial) {
  const createdAt = partial.createdAt;
  return {
    type: 'point',
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    originalWidth: 1000,
    originalHeight: 500,
    status: 'open',
    revision: 1,
    checkNote: '',
    replies: [],
    updatedAt: createdAt,
    statusHistory: [
      {
        id: `${partial.id}-open`,
        annotationId: partial.id,
        status: 'open',
        userId: partial.authorId,
        at: createdAt,
        note: 'Tạo góp ý'
      }
    ],
    ...partial
  };
}

function buildAnnotations() {
  const sample = HOTSPOTS.samplePoint;
  return [
    ann({
      id: 'ann-01',
      projectId: 'proj-shop',
      screenId: 'scr-signup',
      imageVersionId: 'ver-signup-1',
      type: 'point',
      x: sample.x,
      y: sample.y,
      authorId: 'user-binh',
      body: 'Nút Đăng ký cần tương phản cao hơn so với nền thẻ bên phải.',
      createdAt: '2026-03-02T02:15:00.000Z',
      replies: [
        {
          id: 'rep-01',
          annotationId: 'ann-01',
          authorId: 'user-an',
          body: 'Mình sẽ tăng độ đậm của nút ở bản sau. Góp ý này chỉ thuộc v1, không chuyển sang v2.',
          createdAt: '2026-03-02T04:00:00.000Z'
        }
      ]
    }),
    ann({
      id: 'ann-02',
      projectId: 'proj-shop',
      screenId: 'scr-signup',
      imageVersionId: 'ver-signup-1',
      type: 'rect',
      x: 64,
      y: 160,
      w: 520,
      h: 220,
      authorId: 'user-an',
      body: 'Nhóm ô nhập bên trái còn thiếu thông báo lỗi ngay dưới ô mật khẩu.',
      createdAt: '2026-03-02T02:40:00.000Z'
    }),
    ann({
      id: 'ann-03',
      projectId: 'proj-shop',
      screenId: 'scr-signup',
      imageVersionId: 'ver-signup-1',
      type: 'point',
      x: 120,
      y: 34,
      authorId: 'user-chi',
      body: 'Tên thương hiệu trên thanh đầu trang hơi khó nhận ra khi nhìn nhanh.',
      status: 'resolved',
      revision: 2,
      createdAt: '2026-03-02T03:10:00.000Z',
      updatedAt: '2026-03-03T01:20:00.000Z',
      replies: [
        {
          id: 'rep-03',
          annotationId: 'ann-03',
          authorId: 'user-binh',
          body: 'Có thể tăng cỡ chữ logo, không cần đổi vị trí điều hướng.',
          createdAt: '2026-03-02T06:00:00.000Z'
        }
      ],
      statusHistory: [
        { id: 'ann-03-open', annotationId: 'ann-03', status: 'open', userId: 'user-chi', at: '2026-03-02T03:10:00.000Z', note: 'Tạo góp ý' },
        { id: 'ann-03-resolved', annotationId: 'ann-03', status: 'resolved', userId: 'user-an', at: '2026-03-03T01:20:00.000Z', note: 'Đã xử lý' }
      ]
    }),
    ann({
      id: 'ann-04',
      projectId: 'proj-shop',
      screenId: 'scr-signup',
      imageVersionId: 'ver-signup-1',
      type: 'rect',
      x: 640,
      y: 210,
      w: 280,
      h: 100,
      authorId: 'user-binh',
      body: 'Khối ghi chú dưới nút Đăng ký đang tách khỏi hành động chính.',
      createdAt: '2026-03-02T05:05:00.000Z'
    }),
    ann({
      id: 'ann-05',
      projectId: 'proj-shop',
      screenId: 'scr-signup',
      imageVersionId: 'ver-signup-2',
      type: 'point',
      x: 248,
      y: 418,
      authorId: 'user-an',
      body: 'Nút Đăng ký đã chuyển xuống cuối form. Cần kiểm tra khoảng cách với mép dưới.',
      createdAt: '2026-03-08T02:00:00.000Z'
    }),
    ann({
      id: 'ann-06',
      projectId: 'proj-shop',
      screenId: 'scr-signup',
      imageVersionId: 'ver-signup-2',
      type: 'rect',
      x: 250,
      y: 124,
      w: 500,
      h: 250,
      authorId: 'user-binh',
      body: 'Nhóm trường thông tin ở bố cục một cột đã gọn hơn, có thể chốt hướng này.',
      status: 'resolved',
      revision: 2,
      checkNote: 'Đã kiểm tra bố cục một cột trên khung 1000×500.',
      createdAt: '2026-03-08T02:30:00.000Z',
      updatedAt: '2026-03-08T07:00:00.000Z',
      replies: [
        {
          id: 'rep-06',
          annotationId: 'ann-06',
          authorId: 'user-an',
          body: 'Đã ghi nhận. Giữ form một cột cho bản bàn giao.',
          createdAt: '2026-03-08T06:10:00.000Z'
        }
      ],
      statusHistory: [
        { id: 'ann-06-open', annotationId: 'ann-06', status: 'open', userId: 'user-binh', at: '2026-03-08T02:30:00.000Z', note: 'Tạo góp ý' },
        { id: 'ann-06-resolved', annotationId: 'ann-06', status: 'resolved', userId: 'user-an', at: '2026-03-08T07:00:00.000Z', note: 'Đã xử lý' }
      ]
    }),
    ann({
      id: 'ann-07',
      projectId: 'proj-shop',
      screenId: 'scr-home',
      imageVersionId: 'ver-home-1',
      type: 'point',
      x: 500,
      y: 168,
      authorId: 'user-binh',
      body: 'Tiêu đề hero đang lệch khỏi trục nội dung chính bên trái.',
      createdAt: '2026-03-04T01:15:00.000Z'
    }),
    ann({
      id: 'ann-08',
      projectId: 'proj-shop',
      screenId: 'scr-home',
      imageVersionId: 'ver-home-1',
      type: 'rect',
      x: 48,
      y: 250,
      w: 280,
      h: 180,
      authorId: 'user-an',
      body: 'Thẻ sản phẩm đầu tiên thiếu giá và nút xem chi tiết.',
      createdAt: '2026-03-04T01:40:00.000Z'
    }),
    ann({
      id: 'ann-09',
      projectId: 'proj-shop',
      screenId: 'scr-home',
      imageVersionId: 'ver-home-1',
      type: 'point',
      x: 900,
      y: 34,
      authorId: 'user-an',
      body: 'Mục tài khoản trên thanh điều hướng chưa có trạng thái đang đăng nhập.',
      status: 'resolved',
      revision: 2,
      createdAt: '2026-03-04T03:00:00.000Z',
      updatedAt: '2026-03-05T02:00:00.000Z',
      statusHistory: [
        { id: 'ann-09-open', annotationId: 'ann-09', status: 'open', userId: 'user-an', at: '2026-03-04T03:00:00.000Z', note: 'Tạo góp ý' },
        { id: 'ann-09-resolved', annotationId: 'ann-09', status: 'resolved', userId: 'user-binh', at: '2026-03-05T02:00:00.000Z', note: 'Đã xử lý' }
      ]
    }),
    ann({
      id: 'ann-10',
      projectId: 'proj-shop',
      screenId: 'scr-home',
      imageVersionId: 'ver-home-2',
      type: 'point',
      x: 180,
      y: 86,
      authorId: 'user-chi',
      body: 'Banner khuyến mãi chiếm nhiều chiều cao, cân nhắc thu gọn trên màn hình nhỏ.',
      createdAt: '2026-03-11T02:20:00.000Z'
    }),
    ann({
      id: 'ann-11',
      projectId: 'proj-shop',
      screenId: 'scr-home',
      imageVersionId: 'ver-home-2',
      type: 'rect',
      x: 520,
      y: 240,
      w: 420,
      h: 160,
      authorId: 'user-binh',
      body: 'Hai thẻ bên phải còn khoảng trống không đều so với khối hero.',
      createdAt: '2026-03-11T03:05:00.000Z',
      replies: [
        {
          id: 'rep-11',
          annotationId: 'ann-11',
          authorId: 'user-an',
          body: 'Mình sẽ chỉnh lưới ở vòng thiết kế sau, không sửa trực tiếp ảnh này.',
          createdAt: '2026-03-11T05:40:00.000Z'
        }
      ]
    }),
    ann({
      id: 'ann-12',
      projectId: 'proj-shop',
      screenId: 'scr-pay',
      imageVersionId: 'ver-pay-1',
      type: 'point',
      x: 820,
      y: 400,
      authorId: 'user-an',
      body: 'Nút Thanh toán nằm sát mép, dễ bấm nhầm khi cuộn trên màn hình nhỏ.',
      createdAt: '2026-03-06T08:00:00.000Z'
    }),
    ann({
      id: 'ann-13',
      projectId: 'proj-shop',
      screenId: 'scr-pay',
      imageVersionId: 'ver-pay-1',
      type: 'rect',
      x: 48,
      y: 88,
      w: 460,
      h: 280,
      authorId: 'user-binh',
      body: 'Tóm tắt đơn hàng đã rõ ràng, có thể giữ bố cục này.',
      status: 'resolved',
      revision: 2,
      checkNote: 'Giữ nguyên khối tóm tắt đơn.',
      createdAt: '2026-03-06T08:30:00.000Z',
      updatedAt: '2026-03-06T10:00:00.000Z',
      statusHistory: [
        { id: 'ann-13-open', annotationId: 'ann-13', status: 'open', userId: 'user-binh', at: '2026-03-06T08:30:00.000Z', note: 'Tạo góp ý' },
        { id: 'ann-13-resolved', annotationId: 'ann-13', status: 'resolved', userId: 'user-an', at: '2026-03-06T10:00:00.000Z', note: 'Đã xử lý' }
      ]
    }),
    ann({
      id: 'ann-14',
      projectId: 'proj-shop',
      screenId: 'scr-pay',
      imageVersionId: 'ver-pay-2',
      type: 'point',
      x: 160,
      y: 170,
      authorId: 'user-binh',
      body: 'Phương thức ví điện tử cần trạng thái được chọn rõ hơn cả về chữ lẫn viền.',
      createdAt: '2026-03-12T01:10:00.000Z',
      replies: [
        {
          id: 'rep-14',
          annotationId: 'ann-14',
          authorId: 'user-an',
          body: 'Sẽ thêm nhãn Đang được chọn và viền indigo.',
          createdAt: '2026-03-12T02:00:00.000Z'
        }
      ]
    }),
    ann({
      id: 'ann-15',
      projectId: 'proj-ops',
      screenId: 'scr-dash',
      imageVersionId: 'ver-dash-1',
      type: 'point',
      x: 250,
      y: 140,
      authorId: 'user-an',
      body: 'Số liệu doanh thu chưa có đơn vị tiền tệ nên dễ hiểu nhầm.',
      createdAt: '2026-03-07T01:00:00.000Z'
    }),
    ann({
      id: 'ann-16',
      projectId: 'proj-ops',
      screenId: 'scr-dash',
      imageVersionId: 'ver-dash-1',
      type: 'rect',
      x: 520,
      y: 96,
      w: 440,
      h: 200,
      authorId: 'user-chi',
      body: 'Khối biểu đồ đã đủ khoảng trắng, có thể giữ tỷ lệ này.',
      status: 'resolved',
      revision: 2,
      createdAt: '2026-03-07T01:30:00.000Z',
      updatedAt: '2026-03-07T04:15:00.000Z',
      statusHistory: [
        { id: 'ann-16-open', annotationId: 'ann-16', status: 'open', userId: 'user-chi', at: '2026-03-07T01:30:00.000Z', note: 'Tạo góp ý' },
        { id: 'ann-16-resolved', annotationId: 'ann-16', status: 'resolved', userId: 'user-an', at: '2026-03-07T04:15:00.000Z', note: 'Đã xử lý' }
      ]
    }),
    ann({
      id: 'ann-17',
      projectId: 'proj-ops',
      screenId: 'scr-dash',
      imageVersionId: 'ver-dash-2',
      type: 'point',
      x: 900,
      y: 52,
      authorId: 'user-binh',
      body: 'Cảnh báo hệ thống nên có nút đóng và không chỉ dựa vào ký hiệu nhân.',
      createdAt: '2026-03-15T03:20:00.000Z'
    }),
    ann({
      id: 'ann-18',
      projectId: 'proj-ops',
      screenId: 'scr-orders',
      imageVersionId: 'ver-orders-1',
      type: 'rect',
      x: 40,
      y: 96,
      w: 920,
      h: 48,
      authorId: 'user-an',
      body: 'Hàng tiêu đề bảng thiếu tương phản so với nền trang.',
      createdAt: '2026-03-09T02:45:00.000Z'
    }),
    ann({
      id: 'ann-19',
      projectId: 'proj-ops',
      screenId: 'scr-orders',
      imageVersionId: 'ver-orders-1',
      type: 'point',
      x: 916,
      y: 30,
      authorId: 'user-binh',
      body: 'Nút Xuất trên thanh công cụ dễ bị hiểu là xuất góp ý. Nên đổi thành Xuất đơn.',
      status: 'resolved',
      revision: 2,
      createdAt: '2026-03-09T03:10:00.000Z',
      updatedAt: '2026-03-09T06:00:00.000Z',
      replies: [
        {
          id: 'rep-19',
          annotationId: 'ann-19',
          authorId: 'user-an',
          body: 'Đổi nhãn thành Xuất đơn ở phiên bản sau.',
          createdAt: '2026-03-09T04:20:00.000Z'
        }
      ],
      statusHistory: [
        { id: 'ann-19-open', annotationId: 'ann-19', status: 'open', userId: 'user-binh', at: '2026-03-09T03:10:00.000Z', note: 'Tạo góp ý' },
        { id: 'ann-19-resolved', annotationId: 'ann-19', status: 'resolved', userId: 'user-an', at: '2026-03-09T06:00:00.000Z', note: 'Đã xử lý' }
      ]
    }),
    ann({
      id: 'ann-20',
      projectId: 'proj-ops',
      screenId: 'scr-orders',
      imageVersionId: 'ver-orders-2',
      type: 'point',
      x: 520,
      y: 214,
      authorId: 'user-an',
      body: 'Hàng được chọn chưa có chú thích trạng thái sau khi mở lại góp ý.',
      status: 'open',
      revision: 3,
      createdAt: '2026-03-16T01:00:00.000Z',
      updatedAt: '2026-03-17T02:30:00.000Z',
      statusHistory: [
        { id: 'ann-20-open', annotationId: 'ann-20', status: 'open', userId: 'user-an', at: '2026-03-16T01:00:00.000Z', note: 'Tạo góp ý' },
        { id: 'ann-20-resolved', annotationId: 'ann-20', status: 'resolved', userId: 'user-binh', at: '2026-03-16T08:00:00.000Z', note: 'Đã xử lý' },
        { id: 'ann-20-reopen', annotationId: 'ann-20', status: 'open', userId: 'user-an', at: '2026-03-17T02:30:00.000Z', note: 'Mở lại' }
      ]
    })
  ];
}

function version(id, screenId, projectId, number, imageKey, createdAt) {
  return {
    id,
    screenId,
    projectId,
    number,
    width: 1000,
    height: 500,
    imageKey,
    mimeType: 'image/svg+xml',
    source: 'seed',
    createdAt,
    createdBy: 'user-an'
  };
}

export function createSeed() {
  const annotations = buildAnnotations();
  if (annotations.length !== 20) {
    throw new Error(`Dữ liệu mẫu phải có đúng 20 góp ý, hiện có ${annotations.length}.`);
  }
  const projects = [
    {
      id: 'proj-shop',
      name: 'Cửa hàng DesignMark',
      description: 'Luồng đăng ký, trang chủ và thanh toán cho website thương mại.',
      createdAt: '2026-02-12T08:00:00.000Z',
      updatedAt: '2026-03-12T02:00:00.000Z',
      createdBy: 'user-an'
    },
    {
      id: 'proj-ops',
      name: 'Bảng điều khiển nội bộ',
      description: 'Giao diện vận hành: tổng quan, danh sách đơn và cài đặt.',
      createdAt: '2026-02-20T09:00:00.000Z',
      updatedAt: '2026-03-17T02:30:00.000Z',
      createdBy: 'user-an'
    }
  ];
  const screens = [
    { id: 'scr-signup', projectId: 'proj-shop', name: 'Đăng ký tài khoản', description: 'Form đăng ký. Điểm mẫu trên nút Đăng ký thuộc v1.', createdAt: '2026-02-12T08:30:00.000Z', updatedAt: '2026-03-08T07:00:00.000Z', createdBy: 'user-an' },
    { id: 'scr-home', projectId: 'proj-shop', name: 'Trang chủ', description: 'Hero và lưới sản phẩm.', createdAt: '2026-02-14T08:00:00.000Z', updatedAt: '2026-03-11T05:40:00.000Z', createdBy: 'user-an' },
    { id: 'scr-pay', projectId: 'proj-shop', name: 'Thanh toán', description: 'Tóm tắt đơn và phương thức thanh toán.', createdAt: '2026-02-16T08:00:00.000Z', updatedAt: '2026-03-12T02:00:00.000Z', createdBy: 'user-an' },
    { id: 'scr-dash', projectId: 'proj-ops', name: 'Tổng quan', description: 'Số liệu và biểu đồ vận hành.', createdAt: '2026-02-20T09:30:00.000Z', updatedAt: '2026-03-15T03:20:00.000Z', createdBy: 'user-an' },
    { id: 'scr-orders', projectId: 'proj-ops', name: 'Danh sách đơn', description: 'Bảng đơn hàng và bộ lọc.', createdAt: '2026-02-21T09:00:00.000Z', updatedAt: '2026-03-17T02:30:00.000Z', createdBy: 'user-an' },
    { id: 'scr-settings', projectId: 'proj-ops', name: 'Cài đặt', description: 'Hồ sơ, bảo mật và thông báo.', createdAt: '2026-02-22T09:00:00.000Z', updatedAt: '2026-02-28T09:00:00.000Z', createdBy: 'user-an' }
  ];
  const versions = [
    version('ver-signup-1', 'scr-signup', 'proj-shop', 1, 'seed:signup-v1', '2026-02-12T08:40:00.000Z'),
    version('ver-signup-2', 'scr-signup', 'proj-shop', 2, 'seed:signup-v2', '2026-03-08T01:00:00.000Z'),
    version('ver-home-1', 'scr-home', 'proj-shop', 1, 'seed:home-v1', '2026-02-14T08:20:00.000Z'),
    version('ver-home-2', 'scr-home', 'proj-shop', 2, 'seed:home-v2', '2026-03-11T01:00:00.000Z'),
    version('ver-pay-1', 'scr-pay', 'proj-shop', 1, 'seed:pay-v1', '2026-02-16T08:20:00.000Z'),
    version('ver-pay-2', 'scr-pay', 'proj-shop', 2, 'seed:pay-v2', '2026-03-12T01:00:00.000Z'),
    version('ver-dash-1', 'scr-dash', 'proj-ops', 1, 'seed:dash-v1', '2026-02-20T09:40:00.000Z'),
    version('ver-dash-2', 'scr-dash', 'proj-ops', 2, 'seed:dash-v2', '2026-03-15T02:00:00.000Z'),
    version('ver-orders-1', 'scr-orders', 'proj-ops', 1, 'seed:orders-v1', '2026-02-21T09:20:00.000Z'),
    version('ver-orders-2', 'scr-orders', 'proj-ops', 2, 'seed:orders-v2', '2026-03-16T00:30:00.000Z'),
    version('ver-settings-1', 'scr-settings', 'proj-ops', 1, 'seed:settings-v1', '2026-02-22T09:20:00.000Z'),
    version('ver-settings-2', 'scr-settings', 'proj-ops', 2, 'seed:settings-v2', '2026-02-28T09:00:00.000Z')
  ];
  const memberships = [];
  for (const project of projects) {
    for (const user of USERS) {
      memberships.push({
        id: `mem-${project.id}-${user.id}`,
        projectId: project.id,
        userId: user.id,
        role: user.role,
        invitedBy: 'user-an',
        createdAt: project.createdAt
      });
    }
  }
  const activities = [
    { id: 'act-01', projectId: 'proj-shop', userId: 'user-an', type: 'project.created', message: 'đã tạo dự án Cửa hàng DesignMark', createdAt: '2026-02-12T08:00:00.000Z' },
    { id: 'act-02', projectId: 'proj-shop', userId: 'user-an', type: 'version.created', message: 'đã tải màn hình Đăng ký tài khoản, phiên bản v1', createdAt: '2026-02-12T08:40:00.000Z' },
    { id: 'act-03', projectId: 'proj-shop', userId: 'user-an', type: 'version.created', message: 'đã tải phiên bản v2 cho màn hình Đăng ký tài khoản', createdAt: '2026-03-08T01:00:00.000Z' },
    { id: 'act-04', projectId: 'proj-shop', userId: 'user-binh', type: 'comment.created', message: 'đã thêm nhận xét trên Đăng ký tài khoản v1', createdAt: '2026-03-02T02:15:00.000Z' },
    { id: 'act-05', projectId: 'proj-shop', userId: 'user-an', type: 'comment.replied', message: 'đã trả lời một góp ý trên Đăng ký tài khoản v1', createdAt: '2026-03-02T04:00:00.000Z' },
    { id: 'act-06', projectId: 'proj-shop', userId: 'user-an', type: 'comment.status', message: 'đã đánh dấu một góp ý là đã xử lý', createdAt: '2026-03-03T01:20:00.000Z' },
    { id: 'act-07', projectId: 'proj-ops', userId: 'user-an', type: 'project.created', message: 'đã tạo dự án Bảng điều khiển nội bộ', createdAt: '2026-02-20T09:00:00.000Z' },
    { id: 'act-08', projectId: 'proj-ops', userId: 'user-an', type: 'version.created', message: 'đã tải màn hình Danh sách đơn, phiên bản v1', createdAt: '2026-02-21T09:20:00.000Z' },
    { id: 'act-09', projectId: 'proj-ops', userId: 'user-an', type: 'version.created', message: 'đã tải phiên bản v2 cho màn hình Danh sách đơn', createdAt: '2026-03-16T00:30:00.000Z' },
    { id: 'act-10', projectId: 'proj-ops', userId: 'user-binh', type: 'comment.status', message: 'đã đánh dấu một góp ý là đã xử lý', createdAt: '2026-03-16T08:00:00.000Z' },
    { id: 'act-11', projectId: 'proj-ops', userId: 'user-an', type: 'comment.status', message: 'đã mở lại một góp ý trên Danh sách đơn v2', createdAt: '2026-03-17T02:30:00.000Z' }
  ];
  return {
    schema: SCHEMA,
    projects,
    screens,
    versions,
    annotations,
    memberships,
    activities
  };
}

export function findUser(idOrName) {
  return USERS.find((user) => user.id === idOrName || user.username === idOrName) || null;
}
