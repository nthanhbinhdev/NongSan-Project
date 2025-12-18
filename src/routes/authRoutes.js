// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth } = require('../config/firebase');

// API: /api/auth/register
router.post('/register', async (req, res) => {
    // Frontend gửi lên token (lấy từ Firebase Client) và thông tin user
    const { idToken, fullName, phone, address } = req.body;

    try {
        // 1. Xác thực token với Firebase Admin
        const decodedToken = await auth.verifyIdToken(idToken);
        const { uid, email } = decodedToken;

        // 2. Kiểm tra xem user đã có trong MongoDB chưa
        let user = await User.findOne({ firebaseUID: uid });
        if (user) {
            return res.status(400).json({ message: 'Người dùng đã tồn tại.' });
        }

        // 3. Tạo user mới
        user = new User({
            firebaseUID: uid,
            email,
            fullName,
            phone,
            address
        });

        await user.save();
        res.status(201).json({ message: 'Đăng ký thành công', user });

    } catch (error) {
        console.error("Lỗi đăng ký:", error);
        res.status(500).json({ message: 'Lỗi xác thực', error: error.message });
    }
});

module.exports = router;