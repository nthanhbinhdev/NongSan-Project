const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { auth } = require("../config/firebase");
const { verifyToken } = require("../middleware/authMiddleware");

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

router.post("/login", async (req, res) => {
  const { idToken } = req.body;

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const { uid } = decodedToken;

    const user = await User.findOne({ firebaseUID: uid });

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy thông tin người dùng trong hệ thống.",
      });
    }

    res.status(200).json({
      message: "Đăng nhập thành công",
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn." });
  }
});

router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-firebaseUID");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin người dùng",
      });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        address: user.address,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("GET /auth/profile error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi lấy thông tin người dùng",
    });
  }
});

router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { fullName, phone, address } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { fullName, phone, address },
      { new: true, runValidators: true }
    ).select("-firebaseUID");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    res.json({
      success: true,
      message: "Cập nhật thông tin thành công",
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("PUT /auth/profile error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi cập nhật thông tin",
    });
  }
});

router.post("/change-password", verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu mới phải có ít nhất 6 ký tự",
      });
    }

    try {
      await auth.updateUser(req.firebaseUID, {
        password: newPassword,
      });

      res.json({
        success: true,
        message: "Đổi mật khẩu thành công",
      });
    } catch (firebaseError) {
      console.error("Firebase change password error:", firebaseError);
      res.status(400).json({
        success: false,
        message: "Không thể đổi mật khẩu",
      });
    }
  } catch (error) {
    console.error("POST /auth/change-password error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi đổi mật khẩu",
    });
  }
});

router.post("/verify-token", verifyToken, async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Token hợp lệ",
      user: {
        _id: req.userId,
        firebaseUID: req.firebaseUID,
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Token không hợp lệ",
    });
  }
});

module.exports = router;
