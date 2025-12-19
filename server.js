require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");

// --- IMPORT ROUTES ---
const productRoutes = require("./src/routes/productRoutes");
const orderRoutes = require("./src/routes/orderRoutes");
const cartRoutes = require("./src/routes/cartRoutes");
const authRoutes = require("./src/routes/authRoutes");
const adminRoutes = require("./src/routes/adminRoutes"); // NEW

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// 2. Static Files
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// 3. Kết nối MongoDB
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/nongsanviet")
  .then(() => console.log("Đã kết nối MongoDB"))
  .catch((err) => console.error("Lỗi kết nối MongoDB:", err));

// 4. API Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/admin", adminRoutes); // NEW - Admin routes

// 5. Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server đang hoạt động",
    timestamp: new Date(),
  });
});

// 6. Xử lý 404
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Đường dẫn không tồn tại (404 Not Found)",
  });
});

// 7. Error handling
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({
    success: false,
    message: "Lỗi server nội bộ",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 8. Start Server
app.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api`);
  console.log(`Admin endpoint: http://localhost:${PORT}/api/admin`);
});