// ============================================================
// src/middleware/authMiddleware.js - MIDDLEWARE XÁC THỰC
// ============================================================
const { auth } = require("../config/firebase");
const User = require("../models/User");

// ===== Verify Firebase Token =====
const verifyToken = async (req, res, next) => {
  try {
    // Lấy token từ header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy token xác thực",
      });
    }

    const idToken = authHeader.split("Bearer ")[1];

    // Verify token với Firebase
    const decodedToken = await auth.verifyIdToken(idToken);
    const { uid } = decodedToken;

    // Tìm user trong MongoDB
    const user = await User.findOne({ firebaseUID: uid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin người dùng",
      });
    }

    // Gắn user vào request để sử dụng ở các route
    req.user = user;
    req.userId = user._id;
    req.firebaseUID = uid;

    next();
  } catch (error) {
    console.error("Lỗi xác thực token:", error);
    
    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({
        success: false,
        message: "Token đã hết hạn. Vui lòng đăng nhập lại.",
      });
    }

    res.status(401).json({
      success: false,
      message: "Token không hợp lệ",
    });
  }
};

// ===== Check Admin Role =====
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Vui lòng đăng nhập",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Bạn không có quyền truy cập chức năng này",
    });
  }

  next();
};

// ===== Optional Auth (không bắt buộc đăng nhập) =====
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const idToken = authHeader.split("Bearer ")[1];
      const decodedToken = await auth.verifyIdToken(idToken);
      const user = await User.findOne({ firebaseUID: decodedToken.uid });
      
      if (user) {
        req.user = user;
        req.userId = user._id;
      }
    }
  } catch (error) {
    // Không cần xử lý lỗi vì auth là optional
    console.log("Optional auth failed, continuing...");
  }

  next();
};

module.exports = {
  verifyToken,
  isAdmin,
  optionalAuth,
};