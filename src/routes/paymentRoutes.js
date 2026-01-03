const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const { verifyToken, optionalAuth } = require("../middleware/authMiddleware");

router.get("/methods", (req, res) => {
  const paymentMethods = [
    {
      id: "cod",
      name: "Thanh toán khi nhận hàng",
      description: "Thanh toán bằng tiền mặt khi nhận hàng",
      fee: 0,
      icon: "💵",
      enabled: true,
    },
    {
      id: "bank_transfer",
      name: "Chuyển khoản ngân hàng",
      description: "Chuyển khoản qua VCB, TCB, MB",
      fee: 0,
      icon: "🏦",
      enabled: true,
      bankInfo: {
        bankName: "Ngân hàng Vietcombank",
        accountNumber: "0123456789",
        accountName: "NONG SAN VIET",
        branch: "Chi nhánh TP.HCM",
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
      enabled: true,
    },
  ];

  res.json({
    success: true,
    data: paymentMethods,
  });
});

router.post("/process", optionalAuth, async (req, res) => {
  try {
    const { orderId, paymentMethod } = req.body;

    if (!orderId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin thanh toán",
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    let paymentResult;

    switch (paymentMethod) {
      case "cod":
        paymentResult = {
          transactionId: `COD-${Date.now()}`,
          status: "pending",
          message: "Đơn hàng sẽ được thanh toán khi nhận hàng",
        };
        break;

      case "bank_transfer":
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
      case "zalopay":
        const provider = paymentMethod.toUpperCase();
        paymentResult = {
          transactionId: `${provider}-${Date.now()}`,
          status: "success",
          message: `Thanh toán ${provider} thành công`,
          paymentUrl: `https://payment.${paymentMethod}.vn/gateway/${orderId}`,
        };

        order.paymentStatus = "paid";
        order.status = "confirmed";
        order.confirmedAt = Date.now();
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Phương thức thanh toán không hợp lệ",
        });
    }

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
    console.error("POST /payment/process error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi xử lý thanh toán",
    });
  }
});

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
    console.error("POST /payment/verify error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi xác minh thanh toán",
    });
  }
});

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
        status: order.status,
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

router.post("/confirm-bank-transfer", verifyToken, async (req, res) => {
  try {
    const { orderId, transferProof } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    if (order.paymentMethod !== "bank_transfer") {
      return res.status(400).json({
        success: false,
        message: "Đơn hàng không phải thanh toán chuyển khoản",
      });
    }

    order.paymentStatus = "paid";
    order.status = "confirmed";
    order.confirmedAt = Date.now();

    if (transferProof) {
      order.note = (order.note || "") + ` | Transfer proof: ${transferProof}`;
    }

    await order.save();

    res.json({
      success: true,
      message: "Đã xác nhận thanh toán",
      data: order,
    });
  } catch (error) {
    console.error("POST /payment/confirm-bank-transfer error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi xác nhận thanh toán",
    });
  }
});

module.exports = router;
