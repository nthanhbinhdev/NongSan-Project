const admin = require("firebase-admin");

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT;

if (serviceAccountKey) {
  // Production: Dùng biến môi trường
  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("🔥 Firebase Production OK!");
  } catch (error) {
    console.error("❌ Lỗi Firebase:", error);
  }
} else {
  // Development: Dùng file local
  try {
    const serviceAccount = require("./serviceAccountKey.json");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("💻 Firebase Local OK!");
  } catch (error) {
    console.warn("⚠️ Không tìm thấy Firebase key");
  }
}

module.exports = admin;
