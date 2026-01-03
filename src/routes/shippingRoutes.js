// ============================================================
// src/routes/shippingRoutes.js - API VẬN CHUYỂN (DEMO MODE)
// ============================================================
// Chạy: Thêm vào server.js -> app.use("/api/shipping", shippingRoutes);

const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const { verifyToken, isAdmin, optionalAuth } = require("../middleware/authMiddleware");

// ===== POST: Tính phí vận chuyển =====
router.post("/calculate", (req, res) => {
  try {
    const { address, weight, items } = req.body;

    // Demo: Tính phí ship đơn giản theo khu vực
    let baseFee = 20000; // Phí cơ bản
    let distanceFee = 0;

    // Giả lập tính theo địa chỉ
    if (address) {
      const addressLower = address.toLowerCase();

      if (
        addressLower.includes("tp.hcm") ||
        addressLower.includes("sài gòn") ||
        addressLower.includes("hồ chí minh")
      ) {
        distanceFee = 0; // Nội thành miễn phí
      } else if (
        addressLower.includes("hà nội") ||
        addressLower.includes("đà nẵng")
      ) {
        distanceFee = 30000; // Thành phố lớn
      } else {
        distanceFee = 50000; // Tỉnh xa
      }
    }

    // Tính thêm phí theo trọng lượng (demo)
    const weightFee = weight > 5 ? (weight - 5) * 5000 : 0;

    const totalShippingFee = baseFee + distanceFee + weightFee;

    res.json({
      success: true,
      data: {
        baseFee,
        distanceFee,
        weightFee,
        totalShippingFee,
        estimatedDays: distanceFee === 0 ? "1-2 ngày" : "2-4 ngày",
        breakdown: [
          { label: "Phí cơ bản", amount: baseFee },
          { label: "Phí khoảng cách", amount: distanceFee },
          { label: "Phí trọng lượng", amount: weightFee },
        ],
      },
    });
  } catch (error) {
    console.error("❌ POST /shipping/calculate error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi tính phí vận chuyển",
    });
  }
});

// ===== POST: Tạo đơn vận chuyển (Admin) =====
router.post("/create", verifyToken, isAdmin, async (req, res) => {
  try {
    const { orderId, shippingPartner, trackingNumber } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    // Cập nhật trạng thái đơn hàng
    order.status = "shipping";
    order.shippedAt = Date.now();

    // Lưu thông tin vận chuyển (giả lập)
    const shippingInfo = {
      shippingPartner: shippingPartner || "Giao hàng nhanh",
      trackingNumber: trackingNumber || `GHN-${Date.now()}`,
      createdAt: Date.now(),
    };

    // Có thể lưu vào order hoặc collection riêng (demo đơn giản)
    // Ở đây ta chỉ giả lập, không lưu thực tế vào DB

    await order.save();

    res.json({
      success: true,
      message: "Đã tạo đơn vận chuyển",
      data: {
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
        },
        shipping: shippingInfo,
      },
    });
  } catch (error) {
    console.error("❌ POST /shipping/create error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi tạo đơn vận chuyển",
    });
  }
});

// ===== GET: Theo dõi đơn hàng (Tracking) =====
router.get("/tracking/:orderId", optionalAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    // Giả lập timeline vận chuyển
    const timeline = [];

    timeline.push({
      status: "pending",
      title: "Đơn hàng đã được đặt",
      description: "Chúng tôi đã nhận được đơn hàng của bạn",
      timestamp: order.createdAt,
      completed: true,
    });

    if (order.confirmedAt) {
      timeline.push({
        status: "confirmed",
        title: "Đơn hàng đã được xác nhận",
        description: "Người bán đã xác nhận và đang chuẩn bị hàng",
        timestamp: order.confirmedAt,
        completed: true,
      });
    }

    if (order.shippedAt) {
      timeline.push({
        status: "shipping",
        title: "Đơn hàng đang được giao",
        description: "Đơn hàng đã được chuyển cho đơn vị vận chuyển",
        timestamp: order.shippedAt,
        completed: true,
      });

      // Giả lập các điểm dừng trên đường
      timeline.push({
        status: "in_transit",
        title: "Hàng đang trên đường",
        description: "Đơn hàng đang di chuyển đến khu vực của bạn",
        timestamp: new Date(order.shippedAt.getTime() + 86400000), // +1 ngày
        completed: order.status !== "shipping",
      });
    }

    if (order.deliveredAt) {
      timeline.push({
        status: "delivered",
        title: "Đã giao hàng thành công",
        description: "Đơn hàng đã được giao đến bạn",
        timestamp: order.deliveredAt,
        completed: true,
      });
    } else if (order.status === "shipping") {
      timeline.push({
        status: "out_for_delivery",
        title: "Đang giao hàng",
        description: "Shipper đang trên đường giao hàng đến bạn",
        timestamp: null,
        completed: false,
        estimated: "Dự kiến trong 2-4 giờ tới",
      });
    }

    if (order.cancelledAt) {
      timeline.push({
        status: "cancelled",
        title: "Đơn hàng đã bị hủy",
        description: "Đơn hàng đã bị hủy theo yêu cầu",
        timestamp: order.cancelledAt,
        completed: true,
      });
    }

    res.json({
      success: true,
      data: {
        order: {
          orderNumber: order.orderNumber,
          status: order.status,
          customer: order.customer,
        },
        tracking: {
          currentStatus: order.status,
          estimatedDelivery:
            order.status === "shipping"
              ? "2-4 ngày"
              : order.status === "delivered"
              ? "Đã giao"
              : "Đang xử lý",
          timeline,
        },
      },
    });
  } catch (error) {
    console.error("❌ GET /shipping/tracking error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi lấy thông tin vận chuyển",
    });
  }
});

// ===== GET: Danh sách đơn vị vận chuyển =====
router.get("/partners", (req, res) => {
  const partners = [
    {
      id: "ghn",
      name: "Giao hàng nhanh",
      description: "Đối tác vận chuyển chính",
      logo: "🚚",
      estimatedDays: "2-3 ngày",
      rating: 4.5,
    },
    {
      id: "ghtk",
      name: "Giao hàng tiết kiệm",
      description: "Giá rẻ, phù hợp đơn nhỏ",
      logo: "📦",
      estimatedDays: "3-5 ngày",
      rating: 4.2,
    },
    {
      id: "vnpost",
      name: "VN Post",
      description: "Bưu điện Việt Nam",
      logo: "📮",
      estimatedDays: "4-7 ngày",
      rating: 4.0,
    },
  ];

  res.json({
    success: true,
    data: partners,
  });
});

module.exports = router;