// server.js - SERVER BACKEND HOÀN CHỈNH
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://your-domain.com' 
    : 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// ============================================================
// MONGODB CONNECTION
// ============================================================
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Đã kết nối MongoDB thành công"))
  .catch((err) => {
    console.error("❌ Lỗi kết nối MongoDB:", err.message);
    process.exit(1);
  });

// ============================================================
// IMPORT ROUTES
// ============================================================
const authRoutes = require("./src/routes/authRoutes");
const productRoutes = require("./src/routes/productRoutes");
const orderRoutes = require("./src/routes/orderRoutes");
const cartRoutes = require("./src/routes/cartRoutes");

// ============================================================
// API ROUTES (Phải đặt TRƯỚC route static)
// ============================================================
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server đang hoạt động",
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"
  });
});

// ============================================================
// SERVE FRONTEND (Phải đặt SAU API routes)
// ============================================================
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ============================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Lỗi server nội bộ",
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await mongoose.connection.close();
  process.exit(0);
});

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 MongoDB: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
});