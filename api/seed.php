<?php
// api/seed.php - Database seeder for DesignMark

require_once __DIR__ . '/svg_seeds.php';

function seed_database(PDO $pdo) {
    // Clear all existing data
    $pdo->exec("DELETE FROM activities");
    $pdo->exec("DELETE FROM annotation_status_events");
    $pdo->exec("DELETE FROM annotation_replies");
    $pdo->exec("DELETE FROM annotations");
    $pdo->exec("DELETE FROM image_versions");
    $pdo->exec("DELETE FROM design_screens");
    $pdo->exec("DELETE FROM project_members");
    $pdo->exec("DELETE FROM projects");
    $pdo->exec("DELETE FROM users");

    // 1. Users
    $users = [
        [
            'id' => 'user-an',
            'username' => 'an',
            'name' => 'An Nguyễn',
            'role' => 'manager',
            'title' => 'Quản lý thiết kế',
            'color' => '#4F46E5'
        ],
        [
            'id' => 'user-binh',
            'username' => 'binh',
            'name' => 'Bình Trần',
            'role' => 'reviewer',
            'title' => 'Người góp ý',
            'color' => '#0F766E'
        ],
        [
            'id' => 'user-chi',
            'username' => 'chi',
            'name' => 'Chi Lê',
            'role' => 'viewer',
            'title' => 'Bên liên quan',
            'color' => '#B45309'
        ]
    ];
    $stmtUser = $pdo->prepare("INSERT INTO users (id, username, name, role, title, color, password_hash, is_verified, created_at) VALUES (:id, :username, :name, :role, :title, :color, :phash, 1, '2026-02-12T08:00:00.000Z')");
    $demoHash = password_hash('demo', PASSWORD_DEFAULT);
    foreach ($users as $u) {
        $u['phash'] = $demoHash;
        $stmtUser->execute($u);
    }

    // 2. Projects
    $projects = [
        [
            'id' => 'proj-shop',
            'name' => 'Cửa hàng DesignMark',
            'description' => 'Luồng đăng ký, trang chủ và thanh toán cho website thương mại.',
            'created_at' => '2026-02-12T08:00:00.000Z',
            'updated_at' => '2026-03-12T02:00:00.000Z',
            'created_by' => 'user-an'
        ],
        [
            'id' => 'proj-ops',
            'name' => 'Bảng điều khiển nội bộ',
            'description' => 'Giao diện vận hành: tổng quan, danh sách đơn và cài đặt.',
            'created_at' => '2026-02-20T09:00:00.000Z',
            'updated_at' => '2026-03-17T02:30:00.000Z',
            'created_by' => 'user-an'
        ]
    ];
    $stmtProj = $pdo->prepare("INSERT INTO projects (id, name, description, created_at, updated_at, created_by) VALUES (:id, :name, :description, :created_at, :updated_at, :created_by)");
    foreach ($projects as $p) {
        $stmtProj->execute($p);
    }

    // 3. Project Members
    $stmtMem = $pdo->prepare("INSERT INTO project_members (id, project_id, user_id, role, invited_by, created_at) VALUES (:id, :project_id, :user_id, :role, :invited_by, :created_at)");
    foreach ($projects as $p) {
        foreach ($users as $u) {
            $stmtMem->execute([
                ':id' => 'mem-' . $p['id'] . '-' . $u['id'],
                ':project_id' => $p['id'],
                ':user_id' => $u['id'],
                ':role' => $u['role'],
                ':invited_by' => 'user-an',
                ':created_at' => $p['created_at']
            ]);
        }
    }

    // 4. Screens
    $screens = [
        ['id' => 'scr-signup', 'project_id' => 'proj-shop', 'name' => 'Đăng ký tài khoản', 'description' => 'Form đăng ký. Điểm mẫu trên nút Đăng ký thuộc v1.', 'created_at' => '2026-02-12T08:30:00.000Z', 'updated_at' => '2026-03-08T07:00:00.000Z', 'created_by' => 'user-an'],
        ['id' => 'scr-home', 'project_id' => 'proj-shop', 'name' => 'Trang chủ', 'description' => 'Hero và lưới sản phẩm.', 'created_at' => '2026-02-14T08:00:00.000Z', 'updated_at' => '2026-03-11T05:40:00.000Z', 'created_by' => 'user-an'],
        ['id' => 'scr-pay', 'project_id' => 'proj-shop', 'name' => 'Thanh toán', 'description' => 'Tóm tắt đơn và phương thức thanh toán.', 'created_at' => '2026-02-16T08:00:00.000Z', 'updated_at' => '2026-03-12T02:00:00.000Z', 'created_by' => 'user-an'],
        ['id' => 'scr-dash', 'project_id' => 'proj-ops', 'name' => 'Tổng quan', 'description' => 'Số liệu và biểu đồ vận hành.', 'created_at' => '2026-02-20T09:30:00.000Z', 'updated_at' => '2026-03-15T03:20:00.000Z', 'created_by' => 'user-an'],
        ['id' => 'scr-orders', 'project_id' => 'proj-ops', 'name' => 'Danh sách đơn', 'description' => 'Bảng đơn hàng và bộ lọc.', 'created_at' => '2026-02-21T09:00:00.000Z', 'updated_at' => '2026-03-17T02:30:00.000Z', 'created_by' => 'user-an'],
        ['id' => 'scr-settings', 'project_id' => 'proj-ops', 'name' => 'Cài đặt', 'description' => 'Hồ sơ, bảo mật và thông báo.', 'created_at' => '2026-02-22T09:00:00.000Z', 'updated_at' => '2026-02-28T09:00:00.000Z', 'created_by' => 'user-an']
    ];
    $stmtScr = $pdo->prepare("INSERT INTO design_screens (id, project_id, name, description, created_at, updated_at, created_by) VALUES (:id, :project_id, :name, :description, :created_at, :updated_at, :created_by)");
    foreach ($screens as $s) {
        $stmtScr->execute($s);
    }

    // 5. Image Versions
    $versions = [
        ['id' => 'ver-signup-1', 'screen_id' => 'scr-signup', 'project_id' => 'proj-shop', 'number' => 1, 'image_key' => 'seed:signup-v1', 'created_at' => '2026-02-12T08:40:00.000Z'],
        ['id' => 'ver-signup-2', 'screen_id' => 'scr-signup', 'project_id' => 'proj-shop', 'number' => 2, 'image_key' => 'seed:signup-v2', 'created_at' => '2026-03-08T01:00:00.000Z'],
        ['id' => 'ver-home-1', 'screen_id' => 'scr-home', 'project_id' => 'proj-shop', 'number' => 1, 'image_key' => 'seed:home-v1', 'created_at' => '2026-02-14T08:20:00.000Z'],
        ['id' => 'ver-home-2', 'screen_id' => 'scr-home', 'project_id' => 'proj-shop', 'number' => 2, 'image_key' => 'seed:home-v2', 'created_at' => '2026-03-11T01:00:00.000Z'],
        ['id' => 'ver-pay-1', 'screen_id' => 'scr-pay', 'project_id' => 'proj-shop', 'number' => 1, 'image_key' => 'seed:pay-v1', 'created_at' => '2026-02-16T08:20:00.000Z'],
        ['id' => 'ver-pay-2', 'screen_id' => 'scr-pay', 'project_id' => 'proj-shop', 'number' => 2, 'image_key' => 'seed:pay-v2', 'created_at' => '2026-03-12T01:00:00.000Z'],
        ['id' => 'ver-dash-1', 'screen_id' => 'scr-dash', 'project_id' => 'proj-ops', 'number' => 1, 'image_key' => 'seed:dash-v1', 'created_at' => '2026-02-20T09:40:00.000Z'],
        ['id' => 'ver-dash-2', 'screen_id' => 'scr-dash', 'project_id' => 'proj-ops', 'number' => 2, 'image_key' => 'seed:dash-v2', 'created_at' => '2026-03-15T02:00:00.000Z'],
        ['id' => 'ver-orders-1', 'screen_id' => 'scr-orders', 'project_id' => 'proj-ops', 'number' => 1, 'image_key' => 'seed:orders-v1', 'created_at' => '2026-02-21T09:20:00.000Z'],
        ['id' => 'ver-orders-2', 'screen_id' => 'scr-orders', 'project_id' => 'proj-ops', 'number' => 2, 'image_key' => 'seed:orders-v2', 'created_at' => '2026-03-16T00:30:00.000Z'],
        ['id' => 'ver-settings-1', 'screen_id' => 'scr-settings', 'project_id' => 'proj-ops', 'number' => 1, 'image_key' => 'seed:settings-v1', 'created_at' => '2026-02-22T09:20:00.000Z'],
        ['id' => 'ver-settings-2', 'screen_id' => 'scr-settings', 'project_id' => 'proj-ops', 'number' => 2, 'image_key' => 'seed:settings-v2', 'created_at' => '2026-02-28T09:00:00.000Z']
    ];
    $stmtVer = $pdo->prepare("INSERT INTO image_versions (id, screen_id, project_id, number, width, height, image_key, mime_type, source, created_at, created_by) VALUES (:id, :screen_id, :project_id, :number, 1000, 500, :image_key, 'image/svg+xml', 'seed', :created_at, 'user-an')");
    foreach ($versions as $v) {
        $stmtVer->execute($v);
    }

    // 6. Annotations (20 items)
    $annotations = [
        [
            'id' => 'ann-01',
            'project_id' => 'proj-shop',
            'screen_id' => 'scr-signup',
            'image_version_id' => 'ver-signup-1',
            'type' => 'point',
            'x' => 750,
            'y' => 150,
            'w' => 0,
            'h' => 0,
            'author_id' => 'user-binh',
            'body' => 'Nút Đăng ký cần tương phản cao hơn so với nền thẻ bên phải.',
            'status' => 'open',
            'revision' => 1,
            'check_note' => '',
            'created_at' => '2026-03-02T02:15:00.000Z',
            'updated_at' => '2026-03-02T02:15:00.000Z',
            'replies' => [
                ['id' => 'rep-01', 'author_id' => 'user-an', 'body' => 'Mình sẽ tăng độ đậm của nút ở bản sau. Góp ý này chỉ thuộc v1, không chuyển sang v2.', 'created_at' => '2026-03-02T04:00:00.000Z']
            ],
            'status_history' => [
                ['id' => 'ann-01-open', 'status' => 'open', 'user_id' => 'user-binh', 'created_at' => '2026-03-02T02:15:00.000Z', 'note' => 'Tạo góp ý']
            ]
        ],
        [
            'id' => 'ann-02',
            'project_id' => 'proj-shop',
            'screen_id' => 'scr-signup',
            'image_version_id' => 'ver-signup-1',
            'type' => 'rect',
            'x' => 64,
            'y' => 160,
            'w' => 520,
            'h' => 220,
            'author_id' => 'user-an',
            'body' => 'Nhóm ô nhập bên trái còn thiếu thông báo lỗi ngay dưới ô mật khẩu.',
            'status' => 'open',
            'revision' => 1,
            'check_note' => '',
            'created_at' => '2026-03-02T02:40:00.000Z',
            'updated_at' => '2026-03-02T02:40:00.000Z',
            'replies' => [],
            'status_history' => [
                ['id' => 'ann-02-open', 'status' => 'open', 'user_id' => 'user-an', 'created_at' => '2026-03-02T02:40:00.000Z', 'note' => 'Tạo góp ý']
            ]
        ],
        [
            'id' => 'ann-03',
            'project_id' => 'proj-shop',
            'screen_id' => 'scr-signup',
            'image_version_id' => 'ver-signup-1',
            'type' => 'point',
            'x' => 120,
            'y' => 34,
            'w' => 0,
            'h' => 0,
            'author_id' => 'user-chi',
            'body' => 'Tên thương hiệu trên thanh đầu trang hơi khó nhận ra khi nhìn nhanh.',
            'status' => 'resolved',
            'revision' => 2,
            'check_note' => '',
            'created_at' => '2026-03-02T03:10:00.000Z',
            'updated_at' => '2026-03-03T01:20:00.000Z',
            'replies' => [
                ['id' => 'rep-03', 'author_id' => 'user-binh', 'body' => 'Có thể tăng cỡ chữ logo, không cần đổi vị trí điều hướng.', 'created_at' => '2026-03-02T06:00:00.000Z']
            ],
            'status_history' => [
                ['id' => 'ann-03-open', 'status' => 'open', 'user_id' => 'user-chi', 'created_at' => '2026-03-02T03:10:00.000Z', 'note' => 'Tạo góp ý'],
                ['id' => 'ann-03-resolved', 'status' => 'resolved', 'user_id' => 'user-an', 'created_at' => '2026-03-03T01:20:00.000Z', 'note' => 'Đã xử lý']
            ]
        ],
        [
            'id' => 'ann-04',
            'project_id' => 'proj-shop',
            'screen_id' => 'scr-signup',
            'image_version_id' => 'ver-signup-1',
            'type' => 'rect',
            'x' => 640,
            'y' => 210,
            'w' => 280,
            'h' => 100,
            'author_id' => 'user-binh',
            'body' => 'Khối ghi chú dưới nút Đăng ký đang tách khỏi hành động chính.',
            'status' => 'open',
            'revision' => 1,
            'check_note' => '',
            'created_at' => '2026-03-02T05:05:00.000Z',
            'updated_at' => '2026-03-02T05:05:00.000Z',
            'replies' => [],
            'status_history' => [
                ['id' => 'ann-04-open', 'status' => 'open', 'user_id' => 'user-binh', 'created_at' => '2026-03-02T05:05:00.000Z', 'note' => 'Tạo góp ý']
            ]
        ],
        [
            'id' => 'ann-05',
            'project_id' => 'proj-shop',
            'screen_id' => 'scr-signup',
            'image_version_id' => 'ver-signup-2',
            'type' => 'point',
            'x' => 248,
            'y' => 418,
            'w' => 0,
            'h' => 0,
            'author_id' => 'user-an',
            'body' => 'Nút Đăng ký đã chuyển xuống cuối form. Cần kiểm tra khoảng cách với mép dưới.',
            'status' => 'open',
            'revision' => 1,
            'check_note' => '',
            'created_at' => '2026-03-08T02:00:00.000Z',
            'updated_at' => '2026-03-08T02:00:00.000Z',
            'replies' => [],
            'status_history' => [
                ['id' => 'ann-05-open', 'status' => 'open', 'user_id' => 'user-an', 'created_at' => '2026-03-08T02:00:00.000Z', 'note' => 'Tạo góp ý']
            ]
        ],
        [
            'id' => 'ann-06',
            'project_id' => 'proj-shop',
            'screen_id' => 'scr-signup',
            'image_version_id' => 'ver-signup-2',
            'type' => 'rect',
            'x' => 250,
            'y' => 124,
            'w' => 500,
            'h' => 250,
            'author_id' => 'user-binh',
            'body' => 'Nhóm trường thông tin ở bố cục một cột đã gọn hơn, có thể chốt hướng này.',
            'status' => 'resolved',
            'revision' => 2,
            'check_note' => 'Đã kiểm tra bố cục một cột trên khung 1000×500.',
            'created_at' => '2026-03-08T02:30:00.000Z',
            'updated_at' => '2026-03-08T07:00:00.000Z',
            'replies' => [
                ['id' => 'rep-06', 'author_id' => 'user-an', 'body' => 'Đã ghi nhận. Giữ form một cột cho bản bàn giao.', 'created_at' => '2026-03-08T06:10:00.000Z']
            ],
            'status_history' => [
                ['id' => 'ann-06-open', 'status' => 'open', 'user_id' => 'user-binh', 'created_at' => '2026-03-08T02:30:00.000Z', 'note' => 'Tạo góp ý'],
                ['id' => 'ann-06-resolved', 'status' => 'resolved', 'user_id' => 'user-an', 'created_at' => '2026-03-08T07:00:00.000Z', 'note' => 'Đã xử lý']
            ]
        ],
        [
            'id' => 'ann-07',
            'project_id' => 'proj-shop',
            'screen_id' => 'scr-home',
            'image_version_id' => 'ver-home-1',
            'type' => 'point',
            'x' => 500,
            'y' => 168,
            'w' => 0,
            'h' => 0,
            'author_id' => 'user-binh',
            'body' => 'Tiêu đề hero đang lệch khỏi trục nội dung chính bên trái.',
            'status' => 'open',
            'revision' => 1,
            'check_note' => '',
            'created_at' => '2026-03-04T01:15:00.000Z',
            'updated_at' => '2026-03-04T01:15:00.000Z',
            'replies' => [],
            'status_history' => [
                ['id' => 'ann-07-open', 'status' => 'open', 'user_id' => 'user-binh', 'created_at' => '2026-03-04T01:15:00.000Z', 'note' => 'Tạo góp ý']
            ]
        ],
        [
            'id' => 'ann-08',
            'project_id' => 'proj-shop',
            'screen_id' => 'scr-home',
            'image_version_id' => 'ver-home-1',
            'type' => 'rect',
            'x' => 48,
            'y' => 250,
            'w' => 280,
            'h' => 180,
            'author_id' => 'user-an',
            'body' => 'Thẻ sản phẩm đầu tiên thiếu giá và nút xem chi tiết.',
            'status' => 'open',
            'revision' => 1,
            'check_note' => '',
            'created_at' => '2026-03-04T01:40:00.000Z',
            'updated_at' => '2026-03-04T01:40:00.000Z',
            'replies' => [],
            'status_history' => [
                ['id' => 'ann-08-open', 'status' => 'open', 'user_id' => 'user-an', 'created_at' => '2026-03-04T01:40:00.000Z', 'note' => 'Tạo góp ý']
            ]
        ],
        [
            'id' => 'ann-09',
            'project_id' => 'proj-shop',
            'screen_id' => 'scr-home',
            'image_version_id' => 'ver-home-1',
            'type' => 'point',
            'x' => 900,
            'y' => 34,
            'w' => 0,
            'h' => 0,
            'author_id' => 'user-an',
            'body' => 'Mục tài khoản trên thanh điều hướng chưa có trạng thái đang đăng nhập.',
            'status' => 'resolved',
            'revision' => 2,
            'check_note' => '',
            'created_at' => '2026-03-04T03:00:00.000Z',
            'updated_at' => '2026-03-05T02:00:00.000Z',
            'replies' => [],
            'status_history' => [
                ['id' => 'ann-09-open', 'status' => 'open', 'user_id' => 'user-an', 'created_at' => '2026-03-04T03:00:00.000Z', 'note' => 'Tạo góp ý'],
                ['id' => 'ann-09-resolved', 'status' => 'resolved', 'user_id' => 'user-binh', 'created_at' => '2026-03-05T02:00:00.000Z', 'note' => 'Đã xử lý']
            ]
        ],
        [
            'id' => 'ann-10',
            'project_id' => 'proj-shop',
            'screen_id' => 'scr-home',
            'image_version_id' => 'ver-home-2',
            'type' => 'point',
            'x' => 180,
            'y' => 86,
            'w' => 0,
            'h' => 0,
            'author_id' => 'user-chi',
            'body' => 'Banner khuyến mãi chiếm nhiều chiều cao, cân nhắc thu gọn trên màn hình nhỏ.',
            'status' => 'open',
            'revision' => 1,
            'check_note' => '',
            'created_at' => '2026-03-11T02:20:00.000Z',
            'updated_at' => '2026-03-11T02:20:00.000Z',
            'replies' => [],
            'status_history' => [
                ['id' => 'ann-10-open', 'status' => 'open', 'user_id' => 'user-chi', 'created_at' => '2026-03-11T02:20:00.000Z', 'note' => 'Tạo góp ý']
            ]
        ],
        [
            'id' => 'ann-11',
            'project_id' => 'proj-shop',
            'screen_id' => 'scr-home',
            'image_version_id' => 'ver-home-2',
            'type' => 'rect',
            'x' => 520,
            'y' => 240,
            'w' => 420,
            'h' => 160,
            'author_id' => 'user-binh',
            'body' => 'Hai thẻ bên phải còn khoảng trống không đều so với khối hero.',
            'status' => 'open',
            'revision' => 1,
            'check_note' => '',
            'created_at' => '2026-03-11T03:05:00.000Z',
            'updated_at' => '2026-03-11T05:40:00.000Z',
            'replies' => [
                ['id' => 'rep-11', 'author_id' => 'user-an', 'body' => 'Mình sẽ chỉnh lưới ở vòng thiết kế sau, không sửa trực tiếp ảnh này.', 'created_at' => '2026-03-11T05:40:00.000Z']
            ],
            'status_history' => [
                ['id' => 'ann-11-open', 'status' => 'open', 'user_id' => 'user-binh', 'created_at' => '2026-03-11T03:05:00.000Z', 'note' => 'Tạo góp ý']
            ]
        ],
        [
            'id' => 'ann-12',
            'project_id' => 'proj-shop',
            'screen_id' => 'scr-pay',
            'image_version_id' => 'ver-pay-1',
            'type' => 'point',
            'x' => 820,
            'y' => 400,
            'w' => 0,
            'h' => 0,
            'author_id' => 'user-an',
            'body' => 'Nút Thanh toán nằm sát mép, dễ bấm nhầm khi cuộn trên màn hình nhỏ.',
            'status' => 'open',
            'revision' => 1,
            'check_note' => '',
            'created_at' => '2026-03-06T08:00:00.000Z',
            'updated_at' => '2026-03-06T08:00:00.000Z',
            'replies' => [],
            'status_history' => [
                ['id' => 'ann-12-open', 'status' => 'open', 'user_id' => 'user-an', 'created_at' => '2026-03-06T08:00:00.000Z', 'note' => 'Tạo góp ý']
            ]
        ],
        [
            'id' => 'ann-13',
            'project_id' => 'proj-shop',
            'screen_id' => 'scr-pay',
            'image_version_id' => 'ver-pay-1',
            'type' => 'rect',
            'x' => 48,
            'y' => 88,
            'w' => 460,
            'h' => 280,
            'author_id' => 'user-binh',
            'body' => 'Tóm tắt đơn hàng đã rõ ràng, có thể giữ bố cục này.',
            'status' => 'resolved',
            'revision' => 2,
            'check_note' => 'Giữ nguyên khối tóm tắt đơn.',
            'created_at' => '2026-03-06T08:30:00.000Z',
            'updated_at' => '2026-03-06T10:00:00.000Z',
            'replies' => [],
            'status_history' => [
                ['id' => 'ann-13-open', 'status' => 'open', 'user_id' => 'user-binh', 'created_at' => '2026-03-06T08:30:00.000Z', 'note' => 'Tạo góp ý'],
                ['id' => 'ann-13-resolved', 'status' => 'resolved', 'user_id' => 'user-an', 'created_at' => '2026-03-06T10:00:00.000Z', 'note' => 'Đã xử lý']
            ]
        ],
        [
            'id' => 'ann-14',
            'project_id' => 'proj-shop',
            'screen_id' => 'scr-pay',
            'image_version_id' => 'ver-pay-2',
            'type' => 'point',
            'x' => 160,
            'y' => 170,
            'w' => 0,
            'h' => 0,
            'author_id' => 'user-binh',
            'body' => 'Phương thức ví điện tử cần trạng thái được chọn rõ hơn cả về chữ lẫn viền.',
            'status' => 'open',
            'revision' => 1,
            'check_note' => '',
            'created_at' => '2026-03-12T01:10:00.000Z',
            'updated_at' => '2026-03-12T02:00:00.000Z',
            'replies' => [
                ['id' => 'rep-14', 'author_id' => 'user-an', 'body' => 'Sẽ thêm nhãn Đang được chọn và viền indigo.', 'created_at' => '2026-03-12T02:00:00.000Z']
            ],
            'status_history' => [
                ['id' => 'ann-14-open', 'status' => 'open', 'user_id' => 'user-binh', 'created_at' => '2026-03-12T01:10:00.000Z', 'note' => 'Tạo góp ý']
            ]
        ],
        [
            'id' => 'ann-15',
            'project_id' => 'proj-ops',
            'screen_id' => 'scr-dash',
            'image_version_id' => 'ver-dash-1',
            'type' => 'point',
            'x' => 250,
            'y' => 140,
            'w' => 0,
            'h' => 0,
            'author_id' => 'user-an',
            'body' => 'Số liệu doanh thu chưa có đơn vị tiền tệ nên dễ hiểu nhầm.',
            'status' => 'open',
            'revision' => 1,
            'check_note' => '',
            'created_at' => '2026-03-07T01:00:00.000Z',
            'updated_at' => '2026-03-07T01:00:00.000Z',
            'replies' => [],
            'status_history' => [
                ['id' => 'ann-15-open', 'status' => 'open', 'user_id' => 'user-an', 'created_at' => '2026-03-07T01:00:00.000Z', 'note' => 'Tạo góp ý']
            ]
        ],
        [
            'id' => 'ann-16',
            'project_id' => 'proj-ops',
            'screen_id' => 'scr-dash',
            'image_version_id' => 'ver-dash-1',
            'type' => 'rect',
            'x' => 520,
            'y' => 96,
            'w' => 440,
            'h' => 200,
            'author_id' => 'user-chi',
            'body' => 'Khối biểu đồ đã đủ khoảng trắng, có thể giữ tỷ lệ này.',
            'status' => 'resolved',
            'revision' => 2,
            'check_note' => '',
            'created_at' => '2026-03-07T01:30:00.000Z',
            'updated_at' => '2026-03-07T04:15:00.000Z',
            'replies' => [],
            'status_history' => [
                ['id' => 'ann-16-open', 'status' => 'open', 'user_id' => 'user-chi', 'created_at' => '2026-03-07T01:30:00.000Z', 'note' => 'Tạo góp ý'],
                ['id' => 'ann-16-resolved', 'status' => 'resolved', 'user_id' => 'user-an', 'created_at' => '2026-03-07T04:15:00.000Z', 'note' => 'Đã xử lý']
            ]
        ],
        [
            'id' => 'ann-17',
            'project_id' => 'proj-ops',
            'screen_id' => 'scr-dash',
            'image_version_id' => 'ver-dash-2',
            'type' => 'point',
            'x' => 900,
            'y' => 52,
            'w' => 0,
            'h' => 0,
            'author_id' => 'user-binh',
            'body' => 'Cảnh báo hệ thống nên có nút đóng và không chỉ dựa vào ký hiệu nhân.',
            'status' => 'open',
            'revision' => 1,
            'check_note' => '',
            'created_at' => '2026-03-15T03:20:00.000Z',
            'updated_at' => '2026-03-15T03:20:00.000Z',
            'replies' => [],
            'status_history' => [
                ['id' => 'ann-17-open', 'status' => 'open', 'user_id' => 'user-binh', 'created_at' => '2026-03-15T03:20:00.000Z', 'note' => 'Tạo góp ý']
            ]
        ],
        [
            'id' => 'ann-18',
            'project_id' => 'proj-ops',
            'screen_id' => 'scr-orders',
            'image_version_id' => 'ver-orders-1',
            'type' => 'rect',
            'x' => 40,
            'y' => 96,
            'w' => 920,
            'h' => 48,
            'author_id' => 'user-an',
            'body' => 'Hàng tiêu đề bảng thiếu tương phản so với nền trang.',
            'status' => 'open',
            'revision' => 1,
            'check_note' => '',
            'created_at' => '2026-03-09T02:45:00.000Z',
            'updated_at' => '2026-03-09T02:45:00.000Z',
            'replies' => [],
            'status_history' => [
                ['id' => 'ann-18-open', 'status' => 'open', 'user_id' => 'user-an', 'created_at' => '2026-03-09T02:45:00.000Z', 'note' => 'Tạo góp ý']
            ]
        ],
        [
            'id' => 'ann-19',
            'project_id' => 'proj-ops',
            'screen_id' => 'scr-orders',
            'image_version_id' => 'ver-orders-1',
            'type' => 'point',
            'x' => 916,
            'y' => 30,
            'w' => 0,
            'h' => 0,
            'author_id' => 'user-binh',
            'body' => 'Nút Xuất trên thanh công cụ dễ bị hiểu là xuất góp ý. Nên đổi thành Xuất đơn.',
            'status' => 'resolved',
            'revision' => 2,
            'check_note' => '',
            'created_at' => '2026-03-09T03:10:00.000Z',
            'updated_at' => '2026-03-09T06:00:00.000Z',
            'replies' => [
                ['id' => 'rep-19', 'author_id' => 'user-an', 'body' => 'Đổi nhãn thành Xuất đơn ở phiên bản sau.', 'created_at' => '2026-03-09T04:20:00.000Z']
            ],
            'status_history' => [
                ['id' => 'ann-19-open', 'status' => 'open', 'user_id' => 'user-binh', 'created_at' => '2026-03-09T03:10:00.000Z', 'note' => 'Tạo góp ý'],
                ['id' => 'ann-19-resolved', 'status' => 'resolved', 'user_id' => 'user-an', 'created_at' => '2026-03-09T06:00:00.000Z', 'note' => 'Đã xử lý']
            ]
        ],
        [
            'id' => 'ann-20',
            'project_id' => 'proj-ops',
            'screen_id' => 'scr-orders',
            'image_version_id' => 'ver-orders-2',
            'type' => 'point',
            'x' => 520,
            'y' => 214,
            'w' => 0,
            'h' => 0,
            'author_id' => 'user-an',
            'body' => 'Hàng được chọn chưa có chú thích trạng thái sau khi mở lại góp ý.',
            'status' => 'open',
            'revision' => 3,
            'check_note' => '',
            'created_at' => '2026-03-16T01:00:00.000Z',
            'updated_at' => '2026-03-17T02:30:00.000Z',
            'replies' => [],
            'status_history' => [
                ['id' => 'ann-20-open', 'status' => 'open', 'user_id' => 'user-an', 'created_at' => '2026-03-16T01:00:00.000Z', 'note' => 'Tạo góp ý'],
                ['id' => 'ann-20-resolved', 'status' => 'resolved', 'user_id' => 'user-binh', 'created_at' => '2026-03-16T08:00:00.000Z', 'note' => 'Đã xử lý'],
                ['id' => 'ann-20-reopen', 'status' => 'open', 'user_id' => 'user-an', 'created_at' => '2026-03-17T02:30:00.000Z', 'note' => 'Mở lại']
            ]
        ]
    ];

    $stmtAnn = $pdo->prepare("INSERT INTO annotations (id, project_id, screen_id, image_version_id, type, x, y, w, h, original_width, original_height, author_id, body, status, revision, check_note, created_at, updated_at) VALUES (:id, :project_id, :screen_id, :image_version_id, :type, :x, :y, :w, :h, 1000, 500, :author_id, :body, :status, :revision, :check_note, :created_at, :updated_at)");
    $stmtRep = $pdo->prepare("INSERT INTO annotation_replies (id, annotation_id, author_id, body, created_at) VALUES (:id, :annotation_id, :author_id, :body, :created_at)");
    $stmtHis = $pdo->prepare("INSERT INTO annotation_status_events (id, annotation_id, status, user_id, note, created_at) VALUES (:id, :annotation_id, :status, :user_id, :note, :created_at)");

    foreach ($annotations as $a) {
        $stmtAnn->execute([
            ':id' => $a['id'],
            ':project_id' => $a['project_id'],
            ':screen_id' => $a['screen_id'],
            ':image_version_id' => $a['image_version_id'],
            ':type' => $a['type'],
            ':x' => $a['x'],
            ':y' => $a['y'],
            ':w' => $a['w'],
            ':h' => $a['h'],
            ':author_id' => $a['author_id'],
            ':body' => $a['body'],
            ':status' => $a['status'],
            ':revision' => $a['revision'],
            ':check_note' => $a['check_note'],
            ':created_at' => $a['created_at'],
            ':updated_at' => $a['updated_at']
        ]);
        foreach ($a['replies'] as $rep) {
            $stmtRep->execute([
                ':id' => $rep['id'],
                ':annotation_id' => $a['id'],
                ':author_id' => $rep['author_id'],
                ':body' => $rep['body'],
                ':created_at' => $rep['created_at']
            ]);
        }
        foreach ($a['status_history'] as $sh) {
            $stmtHis->execute([
                ':id' => $sh['id'],
                ':annotation_id' => $a['id'],
                ':status' => $sh['status'],
                ':user_id' => $sh['user_id'],
                ':note' => $sh['note'],
                ':created_at' => $sh['created_at']
            ]);
        }
    }

    // 7. Activities
    $activities = [
        ['id' => 'act-01', 'project_id' => 'proj-shop', 'user_id' => 'user-an', 'type' => 'project.created', 'message' => 'đã tạo dự án Cửa hàng DesignMark', 'created_at' => '2026-02-12T08:00:00.000Z'],
        ['id' => 'act-02', 'project_id' => 'proj-shop', 'user_id' => 'user-an', 'type' => 'version.created', 'message' => 'đã tải màn hình Đăng ký tài khoản, phiên bản v1', 'created_at' => '2026-02-12T08:40:00.000Z'],
        ['id' => 'act-03', 'project_id' => 'proj-shop', 'user_id' => 'user-an', 'type' => 'version.created', 'message' => 'đã tải phiên bản v2 cho màn hình Đăng ký tài khoản', 'created_at' => '2026-03-08T01:00:00.000Z'],
        ['id' => 'act-04', 'project_id' => 'proj-shop', 'user_id' => 'user-binh', 'type' => 'comment.created', 'message' => 'đã thêm nhận xét trên Đăng ký tài khoản v1', 'created_at' => '2026-03-02T02:15:00.000Z'],
        ['id' => 'act-05', 'project_id' => 'proj-shop', 'user_id' => 'user-an', 'type' => 'comment.replied', 'message' => 'đã trả lời một góp ý trên Đăng ký tài khoản v1', 'created_at' => '2026-03-02T04:00:00.000Z'],
        ['id' => 'act-06', 'project_id' => 'proj-shop', 'user_id' => 'user-an', 'type' => 'comment.status', 'message' => 'đã đánh dấu một góp ý là đã xử lý', 'created_at' => '2026-03-03T01:20:00.000Z'],
        ['id' => 'act-07', 'project_id' => 'proj-ops', 'user_id' => 'user-an', 'type' => 'project.created', 'message' => 'đã tạo dự án Bảng điều khiển nội bộ', 'created_at' => '2026-02-20T09:00:00.000Z'],
        ['id' => 'act-08', 'project_id' => 'proj-ops', 'user_id' => 'user-an', 'type' => 'version.created', 'message' => 'đã tải màn hình Danh sách đơn, phiên bản v1', 'created_at' => '2026-02-21T09:20:00.000Z'],
        ['id' => 'act-09', 'project_id' => 'proj-ops', 'user_id' => 'user-an', 'type' => 'version.created', 'message' => 'đã tải phiên bản v2 cho màn hình Danh sách đơn', 'created_at' => '2026-03-16T00:30:00.000Z'],
        ['id' => 'act-10', 'project_id' => 'proj-ops', 'user_id' => 'user-binh', 'type' => 'comment.status', 'message' => 'đã đánh dấu một góp ý là đã xử lý', 'created_at' => '2026-03-16T08:00:00.000Z'],
        ['id' => 'act-11', 'project_id' => 'proj-ops', 'user_id' => 'user-an', 'type' => 'comment.status', 'message' => 'đã mở lại một góp ý trên Danh sách đơn v2', 'created_at' => '2026-03-17T02:30:00.000Z']
    ];
    $stmtAct = $pdo->prepare("INSERT INTO activities (id, project_id, user_id, type, message, created_at) VALUES (:id, :project_id, :user_id, :type, :message, :created_at)");
    foreach ($activities as $act) {
        $stmtAct->execute($act);
    }

    return true;
}
