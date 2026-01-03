// ============================================================
// src/routes/analyticsRoutes.js - THỐNG KÊ NÂNG CAO (ADMIN)
// ============================================================
// Chạy: Thêm vào server.js -> app.use("/api/analytics", analyticsRoutes);

const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// Middleware: Tất cả routes yêu cầu admin
router.use(verifyToken);
router.use(isAdmin);

// ===== GET: Thống kê doanh thu chi tiết =====
router.get("/revenue", async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      groupBy = "day", // day, week, month, year
    } = req.query;

    // Thiết lập khoảng thời gian
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const matchStage = {
      status: { $ne: "cancelled" },
    };

    if (startDate || endDate) {
      matchStage.createdAt = dateFilter;
    }

    // Định dạng group theo thời gian
    let groupFormat;
    switch (groupBy) {
      case "day":
        groupFormat = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        };
        break;
      case "week":
        groupFormat = {
          year: { $year: "$createdAt" },
          week: { $week: "$createdAt" },
        };
        break;
      case "month":
        groupFormat = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        };
        break;
      case "year":
        groupFormat = {
          year: { $year: "$createdAt" },
        };
        break;
      default:
        groupFormat = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        };
    }

    // Aggregate revenue
    const revenueData = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupFormat,
          totalRevenue: { $sum: "$finalAmount" },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: "$finalAmount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    // Tính tổng
    const totalStats = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$finalAmount" },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: "$finalAmount" },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        timeline: revenueData,
        summary: totalStats[0] || {
          totalRevenue: 0,
          totalOrders: 0,
          avgOrderValue: 0,
        },
      },
    });
  } catch (error) {
    console.error("❌ GET /analytics/revenue error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi lấy thống kê doanh thu",
    });
  }
});

// ===== GET: Top sản phẩm bán chạy =====
router.get("/products/best-sellers", async (req, res) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;

    const matchStage = {
      status: { $ne: "cancelled" },
    };

    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const bestSellers = await Order.aggregate([
      { $match: matchStage },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          productName: { $first: "$items.name" },
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.subtotal" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: Number(limit) },
    ]);

    // Lấy thêm thông tin sản phẩm
    for (const item of bestSellers) {
      const product = await Product.findById(item._id).select("image category");
      if (product) {
        item.image = product.image;
        item.category = product.category;
      }
    }

    res.json({
      success: true,
      data: bestSellers,
    });
  } catch (error) {
    console.error("❌ GET /analytics/products/best-sellers error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi lấy sản phẩm bán chạy",
    });
  }
});

// ===== GET: Sản phẩm tồn kho thấp =====
router.get("/products/low-stock", async (req, res) => {
  try {
    const { threshold = 10 } = req.query;

    const lowStockProducts = await Product.find({
      stock: { $lte: Number(threshold), $gt: 0 },
      inStock: true,
    })
      .select("id name stock category price image")
      .sort({ stock: 1 })
      .limit(20);

    res.json({
      success: true,
      data: lowStockProducts,
      count: lowStockProducts.length,
    });
  } catch (error) {
    console.error("❌ GET /analytics/products/low-stock error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi lấy sản phẩm tồn kho thấp",
    });
  }
});

// ===== GET: Thống kê khách hàng =====
router.get("/customers", async (req, res) => {
  try {
    // Tổng số khách hàng
    const totalCustomers = await User.countDocuments({ role: "customer" });

    // Khách hàng mới trong tháng
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );
    const newCustomers = await User.countDocuments({
      role: "customer",
      createdAt: { $gte: startOfMonth },
    });

    // Top khách hàng theo doanh thu
    const topCustomers = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: "$customer.userId",
          customerName: { $first: "$customer.name" },
          customerEmail: { $first: "$customer.email" },
          totalSpent: { $sum: "$finalAmount" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
    ]);

    // Phân bố khách hàng theo tháng
    const customerGrowth = await User.aggregate([
      { $match: { role: "customer" } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 },
    ]);

    res.json({
      success: true,
      data: {
        totalCustomers,
        newCustomers,
        topCustomers,
        customerGrowth,
      },
    });
  } catch (error) {
    console.error("❌ GET /analytics/customers error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi lấy thống kê khách hàng",
    });
  }
});

// ===== GET: Thống kê theo danh mục =====
router.get("/categories", async (req, res) => {
  try {
    const categoryStats = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },
      {
        $group: {
          _id: "$productInfo.category",
          totalRevenue: { $sum: "$items.subtotal" },
          totalQuantity: { $sum: "$items.quantity" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    res.json({
      success: true,
      data: categoryStats,
    });
  } catch (error) {
    console.error("❌ GET /analytics/categories error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi lấy thống kê danh mục",
    });
  }
});

// ===== GET: Dashboard overview (tất cả số liệu quan trọng) =====
router.get("/dashboard", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1
    );

    // Doanh thu hôm nay
    const todayRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: today },
          status: { $ne: "cancelled" },
        },
      },
      { $group: { _id: null, total: { $sum: "$finalAmount" } } },
    ]);

    // Doanh thu tháng này
    const monthRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth },
          status: { $ne: "cancelled" },
        },
      },
      { $group: { _id: null, total: { $sum: "$finalAmount" } } },
    ]);

    // Doanh thu tháng trước
    const lastMonthRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfLastMonth, $lt: startOfMonth },
          status: { $ne: "cancelled" },
        },
      },
      { $group: { _id: null, total: { $sum: "$finalAmount" } } },
    ]);

    // Đơn hàng mới hôm nay
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: today },
    });

    // Tổng số khách hàng
    const totalCustomers = await User.countDocuments({ role: "customer" });

    // Sản phẩm tồn kho thấp
    const lowStockCount = await Product.countDocuments({
      stock: { $lte: 10, $gt: 0 },
      inStock: true,
    });

    // Tính tỷ lệ tăng trưởng
    const currentMonth = monthRevenue[0]?.total || 0;
    const lastMonth = lastMonthRevenue[0]?.total || 1; // Tránh chia 0
    const growthRate = ((currentMonth - lastMonth) / lastMonth) * 100;

    res.json({
      success: true,
      data: {
        today: {
          revenue: todayRevenue[0]?.total || 0,
          orders: todayOrders,
        },
        month: {
          revenue: currentMonth,
          growthRate: growthRate.toFixed(2),
        },
        overview: {
          totalCustomers,
          lowStockProducts: lowStockCount,
        },
      },
    });
  } catch (error) {
    console.error("❌ GET /analytics/dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi lấy dashboard overview",
    });
  }
});

// ===== GET: Thống kê theo giờ (hôm nay) =====
router.get("/hourly", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const hourlyStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: today },
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: { $hour: "$createdAt" },
          orders: { $sum: 1 },
          revenue: { $sum: "$finalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Tạo mảng 24 giờ với giá trị mặc định
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      orders: 0,
      revenue: 0,
    }));

    // Fill dữ liệu thực tế
    hourlyStats.forEach((stat) => {
      hours[stat._id] = {
        hour: stat._id,
        orders: stat.orders,
        revenue: stat.revenue,
      };
    });

    res.json({
      success: true,
      data: hours,
    });
  } catch (error) {
    console.error("❌ GET /analytics/hourly error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi lấy thống kê theo giờ",
    });
  }
});

module.exports = router;