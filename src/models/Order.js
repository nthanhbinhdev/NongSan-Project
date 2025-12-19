// ============================================================
// src/models/Order.js - MODEL ĐƠN HÀNG
// ============================================================
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    default: () => "ORD" + Date.now() + Math.floor(Math.random() * 1000),
  },

  // Thông tin khách hàng
  customer: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true },
    email: String,
    phone: { type: String, required: true },
    address: { type: String, required: true },
  },

  // Sản phẩm trong đơn
  items: [
    {
      productId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Product",
        required: true 
      },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true, min: 1 },
      subtotal: { type: Number, required: true },
    },
  ],

  // Thanh toán
  totalAmount: { type: Number, required: true },
  shippingFee: { type: Number, default: 20000 },
  discount: { type: Number, default: 0 },
  finalAmount: { type: Number, required: true },

  // Trạng thái đơn hàng
  status: {
    type: String,
    enum: ["pending", "confirmed", "shipping", "delivered", "cancelled"],
    default: "pending",
  },

  // Phương thức thanh toán
  paymentMethod: {
    type: String,
    enum: ["cod", "bank_transfer", "momo", "zalopay"],
    default: "cod",
  },
  
  paymentStatus: {
    type: String,
    enum: ["unpaid", "paid"],
    default: "unpaid",
  },

  // Ghi chú
  note: String,

  // Thời gian
  createdAt: { type: Date, default: Date.now },
  confirmedAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  updatedAt: { type: Date, default: Date.now },
});

// Middleware tự động cập nhật updatedAt
orderSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index để tìm kiếm nhanh
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ "customer.userId": 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);