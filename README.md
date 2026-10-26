# PHÁT TRIỂN PHẦN MỀM MÃ NGUỒN MỞ — BÀI THỰC HÀNH LAB 05 (POSTGRESQL)

## NHÓM 12 - CNTT 1810

**Trường:** Đại học Đại Nam  
**Môn học:** Phát triển phần mềm mã nguồn mở  
**Đề tài 15:** DesignMark — Ứng dụng góp ý trực tiếp trên hình ảnh và bản thiết kế giao diện

### Thành viên nhóm

| STT | Họ và tên      | Mã sinh viên | Vai trò |
| --- | -------------- | ------------ | --- |
| 1   | Đỗ Vinh Đạt    | 1871020126   | Nhóm trưởng |
| 2   | Vương Xuân Sơn | 1871020502   | Thành viên |
| 3   | Nguyễn Phú Duy | 1871020196   | Thành viên |

---

# DesignMark

DesignMark là ứng dụng web để góp ý trực tiếp trên ảnh và bản thiết kế giao diện. Người thiết kế tổ chức ảnh theo dự án, màn hình và phiên bản. Người duyệt đặt điểm hoặc khoanh vùng trên ảnh, viết nhận xét đúng vị trí, trả lời trong thread và theo dõi trạng thái xử lý. Hỗ trợ cơ sở dữ liệu Supabase PostgreSQL Cloud và CSDL cục bộ SQLite siêu tốc khi mạng yếu.

## Mục tiêu

- Góp ý theo tọa độ pixel của ảnh gốc, không lệch khi phóng to, thu nhỏ, cuộn hoặc đổi kích thước cửa sổ.
- Giữ annotation đúng phiên bản ảnh. Góp ý của v1 không tự chuyển sang v2.
- Quản lý vai trò demo: Quản lý, Góp ý, Chỉ xem.
- So sánh hai phiên bản và xuất CSV an toàn với tiếng Việt.

## Công nghệ

- HTML5 semantic
- CSS3, Grid và Flexbox
- JavaScript ES6 modules
- LocalStorage cho metadata JSON
- IndexedDB cho ảnh người dùng tải lên
- Ảnh mẫu là SVG tạo trong mã nguồn, không phụ thuộc tài nguyên ngoài

Không dùng React, Vue, Angular, TypeScript, Tailwind, Bootstrap, bundler hay API bên ngoài.

## Cấu trúc thư mục

```text
index.php         Đăng nhập
register.php      Tạo tài khoản mới
verify.php        Xác minh tài khoản Admin
dashboard.php     Tổng quan dự án (Thống kê, góp ý cần xử lý, hoạt động)
projects.php      Danh sách dự án (Tìm kiếm, lọc, quản lý dự án)
project.php       Chi tiết dự án
review.php        Góp ý trực tiếp trên ảnh
compare.php       So sánh hai phiên bản
feedback.php      Danh sách góp ý và xuất CSV
includes/         Các thành phần giao diện dùng chung (head, footer, sidebar)
api/db.php        Kết nối SQLite, schema và các hàm tiện ích
api/dashboard.php API tổng quan dự án, thống kê và hoạt động
api/seed.php      Khởi tạo dữ liệu mẫu
api/svg_seeds.php Bộ dựng SVG mẫu trên máy chủ
api/auth.php      Xác thực người dùng, đăng ký và xác minh Admin
api/projects.php  API dự án, thành viên và hoạt động
api/screens.php   API màn hình thiết kế và tải ảnh
api/versions.php  API phiên bản ảnh
api/annotations.php API góp ý, bình luận, trạng thái
api/feedback.php  API danh sách góp ý
api/image.php     Phục vụ ảnh mẫu SVG và ảnh tải lên
api/reset.php     Khôi phục dữ liệu mẫu
data/             Thư mục chứa database SQLite (database.sqlite)
uploads/          Thư mục lưu trữ ảnh người dùng tải lên
css/app.css       Design system
js/app.js         Khởi tạo trang
js/auth.js        Phiên đăng nhập, đăng ký và xác minh
js/api.js         Tầng dữ liệu gọi PHP API
js/coords.js      Quy đổi tọa độ
js/ui.js          Thành phần giao diện
js/projects.js    Danh sách dự án
js/project.js     Chi tiết dự án
js/review.js      Marker, điểm và vùng
js/compare.js     So sánh phiên bản
js/feedback.js    Bảng góp ý và CSV
```

Giao diện gọi nghiệp vụ qua `js/api.js` tới các endpoint PHP tại `/api/`.

## Chạy trên macOS / Linux / Windows

Mở Terminal tại thư mục dự án rồi chạy máy chủ PHP tích hợp sẵn:

```bash
php -S localhost:8000
```

Truy cập [http://localhost:8000](http://localhost:8000).

Cơ sở dữ liệu SQLite (`data/database.sqlite`) sẽ tự động được khởi tạo và nạp dữ liệu mẫu ở lần chạy đầu tiên.

## Đăng ký và Xác minh tài khoản Admin

1. **Đăng ký tài khoản thông thường (`reviewer` hoặc `viewer`)**:
   - Truy cập trang `register.php`.
   - Nhập tên đăng nhập, họ tên, mật khẩu và chọn vai trò.
   - Tài khoản được kích hoạt ngay và tự động đăng nhập.

2. **Xác minh tài khoản Quản trị viên (Admin / `manager`)**:
   - Khi chọn vai trò **Quản trị (Admin)** trên `register.php`, hệ thống áp dụng bảo mật xác minh:
     - **Cách 1 - Kích hoạt tức thì**: Nhập mã bí mật Quản trị viên (Mã demo: `ADMIN2026`). Tài khoản sẽ được kích hoạt ngay lập tức.
     - **Cách 2 - Xác minh OTP**: Nếu không nhập mã bí mật, hệ thống tạo tài khoản ở trạng thái chưa xác minh (`is_verified = 0`) và cấp mã OTP 6 số. Người dùng xác minh tại `verify.php?username=...` để kích hoạt tài khoản.
     - **Cách 3 - Duyệt bởi Admin hiện tại**: Tài khoản Quản trị viên đã đăng nhập có thể thấy danh sách tài khoản Admin đang chờ xác minh trong tab **Thành viên** của dự án và bấm **Duyệt Admin**.
   - Tài khoản Admin chưa xác minh sẽ bị chặn đăng nhập và được hướng dẫn tới trang `verify.php`.

## Tài khoản mẫu

Mật khẩu demo là bất kỳ chuỗi không rỗng (hoặc `demo`).

| Tài khoản | Vai trò | Trạng thái |
| --- | --- | --- |
| an | Quản lý (Admin) | Đã xác minh |
| binh | Góp ý | Đã xác minh |
| chi | Chỉ xem | Đã xác minh |

Có thể bấm tài khoản mẫu ở trang đăng nhập, hoặc dùng nút chuyển tài khoản ở cuối sidebar sau khi đăng nhập.

## Tải ảnh

1. Đăng nhập bằng `an`.
2. Mở một dự án.
3. Bấm **Tải ảnh**, nhập tên màn hình và chọn PNG hoặc JPEG tối đa 10 MB.
4. Hệ thống kiểm tra MIME type, magic bytes, khả năng đọc ảnh và kích thước gốc.
5. **Tải phiên bản mới** tạo version tiếp theo, giữ ảnh cũ và không copy góp ý.

Ảnh tải lên được lưu trữ trên máy chủ trong thư mục `uploads/`. Metadata và các góp ý được lưu trong cơ sở dữ liệu SQLite (`data/database.sqlite`). Nếu lưu thất bại, ứng dụng báo lỗi và không hiện thông báo thành công.

## Đặt điểm và khoanh vùng

1. Mở màn hình **Đăng ký tài khoản** trong dự án **Cửa hàng DesignMark**.
2. Chọn phiên bản **v1**.
3. Góp ý số 1 nằm tại `x = 750`, `y = 150`, trên nút **Đăng ký**.
4. Chọn **v2**: nút đã chuyển xuống cuối form và marker của v1 không còn.
5. Chọn công cụ **Đặt điểm**, nhấp lên ảnh, nhập nhận xét rồi bấm **Gửi**.
6. Chọn **Khoanh vùng**, kéo để tạo hình chữ nhật. Kéo theo mọi hướng đều được.
7. Nếu khoảng kéo dưới 4 pixel hiển thị, thao tác được tính là đặt điểm.
8. **Hủy** hoặc phím Escape bỏ marker tạm và không lưu.

Người chỉ xem không thấy công cụ tạo góp ý. Có thể dùng **Nhập tọa độ** hoặc phím mũi tên và Enter khi vùng ảnh được focus.

## Kiểm tra zoom

Dùng **Phóng to**, **Thu nhỏ** và **Vừa khung**. Marker dùng phần trăm của ảnh, dữ liệu lưu bằng pixel ảnh gốc. Vị trí không đổi khi zoom, cuộn, resize hoặc khi khung chứa rộng hơn ảnh.

## Phiên bản và so sánh

Dropdown phiên bản chỉ hiện annotation của version đó. Banner xuất hiện khi xem bản cũ.

Trang **So sánh** có hai khung độc lập. Công tắc **Thu phóng đồng bộ** áp cùng mức zoom cho cả hai bên. Ghi chú **Kiểm tra sau sửa** và trạng thái được lưu qua API mock. Annotation không bị sao chép giữa hai phiên bản.

## Xuất CSV

Trang **Góp ý** lọc theo trạng thái và từ khóa. **Xuất CSV** chỉ xuất các dòng đang lọc, mã hóa UTF-8 có BOM, escape dấu phẩy, nháy kép và xuống dòng. Ô bắt đầu bằng `=`, `+`, `-`, `@`, kể cả khi có khoảng trắng phía trước, được thêm dấu nháy đơn.

## Dữ liệu demo

Lần đầu mở ứng dụng sẽ tạo:

- 2 dự án
- 3 tài khoản
- 6 màn hình, mỗi màn hình 2 phiên bản
- đúng 20 góp ý, gồm điểm, vùng, đã xử lý, chưa xử lý, nhiều tác giả, trả lời và lịch sử trạng thái

Refresh không ghi đè dữ liệu đã sửa. Nếu JSON lưu bị hỏng, ứng dụng khôi phục dữ liệu mẫu và báo lỗi. Nút **Khôi phục dữ liệu mẫu** ở sidebar xóa dữ liệu demo trên trình duyệt này, gồm cả ảnh đã tải lên.

## API mock và hướng PHP / PostgreSQL

`js/api.js` là ranh giới dữ liệu. Mỗi hàm bất đồng bộ có thể được thay bằng `fetch()` tới PHP mà không viết lại giao diện.

Mô hình gợi ý cho PostgreSQL:

- users
- projects
- project_members
- design_screens
- image_versions
- annotations
- annotation_replies
- annotation_status_events
- activities

Ảnh nên lưu ở object storage hoặc thư mục server, không nhét blob vào LocalStorage. Server phải tự kiểm tra phiên, vai trò và dữ liệu đầu vào. Tọa độ tiếp tục lưu theo pixel ảnh gốc cùng `imageVersionId`, `originalWidth` và `originalHeight`.

## Giới hạn của bản demo

- Không có backend, email mời hay mật khẩu thật.
- Quyền có thể bị sửa nếu người dùng can thiệp LocalStorage.
- Không có cộng tác thời gian thực ngoài nút mô phỏng xung đột.
- Không có công cụ vẽ đè hoặc sửa pixel ảnh.
