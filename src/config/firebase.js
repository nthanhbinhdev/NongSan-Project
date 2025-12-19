const admin = require("firebase-admin");

// Đoạn này quan trọng: Kiểm tra xem có biến môi trường không
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT;

if (serviceAccountKey) {
  // TRƯỜNG HỢP 1: Chạy trên Render (Production)
  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("🔥 Kết nối Firebase thành công qua biến môi trường!");
  } catch (error) {
    console.error("❌ Lỗi parse JSON Firebase key:", error);
  }
} else {
  // TRƯỜNG HỢP 2: Chạy ở máy Bình (Local)
  try {
    const serviceAccount = require("./serviceAccountKey.json");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("💻 Kết nối Firebase thành công qua file Local!");
  } catch (error) {
    console.warn("⚠️ Không tìm thấy key Firebase (Cả biến môi trường lẫn file local).");
  }
}

module.exports = admin;
