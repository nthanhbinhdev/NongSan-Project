require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// --- IMPORT ROUTES ---
const productRoutes = require("./src/routes/productRoutes");
const authRoutes = require("./src/routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Cấu hình Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Cấu hình Static Files (Giao diện & Ảnh)
// Serve toàn bộ file trong thư mục public (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "public")));
// Serve thư mục uploads để truy cập ảnh
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// 3. Kết nối MongoDB
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/nongsanviet")
  .then(() => console.log("Đã kết nối MongoDB"))
  .catch((err) => console.error("Lỗi kết nối MongoDB:", err));

// 4. Cấu hình API Routes (QUAN TRỌNG: Phải đặt trước route '*')
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes); // Route đăng ký/đăng nhập

// Route mặc định trả về trang chủ
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 6. Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
