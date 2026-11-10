# Tạo database MongoDB mới bằng Compass để demo đồ án TECH

## Hiểu đúng trước khi cài

- **MongoDB Compass** là ứng dụng GUI để kết nối, xem và sửa dữ liệu; không phải MongoDB Server.
- **MongoDB Community Server** lưu và xử lý dữ liệu trên máy Windows. Compass kết nối tới server này.
- **MongoDB Atlas** lưu dữ liệu trên Cloud. Compass vẫn có thể kết nối tới Atlas mà không cần MongoDB Server local.
- Dự án **TECH** đã có Mongoose models và script seed. **Không cần tạo thủ công 10 collection**; chạy `npm run seed` sẽ tạo collection khi kết nối thành công.

## Lựa chọn A – MongoDB Community Server + Compass (dễ demo khi offline)

1. Tải MongoDB Community Server: https://www.mongodb.com/try/download/community
2. Chọn Windows MSI, cài `Complete`, bật `Install MongoD as a Service`. Có thể tích chọn cài Compass.
3. Kiểm tra PowerShell: `Get-Service MongoDB` (kỳ vọng `Running`). Nếu `Stopped`, mở PowerShell **Run as administrator** và chạy `Start-Service MongoDB`.
4. Mở MongoDB Compass → **Add New Connection** → nhập `mongodb://127.0.0.1:27017` → **Connect**.
5. **Không bắt buộc tự tạo database.** Trong TECH mở `backend/.env` và giữ dòng:

   ```env
   MONGO_URI=mongodb://127.0.0.1:27017/tech_ecommerce
   ```

6. Bấm `CAI_DAT_LAN_DAU.bat` tại thư mục gốc. Script sẽ cài npm, sinh JWT secret nếu đang là giá trị ví dụ, chạy `npm run seed` và unit test.
7. Trở lại Compass → **Refresh** → xem database `tech_ecommerce` với các collection. Ví dụ: `users`, `products`, `categories`, `brands`, `carts`, `orders`, `reviews`, `coupons`, `addresses`, `banners`.

**Nếu bạn thật sự muốn tạo DB thủ công trước khi chạy seed:** Compass → Create Database → Database Name: `tech_ecommerce`, Collection Name: `products` → Create Database. Các collection còn lại sẽ được tạo sau khi seed.

## Lựa chọn B – MongoDB Atlas mới + Compass (không cần Mongo Server local)

1. Tạo Cluster mới trên https://cloud.mongodb.com/ (chọn gói Free nếu phù hợp), tạo Database User.
2. Network Access → Add Current IP Address (chỉ cấp quyền IP bạn đang sử dụng; hạn chế mở `0.0.0.0/0`).
3. Cluster → Connect → Drivers → Node.js, sao chép chuỗi `mongodb+srv://...`.
4. Dán chuỗi vào **`backend/.env`** ở dòng `MONGO_URI` và thêm tên database `tech_ecommerce` vào đường dẫn URI. Phần mật khẩu có ký tự đặc biệt phải URL-encode.
5. Trong Compass, tạo **New Connection**, dán đúng chuỗi Atlas (nếu cần). **Không gửi chuỗi URI có mật khẩu lên nhóm, chat hoặc GitHub.**
6. Chạy `CAI_DAT_LAN_DAU.bat` để seed; Compass Refresh để xem database và các collection.

> Không tạo thêm một “MongoDB Compass server” riêng. Chỉ cần một server MongoDB (local hoặc Atlas), và Compass là công cụ quan sát dữ liệu đó.

## Khắc phục lỗi gặp trên máy bạn

- `Get-Service : Cannot find any service with service name 'MongoDB'`: chưa có Windows Service MongoDB. Bạn có thể cài Community Server hoặc dùng Atlas; cài Compass riêng **không** giải quyết lỗi này.
- `connect ECONNREFUSED 127.0.0.1:27017`: `.env` đang trỏ tới localhost nhưng MongoDB local chưa chạy. Cần bật Community Server hoặc thay URI Atlas.
- `Vite http proxy error ECONNREFUSED`: Backend không khởi động, thường vì không kết nối được MongoDB. Kiểm tra terminal Backend trước.
- Atlas `bad auth`, `IP not whitelisted`, `ENOTFOUND`: kiểm tra database user/mật khẩu, IP cho phép, URI Cluster và kết nối Internet.
- Không thấy database trong Compass: kiểm tra đã Connect tới **cùng server/Cluster** và đã chạy seed thành công; sau đó Refresh.

## Cách thuyết trình dữ liệu

Mở đồng thời TECH trên `localhost:5173` và Compass → `tech_ecommerce`. Đặt đơn COD bằng tài khoản User, chuyển sang Compass mở collection `orders`, nhấn Refresh. Có thể quan sát đơn hàng mới và trạng thái `pending`/`unpaid`; sau đó đăng nhập Admin để duyệt đơn, refresh `orders` để kiểm chứng API thực sự ghi dữ liệu MongoDB.
