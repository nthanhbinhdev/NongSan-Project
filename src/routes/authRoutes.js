// src/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { auth } = require("../config/firebase");

// --- 1. ĐĂNG KÝ (Code cũ của bạn) ---
router.post("/register", async (req, res) => {
  const { idToken, fullName, phone, address } = req.body;
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const { uid, email } = decodedToken;

    let user = await User.findOne({ firebaseUID: uid });
    if (user) {
      return res.status(400).json({ message: "User đã tồn tại" });
    }

    user = new User({
      firebaseUID: uid,
      email,
      fullName,
      phone,
      address,
    });

    await user.save();
    res.status(201).json({ message: "Đăng ký thành công", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// --- 2. ĐĂNG NHẬP (Thêm mới) ---
// API này nhận token từ Frontend, xác thực và trả về thông tin User từ MongoDB
router.post("/login", async (req, res) => {
  const { idToken } = req.body;

  try {
    // Xác thực token với Firebase
    const decodedToken = await auth.verifyIdToken(idToken);
    const { uid } = decodedToken;

    // Tìm user trong MongoDB bằng Firebase UID
    const user = await User.findOne({ firebaseUID: uid });

    if (!user) {
      return res
        .status(404)
        .json({
          message: "Không tìm thấy thông tin người dùng trong hệ thống.",
        });
    }

    // Trả về thông tin user (quan trọng nhất là ROLE)
    res.status(200).json({
      message: "Đăng nhập thành công",
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role, // 'admin' hoặc 'customer'
      },
    });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn." });
  }
});

module.exports = router;
