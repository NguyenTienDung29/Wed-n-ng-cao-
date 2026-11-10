# Kịch bản demo đồ án cuối kỳ TECH (6–8 phút)

**Yêu cầu:** Một MongoDB Server đang hoạt động (local/Atlas), đã chạy `CAI_DAT_LAN_DAU.bat` và `CHAY_DEMO_TECH.bat`.

| Thời lượng | Trình diễn | Bằng chứng |
| --- | --- | --- |
| 0:00–0:45 | Trang chủ TECH tông cam; banner, danh mục, sản phẩm | Frontend React tại localhost:5173 |
| 0:45–1:30 | Tìm kiếm, lọc theo danh mục, xem chi tiết | GET /api/catalog/products |
| 1:30–2:10 | Đăng nhập User (minhanh@tech.local / TechUser@2026) | JWT /api/auth/login |
| 2:10–3:20 | Thêm giỏ, checkout COD, nhập địa chỉ, TECH10 | Cart/Order được lưu vào MongoDB |
| 3:20–4:00 | Mở MongoDB Compass → tech_ecommerce → orders → Refresh | Đơn mới có `paymentStatus: unpaid` |
| 4:00–5:15 | Đăng nhập Admin (admin@tech.local / TechAdmin@2026), duyệt đơn | Dashboard/Order API có phân quyền |
| 5:15–6:00 | Thay tồn kho, sửa thông tin sản phẩm; refresh Compass | Product thay đổi trong database |
| 6:00–7:00 | Mở code backend/models, routes, frontend/pages | Giải thích Full Stack và 6 công nghệ |
| 7:00–8:00 | Giới thiệu /api/health, Swagger? (không có), Postman Collection, test | docs/TECH.postman_collection.json |

## 6 công nghệ yêu cầu trong báo cáo

1. **HTML/CSS:** `frontend/index.html`, `frontend/src/index.css` + Tailwind CSS.
2. **JavaScript:** code frontend `.js/.jsx` và backend `.js`.
3. **Node.js:** môi trường chạy `backend/src/index.js`, npm scripts trong package.json.
4. **MongoDB:** Collections và indexes trong `backend/src/models/index.js`; seed `backend/src/seed.js`.
5. **Express.js:** router, middleware và REST API trong `backend/src/index.js`, `backend/src/routes/`.
6. **React.js:** `frontend/src/main.jsx` và các component/pages `.jsx`.

**Tài khoản demo:** Admin `admin@tech.local` / `TechAdmin@2026`; User `minhanh@tech.local` / `TechUser@2026`. Chỉ dùng trên môi trường học tập; đổi thông tin khi triển khai public.

**Nếu không có mạng Internet tại hội trường:** Nên dùng MongoDB Community Server local (và cài npm trước), không phụ thuộc Atlas.

**Giới hạn cần nói rõ:** COD hoạt động, VNPay/MoMo chưa tích hợp; chưa thực hiện kiểm thử tích hợp trên máy Windows của bạn nếu chưa chạy thử theo checklist.
