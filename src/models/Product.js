// ============================================================
// src/models/Product.js - MODEL SẢN PHẨM
// ============================================================
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // TC001, RL001...
  name: { type: String, required: true },
  category: { type: String, required: true }, // trái cây, rau lá, củ quả, nấm
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 }, // 0 đến 1 (0.2 = 20%)
  rating: { type: String, default: "0/5" },
  stock: { type: Number, default: 0 },
  unit: { type: String, default: "kg" }, // kg, bó, quả...

  // Hình ảnh
  image: { type: String }, // Ảnh chính
  images: [String], // Ảnh phụ [img1, img2, img3, img4]

  // Mô tả
  description: { type: String }, // Mô tả ngắn
  descriptionDetail: { type: String }, // Mô tả chi tiết

  // Thông tin bổ sung
  brand: { type: String },
  origin: { type: String }, // Nguồn gốc
  certifications: [String], // VietGAP, Organic...

  // Đánh giá
  reviews: [
    {
      reviewer: String,
      rating: Number,
      comment: String,
      date: { type: Date, default: Date.now },
    },
  ],

  inStock: { type: Boolean, default: true },
  featured: { type: Boolean, default: false }, // Sản phẩm nổi bật

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Index để tìm kiếm nhanh
productSchema.index({ name: "text", category: "text" });

module.exports = mongoose.model("Product", productSchema);

// ============================================================
// src/models/Order.js - MODEL ĐƠN HÀNG
// ============================================================
const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    default: () => "ORD" + Date.now(),
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
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      name: String,
      price: Number,
      quantity: Number,
      subtotal: Number,
    },
  ],

  // Thanh toán
  totalAmount: { type: Number, required: true },
  shippingFee: { type: Number, default: 20000 },
  discount: { type: Number, default: 0 },
  finalAmount: { type: Number, required: true },

  // Trạng thái
  status: {
    type: String,
    enum: ["pending", "confirmed", "shipping", "delivered", "cancelled"],
    default: "pending",
  },

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

  note: String,

  // Thời gian
  createdAt: { type: Date, default: Date.now },
  confirmedAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
});

module.exports = mongoose.model("Order", orderSchema);

// ============================================================
// src/models/Cart.js - MODEL GIỎ HÀNG
// ============================================================
const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },

  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      addedAt: { type: Date, default: Date.now },
    },
  ],

  updatedAt: { type: Date, default: Date.now },
});

// Middleware tự động cập nhật updatedAt
cartSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Cart", cartSchema);
