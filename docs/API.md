# TECH REST API (v1)

**Base URL dev:** `http://localhost:5000/api` hoặc `/api` khi gọi từ Vite nhờ proxy.

Body gửi JSON (`Content-Type: application/json`), trừ upload ảnh (multipart/form-data). Endpoint cần token truyền header `Authorization: Bearer <JWT>`.

Response lỗi theo dạng `{"success":false,"message":"..."}` và status HTTP phù hợp. Không trả giá mật khẩu hay password hash trong API.

## 1. Khách không cần đăng nhập

| Method | Endpoint | Chức năng |
| --- | --- | --- |
| GET | `/health` | Health check |
| POST | `/auth/register` | Đăng ký |
| POST | `/auth/login` | Đăng nhập, trả user + JWT |
| POST | `/auth/forgot-password` | Gửi email reset (link dev nếu được bật) |
| POST | `/auth/reset-password` | Đặt lại mật khẩu |
| GET | `/catalog/categories` | Danh mục |
| GET | `/catalog/brands` | Thương hiệu |
| GET | `/catalog/banners` | Banner đang hiển thị |
| GET | `/catalog/products` | Danh sách / lọc / phân trang |
| GET | `/catalog/products/:slug` | Chi tiết + liên quan |
| GET | `/catalog/products/:slug/reviews` | Reviews công khai |
| GET | `/sitemap.xml` | Sitemap (ở root, không có `/api`) |
| GET | `/robots.txt` | Robots (ở root) |

### GET `/catalog/products`

Các query parameter: `q` (tên sản phẩm), `category` (slug), `brand` (slug), `minPrice`, `maxPrice` (VNĐ), `badge` (`hot`, `new`, `sale`), `featured=true`, `sort` (`newest`, `popular`, `price_asc`, `price_desc`, `rating`), `page` (bắt đầu từ 1), `limit` (tối đa 48).

Ví dụ:

```http
GET /api/catalog/products?category=tai-nghe&minPrice=200000&sort=price_asc&page=1&limit=12
```

Response có `{items, total, page, pages, limit}`.

### POST `/auth/register`

```json
{"name":"Nguyễn Minh Anh","email":"new-user@example.com","phone":"0901234567","password":"Password@2026"}
```

### POST `/auth/login`

```json
{"email":"minhanh@tech.local","password":"TechUser@2026"}
```

Trả về `{user:{id,name,email,phone,role,locked},token}`.

### POST `/auth/forgot-password`

```json
{"email":"minhanh@tech.local"}
```

Ở development với `DEV_SHOW_RESET_LINK=true` và chưa có SMTP: response có `devResetUrl` để test. Ở production không trả link này.

### POST `/auth/reset-password`

```json
{"token":"token-trong-email-hoac-link-dev","password":"NewStrongPass@2026"}
```

## 2. Khách đã đăng nhập (Bearer JWT)

| Method | Endpoint | Chức năng |
| --- | --- | --- |
| GET | `/auth/me` | Thông tin tài khoản |
| PUT | `/auth/me` | Đổi họ tên/điện thoại |
| PUT | `/auth/password` | Đổi mật khẩu |
| GET/POST | `/auth/addresses` | Danh sách/thêm địa chỉ |
| PUT/DELETE | `/auth/addresses/:id` | Sửa/xóa địa chỉ thuộc user |
| GET | `/cart` | Giỏ hàng MongoDB |
| POST | `/cart/items` | Thêm sản phẩm |
| PUT | `/cart/items/:id` | Đổi số lượng, 0 là xóa |
| PATCH | `/cart/items/:id` | Chọn/bỏ chọn sản phẩm |
| DELETE | `/cart/items/:id` | Xóa sản phẩm |
| POST | `/orders/quote` | Báo giá vận chuyển/coupon từ server |
| POST | `/orders` | Đặt COD: giữ stock, tạo order |
| GET | `/orders` | Các đơn của tài khoản đang login |
| GET | `/orders/:id` | Xem đơn **chỉ thuộc tài khoản** |
| PATCH | `/orders/:id/cancel` | Hủy đơn pending |
| POST | `/catalog/products/:slug/reviews` | Đánh giá sau khi đã nhận sản phẩm |

### POST `/cart/items`

```json
{"productId":"507f191e810c19729de860ea","quantity":1}
```

`productId` là `_id` thật từ GET `/catalog/products`, không dùng mã ví dụ trong môi trường thật.

### PUT `/cart/items/:id`

```json
{"quantity":2}
```

### PATCH `/cart/items/:id`

```json
{"selected":true}
```

### POST `/orders/quote`

```json
{"shippingMethod":"standard","couponCode":"TECH10"}
```

Phí vận chuyển `standard` = 25.000₫ hoặc 0₫ khi subtotal từ 500.000₫; `express` = 39.000₫. Coupon được validate ở backend, bao gồm thời hạn, mức chi tối thiểu và lượt dùng.

### POST `/orders` (COD)

```json
{
  "idempotencyKey":"0a628a64-8d46-4b6f-84d0-43aee8229342",
  "paymentMethod":"COD",
  "shippingMethod":"standard",
  "couponCode":"TECH10",
  "shippingAddress":{
    "name":"Nguyễn Minh Anh",
    "phone":"0901234567",
    "line":"123 Nguyễn Văn Linh",
    "ward":"Tân Phong",
    "district":"Quận 7",
    "city":"TP. Hồ Chí Minh"
  },
  "notes":"Gọi trước khi giao"
}
```

**Quan trọng:** Request **không chứa** `total`, `price` hoặc `items` cho checkout. Backend tự đọc các sản phẩm đã chọn trong `Cart`, lấy `Product.price` hiện hành, kiểm tra stock và coupon. Với cùng `idempotencyKey`, trả lại order đã có, không tạo đơn trùng lặp. Response thành công 201 có `status:"pending"` và `paymentStatus:"unpaid"`.

### POST `/catalog/products/:slug/reviews`

```json
{"rating":5,"comment":"Sản phẩm rất tốt, dùng ổn định trong thời gian dài."}
```

Backend kiểm tra ít nhất một đơn `delivered` chứa sản phẩm của user, không tin `userId` từ client.

## 3. Admin (Bearer JWT với role `admin`)

| Method | Endpoint | Chức năng |
| --- | --- | --- |
| GET | `/admin/dashboard` | Số liệu, biểu đồ, đơn gần đây, stock thấp |
| GET | `/admin/products?page=1&q=` | Danh sách gồm cả sản phẩm đã ẩn |
| POST | `/admin/products` | Thêm sản phẩm |
| PUT | `/admin/products/:id` | Sửa sản phẩm |
| DELETE | `/admin/products/:id` | Ẩn thay vì xóa cứng |
| POST | `/admin/uploads` | Upload tối đa 8 ảnh (mỗi ảnh tối đa 3 MB) |
| GET | `/admin/orders?status=` | Danh sách đơn |
| PATCH | `/admin/orders/:id/status` | Chuyển trạng thái |
| GET | `/admin/users?q=` | Danh sách user |
| PATCH | `/admin/users/:id` | Đổi quyền/khóa tài khoản |
| GET/POST | `/admin/categories` | Danh mục |
| PUT/DELETE | `/admin/categories/:id` | Sửa/xóa danh mục khi không có sản phẩm |
| GET/POST | `/admin/brands` | Thương hiệu |
| PUT/DELETE | `/admin/brands/:id` | Sửa/xóa thương hiệu khi không có sản phẩm |
| GET/POST | `/admin/coupons` | Mã giảm giá |
| PUT/DELETE | `/admin/coupons/:id` | Sửa/xóa mã |
| GET/POST | `/admin/banners` | Banner |
| PUT/DELETE | `/admin/banners/:id` | Sửa/xóa banner |

### POST `/admin/products`

```json
{
  "name":"Tai nghe TECH Gaming H12",
  "description":"Mô tả chi tiết sản phẩm",
  "shortDescription":"Tai nghe gaming chất lượng cao",
  "price":459000,
  "originalPrice":599000,
  "stock":35,
  "category":"<ObjectId-category>",
  "brand":"<ObjectId-brand>",
  "images":["/products/headphones-1.svg"],
  "badge":"new",
  "featured":true,
  "active":true,
  "tags":["gaming","tai nghe"],
  "specs":{"Kết nối":"Bluetooth 5.3","Bảo hành":"12 tháng"}
}
```

`category`, `brand` phải là ObjectId thực tế từ API danh mục/thương hiệu. API upload trả `{urls:["/uploads/xxx.webp"]}` để lưu vào trường `images`.

### PATCH `/admin/orders/:id/status`

```json
{"status":"confirmed"}
```

Chuyển trạng thái hợp lệ: `pending → confirmed → shipping → delivered`. Admin có thể `pending/confirmed → cancelled`; khi đó stock được hoàn lại. Không cho hủy đơn đã giao.

### PATCH `/admin/users/:id`

```json
{"role":"user","locked":true}
```

Không cho admin tự hạ quyền hoặc tự khóa tài khoản.

### POST `/admin/coupons`

```json
{
  "code":"TECH15",
  "type":"percent",
  "value":15,
  "minSpend":300000,
  "maxDiscount":100000,
  "limit":100,
  "startAt":"2026-11-01T00:00:00.000Z",
  "expiresAt":"2027-01-01T00:00:00.000Z",
  "active":true
}
```

## 4. Bảo mật API

- JWT ký bằng secret môi trường, xác thực người dùng hiện tại từ database ở mỗi request.
- `/api/admin` có middleware phân quyền theo role server, không chỉ chặn ở UI.
- Password hash bằng bcrypt 12 rounds, không có API trả hash.
- Rate limit login/register/reset; quyền xem/hủy đơn lọc theo user hiện tại.
- Giá, coupon, ship, số lượng đặt được kiểm lại trên server; stock mỗi dòng cập nhật nguyên tử (`stock >= requestedQty`).
- Chưa hỗ trợ cổng thanh toán online: không chấp nhận `paymentMethod` khác COD.

## 5. Mô hình dữ liệu / Index

| Collection | Tham chiếu và index quan trọng |
| --- | --- |
| `users` | `email` unique, role/locked |
| `products` | `slug` unique, `category`, `brand`, `active`, createdAt, text index |
| `categories` | `slug` unique |
| `brands` | `slug` unique |
| `carts` | `user` unique, `items.product` ObjectId |
| `orders` | `user`, `status`, user + idempotencyKey unique partial; snapshot item, địa chỉ |
| `reviews` | `(user, product)` unique |
| `coupons` | `code` unique, used/limit/expiry |
| `addresses` | `user` index |
| `banners` | `active`, `sort` |

Dữ liệu `orders.items` dùng snapshot tên/giá/ảnh ở thời điểm đặt, tránh thay đổi hóa đơn sau khi Admin sửa giá sản phẩm.
