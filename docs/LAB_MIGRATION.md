# Đối chiếu source 10 lab → TECH Ecommerce

File gốc `shoppingonline1.rar` sau khi đọc có ba nhánh chính: `client-customer` (React giao diện khách), `client-admin` (React quản trị), `server` (Express/Mongoose). Dữ liệu của bản gốc có `Admin`, `Customer`, `Category`, `Product`, `Order`, trong đó Order lưu embedded items.

| File/luồng lab gốc | Nâng cấp trong TECH | Ghi chú |
| --- | --- | --- |
| `client-customer/src/components/HomeComponent.js` | `frontend/src/pages/Home.jsx` | Trang chủ bán hàng thực tế, danh mục, flash sale, bestseller, banner |
| `ProductComponent.js`, `ProductDetailComponent.js` | `pages/Catalog.jsx`, `pages/ProductDetail.jsx` | URL slug, lọc/sắp xếp/phân trang, reviews, wishlist |
| `MycartComponent.js`, `utils/CartUtil.js` | `contexts/AppContext.jsx`, `pages/Cart.jsx` | Giỏ khách local, giỏ tài khoản MongoDB, kiểm tra stock |
| `LoginComponent.js`, `SignupComponent.js`, `ActiveComponent.js` | `pages/AuthPages.jsx`, `backend/src/routes/auth.js` | JWT user ID thật, bcrypt, reset password thay cho giải pháp cũ |
| `MyprofileComponent.js` | `pages/Account.jsx` | Profile, change password, sổ địa chỉ |
| `MyordersComponent.js` | `pages/Orders.jsx` | Order ownership, theo dõi trạng thái và hủy theo rule |
| `client-admin/src/components/*` | `frontend/src/admin/Admin.jsx` | Dashboard, sản phẩm, đơn, user, coupon, danh mục, thương hiệu, banner |
| `server/models/Models.js` | `backend/src/models/index.js` | Mở rộng 10 collections, relation refs, validation và index |
| `server/models/*DAO.js` | `backend/src/routes/*`, `models/index.js` | Tách routes và model, query trực tiếp Mongoose theo nghiệp vụ |
| `server/api/customer.js` | `routes/auth.js`, `catalog.js`, `cart.js`, `orders.js` | Phân tách API, kiểm tra quyền server |
| `server/api/admin.js` | `routes/admin.js` | RBAC, CRUD, kiểm tra chuyển trạng thái |
| `server/utils/JwtUtil.js` | `middleware/auth.js` | Bỏ JWT không có user ID, xác thực token và truy vấn user hiện tại |
| `server/utils/CryptoUtil.js` | `bcryptjs` ở `routes/auth.js` | **Không dùng MD5/plain-text passwords**, demo dùng bcrypt 12 rounds |
| `server/index.js` | `backend/src/index.js` | Helmet, cors, request size, xử lý lỗi, sitemap, SPA production hosting |

## Các lỗi cũ được sửa theo nghiệp vụ

1. **Giá đơn hàng:** bản lab nhận `req.body.total` từ phía client. TECH chỉ lấy giá hiện hành từ `Products` trên server khi quote và tạo order.
2. **Quyền xem đơn:** bản lab dùng ID customer trong URL mà không xác minh chủ sở hữu. TECH query với `{_id, user:req.user.id}`.
3. **Quyền Admin:** bản lab chỉ kiểm tra JWT chung. TECH tải user từ DB trên mỗi request và kiểm tra `role==='admin'`.
4. **Mật khẩu:** thay bằng bcrypt hash và login dùng compare; không trả `passwordHash` trong response.
5. **Tồn kho:** có cập nhật stock nguyên tử bằng điều kiện `$gte`, không tạo đơn khi không đủ số lượng, hoàn lại stock khi hủy.
6. **Mở rộng:** bổ sung collection `Brands`, `Carts`, `Reviews`, `Coupons`, `Addresses`, `Banners` bên cạnh các collection được chuyển đổi.

## Vì sao có `legacy-labs/`?

Người làm đồ án có thể đối chiếu chứng minh sự kế thừa từ 10 bài lab và mức độ cải tiến. Đây là mã gốc chỉ làm tư liệu, không nằm trong script `npm run dev`, và **không nên triển khai mã gốc** do có lỗ hổng đã chỉ ra ở trên.

**Lưu ý bảo mật:** `legacy-labs/server/utils/MyConstants.js` đã được thay mật khẩu, host và địa chỉ email gốc bằng placeholder vì bản người dùng đưa vào có thông tin xác thực hard-code. Source lab còn lại được giữ để tham chiếu.
