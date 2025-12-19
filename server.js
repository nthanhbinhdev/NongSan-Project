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
const adminRoutes = require("./src/routes/adminRoutes");

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

// 3. Health check TRƯỚC KHI kết nối MongoDB
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server đang hoạt động",
    mongoStatus: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date(),
  });
});

// 4. Kết nối MongoDB với timeout và retry logic
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/nongsanviet";

console.log("🔌 Đang kết nối MongoDB...");
console.log("📍 URI:", MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@")); // Ẩn password

mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 30000, // Tăng timeout lên 30s
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
  })
  .then(() => {
    console.log("✅ Đã kết nối MongoDB thành công!");
    console.log("📊 Database:", mongoose.connection.name);
  })
  .catch((err) => {
    console.error("❌ Lỗi kết nối MongoDB:");
    console.error("   Message:", err.message);
    console.error("   Code:", err.code);
    console.error("\n⚠️  Kiểm tra:");
    console.error("   1. MONGO_URI có đúng không?");
    console.error("   2. MongoDB Atlas Network Access đã whitelist IP chưa?");
    console.error("   3. Database user có quyền readWrite?");
    console.error("   4. Internet connection ổn định không?\n");
  });

// Handle MongoDB connection events
mongoose.connection.on("connected", () => {
  console.log("🟢 MongoDB connected");
});

mongoose.connection.on("error", (err) => {
  console.error("🔴 MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("🟡 MongoDB disconnected");
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("MongoDB connection closed due to app termination");
  process.exit(0);
});

// 5. API Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/admin", adminRoutes);

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
    error: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
  });
});

// 8. Start Server
app.listen(PORT, () => {
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log(`║  🚀 Server đang chạy tại: http://localhost:${PORT}  ║`);
  console.log("╚══════════════════════════════════════════════════╝");
  console.log(`📡 API endpoint: http://localhost:${PORT}/api`);
  console.log(`🔧 Admin endpoint: http://localhost:${PORT}/api/admin`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health\n`);
});
