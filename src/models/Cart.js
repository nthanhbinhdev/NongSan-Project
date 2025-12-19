// ============================================================
// src/models/Cart.js - MODEL GIỎ HÀNG
// ============================================================
const mongoose = require("mongoose");

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
        default: 1,
      },
      addedAt: { 
        type: Date, 
        default: Date.now 
      },
    },
  ],

  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
});

// Middleware tự động cập nhật updatedAt khi save
cartSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index
cartSchema.index({ userId: 1 });

module.exports = mongoose.model("Cart", cartSchema);