// ============================================================
// src/routes/orderRoutes.js - API ĐƠN HÀNG
// ============================================================
const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");

// ===== POST: Tạo đơn hàng mới =====
router.post("/", async (req, res) => {
  try {
    const { customer, items, note, paymentMethod } = req.body;

    // Validate
    if (!customer || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Thông tin đơn hàng không hợp lệ",
      });
    }

    // Validate thông tin khách hàng
    if (!customer.name || !customer.phone || !customer.address) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin giao hàng",
      });
    }

    // Tính tổng tiền và validate sản phẩm
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Không tìm thấy sản phẩm`,
        });
      }

      if (!product.inStock || product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm "${product.name}" không đủ số lượng`,
        });
      }

      const priceAfterDiscount = product.price * (1 - product.discount);
      const subtotal = priceAfterDiscount * item.quantity;
      totalAmount += subtotal;

      orderItems.push({
        productId: product._id,
        name: product.name,
        price: priceAfterDiscount,
        quantity: item.quantity,
        subtotal,
      });
    }

    const shippingFee = 20000;
    const finalAmount = totalAmount + shippingFee;

    // Tạo đơn hàng
    const newOrder = new Order({
      customer,
      items: orderItems,
      totalAmount,
      shippingFee,
      finalAmount,
      note,
      paymentMethod: paymentMethod || "cod",
    });

    const savedOrder = await newOrder.save();

    // Giảm số lượng tồn kho
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      });
    }

    res.status(201).json({
      success: true,
      message: "Đặt hàng thành công! Chúng tôi sẽ liên hệ với bạn sớm.",
      data: savedOrder,
    });
  } catch (error) {
    console.error("Lỗi POST /orders:", error);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.",
    });
  }
});

// ===== GET: Lấy danh sách đơn hàng =====
router.get("/", async (req, res) => {
  try {
    const { userId, status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (userId) query["customer.userId"] = userId;
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(skip)
        .populate("items.productId"),
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
    console.error("Lỗi GET /orders:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== GET: Lấy đơn hàng của user hiện tại =====
router.get("/my-orders", async (req, res) => {
  try {
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng đăng nhập để xem đơn hàng",
      });
    }

    const orders = await Order.find({ "customer.userId": userId })
      .sort({ createdAt: -1 })
      .populate("items.productId");

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error("Lỗi GET /orders/my-orders:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== GET: Chi tiết 1 đơn hàng =====
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "items.productId"
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error("Lỗi GET /orders/:id:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== PUT: Cập nhật trạng thái đơn hàng (Admin) =====
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = [
      "pending",
      "confirmed",
      "shipping",
      "delivered",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ",
      });
    }

    const updateData = { status };

    // Cập nhật thời gian theo trạng thái
    if (status === "confirmed") updateData.confirmedAt = Date.now();
    if (status === "shipping") updateData.shippedAt = Date.now();
    if (status === "delivered") {
      updateData.deliveredAt = Date.now();
      updateData.paymentStatus = "paid";
    }
    if (status === "cancelled") updateData.cancelledAt = Date.now();

    const order = await Order.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

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
    console.error("Lỗi PUT /orders/:id/status:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== DELETE: Hủy đơn hàng =====
router.delete("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    // Chỉ cho phép hủy đơn ở trạng thái pending
    if (order.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Không thể hủy đơn hàng đã được xác nhận",
      });
    }

    // Hoàn lại số lượng tồn kho
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity },
      });
    }

    order.status = "cancelled";
    order.cancelledAt = Date.now();
    await order.save();

    res.json({
      success: true,
      message: "Hủy đơn hàng thành công",
    });
  } catch (error) {
    console.error("Lỗi DELETE /orders/:id:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================
// src/routes/orderRoutes.js - BỔ SUNG (Thêm vào file cũ)
// ============================================================
// Các routes bổ sung cho chức năng đơn hàng đầy đủ hơn
// COPY & PASTE các đoạn này vào cuối file orderRoutes.js hiện tại

const emailService = require("../services/emailService");

// ===== GET: Lịch sử đơn hàng của user =====
router.get("/history", async (req, res) => {
  try {
    const {
      userId,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu userId",
      });
    }

    const query = { "customer.userId": userId };

    // Lọc theo trạng thái
    if (status) {
      query.status = status;
    }

    // Lọc theo thời gian
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
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

    // Thống kê theo trạng thái
    const statusCounts = await Order.aggregate([
      { $match: { "customer.userId": userId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const stats = {
      total,
      pending: 0,
      confirmed: 0,
      shipping: 0,
      delivered: 0,
      cancelled: 0,
    };

    statusCounts.forEach((item) => {
      stats[item._id] = item.count;
    });

    res.json({
      success: true,
      data: orders,
      stats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ GET /orders/history error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi lấy lịch sử đơn hàng",
    });
  }
});

// ===== GET: Timeline chi tiết của đơn hàng =====
router.get("/:id/timeline", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    // Tạo timeline events
    const timeline = [];

    // 1. Đơn hàng được tạo
    timeline.push({
      event: "created",
      title: "Đơn hàng được đặt",
      description: `Bạn đã đặt đơn hàng #${order.orderNumber}`,
      timestamp: order.createdAt,
      icon: "📝",
      color: "blue",
    });

    // 2. Xác nhận
    if (order.confirmedAt) {
      timeline.push({
        event: "confirmed",
        title: "Đơn hàng được xác nhận",
        description: "Người bán đã xác nhận và đang chuẩn bị hàng",
        timestamp: order.confirmedAt,
        icon: "✅",
        color: "green",
      });
    }

    // 3. Đang giao
    if (order.shippedAt) {
      timeline.push({
        event: "shipped",
        title: "Đơn hàng đang được giao",
        description: "Đơn hàng đã được chuyển cho đơn vị vận chuyển",
        timestamp: order.shippedAt,
        icon: "🚚",
        color: "orange",
      });
    }

    // 4. Đã giao
    if (order.deliveredAt) {
      timeline.push({
        event: "delivered",
        title: "Đã giao hàng thành công",
        description: "Đơn hàng đã được giao đến bạn",
        timestamp: order.deliveredAt,
        icon: "🎉",
        color: "green",
      });
    }

    // 5. Đã hủy
    if (order.cancelledAt) {
      timeline.push({
        event: "cancelled",
        title: "Đơn hàng đã bị hủy",
        description: order.note || "Đơn hàng đã bị hủy",
        timestamp: order.cancelledAt,
        icon: "❌",
        color: "red",
      });
    }

    // Sắp xếp theo thời gian
    timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.json({
      success: true,
      data: {
        order: {
          orderNumber: order.orderNumber,
          status: order.status,
          createdAt: order.createdAt,
        },
        timeline,
      },
    });
  } catch (error) {
    console.error("❌ GET /orders/:id/timeline error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi lấy timeline đơn hàng",
    });
  }
});

// ===== POST: Hủy đơn hàng (có lý do) =====
router.post("/:id/cancel", async (req, res) => {
  try {
    const { reason, userId } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    // Kiểm tra quyền hủy (chỉ user sở hữu hoặc admin)
    if (userId && order.customer.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền hủy đơn hàng này",
      });
    }

    // Chỉ cho phép hủy đơn pending hoặc confirmed
    if (!["pending", "confirmed"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "Không thể hủy đơn hàng đang giao hoặc đã giao",
      });
    }

    // Hoàn lại số lượng tồn kho
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity },
      });
    }

    // Cập nhật trạng thái
    const oldStatus = order.status;
    order.status = "cancelled";
    order.cancelledAt = Date.now();
    order.note = reason || "Khách hàng hủy đơn";

    await order.save();

    // Gửi email thông báo (mock)
    try {
      await emailService.sendOrderStatusUpdate(order, oldStatus, "cancelled");
    } catch (emailError) {
      console.log("⚠️ Không gửi được email:", emailError.message);
    }

    res.json({
      success: true,
      message: "Đã hủy đơn hàng thành công",
      data: order,
    });
  } catch (error) {
    console.error("❌ POST /orders/:id/cancel error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hủy đơn hàng",
    });
  }
});

// ===== GET: Thống kê đơn hàng của user =====
router.get("/stats/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    // Thống kê tổng quan
    const [totalOrders, totalSpent, statusBreakdown] = await Promise.all([
      Order.countDocuments({ "customer.userId": userId }),
      Order.aggregate([
        {
          $match: {
            "customer.userId": userId,
            status: { $ne: "cancelled" },
          },
        },
        { $group: { _id: null, total: { $sum: "$finalAmount" } } },
      ]),
      Order.aggregate([
        { $match: { "customer.userId": userId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const totalAmount = totalSpent[0]?.total || 0;

    const statusCounts = {
      pending: 0,
      confirmed: 0,
      shipping: 0,
      delivered: 0,
      cancelled: 0,
    };

    statusBreakdown.forEach((item) => {
      statusCounts[item._id] = item.count;
    });

    // Đơn hàng gần nhất
    const recentOrders = await Order.find({ "customer.userId": userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("orderNumber status finalAmount createdAt");

    res.json({
      success: true,
      data: {
        totalOrders,
        totalAmount,
        statusCounts,
        recentOrders,
      },
    });
  } catch (error) {
    console.error("❌ GET /orders/stats/user error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi lấy thống kê đơn hàng",
    });
  }
});

// ===== POST: Đánh giá đơn hàng =====
router.post("/:id/review", async (req, res) => {
  try {
    const { rating, comment, userId } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    // Kiểm tra quyền đánh giá
    if (userId && order.customer.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền đánh giá đơn hàng này",
      });
    }

    // Chỉ cho phép đánh giá đơn đã giao
    if (order.status !== "delivered") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể đánh giá đơn hàng đã giao",
      });
    }

    // Lưu đánh giá (giả lập - trong thực tế cần schema riêng)
    // Ở đây ta chỉ demo bằng cách thêm vào note
    order.note = `Đánh giá: ${rating}/5 - ${comment}`;
    await order.save();

    res.json({
      success: true,
      message: "Cảm ơn bạn đã đánh giá!",
      data: {
        rating,
        comment,
      },
    });
  } catch (error) {
    console.error("❌ POST /orders/:id/review error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi gửi đánh giá",
    });
  }
});

// ===== Middleware: Gửi email khi tạo đơn =====
// Thêm vào sau khi tạo đơn hàng thành công trong POST /orders
/*
// Trong POST / endpoint, sau dòng: const savedOrder = await newOrder.save();
// Thêm:

try {
  await emailService.sendOrderConfirmation(savedOrder);
} catch (emailError) {
  console.log("⚠️ Không gửi được email:", emailError.message);
}
*/

// ===== Middleware: Gửi email khi thay đổi trạng thái =====
// Thêm vào PUT /:id/status endpoint
/*
// Trong PUT /:id/status, sau khi save order, thêm:

try {
  await emailService.sendOrderStatusUpdate(order, oldStatus, status);
} catch (emailError) {
  console.log("⚠️ Không gửi được email:", emailError.message);
}
*/

module.exports = router;
