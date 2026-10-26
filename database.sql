-- ====================================================================
-- DesignMark - Supabase PostgreSQL Database Schema & Seed Data
-- Generated: 2026-10-22 04:03:49 UTC
-- Compatible with: Supabase PostgreSQL (SQL Editor & psql)
-- ====================================================================

-- 1. CẤU TRÚC BẢNG (TABLE SCHEMAS)

-- Bảng người dùng hệ thống
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('manager', 'reviewer', 'viewer', 'pending')),
    title TEXT,
    color TEXT,
    password_hash TEXT,
    is_verified INTEGER DEFAULT 1,
    verification_code TEXT,
    verified_at TEXT,
    created_at TEXT NOT NULL
);

-- Bảng dự án thiết kế
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Bảng phân quyền thành viên dự án
CREATE TABLE IF NOT EXISTS project_members (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('manager', 'reviewer', 'viewer')),
    invited_by TEXT,
    created_at TEXT NOT NULL,
    UNIQUE(project_id, user_id)
);

-- Bảng màn hình thiết kế
CREATE TABLE IF NOT EXISTS design_screens (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Bảng các phiên bản ảnh của từng màn hình
CREATE TABLE IF NOT EXISTS image_versions (
    id TEXT PRIMARY KEY,
    screen_id TEXT NOT NULL REFERENCES design_screens(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    number INTEGER NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    image_key TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    source TEXT NOT NULL,
    created_at TEXT NOT NULL,
    created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Bảng nhận xét / ghim góp ý trên ảnh
CREATE TABLE IF NOT EXISTS annotations (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    screen_id TEXT NOT NULL REFERENCES design_screens(id) ON DELETE CASCADE,
    image_version_id TEXT NOT NULL REFERENCES image_versions(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('point', 'rect', 'area')),
    x REAL NOT NULL,
    y REAL NOT NULL,
    w REAL NOT NULL,
    h REAL NOT NULL,
    original_width INTEGER NOT NULL,
    original_height INTEGER NOT NULL,
    author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'rejected')),
    revision INTEGER NOT NULL DEFAULT 1,
    check_note TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Bảng câu trả lời / trao đổi trong thread nhận xét
CREATE TABLE IF NOT EXISTS annotation_replies (
    id TEXT PRIMARY KEY,
    annotation_id TEXT NOT NULL REFERENCES annotations(id) ON DELETE CASCADE,
    author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL
);

-- Bảng lịch sử thay đổi trạng thái nhận xét
CREATE TABLE IF NOT EXISTS annotation_status_events (
    id TEXT PRIMARY KEY,
    annotation_id TEXT NOT NULL REFERENCES annotations(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note TEXT,
    created_at TEXT NOT NULL
);

-- Bảng nhật ký hoạt động dự án
CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL
);

-- Tạo chỉ mục (Indexes) để tăng tốc truy vấn
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_design_screens_project ON design_screens(project_id);
CREATE INDEX IF NOT EXISTS idx_image_versions_screen ON image_versions(screen_id);
CREATE INDEX IF NOT EXISTS idx_annotations_version ON annotations(image_version_id);
CREATE INDEX IF NOT EXISTS idx_annotations_screen ON annotations(screen_id);
CREATE INDEX IF NOT EXISTS idx_annotation_replies_ann ON annotation_replies(annotation_id);
CREATE INDEX IF NOT EXISTS idx_activities_project ON activities(project_id);

-- ====================================================================
-- 2. DỮ LIỆU BAN ĐẦU (DATA INSERTS)
-- ====================================================================

-- Dữ liệu bảng `users` (6 bản ghi)
INSERT INTO users ("id", "username", "name", "role", "title", "color", "password_hash", "is_verified", "verification_code", "verified_at", "created_at") VALUES
  ('user-an', 'an', 'An Nguyễn', 'manager', 'Quản lý thiết kế', '#4F46E5', '$2y$12$KO2wwwn9yUq64yvTbVjgnOC1gY6AveC9Y1iH146bB7y9NgtuvTb4K', 1, NULL, NULL, '2026-02-12T08:00:00.000Z'),
  ('user-binh', 'binh', 'Bình Trần', 'reviewer', 'Người góp ý', '#0F766E', '$2y$12$KO2wwwn9yUq64yvTbVjgnOC1gY6AveC9Y1iH146bB7y9NgtuvTb4K', 1, NULL, NULL, '2026-02-12T08:00:00.000Z'),
  ('user-chi', 'chi', 'Chi Lê', 'viewer', 'Bên liên quan', '#B45309', '$2y$12$KO2wwwn9yUq64yvTbVjgnOC1gY6AveC9Y1iH146bB7y9NgtuvTb4K', 1, NULL, NULL, '2026-02-12T08:00:00.000Z'),
  ('user-f9bdccff-d7cb-447a-a3a8-4a760ac11562', 'hoanghai', 'SD', 'manager', 'DSADSA', '#DB2777', '$2y$12$ijeVFw5BeKFnbwxY8U1ykeEOfP12lTAQW/QGKGTLj0U5glBbYiJnu', 1, NULL, '2026-10-22T03:06:00.000Z', '2026-10-22T02:48:04.000Z'),
  ('user-7e08216f-1fc1-4bcd-86e8-c995452b6c8a', 'thanhnt', 'Thành Nguyễn', 'reviewer', 'Product Designer', '#B45309', '$2y$12$EiSgMlkNgZDV7rakttIp0O0NwT0PFmOPkW7RCdzgGiYL29eNPmL5m', 1, NULL, '2026-10-22T03:05:49.000Z', '2026-10-22T03:05:24.000Z'),
  ('user-022a2b97-ff04-491e-8e0e-bcd9848bb03c', 'hongphuc', 'Hồng Phúc', 'reviewer', 'UX Researcher', '#B45309', '$2y$12$gg8CpFxGeOMNbuznKeh8ieUWDYGtbJ.O0DMsQuvZI5sOxsUiZEEqG', 1, NULL, '2026-10-22T03:47:36.000Z', '2026-10-22T03:25:47.000Z')
ON CONFLICT (id) DO NOTHING;

-- Dữ liệu bảng `projects` (2 bản ghi)
INSERT INTO projects ("id", "name", "description", "created_at", "updated_at", "created_by") VALUES
  ('proj-shop', 'Cửa hàng DesignMark', 'Luồng đăng ký, trang chủ và thanh toán cho website thương mại.', '2026-02-12T08:00:00.000Z', '2026-03-12T02:00:00.000Z', 'user-an'),
  ('proj-ops', 'Bảng điều khiển nội bộ', 'Giao diện vận hành: tổng quan, danh sách đơn và cài đặt.', '2026-02-20T09:00:00.000Z', '2026-03-17T02:30:00.000Z', 'user-an')
ON CONFLICT (id) DO NOTHING;

-- Dữ liệu bảng `project_members` (12 bản ghi)
INSERT INTO project_members ("id", "project_id", "user_id", "role", "invited_by", "created_at") VALUES
  ('mem-proj-shop-user-an', 'proj-shop', 'user-an', 'manager', 'user-an', '2026-02-12T08:00:00.000Z'),
  ('mem-proj-shop-user-binh', 'proj-shop', 'user-binh', 'reviewer', 'user-an', '2026-02-12T08:00:00.000Z'),
  ('mem-proj-shop-user-chi', 'proj-shop', 'user-chi', 'viewer', 'user-an', '2026-02-12T08:00:00.000Z'),
  ('mem-proj-ops-user-an', 'proj-ops', 'user-an', 'manager', 'user-an', '2026-02-20T09:00:00.000Z'),
  ('mem-proj-ops-user-binh', 'proj-ops', 'user-binh', 'reviewer', 'user-an', '2026-02-20T09:00:00.000Z'),
  ('mem-proj-ops-user-chi', 'proj-ops', 'user-chi', 'viewer', 'user-an', '2026-02-20T09:00:00.000Z'),
  ('mem-db47dc60-ed52-4e28-9198-b5d3c9f31d36', 'proj-shop', 'user-f9bdccff-d7cb-447a-a3a8-4a760ac11562', 'manager', 'system', '2026-10-22T02:48:04.000Z'),
  ('mem-e37469e6-b150-46bc-9d69-6b9ba3c7e03a', 'proj-ops', 'user-f9bdccff-d7cb-447a-a3a8-4a760ac11562', 'manager', 'system', '2026-10-22T02:48:04.000Z'),
  ('mem-024c3bdb-66fb-4a7e-b8df-6100e1feebcb', 'proj-ops', 'user-7e08216f-1fc1-4bcd-86e8-c995452b6c8a', 'reviewer', 'user-an', '2026-10-22T03:05:49.000Z'),
  ('mem-e880eca8-5112-49f0-8f68-8a5e1c311aac', 'proj-shop', 'user-7e08216f-1fc1-4bcd-86e8-c995452b6c8a', 'reviewer', 'user-an', '2026-10-22T03:05:49.000Z'),
  ('mem-62c02b5a-85a1-4106-8930-b1bed6136e61', 'proj-shop', 'user-022a2b97-ff04-491e-8e0e-bcd9848bb03c', 'reviewer', 'user-an', '2026-10-22T03:47:36.000Z'),
  ('mem-7d73126b-7f09-4192-b6f3-0d77ab7c3201', 'proj-ops', 'user-022a2b97-ff04-491e-8e0e-bcd9848bb03c', 'reviewer', 'user-an', '2026-10-22T03:47:36.000Z')
ON CONFLICT (project_id, user_id) DO NOTHING;

-- Dữ liệu bảng `design_screens` (6 bản ghi)
INSERT INTO design_screens ("id", "project_id", "name", "description", "created_at", "updated_at", "created_by") VALUES
  ('scr-signup', 'proj-shop', 'Đăng ký tài khoản', 'Form đăng ký. Điểm mẫu trên nút Đăng ký thuộc v1.', '2026-02-12T08:30:00.000Z', '2026-03-08T07:00:00.000Z', 'user-an'),
  ('scr-home', 'proj-shop', 'Trang chủ', 'Hero và lưới sản phẩm.', '2026-02-14T08:00:00.000Z', '2026-03-11T05:40:00.000Z', 'user-an'),
  ('scr-pay', 'proj-shop', 'Thanh toán', 'Tóm tắt đơn và phương thức thanh toán.', '2026-02-16T08:00:00.000Z', '2026-03-12T02:00:00.000Z', 'user-an'),
  ('scr-dash', 'proj-ops', 'Tổng quan', 'Số liệu và biểu đồ vận hành.', '2026-02-20T09:30:00.000Z', '2026-03-15T03:20:00.000Z', 'user-an'),
  ('scr-orders', 'proj-ops', 'Danh sách đơn', 'Bảng đơn hàng và bộ lọc.', '2026-02-21T09:00:00.000Z', '2026-03-17T02:30:00.000Z', 'user-an'),
  ('scr-settings', 'proj-ops', 'Cài đặt', 'Hồ sơ, bảo mật và thông báo.', '2026-02-22T09:00:00.000Z', '2026-02-28T09:00:00.000Z', 'user-an')
ON CONFLICT (id) DO NOTHING;

-- Dữ liệu bảng `image_versions` (12 bản ghi)
INSERT INTO image_versions ("id", "screen_id", "project_id", "number", "width", "height", "image_key", "mime_type", "source", "created_at", "created_by") VALUES
  ('ver-signup-1', 'scr-signup', 'proj-shop', 1, 1000, 500, 'seed:signup-v1', 'image/svg+xml', 'seed', '2026-02-12T08:40:00.000Z', 'user-an'),
  ('ver-home-1', 'scr-home', 'proj-shop', 1, 1000, 500, 'seed:home-v1', 'image/svg+xml', 'seed', '2026-02-14T08:20:00.000Z', 'user-an'),
  ('ver-pay-1', 'scr-pay', 'proj-shop', 1, 1000, 500, 'seed:pay-v1', 'image/svg+xml', 'seed', '2026-02-16T08:20:00.000Z', 'user-an'),
  ('ver-dash-1', 'scr-dash', 'proj-ops', 1, 1000, 500, 'seed:dash-v1', 'image/svg+xml', 'seed', '2026-02-20T09:40:00.000Z', 'user-an'),
  ('ver-orders-1', 'scr-orders', 'proj-ops', 1, 1000, 500, 'seed:orders-v1', 'image/svg+xml', 'seed', '2026-02-21T09:20:00.000Z', 'user-an'),
  ('ver-settings-1', 'scr-settings', 'proj-ops', 1, 1000, 500, 'seed:settings-v1', 'image/svg+xml', 'seed', '2026-02-22T09:20:00.000Z', 'user-an'),
  ('ver-settings-2', 'scr-settings', 'proj-ops', 2, 1000, 500, 'seed:settings-v2', 'image/svg+xml', 'seed', '2026-02-28T09:00:00.000Z', 'user-an'),
  ('ver-signup-2', 'scr-signup', 'proj-shop', 2, 1000, 500, 'seed:signup-v2', 'image/svg+xml', 'seed', '2026-03-08T01:00:00.000Z', 'user-an'),
  ('ver-home-2', 'scr-home', 'proj-shop', 2, 1000, 500, 'seed:home-v2', 'image/svg+xml', 'seed', '2026-03-11T01:00:00.000Z', 'user-an'),
  ('ver-pay-2', 'scr-pay', 'proj-shop', 2, 1000, 500, 'seed:pay-v2', 'image/svg+xml', 'seed', '2026-03-12T01:00:00.000Z', 'user-an'),
  ('ver-dash-2', 'scr-dash', 'proj-ops', 2, 1000, 500, 'seed:dash-v2', 'image/svg+xml', 'seed', '2026-03-15T02:00:00.000Z', 'user-an'),
  ('ver-orders-2', 'scr-orders', 'proj-ops', 2, 1000, 500, 'seed:orders-v2', 'image/svg+xml', 'seed', '2026-03-16T00:30:00.000Z', 'user-an')
ON CONFLICT (id) DO NOTHING;

-- Dữ liệu bảng `annotations` (20 bản ghi)
INSERT INTO annotations ("id", "project_id", "screen_id", "image_version_id", "type", "x", "y", "w", "h", "original_width", "original_height", "author_id", "body", "status", "revision", "check_note", "created_at", "updated_at") VALUES
  ('ann-01', 'proj-shop', 'scr-signup', 'ver-signup-1', 'point', 750, 150, 0, 0, 1000, 500, 'user-binh', 'Nút Đăng ký cần tương phản cao hơn so với nền thẻ bên phải.', 'open', 1, '', '2026-03-02T02:15:00.000Z', '2026-03-02T02:15:00.000Z'),
  ('ann-02', 'proj-shop', 'scr-signup', 'ver-signup-1', 'rect', 64, 160, 520, 220, 1000, 500, 'user-an', 'Nhóm ô nhập bên trái còn thiếu thông báo lỗi ngay dưới ô mật khẩu.', 'open', 1, '', '2026-03-02T02:40:00.000Z', '2026-03-02T02:40:00.000Z'),
  ('ann-03', 'proj-shop', 'scr-signup', 'ver-signup-1', 'point', 120, 34, 0, 0, 1000, 500, 'user-chi', 'Tên thương hiệu trên thanh đầu trang hơi khó nhận ra khi nhìn nhanh.', 'resolved', 2, '', '2026-03-02T03:10:00.000Z', '2026-03-03T01:20:00.000Z'),
  ('ann-04', 'proj-shop', 'scr-signup', 'ver-signup-1', 'rect', 640, 210, 280, 100, 1000, 500, 'user-binh', 'Khối ghi chú dưới nút Đăng ký đang tách khỏi hành động chính.', 'open', 1, '', '2026-03-02T05:05:00.000Z', '2026-03-02T05:05:00.000Z'),
  ('ann-07', 'proj-shop', 'scr-home', 'ver-home-1', 'point', 500, 168, 0, 0, 1000, 500, 'user-binh', 'Tiêu đề hero đang lệch khỏi trục nội dung chính bên trái.', 'open', 1, '', '2026-03-04T01:15:00.000Z', '2026-03-04T01:15:00.000Z'),
  ('ann-08', 'proj-shop', 'scr-home', 'ver-home-1', 'rect', 48, 250, 280, 180, 1000, 500, 'user-an', 'Thẻ sản phẩm đầu tiên thiếu giá và nút xem chi tiết.', 'open', 1, '', '2026-03-04T01:40:00.000Z', '2026-03-04T01:40:00.000Z'),
  ('ann-09', 'proj-shop', 'scr-home', 'ver-home-1', 'point', 900, 34, 0, 0, 1000, 500, 'user-an', 'Mục tài khoản trên thanh điều hướng chưa có trạng thái đang đăng nhập.', 'resolved', 2, '', '2026-03-04T03:00:00.000Z', '2026-03-05T02:00:00.000Z'),
  ('ann-12', 'proj-shop', 'scr-pay', 'ver-pay-1', 'point', 820, 400, 0, 0, 1000, 500, 'user-an', 'Nút Thanh toán nằm sát mép, dễ bấm nhầm khi cuộn trên màn hình nhỏ.', 'open', 1, '', '2026-03-06T08:00:00.000Z', '2026-03-06T08:00:00.000Z'),
  ('ann-13', 'proj-shop', 'scr-pay', 'ver-pay-1', 'rect', 48, 88, 460, 280, 1000, 500, 'user-binh', 'Tóm tắt đơn hàng đã rõ ràng, có thể giữ bố cục này.', 'resolved', 2, 'Giữ nguyên khối tóm tắt đơn.', '2026-03-06T08:30:00.000Z', '2026-03-06T10:00:00.000Z'),
  ('ann-15', 'proj-ops', 'scr-dash', 'ver-dash-1', 'point', 250, 140, 0, 0, 1000, 500, 'user-an', 'Số liệu doanh thu chưa có đơn vị tiền tệ nên dễ hiểu nhầm.', 'open', 1, '', '2026-03-07T01:00:00.000Z', '2026-03-07T01:00:00.000Z'),
  ('ann-16', 'proj-ops', 'scr-dash', 'ver-dash-1', 'rect', 520, 96, 440, 200, 1000, 500, 'user-chi', 'Khối biểu đồ đã đủ khoảng trắng, có thể giữ tỷ lệ này.', 'resolved', 2, '', '2026-03-07T01:30:00.000Z', '2026-03-07T04:15:00.000Z'),
  ('ann-05', 'proj-shop', 'scr-signup', 'ver-signup-2', 'point', 248, 418, 0, 0, 1000, 500, 'user-an', 'Nút Đăng ký đã chuyển xuống cuối form. Cần kiểm tra khoảng cách với mép dưới.', 'open', 1, '', '2026-03-08T02:00:00.000Z', '2026-03-08T02:00:00.000Z'),
  ('ann-06', 'proj-shop', 'scr-signup', 'ver-signup-2', 'rect', 250, 124, 500, 250, 1000, 500, 'user-binh', 'Nhóm trường thông tin ở bố cục một cột đã gọn hơn, có thể chốt hướng này.', 'resolved', 2, 'Đã kiểm tra bố cục một cột trên khung 1000×500.', '2026-03-08T02:30:00.000Z', '2026-03-08T07:00:00.000Z'),
  ('ann-18', 'proj-ops', 'scr-orders', 'ver-orders-1', 'rect', 40, 96, 920, 48, 1000, 500, 'user-an', 'Hàng tiêu đề bảng thiếu tương phản so với nền trang.', 'open', 1, '', '2026-03-09T02:45:00.000Z', '2026-03-09T02:45:00.000Z'),
  ('ann-19', 'proj-ops', 'scr-orders', 'ver-orders-1', 'point', 916, 30, 0, 0, 1000, 500, 'user-binh', 'Nút Xuất trên thanh công cụ dễ bị hiểu là xuất góp ý. Nên đổi thành Xuất đơn.', 'resolved', 2, '', '2026-03-09T03:10:00.000Z', '2026-03-09T06:00:00.000Z'),
  ('ann-10', 'proj-shop', 'scr-home', 'ver-home-2', 'point', 180, 86, 0, 0, 1000, 500, 'user-chi', 'Banner khuyến mãi chiếm nhiều chiều cao, cân nhắc thu gọn trên màn hình nhỏ.', 'open', 1, '', '2026-03-11T02:20:00.000Z', '2026-03-11T02:20:00.000Z'),
  ('ann-11', 'proj-shop', 'scr-home', 'ver-home-2', 'rect', 520, 240, 420, 160, 1000, 500, 'user-binh', 'Hai thẻ bên phải còn khoảng trống không đều so với khối hero.', 'open', 1, '', '2026-03-11T03:05:00.000Z', '2026-03-11T05:40:00.000Z'),
  ('ann-14', 'proj-shop', 'scr-pay', 'ver-pay-2', 'point', 160, 170, 0, 0, 1000, 500, 'user-binh', 'Phương thức ví điện tử cần trạng thái được chọn rõ hơn cả về chữ lẫn viền.', 'open', 1, '', '2026-03-12T01:10:00.000Z', '2026-03-12T02:00:00.000Z'),
  ('ann-17', 'proj-ops', 'scr-dash', 'ver-dash-2', 'point', 900, 52, 0, 0, 1000, 500, 'user-binh', 'Cảnh báo hệ thống nên có nút đóng và không chỉ dựa vào ký hiệu nhân.', 'open', 1, '', '2026-03-15T03:20:00.000Z', '2026-03-15T03:20:00.000Z'),
  ('ann-20', 'proj-ops', 'scr-orders', 'ver-orders-2', 'point', 520, 214, 0, 0, 1000, 500, 'user-an', 'Hàng được chọn chưa có chú thích trạng thái sau khi mở lại góp ý.', 'open', 3, '', '2026-03-16T01:00:00.000Z', '2026-03-17T02:30:00.000Z')
ON CONFLICT (id) DO NOTHING;

-- Dữ liệu bảng `annotation_replies` (6 bản ghi)
INSERT INTO annotation_replies ("id", "annotation_id", "author_id", "body", "created_at") VALUES
  ('rep-01', 'ann-01', 'user-an', 'Mình sẽ tăng độ đậm của nút ở bản sau. Góp ý này chỉ thuộc v1, không chuyển sang v2.', '2026-03-02T04:00:00.000Z'),
  ('rep-03', 'ann-03', 'user-binh', 'Có thể tăng cỡ chữ logo, không cần đổi vị trí điều hướng.', '2026-03-02T06:00:00.000Z'),
  ('rep-06', 'ann-06', 'user-an', 'Đã ghi nhận. Giữ form một cột cho bản bàn giao.', '2026-03-08T06:10:00.000Z'),
  ('rep-19', 'ann-19', 'user-an', 'Đổi nhãn thành Xuất đơn ở phiên bản sau.', '2026-03-09T04:20:00.000Z'),
  ('rep-11', 'ann-11', 'user-an', 'Mình sẽ chỉnh lưới ở vòng thiết kế sau, không sửa trực tiếp ảnh này.', '2026-03-11T05:40:00.000Z'),
  ('rep-14', 'ann-14', 'user-an', 'Sẽ thêm nhãn Đang được chọn và viền indigo.', '2026-03-12T02:00:00.000Z')
ON CONFLICT (id) DO NOTHING;

-- Dữ liệu bảng `annotation_status_events` (28 bản ghi)
INSERT INTO annotation_status_events ("id", "annotation_id", "status", "user_id", "note", "created_at") VALUES
  ('ann-01-open', 'ann-01', 'open', 'user-binh', 'Tạo góp ý', '2026-03-02T02:15:00.000Z'),
  ('ann-02-open', 'ann-02', 'open', 'user-an', 'Tạo góp ý', '2026-03-02T02:40:00.000Z'),
  ('ann-03-open', 'ann-03', 'open', 'user-chi', 'Tạo góp ý', '2026-03-02T03:10:00.000Z'),
  ('ann-04-open', 'ann-04', 'open', 'user-binh', 'Tạo góp ý', '2026-03-02T05:05:00.000Z'),
  ('ann-03-resolved', 'ann-03', 'resolved', 'user-an', 'Đã xử lý', '2026-03-03T01:20:00.000Z'),
  ('ann-07-open', 'ann-07', 'open', 'user-binh', 'Tạo góp ý', '2026-03-04T01:15:00.000Z'),
  ('ann-08-open', 'ann-08', 'open', 'user-an', 'Tạo góp ý', '2026-03-04T01:40:00.000Z'),
  ('ann-09-open', 'ann-09', 'open', 'user-an', 'Tạo góp ý', '2026-03-04T03:00:00.000Z'),
  ('ann-09-resolved', 'ann-09', 'resolved', 'user-binh', 'Đã xử lý', '2026-03-05T02:00:00.000Z'),
  ('ann-12-open', 'ann-12', 'open', 'user-an', 'Tạo góp ý', '2026-03-06T08:00:00.000Z'),
  ('ann-13-open', 'ann-13', 'open', 'user-binh', 'Tạo góp ý', '2026-03-06T08:30:00.000Z'),
  ('ann-13-resolved', 'ann-13', 'resolved', 'user-an', 'Đã xử lý', '2026-03-06T10:00:00.000Z'),
  ('ann-15-open', 'ann-15', 'open', 'user-an', 'Tạo góp ý', '2026-03-07T01:00:00.000Z'),
  ('ann-16-open', 'ann-16', 'open', 'user-chi', 'Tạo góp ý', '2026-03-07T01:30:00.000Z'),
  ('ann-16-resolved', 'ann-16', 'resolved', 'user-an', 'Đã xử lý', '2026-03-07T04:15:00.000Z'),
  ('ann-05-open', 'ann-05', 'open', 'user-an', 'Tạo góp ý', '2026-03-08T02:00:00.000Z'),
  ('ann-06-open', 'ann-06', 'open', 'user-binh', 'Tạo góp ý', '2026-03-08T02:30:00.000Z'),
  ('ann-06-resolved', 'ann-06', 'resolved', 'user-an', 'Đã xử lý', '2026-03-08T07:00:00.000Z'),
  ('ann-18-open', 'ann-18', 'open', 'user-an', 'Tạo góp ý', '2026-03-09T02:45:00.000Z'),
  ('ann-19-open', 'ann-19', 'open', 'user-binh', 'Tạo góp ý', '2026-03-09T03:10:00.000Z'),
  ('ann-19-resolved', 'ann-19', 'resolved', 'user-an', 'Đã xử lý', '2026-03-09T06:00:00.000Z'),
  ('ann-10-open', 'ann-10', 'open', 'user-chi', 'Tạo góp ý', '2026-03-11T02:20:00.000Z'),
  ('ann-11-open', 'ann-11', 'open', 'user-binh', 'Tạo góp ý', '2026-03-11T03:05:00.000Z'),
  ('ann-14-open', 'ann-14', 'open', 'user-binh', 'Tạo góp ý', '2026-03-12T01:10:00.000Z'),
  ('ann-17-open', 'ann-17', 'open', 'user-binh', 'Tạo góp ý', '2026-03-15T03:20:00.000Z'),
  ('ann-20-open', 'ann-20', 'open', 'user-an', 'Tạo góp ý', '2026-03-16T01:00:00.000Z'),
  ('ann-20-resolved', 'ann-20', 'resolved', 'user-binh', 'Đã xử lý', '2026-03-16T08:00:00.000Z'),
  ('ann-20-reopen', 'ann-20', 'open', 'user-an', 'Mở lại', '2026-03-17T02:30:00.000Z')
ON CONFLICT (id) DO NOTHING;

-- Dữ liệu bảng `activities` (11 bản ghi)
INSERT INTO activities ("id", "project_id", "user_id", "type", "message", "created_at") VALUES
  ('act-01', 'proj-shop', 'user-an', 'project.created', 'đã tạo dự án Cửa hàng DesignMark', '2026-02-12T08:00:00.000Z'),
  ('act-02', 'proj-shop', 'user-an', 'version.created', 'đã tải màn hình Đăng ký tài khoản, phiên bản v1', '2026-02-12T08:40:00.000Z'),
  ('act-07', 'proj-ops', 'user-an', 'project.created', 'đã tạo dự án Bảng điều khiển nội bộ', '2026-02-20T09:00:00.000Z'),
  ('act-08', 'proj-ops', 'user-an', 'version.created', 'đã tải màn hình Danh sách đơn, phiên bản v1', '2026-02-21T09:20:00.000Z'),
  ('act-04', 'proj-shop', 'user-binh', 'comment.created', 'đã thêm nhận xét trên Đăng ký tài khoản v1', '2026-03-02T02:15:00.000Z'),
  ('act-05', 'proj-shop', 'user-an', 'comment.replied', 'đã trả lời một góp ý trên Đăng ký tài khoản v1', '2026-03-02T04:00:00.000Z'),
  ('act-06', 'proj-shop', 'user-an', 'comment.status', 'đã đánh dấu một góp ý là đã xử lý', '2026-03-03T01:20:00.000Z'),
  ('act-03', 'proj-shop', 'user-an', 'version.created', 'đã tải phiên bản v2 cho màn hình Đăng ký tài khoản', '2026-03-08T01:00:00.000Z'),
  ('act-09', 'proj-ops', 'user-an', 'version.created', 'đã tải phiên bản v2 cho màn hình Danh sách đơn', '2026-03-16T00:30:00.000Z'),
  ('act-10', 'proj-ops', 'user-binh', 'comment.status', 'đã đánh dấu một góp ý là đã xử lý', '2026-03-16T08:00:00.000Z'),
  ('act-11', 'proj-ops', 'user-an', 'comment.status', 'đã mở lại một góp ý trên Danh sách đơn v2', '2026-03-17T02:30:00.000Z')
ON CONFLICT (id) DO NOTHING;
