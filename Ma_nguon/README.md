# Lab 03 — Hiển thị sự kiện, tìm kiếm và xử lý form

Mã mẫu cho phần hướng dẫn và mã khởi đầu cho bài tự làm.

## Mở bài

Mở terminal Ubuntu/WSL tại thư mục chứa `lab.sh`. Dùng PHP từ 8.1 và Git. Hướng dẫn chi tiết, sơ đồ, đoạn mã cần sửa, dữ liệu đối chiếu và rubric nằm trong tài liệu của bài lab.

```bash
bash lab.sh check
bash lab.sh run
```

Mở http://127.0.0.1:8103. Giữ terminal máy chủ hoạt động; dùng terminal thứ hai để kiểm thử. Nhấn Ctrl+C để dừng.

Bài này không cần PostgreSQL, Composer hoặc framework.

## Kiểm tra bài

```bash
bash lab.sh test
bash lab.sh extend
```

`test` kiểm tra phần mẫu; `extend` kiểm tra phần tự làm. Các vị trí TODO là nhiệm vụ cần hoàn thiện; không sửa test để bỏ qua lỗi.

Kết quả mở rộng cần đạt: `TESTS=8 FAILED=0`. Có trang danh sách, bộ lọc theo từ khóa/loại/còn chỗ và Form đăng ký kiểm tra phía máy chủ. Dữ liệu đăng ký hợp lệ hiển thị ở mức xem trước, chưa lưu CSDL.

## Tệp nộp

Giữ mã nguồn, dữ liệu mẫu và kiểm thử. Ghi lại lệnh chạy trong README. Không đưa `.local`, mật khẩu hoặc dữ liệu cá nhân thật vào kho mã và gói nộp. Nộp đúng commit theo yêu cầu của bài; nếu dùng Actions, đính kèm lần chạy tương ứng.


## Phần trình bày giao diện

Lab này giữ CSS cục bộ tại `public/assets/css/app.css`. HTML nằm trong `public/`; các lab có nhiều trang dùng `templates/header.php` và `templates/footer.php`. Có thể lần từ các lớp `form-field`, `event-item`, `error-summary` sang CSS để đọc cách trình bày; Lab01 chỉ dùng phần trang giới thiệu.

Các lớp, nhãn và bố cục chỉ phục vụ hiển thị. Giữ nguyên khối PHP, GET/POST, tên trường, giá trị option, hidden input và thuộc tính kiểm tra đầu vào khi thực hành. Không cần JavaScript, thư viện hoặc bước build mới để chạy giao diện.


## Giao diện Material 3

Màu và kiểu chữ nằm trong `public/assets/css/tokens.css`; bố cục trong `app.css`. Không có bước build hoặc thư viện mới.

Ba lớp được tách rõ:

- `/`: sự kiện gốc của lab; tập kết quả, bộ lọc và form nghiệp vụ giữ nguyên.
- `/event.php?id=1`: chi tiết chỉ đọc, bổ sung metadata hư cấu từ `data/event-content.php`. CTA mở `/register.php` không kèm tham số mới.
- `/ui-demo.php`: sáu sự kiện hư cấu, ID `demo-...` từ `data/ui-demo-events.php`. `/ticket-preview.php?id=demo-open-source` chỉ thử vé/ghế trong bộ nhớ trang, không có form hoặc API ghi dữ liệu.

Khu thử có 96 ghế cố định, 68 khả dụng (16 VIP và 52 Tiêu chuẩn). Hai vé VIP mẫu 350.000 đồng cho tổng 700.000 đồng. Đổi hạng, đổi sự kiện hoặc tải lại sẽ bỏ lựa chọn không phù hợp; không có trạng thái đã giữ chỗ.

Ảnh SVG tự tạo, lưu cục bộ và ghi quyền CC0 trong `public/assets/images/LICENSE.txt`. `presentation.js` chỉ xử lý ảnh lỗi; `ticket-preview.js` chỉ chạy trên trang thử. Khi tắt JavaScript, vẫn đọc được nội dung và dùng form lab như cũ; khu chọn thử được khóa kèm giải thích.

Không đưa ID demo, vé hoặc ghế vào form, Session, Cookie, CSDL hoặc test cũ. TODO sinh viên và đáp án giữ nguyên khác biệt. Không có backend bán vé, thanh toán hoặc gửi email.


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
