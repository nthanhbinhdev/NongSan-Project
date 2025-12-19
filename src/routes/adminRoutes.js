// ============================================================
// src/routes/adminRoutes.js - API ADMIN DASHBOARD
// ============================================================
const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// Middleware: Tất cả routes dưới đây yêu cầu admin
router.use(verifyToken);
router.use(isAdmin);

// ===== GET: Thống kê tổng quan =====
router.get("/stats/overview", async (req, res) => {
  try {
    const [totalCustomers, totalOrders, totalProducts, recentOrders] = await Promise.all([
      User.countDocuments({ role: "customer" }),
      Order.countDocuments(),
      Product.countDocuments(),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("customer.userId", "fullName email"),
    ]);

    // Tính tổng doanh thu
    const revenue = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$finalAmount" } } },
    ]);

    const totalRevenue = revenue.length > 0 ? revenue[0].total : 0;

    // Thống kê đơn hàng theo trạng thái
    const orderStats = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const ordersByStatus = {
      pending: 0,
      confirmed: 0,
      shipping: 0,
      delivered: 0,
      cancelled: 0,
    };

    orderStats.forEach((stat) => {
      ordersByStatus[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: {
        totalCustomers,
        totalOrders,
        totalProducts,
        totalRevenue,
        ordersByStatus,
        recentOrders,
      },
    });
  } catch (error) {
    console.error("❌ GET /admin/stats/overview error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== GET: Hoạt động gần đây =====
router.get("/activities/recent", async (req, res) => {
  try {
    const recentUsers = await User.find({ role: "customer" })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("fullName email createdAt");

    res.json({
      success: true,
      data: recentUsers,
    });
  } catch (error) {
    console.error("❌ GET /admin/activities/recent error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== GET: Danh sách sản phẩm (phân trang) =====
router.get("/products", async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    const query = {};
    
    if (category) {
      query.category = new RegExp(category, "i");
    }

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(skip),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ GET /admin/products error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== GET: Danh sách đơn hàng (tất cả) =====
router.get("/orders", async (req, res) => {
  try {
    const { status, month, year, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      query.createdAt = { $gte: startDate, $lte: endDate };
    }

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(skip)
        .populate("items.productId", "name image"),
      Order.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ GET /admin/orders error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== PUT: Cập nhật trạng thái đơn hàng =====
router.put("/orders/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    
    const validStatuses = ["pending", "confirmed", "shipping", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ",
      });
    }

    const updateData = { status, updatedAt: Date.now() };

    if (status === "confirmed") updateData.confirmedAt = Date.now();
    if (status === "shipping") updateData.shippedAt = Date.now();
    if (status === "delivered") {
      updateData.deliveredAt = Date.now();
      updateData.paymentStatus = "paid";
    }
    if (status === "cancelled") updateData.cancelledAt = Date.now();

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    res.json({
      success: true,
      message: "Cập nhật trạng thái thành công",
      data: order,
    });
  } catch (error) {
    console.error("❌ PUT /admin/orders/:id/status error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== DELETE: Xóa sản phẩm =====
router.delete("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }

    res.json({
      success: true,
      message: "Xóa sản phẩm thành công",
    });
  } catch (error) {
    console.error("❌ DELETE /admin/products/:id error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== PUT: Cập nhật số lượng sản phẩm =====
router.put("/products/:id/quantity", async (req, res) => {
  try {
    const { quantity } = req.body;

    if (!quantity || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Số lượng không hợp lệ",
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { stock: Number(quantity), updatedAt: Date.now() },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }

    res.json({
      success: true,
      message: "Cập nhật số lượng thành công",
      data: product,
    });
  } catch (error) {
    console.error("❌ PUT /admin/products/:id/quantity error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== GET: Thống kê doanh thu theo tháng =====
router.get("/stats/revenue", async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const revenueByMonth = await Order.aggregate([
      {
        $match: {
          status: { $ne: "cancelled" },
          createdAt: {
            $gte: new Date(year, 0, 1),
            $lte: new Date(year, 11, 31, 23, 59, 59),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          total: { $sum: "$finalAmount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const monthlyRevenue = Array(12).fill(0);
    const monthlyOrders = Array(12).fill(0);

    revenueByMonth.forEach((item) => {
      monthlyRevenue[item._id - 1] = item.total;
      monthlyOrders[item._id - 1] = item.count;
    });

    res.json({
      success: true,
      data: {
        year: Number(year),
        monthlyRevenue,
        monthlyOrders,
      },
    });
  } catch (error) {
    console.error("❌ GET /admin/stats/revenue error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;