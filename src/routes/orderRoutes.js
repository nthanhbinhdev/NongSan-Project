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

module.exports = router;
