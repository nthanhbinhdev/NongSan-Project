const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const {
  verifyToken,
  isAdmin,
  optionalAuth,
} = require("../middleware/authMiddleware");

router.post("/calculate", (req, res) => {
  try {
    const { address, weight = 1, items = [] } = req.body;

    let baseFee = 20000;
    let distanceFee = 0;

    if (address) {
      const addressLower = address.toLowerCase();

      if (
        addressLower.includes("tp.hcm") ||
        addressLower.includes("sài gòn") ||
        addressLower.includes("hồ chí minh") ||
        addressLower.includes("quận") ||
        addressLower.includes("thủ đức")
      ) {
        distanceFee = 0;
      } else if (
        addressLower.includes("hà nội") ||
        addressLower.includes("đà nẵng") ||
        addressLower.includes("cần thơ") ||
        addressLower.includes("hải phòng")
      ) {
        distanceFee = 30000;
      } else if (
        addressLower.includes("bình dương") ||
        addressLower.includes("đồng nai") ||
        addressLower.includes("bà rịa") ||
        addressLower.includes("long an")
      ) {
        distanceFee = 15000;
      } else {
        distanceFee = 50000;
      }
    }

    const totalWeight = items.reduce((sum, item) => {
      return sum + (item.quantity || 1) * (item.weight || 0.5);
    }, weight);

    const weightFee =
      totalWeight > 5 ? Math.ceil((totalWeight - 5) / 2) * 5000 : 0;

    const totalShippingFee = baseFee + distanceFee + weightFee;

    const estimatedDays =
      distanceFee === 0
        ? "1-2 ngày"
        : distanceFee <= 30000
        ? "2-3 ngày"
        : "3-5 ngày";

    res.json({
      success: true,
      data: {
        baseFee,
        distanceFee,
        weightFee,
        totalShippingFee,
        totalWeight: totalWeight.toFixed(2),
        estimatedDays,
        breakdown: [
          { label: "Phí cơ bản", amount: baseFee },
          { label: "Phí khoảng cách", amount: distanceFee },
          { label: "Phí trọng lượng", amount: weightFee },
        ],
      },
    });
  } catch (error) {
    console.error("POST /shipping/calculate error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi tính phí vận chuyển",
    });
  }
});

router.post("/create", verifyToken, isAdmin, async (req, res) => {
  try {
    const { orderId, shippingPartner, trackingNumber, estimatedDelivery } =
      req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    if (order.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Đơn hàng chưa được xác nhận",
      });
    }

    order.status = "shipping";
    order.shippedAt = Date.now();

    const shippingInfo = {
      shippingPartner: shippingPartner || "Giao hàng nhanh",
      trackingNumber: trackingNumber || `GHN${Date.now()}`,
      estimatedDelivery: estimatedDelivery || "2-3 ngày",
      createdAt: Date.now(),
    };

    order.note =
      (order.note || "") + ` | Shipping: ${JSON.stringify(shippingInfo)}`;
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
    console.error("POST /shipping/create error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi tạo đơn vận chuyển",
    });
  }
});

router.get("/tracking/:orderId", optionalAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

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

      const inTransitTime = new Date(order.shippedAt.getTime() + 43200000);
      if (order.status === "shipping" || order.deliveredAt) {
        timeline.push({
          status: "in_transit",
          title: "Hàng đang trên đường",
          description: "Đơn hàng đang di chuyển đến khu vực của bạn",
          timestamp: inTransitTime,
          completed: order.status !== "shipping",
        });
      }
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
      const estimatedTime = new Date(order.shippedAt.getTime() + 172800000);
      timeline.push({
        status: "out_for_delivery",
        title: "Đang giao hàng",
        description: "Shipper đang trên đường giao hàng đến bạn",
        timestamp: null,
        completed: false,
        estimated: estimatedTime.toLocaleDateString("vi-VN"),
      });
    }

    if (order.cancelledAt) {
      timeline.push({
        status: "cancelled",
        title: "Đơn hàng đã bị hủy",
        description: order.note || "Đơn hàng đã bị hủy",
        timestamp: order.cancelledAt,
        completed: true,
      });
    }

    const currentLocation =
      order.status === "delivered"
        ? order.customer.address
        : order.status === "shipping"
        ? "Đang trên đường giao hàng"
        : order.status === "confirmed"
        ? "Kho hàng"
        : "Đang xử lý";

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
          currentLocation,
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
    console.error("GET /shipping/tracking error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi lấy thông tin vận chuyển",
    });
  }
});

router.get("/partners", (req, res) => {
  const partners = [
    {
      id: "ghn",
      name: "Giao hàng nhanh",
      description: "Đối tác vận chuyển chính",
      estimatedDays: "2-3 ngày",
      rating: 4.5,
      priceRange: "15.000 - 50.000đ",
    },
    {
      id: "ghtk",
      name: "Giao hàng tiết kiệm",
      description: "Giá rẻ, phù hợp đơn nhỏ",
      estimatedDays: "3-5 ngày",
      rating: 4.2,
      priceRange: "12.000 - 40.000đ",
    },
    {
      id: "vnpost",
      name: "VN Post",
      description: "Bưu điện Việt Nam",
      estimatedDays: "4-7 ngày",
      rating: 4.0,
      priceRange: "10.000 - 35.000đ",
    },
  ];

  res.json({
    success: true,
    data: partners,
  });
});

router.put(
  "/update-status/:orderId",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const { location, note } = req.body;

      const order = await Order.findById(req.params.orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đơn hàng",
        });
      }

      if (order.status !== "shipping") {
        return res.status(400).json({
          success: false,
          message: "Đơn hàng không ở trạng thái đang giao",
        });
      }

      const updateNote = `${new Date().toLocaleString("vi-VN")} - Vị trí: ${
        location || "Đang cập nhật"
      }`;
      order.note = (order.note || "") + ` | ${updateNote}`;

      if (note) {
        order.note += ` - ${note}`;
      }

      await order.save();

      res.json({
        success: true,
        message: "Đã cập nhật trạng thái vận chuyển",
        data: order,
      });
    } catch (error) {
      console.error("PUT /shipping/update-status error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi cập nhật trạng thái",
      });
    }
  }
);

module.exports = router;
