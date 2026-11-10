# Checklist kiểm thử và quay demo TECH

Trạng thái: đây là checklist **để thực hiện trên máy Windows** sau khi `npm install`, bật MongoDB và seed. Những ô dưới đây chưa được xác nhận qua runtime tích hợp trong môi trường tạo file.

| STT | Kịch bản | Thực hiện | Kỳ vọng |
| --- | --- | --- | --- |
| 01 | API sức khỏe | GET `/api/health` | 200, `ok:true` |
| 02 | Trang chủ | Mở `/` | Banner, danh mục, flash sale, bestseller, hàng mới |
| 03 | Responsive | F12 đổi 375/768/1440px | Menu mobile, giỏ, card không tràn màn hình |
| 04 | Tìm sản phẩm | Search `tai nghe` | Tên chứa từ khóa, phân trang chuẩn |
| 05 | Bộ lọc | Chọn `ban-phim`, thương hiệu, min/max | API lọc đúng danh mục, thương hiệu, giá |
| 06 | Đăng ký | Email mới, mật khẩu >=8 | 201, tài khoản user, JWT có hiệu lực |
| 07 | Đăng nhập sai | Sai mật khẩu | 401, không cho đăng nhập |
| 08 | Đăng nhập đúng | minhanh@tech.local | Chuyển trang, thông tin user hiện lên |
| 09 | Giỏ khách | Thêm sản phẩm trước khi đăng nhập | localStorage giữ giỏ; login thì đồng bộ Mongo |
| 10 | Giỏ đã đăng nhập | Thêm, đổi số lượng, xóa, chọn/bỏ chọn | DB Cart thay đổi, tổng tiền đúng |
| 11 | Tồn kho | Đặt số lượng > stock | Backend trả lỗi 400/409, không tạo đơn |
| 12 | Checkout COD | Chọn hàng, ship và địa chỉ hợp lệ | 201, trạng thái pending/unpaid, total từ server |
| 13 | Coupon | `TECH10` với đơn >=200K | Giảm 10%, không quá 100K |
| 14 | Coupon sai | Mã không tồn tại/hết lượt | API báo lỗi, không giảm tiền |
| 15 | Chống double submit | Gửi lại same idempotencyKey | Trả cùng một order, không tạo thêm |
| 16 | Quyền xem đơn | User B mở ID order của User A | 404, không lộ thông tin |
| 17 | Hủy đơn | User hủy pending | Status cancelled, stock hoàn lại |
| 18 | Hủy sai trạng thái | User hủy confirmed/delivered | 409 |
| 19 | Admin RBAC | User token gọi `/api/admin/dashboard` | 403 |
| 20 | Admin sản phẩm | Tạo sản phẩm, upload PNG, sửa giá, ẩn | API lưu thật, frontend cập nhật |
| 21 | Admin trạng thái đơn | pending → confirmed → shipping → delivered | Status tuần tự; sau delivered ghi `paid` với COD |
| 22 | Review quyền mua | User chưa nhận hàng gửi review | 403 |
| 23 | Review đã giao | User có order delivered đánh giá | 201, rating trung bình sản phẩm cập nhật |
| 24 | Quên mật khẩu | Bật DEV_SHOW_RESET_LINK, gửi email | Có link demo; token reset hết hạn 15 phút |
| 25 | Admin users | Khóa user, login lại | Không cho đăng nhập user đã khóa |
| 26 | Admin coupons | Tạo, chỉnh thời gian, xóa coupon | API cập nhật đúng |
| 27 | Admin categories/brands | CRUD (không xóa khi có product) | API trả 409 nếu đang dùng |
| 28 | Admin banners | Chỉnh tiêu đề banner và reload home | Nội dung trang chủ cập nhật |
| 29 | SEO | Xem `/sitemap.xml`, `/robots.txt`, product page | XML, robots và OG/Product JSON-LD có mặt |
| 30 | 404 | Mở URL bất kỳ | Trang 404 thân thiện |

## Kiểm thử tự động

- `npm test`: test tính tiền, giới hạn voucher, phí ship, slug, ObjectId, email; **không cần MongoDB**.
- `npm run smoke`: yêu cầu API local đang chạy, database đã seed, tự tạo/hủy một order; kiểm tra JWT, RBAC, ownership và idempotency.

## Gợi ý video demo 7–10 phút

1. Giới thiệu trang chủ cam công nghệ, danh mục/Flash Sale.
2. Tìm kiếm và lọc, truy cập chi tiết sản phẩm, thêm yêu thích.
3. Đăng nhập user, chọn sản phẩm và thanh toán COD với TECH10.
4. Chuyển qua lịch sử đơn hàng, xem chi tiết, hủy một đơn pending.
5. Đăng nhập Admin, xem Dashboard, thêm/sửa sản phẩm và stock.
6. Duyệt một đơn qua các trạng thái, xem doanh thu/tồn kho cập nhật.
7. Cho thấy bộ API, mô hình MongoDB, 10 bài lab gốc và cấu trúc code mới.
