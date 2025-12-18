require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Cấu hình Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Cấu hình Static Files (Giao diện & Ảnh)
// Serve toàn bộ file trong thư mục public (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));
// Serve thư mục uploads để truy cập ảnh (ví dụ: http://localhost:3000/uploads/anh1.jpg)
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// 3. Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nongsanviet')
    .then(() => console.log('✅ Đã kết nối MongoDB'))
    .catch(err => console.error('❌ Lỗi kết nối MongoDB:', err));

// 4. Routes (Sẽ thêm sau)
const productRoutes = require('./src/routes/productRoutes');
app.use('/api/products', productRoutes);

// Route mặc định trả về trang chủ
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 5. Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});