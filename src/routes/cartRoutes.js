// ============================================================
// src/routes/cartRoutes.js - API GIỎ HÀNG (OPTIONAL)
// ============================================================
// NOTE: Frontend đang dùng localStorage để lưu giỏ hàng
// Route này chỉ cần thiết nếu muốn đồng bộ giỏ hàng lên server

const express = require("express");
const router = express.Router();

// Model Cart (cần tạo nếu muốn lưu giỏ hàng trên server)
const Cart = require("../models/Cart");

// GET: Lấy giỏ hàng của user
router.get("/:userId", async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId }).populate(
      "items.productId"
    );

    if (!cart) {
      return res.json({
        success: true,
        data: { items: [] },
      });
    }

    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST: Thêm sản phẩm vào giỏ
router.post("/:userId/items", async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.params.userId;

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Kiểm tra sản phẩm đã có trong giỏ chưa
    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }

    await cart.save();
    await cart.populate("items.productId");

    res.json({
      success: true,
      message: "Đã thêm vào giỏ hàng",
      data: cart,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT: Cập nhật số lượng
router.put("/:userId/items/:productId", async (req, res) => {
  try {
    const { quantity } = req.body;
    const { userId, productId } = req.params;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Giỏ hàng không tồn tại",
      });
    }

    const item = cart.items.find(
      (item) => item.productId.toString() === productId
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không có trong giỏ",
      });
    }

    item.quantity = quantity;
    await cart.save();
    await cart.populate("items.productId");

    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE: Xóa sản phẩm khỏi giỏ
router.delete("/:userId/items/:productId", async (req, res) => {
  try {
    const { userId, productId } = req.params;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Giỏ hàng không tồn tại",
      });
    }

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId
    );

    await cart.save();
    await cart.populate("items.productId");

    res.json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE: Xóa toàn bộ giỏ hàng
router.delete("/:userId", async (req, res) => {
  try {
    await Cart.findOneAndDelete({ userId: req.params.userId });
    res.json({ success: true, message: "Đã xóa giỏ hàng" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
