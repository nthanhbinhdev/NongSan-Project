// ============================================================
// src/routes/paymentRoutes.js - API THANH TOÁN (DEMO MODE)
// ============================================================
// Chạy: Thêm vào server.js -> app.use("/api/payment", paymentRoutes);

const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const { verifyToken, optionalAuth } = require("../middleware/authMiddleware");

// ===== GET: Danh sách phương thức thanh toán =====
router.get("/methods", (req, res) => {
  const paymentMethods = [
    {
      id: "cod",
      name: "Thanh toán khi nhận hàng (COD)",
      description: "Thanh toán bằng tiền mặt khi nhận hàng",
      fee: 0,
      icon: "💵",
      enabled: true,
    },
    {
      id: "bank_transfer",
      name: "Chuyển khoản ngân hàng",
      description: "Chuyển khoản qua VCB, TCB, MB...",
      fee: 0,
      icon: "🏦",
      enabled: true,
      bankInfo: {
        bankName: "Ngân hàng Vietcombank",
        accountNumber: "0123456789",
        accountName: "NONG SAN VIET",
      },
    },
    {
      id: "momo",
      name: "Ví MoMo",
      description: "Thanh toán qua ví điện tử MoMo",
      fee: 0,
      icon: "📱",
      enabled: true,
    },
    {
      id: "zalopay",
      name: "ZaloPay",
      description: "Thanh toán qua ví ZaloPay",
      fee: 0,
      icon: "💳",
      enabled: false, // Demo: tắt tạm
    },
  ];

  res.json({
    success: true,
    data: paymentMethods,
  });
});

// ===== POST: Xử lý thanh toán (Demo - Giả lập) =====
router.post("/process", optionalAuth, async (req, res) => {
  try {
    const { orderId, paymentMethod, paymentDetails } = req.body;

    // Validate
    if (!orderId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin thanh toán",
      });
    }

    // Tìm đơn hàng
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    // Giả lập xử lý theo từng phương thức
    let paymentResult;

    switch (paymentMethod) {
      case "cod":
        // COD: Không cần xử lý gì, chỉ xác nhận
        paymentResult = {
          transactionId: `COD-${Date.now()}`,
          status: "pending",
          message: "Đơn hàng sẽ được thanh toán khi nhận hàng",
        };
        break;

      case "bank_transfer":
        // Bank Transfer: Giả lập chờ xác nhận chuyển khoản
        paymentResult = {
          transactionId: `BANK-${Date.now()}`,
          status: "pending",
          message: "Vui lòng chuyển khoản và gửi bill xác nhận",
          bankInfo: {
            bankName: "Vietcombank",
            accountNumber: "0123456789",
            accountName: "NONG SAN VIET",
            amount: order.finalAmount,
            content: `THANHTOAN ${order.orderNumber}`,
          },
        };
        break;

      case "momo":
        // MoMo: Giả lập tạo link thanh toán
        paymentResult = {
          transactionId: `MOMO-${Date.now()}`,
          status: "pending",
          message: "Đang tạo link thanh toán MoMo...",
          paymentUrl: `https://test-payment.momo.vn/v2/gateway/pay/${orderId}`,
          qrCode: `MOMO_QR_${orderId}`,
        };

        // Demo: Giả lập thanh toán thành công sau 2s
        setTimeout(async () => {
          order.paymentStatus = "paid";
          order.status = "confirmed";
          order.confirmedAt = Date.now();
          await order.save();
          console.log(`✅ [DEMO] MoMo payment success: ${orderId}`);
        }, 2000);
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Phương thức thanh toán không hợp lệ",
        });
    }

    // Cập nhật phương thức thanh toán vào order
    order.paymentMethod = paymentMethod;
    await order.save();

    res.json({
      success: true,
      message: "Đã tiếp nhận yêu cầu thanh toán",
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        amount: order.finalAmount,
        payment: paymentResult,
      },
    });
  } catch (error) {
    console.error("❌ POST /payment/process error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi xử lý thanh toán",
    });
  }
});

// ===== POST: Xác minh thanh toán (Webhook giả lập) =====
router.post("/verify", async (req, res) => {
  try {
    const { orderId, transactionId, status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    // Giả lập xác minh thành công
    if (status === "success") {
      order.paymentStatus = "paid";
      order.status = "confirmed";
      order.confirmedAt = Date.now();
      await order.save();

      res.json({
        success: true,
        message: "Thanh toán thành công",
        data: order,
      });
    } else {
      res.json({
        success: false,
        message: "Thanh toán thất bại",
      });
    }
  } catch (error) {
    console.error("❌ POST /payment/verify error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi xác minh thanh toán",
    });
  }
});

// ===== GET: Trạng thái thanh toán của đơn hàng =====
router.get("/status/:orderId", async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    res.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        finalAmount: order.finalAmount,
      },
    });
  } catch (error) {
    console.error("GET /payment/status error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi lấy trạng thái thanh toán",
    });
  }
});

module.exports = router;
