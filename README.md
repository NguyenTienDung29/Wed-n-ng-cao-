# TECH – Cửa hàng phụ kiện điện tử

**Đồ án cuối kỳ môn Lập trình Web nâng cao** · React + Vite + Tailwind CSS + Express + MongoDB.

Mã nguồn này được **xây dựng lại và nâng cấp từ `shoppingonline1.rar`** (10 bài lab), thay thế các module cũ bằng hệ thống có xác thực, giỏ hàng lưu MongoDB, đơn hàng COD tính tiền trên server, quản trị riêng và UI tông cam công nghệ. Nguồn gốc các màn hình/luồng được đối chiếu trong [`docs/LAB_MIGRATION.md`](docs/LAB_MIGRATION.md); bản source cũ lưu trong `legacy-labs/` chỉ để tham khảo, **không chạy bản legacy**.

## Cách chạy demo nhanh trên Windows (bản đóng gói Compass)

**Quan trọng: Compass chỉ để xem database, không tự chạy MongoDB Server.** Chọn một trong hai cách: cài **MongoDB Community Server + Compass** trên Windows hoặc dùng **MongoDB Atlas + Compass**. Hướng dẫn chi tiết: [`docs/HUONG_DAN_MONGODB_COMPASS.md`](docs/HUONG_DAN_MONGODB_COMPASS.md).

1. Giải nén thư mục ra ổ `D:` và mở thư mục bằng VS Code.
2. Đảm bảo MongoDB Server local đang chạy, **hoặc** sửa `MONGO_URI` trong `backend/.env` thành URI Atlas (nếu chưa có `.env`, có thể tạo bằng `Copy-Item backend/.env.example backend/.env`).
3. Nhấp đúp **`CAI_DAT_LAN_DAU.bat`**. Script kiểm tra MongoDB local khi dùng URI localhost, tạo `.env` nếu thiếu, tự tạo JWT secret ngẫu nhiên, chạy `npm install`, seed dữ liệu và unit test. Nếu MongoDB chưa sẵn sàng, script dừng và hướng dẫn nguyên nhân, không giả vờ khởi động thành công.
4. Sau khi setup thành công, nhấp đúp **`CHAY_DEMO_TECH.bat`**. Script mở 2 terminal riêng và trình duyệt tới `http://localhost:5173`. Nếu bạn đã chạy Vite, script không mở thêm bản trùng cổng.
5. Mở MongoDB Compass, kết nối cùng server, xem database `tech_ecommerce` → `orders` và `products`. Kịch bản quay báo cáo: [`docs/KICH_BAN_DEMO.md`](docs/KICH_BAN_DEMO.md).

> Không có file ZIP nào chứa sẵn MongoDB Server hoặc MongoDB Atlas của bạn. Để demo thật và lưu dữ liệu vào MongoDB, cần cài/bật MongoDB Community Server hoặc kết nối Atlas bằng URI riêng. Các script hỗ trợ thiết lập và phát hiện lỗi, không thay thế server database.

## 1. Những gì đã triển khai

| Khách hàng | Admin | Hệ thống |
| --- | --- | --- |
| Trang chủ, tìm kiếm/lọc/sắp xếp/phân trang | Dashboard tổng doanh thu, đơn, khách, sản phẩm, biểu đồ | MongoDB/Mongoose với 10 collection |
| Chi tiết sản phẩm, liên quan, reviews | CRUD sản phẩm, upload nhiều ảnh, stock, giá | REST API, JWT + bcrypt, phân quyền backend |
| Đăng ký, đăng nhập, quên/đổi mật khẩu | Danh sách đơn, duyệt và chuyển trạng thái | Helmet, rate limit login, CORS, validation |
| Hồ sơ, địa chỉ giao hàng | Khóa/mở khóa, phân quyền tài khoản | Sitemap tự tạo, metadata/JSON-LD, URL slug |
| Giỏ hàng khách và giỏ lưu database | Danh mục, thương hiệu, mã giảm giá, banner | Skeleton, loading/error, responsive, trang 404 |
| Checkout COD, mã giảm giá, 2 kiểu ship | Cảnh báo tồn kho, top bán chạy | 50 sản phẩm seed, 10 danh mục, 6 thương hiệu |
| Lịch sử/theo dõi/hủy đơn, in đơn | Quản trị không phụ thuộc giao diện khách | Test đơn vị + smoke API |
| Wishlist (localStorage) | | SVG sản phẩm tự host, không hotlink |

**Không giả lập thanh toán thành công.** COD được ghi `paymentStatus=unpaid` khi đặt hàng, chuyển `paid` khi Admin đánh dấu `delivered`. VNPay/MoMo chưa tích hợp vì thiếu tài khoản/cấu hình sandbox, nên frontend hiện không cung cấp phương thức này.

## 2. Yêu cầu máy Windows

- **Node.js 20 trở lên**, npm; khuyến nghị Node.js 22 LTS.
- **MongoDB 7 hoặc 8** đang chạy trên máy, hoặc **Docker Desktop** chạy image `mongo:7`.
- Visual Studio Code.
- Hai cửa sổ terminal PowerShell hoặc VS Code Terminal.

### Bước 1 – Bật MongoDB

**Lựa chọn A – Docker Desktop:** mở PowerShell và chạy:

```powershell
docker run -d --name tech-mongodb -p 27017:27017 mongo:7
```

Nếu đã tạo container trước đó mà container đang dừng:

```powershell
docker start tech-mongodb
```

Kiểm tra bằng `docker ps`.

**Lựa chọn B – MongoDB Community Server:** cài MongoDB Community Server, bảo đảm service MongoDB đang chạy; URI mặc định là `mongodb://127.0.0.1:27017/tech_ecommerce`.

> Docker Desktop phải được bật. Nếu dùng MongoDB Atlas, thay `MONGO_URI` bằng URI riêng trong file `.env` (không chia sẻ mật khẩu database).

### Bước 2 – Cài và cấu hình backend

Mở thư mục `TECH_Ecommerce` trong VS Code. Terminal thứ nhất:

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Mở `backend/.env` và **đổi `JWT_SECRET` thành chuỗi bí mật ít nhất 32 ký tự** (ví dụ sinh ngẫu nhiên bằng PowerShell: `[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))`). Kiểm tra `MONGO_URI`.

Nạp dữ liệu mẫu **lần đầu**:

```powershell
npm run seed
npm run dev
```

Server chạy ở **http://localhost:5000**. Thử **http://localhost:5000/api/health**; phải thấy `"ok":true`.

### Bước 3 – Chạy frontend

Mở terminal thứ hai ở thư mục gốc `TECH_Ecommerce`:

```powershell
cd frontend
npm install
npm run dev
```

Truy cập **http://localhost:5173**. Admin: **http://localhost:5173/admin**.

> Lệnh `cd backend` và `cd frontend` phải thực hiện ở thư mục gốc `TECH_Ecommerce`, không thực hiện cả hai trong cùng một terminal khi server đang chạy.

### Bước 4 – Tài khoản demo (tạo bằng `npm run seed`)

| Quyền | Email | Mật khẩu demo |
| --- | --- | --- |
| Admin | `admin@tech.local` | `TechAdmin@2026` |
| User 1 | `minhanh@tech.local` | `TechUser@2026` |
| User 2 | `giahuy@tech.local` | `TechUser@2026` |
| User 3 | `ngocha@tech.local` | `TechUser@2026` |

**Chỉ dùng thông tin demo ở máy học tập**. Seed bị chặn khi `NODE_ENV=production`. Khi triển khai thật phải đổi mật khẩu admin ngay và không dùng tài khoản công khai.

Dữ liệu mẫu gồm 50 sản phẩm, 10 danh mục, 6 thương hiệu, 1 admin, 3 user, 5 đơn hàng, 2 đánh giá gắn với các đơn đã giao, 3 coupon và 2 banner. Seed dùng upsert, không tự xóa database hiện hữu.

Mã thử giảm giá: `TECH10` (10% tối đa 100K, đơn từ 200K), `WELCOME50` (giảm 50K, đơn từ 300K), `FREESHIP` (giảm 25K, đơn từ 150K).

## 3. Cấu trúc thư mục

```text
TECH_Ecommerce/
├─ frontend/               # React + Vite + Tailwind CSS
│  ├─ public/products/     # 20 SVG tự host, ảnh dùng trong 50 bản ghi seed
│  └─ src/
│     ├─ admin/            # Dashboard + tất cả trang quản trị
│     ├─ components/       # Header, Footer, Card, SEO
│     ├─ contexts/         # Auth, Cart, Wishlist, Toast
│     ├─ lib/api.js        # Axios và helper
│     ├─ pages/            # Home, Catalog, ProductDetail, Checkout...
│     └─ main.jsx          # React Router / phân quyền giao diện
├─ backend/
│  ├─ .env.example         # Mẫu biến môi trường, KHÔNG chứa secret thật
│  ├─ scripts/smoke.js     # Test API end-to-end chạy trên server local
│  ├─ uploads/             # Ảnh do Admin upload (tự tạo ở runtime)
│  └─ src/
│     ├─ index.js          # Express app, middleware, sitemap, production serve
│     ├─ models/index.js   # Mongoose schemas
│     ├─ routes/           # auth, catalog, cart, orders, admin
│     ├─ middleware/       # JWT, Admin RBAC, xử lý lỗi
│     ├─ utils/            # Giá, slug, email
│     ├─ tests/            # Unit tests
│     └─ seed.js
├─ docs/
│  ├─ API.md
│  ├─ LAB_MIGRATION.md
│  ├─ TEST_CHECKLIST.md
│  └─ TECH.postman_collection.json
└─ legacy-labs/           # Source gốc đã lọc .git/build/package-lock
```

## 4. Các chức năng và luồng demo

1. Vào trang chủ → kiểm tra danh mục, flash sale, hàng bán chạy, hàng mới.
2. Xem `Sản phẩm` → tìm kiếm, lọc theo danh mục, thương hiệu, giá; xem chi tiết.
3. Đăng ký tài khoản mới hoặc dùng User demo. Nếu có giỏ hàng khách, hệ thống chuyển sản phẩm vào giỏ của tài khoản sau khi đăng nhập.
4. Thêm sản phẩm → Giỏ hàng → chọn sản phẩm, tăng giảm số lượng.
5. Thanh toán → điền địa chỉ → chọn giao tiêu chuẩn/nhanh → dùng mã `TECH10` → COD → đặt hàng.
6. Xem đơn vừa đặt, thử hủy khi trạng thái `pending`.
7. Đăng nhập Admin → quản lý sản phẩm/đơn/khách/mã giảm/nhóm sản phẩm → Dashboard.
8. Admin xác nhận đơn `pending → confirmed → shipping → delivered`, kiểm tra số liệu doanh thu.
9. User đã nhận hàng có thể gửi đánh giá 1–5 sao ở chi tiết sản phẩm; người chưa nhận bị backend chặn.

## 5. Kiểm thử

Backend (không cần Mongo cho unit tests):

```powershell
cd backend
npm test
```

Sau khi MongoDB chạy, đã seed, backend đang chạy (mở terminal khác):

```powershell
cd backend
npm run smoke
```

`npm run smoke` tạo một đơn COD thử và **hủy lại** đơn đó, kiểm tra quyền truy cập, trạng thái và idempotency. Chỉ chạy trên database demo. Danh sách test thủ công và kết quả kỳ vọng ở [`docs/TEST_CHECKLIST.md`](docs/TEST_CHECKLIST.md).

## 6. Build và triển khai bản chung một domain

```powershell
cd frontend
npm run build
cd ..\backend
npm start
```

Nếu `frontend/dist` tồn tại, Express tự phục vụ trang React và trang sản phẩm có **meta/JSON-LD trong HTML gốc** để crawler truy cập; ngược lại backend chỉ phục vụ API. Trên hosting cấu hình `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL=https://domain-cua-ban.vn`, `PORT` theo hosting, SMTP nếu dùng quên mật khẩu.

**Không được đưa `backend/.env` vào git**, không dùng mật khẩu demo. Cần cấu hình HTTPS/reverse proxy, bảo vệ MongoDB, upload object storage và giám sát ứng dụng trước khi kinh doanh thực tế.

## 7. SEO

- Slug tiếng Việt không dấu, đường dẫn `/san-pham/:slug`.
- React Helmet cập nhật title, description, Open Graph, canonical, Product và Breadcrumb structured data.
- Backend có `GET /sitemap.xml`, `GET /robots.txt` theo dữ liệu thật.
- Khi chạy **production bằng Express cùng frontend/dist**, backend chèn metadata sản phẩm + Product JSON-LD và nội dung tĩnh ban đầu để hỗ trợ bot không chạy JS. Đây là **HTML metadata injection + SPA**, chưa phải Next.js SSR toàn phần.
- Card ảnh lazy-load, ảnh SVG nội bộ, responsive, skeleton state và xử lý lỗi.

## 8. Giới hạn cần biết trước khi kinh doanh thật

- Tại local MongoDB **standalone**, đặt hàng dùng cập nhật tồn kho nguyên tử **theo từng sản phẩm** và rollback bù nếu lỗi; chưa có đảm bảo ACID cho toàn đơn nhiều mặt hàng. Khi triển khai nhiều server, nên bật MongoDB replica set và dùng transaction xuyên suốt stock/coupon/order/cart, cộng thêm background reconciliation.
- VNPay/MoMo **chưa tích hợp**. Bắt buộc xác minh chữ ký callback/IPN trên backend trước khi ghi `paid`.
- Quên mật khẩu: nếu cấu hình SMTP sẽ gửi email; ở development có thể bật `DEV_SHOW_RESET_LINK=true` để hiển thị link reset. Production không trả reset link.
- Email/SMS giao hàng, đối tác vận chuyển, hóa đơn VAT, quản lý lô hàng, kho đa chi nhánh, hệ thống tìm kiếm nâng cao và kiểm thử tải chưa triển khai.
- Ảnh hiện là **hình minh họa SVG tự tạo** để demo không phụ thuộc internet. Khi bán thật nên thay bằng ảnh sản phẩm thương mại được phép sử dụng.
- Mã nguồn gốc trong `legacy-labs/` có cách xử lý dữ liệu cũ không đạt mức bảo mật, **chỉ dùng so sánh học tập**. Thông tin database/email từng hard-code trong source cũ đã được che trong `legacy-labs/server/utils/MyConstants.js`; chủ tài khoản cần đổi các mật khẩu/App Password cũ nếu vẫn còn hiệu lực.

## 9. Khắc phục sự cố thường gặp

- **`ECONNREFUSED 27017` / `MongoServerSelectionError`**: chưa bật service MongoDB/container hoặc URI sai.
- **`401` khi gọi API**: đăng nhập lại, kiểm tra `JWT_SECRET` thống nhất; bearer token quá hạn.
- **`403` trên `/api/admin`**: tài khoản không có vai trò admin trong database.
- **`EADDRINUSE 5000` hoặc `5173`**: đóng tiến trình dùng cổng đó; backend có thể chỉnh `PORT` nhưng khi đổi khỏi `5000` phải cập nhật Vite proxy.
- **Không hiện sản phẩm**: chạy `npm run seed` sau khi MongoDB sẵn sàng và reload trang.
- **Quên mật khẩu không nhận mail**: cần `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` hợp lệ; trong môi trường demo bật `DEV_SHOW_RESET_LINK=true` để nhận link trên giao diện.
- **PowerShell `npm.ps1 cannot be loaded`**: trong VS Code đổi terminal sang Command Prompt (CMD), hoặc xử lý PowerShell Execution Policy theo chính sách máy.

---
**Định hướng:** hệ thống dành cho học tập và demo chức năng, có đường nâng cấp cho môi trường kinh doanh; không nên coi là phần mềm thương mại đã được pentest/chạy tải.
