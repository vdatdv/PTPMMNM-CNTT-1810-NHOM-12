# Lab03 — Bài thực hành dành cho sinh viên

Nhánh này chỉ chứa một bài lab. Dùng Ubuntu/WSL, PHP từ 8.1 và Git.

Không cần PostgreSQL hoặc Composer.

## Chuẩn bị trên Ubuntu/WSL

```bash
sudo apt update
sudo apt install php-cli git unzip
php -v
git --version
```

PHP cần từ 8.1 trở lên. Các lệnh bên dưới chạy trong Ubuntu/WSL. Khi tải nhiều bài, trở về thư mục cha chứa các thư mục lab trước mỗi lệnh clone; không clone bài tiếp theo bên trong `Ma_nguon` của bài trước.

## Tải bài

```bash
git clone --single-branch --branch lab3 https://github.com/FIT-DNU/Open-Source-Software-Development.git lab3
cd lab3/Ma_nguon
```

## Chạy bài

```bash
bash lab.sh check
bash lab.sh run
```

Mở [danh sách sự kiện](http://127.0.0.1:8103/) hoặc [form đăng ký](http://127.0.0.1:8103/register.php). Giữ terminal mở; Ctrl+C để dừng.

## Kiểm tra

Mở terminal thứ hai tại Ma_nguon, hoặc dừng máy chủ trước:

```bash
bash lab.sh test
bash lab.sh extend
```

test kiểm tra phần mẫu; extend kiểm tra phần tự làm. Sinh viên cần hoàn thiện TODO; extend có thể chưa đạt ở bản khởi đầu.

[Hướng dẫn đầy đủ](HUONG_DAN.md) · [Hướng dẫn mã nguồn](Ma_nguon/README.md)

Không đưa .local, mật khẩu hoặc dữ liệu cá nhân thật vào bài nộp.

## Các bài khác

[Lab01](https://github.com/FIT-DNU/Open-Source-Software-Development/tree/lab1) · [Lab02](https://github.com/FIT-DNU/Open-Source-Software-Development/tree/lab2) · [Lab03](https://github.com/FIT-DNU/Open-Source-Software-Development/tree/lab3) · [Lab04](https://github.com/FIT-DNU/Open-Source-Software-Development/tree/lab4) · [Lab05](https://github.com/FIT-DNU/Open-Source-Software-Development/tree/lab5)

Kết quả yêu cầu của phần mẫu: `TESTS=7 FAILED=0`. `check` chỉ kiểm tra môi trường. `extend` ở bản khởi đầu còn ca chưa đạt vì TODO; không sửa test để bỏ qua lỗi.

## Tự kiểm tra luồng trên trình duyệt

1. Trên danh sách, tìm `php`: có 1 sự kiện. Tìm `xyz`: không có kết quả.
2. Chọn **Đăng ký tham dự**, gửi form trống: thấy lỗi họ tên/email.
3. Nhập tên và email thử nghiệm hợp lệ, nhấn **Kiểm tra**: thấy `PREVIEW_OK`. Đây chỉ là xem trước, chưa lưu Session hoặc CSDL.
4. Chọn **Danh sách sự kiện** để quay lại. Bộ lọc nâng cao là phần TODO, sinh viên cần tự hoàn thiện.


## Giao diện Material 3 và khu thử riêng

Sau `bash lab.sh run`, mở [sự kiện mẫu](http://127.0.0.1:8103/ui-demo.php) hoặc [thử vé/ghế](http://127.0.0.1:8103/ticket-preview.php?id=demo-open-source). Sáu sự kiện hư cấu và ảnh SVG cục bộ có giấy phép CC0. Không cần cài thêm thư viện hoặc build.

Chi tiết sự kiện lab tại `/event.php?id=1` chỉ đọc; nút mở biểu mẫu vẫn dùng chức năng gốc. Lựa chọn demo chỉ ở bộ nhớ trang, tải lại sẽ xóa; chưa giữ ghế, tạo vé hoặc thanh toán. ID demo không đi vào Form/CSDL. TODO và các ca `extend` sinh viên vẫn giữ nguyên.

Xem [hướng dẫn phần trình bày](Ma_nguon/README.md#giao-diện-material-3).

Kiểm tra dữ liệu UI riêng (không thay test gốc, không cần CSDL): tại `Ma_nguon`, chạy `php tests/ui-demo.php`.


## Bản hoàn thiện trên macOS Intel (VS Code)

Mã được lấy từ `origin/lab3` có sẵn trong kho Git và đặt tại `Lab03/`,
không chuyển nhánh hiện tại. `HUONG_DAN.md`, tài liệu Word và bộ test gốc
được giữ nguyên. Bộ lọc mở rộng đã hoàn thiện trong bản bàn giao này.

Mở `Lab03/Ma_nguon` bằng **File → Open Folder** trong VS Code, rồi chọn
**Terminal → New Terminal**. Terminal zsh trên macOS chạy được `bash lab.sh`.
Không chạy lệnh `apt` trong tài liệu Ubuntu. Kiểm tra công cụ trước:

```bash
php -v
git --version
```

Cần PHP >= 8.1; nếu đã có thì không cài lại. Nếu thiếu, có thể dùng Homebrew
trên Mac Intel để cài PHP/Git, rồi mở lại terminal. Không cần database,
Composer, framework hoặc bước build.

Tại `Lab03/Ma_nguon`:

```bash
bash lab.sh check
bash lab.sh test
bash lab.sh extend
php tests/ui-demo.php
bash lab.sh run
```

Mở http://127.0.0.1:8103 và http://127.0.0.1:8103/register.php.
Giữ terminal máy chủ mở; dùng terminal thứ hai để test. Dừng bằng Ctrl+C.
Nếu cổng đã được dùng, dừng máy chủ cũ trước khi chạy lại.

Kết quả thực tế trên PHP 8.5.11, Git 2.56.0:

- `check`: `MOI_TRUONG=SAN_SANG | Lab 3`.
- `test`: `TESTS=7 FAILED=0`.
- `extend`: `TESTS=8 FAILED=0`.
- UI: `DEMO_DATA_ASSERTIONS=PASS | EVENTS=6 | SEATS=96 | AVAILABLE=68 | VIP=16 | STANDARD=52`.

Đối chiếu bộ lọc: không lọc → 1,2,3; php → 1; tech → 1,3;
còn chỗ → 1,3; Git + tech + còn chỗ → 3; design + còn chỗ → rỗng;
loại không tồn tại → rỗng. Các điều kiện được giữ sau GET.

`filterEvents()` duyệt mảng và tạo mảng kết quả mới. Mỗi sự kiện phải khớp
cả từ khóa (`stripos(...) !== false`), loại và điều kiện
`registered < capacity` khi bật chỉ còn chỗ. Vị trí 0 vẫn khớp;
không thay đổi dữ liệu gốc. Từ khóa rỗng/loại rỗng bỏ qua điều kiện tương ứng.

Trang đăng ký chỉ validation khi POST: ID phải có trong dữ liệu gốc,
tên không rỗng/tối đa 120 byte/không chứa NUL, email đúng định dạng/tối đa
200 byte. Email được chuyển chữ thường theo quy ước đề. Khi sai, giữ tên,
email và lựa chọn sự kiện hợp lệ; hiển thị mã lỗi cùng hướng dẫn tiếng Việt.
Khi đúng, hiển thị `PREVIEW_OK`, chưa lưu dữ liệu. Dữ liệu đưa vào HTML dùng
`e()` để escape. `field()` loại đầu vào dạng mảng và trim chuỗi.

Thử tên `<b>Demo</b>`, email `demo@example.test`: HTML phải hiện nguyên văn.
Thử tên trống/email `bad`: có lỗi, không có `PREVIEW_OK`.
Demo độc lập tại `/ui-demo.php`, `/event.php?id=demo-open-source`,
`/ticket-preview.php?id=demo-open-source`; ID demo không được đăng ký thật.
Chưa xác minh trực quan bằng VS Code/trình duyệt hoặc tương tác JavaScript vé/ghế.
Chưa chạy trên từng phiên bản PHP 8.1–8.4; đã lint toàn bộ PHP bằng 8.5.11.

Bàn giao giữ đủ `Lab03/Ma_nguon`, dữ liệu, test và tài liệu gốc. `.local/`
được bỏ qua bởi `.gitignore`; không thêm mật khẩu, cấu hình riêng hoặc thông tin
cá nhân. Không sửa test, không commit/push hoặc thay đổi remote.
