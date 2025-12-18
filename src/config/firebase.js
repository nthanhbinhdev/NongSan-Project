// src/config/firebase.js
const admin = require("firebase-admin");
const path = require("path");

// Đường dẫn đến file key bạn vừa tải về
const serviceAccount = require(path.join(__dirname, "serviceAccountKey.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth(); // Export auth để dùng xác thực user
const db = admin.firestore(); // Export firestore (nếu cần dùng db của firebase, nhưng ta đang dùng MongoDB)

module.exports = { admin, auth };