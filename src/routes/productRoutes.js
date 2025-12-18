const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const multer = require('multer');
const path = require('path');

// --- CẤU HÌNH UPLOAD ẢNH (MULTER) ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Lưu vào thư mục public/uploads
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        // Đặt tên file: thời gian hiện tại + tên gốc
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// --- CÁC API ---

// 1. Lấy danh sách sản phẩm
router.get('/', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. Thêm sản phẩm mới (có kèm upload ảnh)
// 'image' là tên field trong form-data gửi từ frontend
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { name, price, description, category, brand } = req.body;
        
        // Tạo đường dẫn ảnh để lưu vào DB
        // Nếu có file upload thì lấy path, không thì để rỗng
        const imagePath = req.file ? `/uploads/${req.file.filename}` : '';

        const newProduct = new Product({
            name,
            price,
            description,
            category,
            brand,
            image: imagePath
        });

        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;