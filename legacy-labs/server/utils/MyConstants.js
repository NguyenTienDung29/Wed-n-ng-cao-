// BẢN THAM KHẢO ĐÃ ĐƯỢC ẨN THÔNG TIN NHẠY CẢM TỪ FILE LAB GỐC.
// KHÔNG SỬ DỤNG FILE NÀY ĐỂ CHẠY WEBSITE TECH MỚI.
// Hãy dùng backend/.env của dự án TECH thay cho cấu hình hard-code.
const MyConstants = {
  DB_SERVER: 'YOUR_OLD_MONGODB_HOST',
  DB_USER: 'YOUR_OLD_DB_USER',
  DB_PASS: 'REDACTED',
  DB_DATABASE: 'shoppingonline',
  EMAIL_USER: 'REDACTED@example.com',
  EMAIL_PASS: 'REDACTED',
  JWT_SECRET: 'REDACTED_LEGACY_SECRET',
  JWT_EXPIRES: '365000000000000'
};
module.exports = MyConstants;
