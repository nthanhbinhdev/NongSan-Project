// ============================================================
// src/models/Product.js - MODEL SẢN PHẨM (FIXED)
// ============================================================
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  rating: { type: String, default: "0/5" },
  stock: { type: Number, default: 0 },
  unit: { type: String, default: "kg" },

  // Hình ảnh
  image: { type: String },
  images: [String],

  // Mô tả
  description: { type: String },
  descriptionDetail: { type: String },

  // Thông tin bổ sung
  brand: { type: String },
  origin: { type: String },
  certifications: [String],

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
  featured: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Index để tìm kiếm nhanh
productSchema.index({ name: "text", category: "text" });

module.exports = mongoose.model("Product", productSchema);
