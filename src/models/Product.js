const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Tên sản phẩm
    description: { type: String },          // Mô tả
    price: { type: Number, required: true },// Đơn giá
    image: { type: String },                // Đường dẫn ảnh (VD: /uploads/abc.jpg)
    category: { type: String },             // Danh mục (Rau, Củ, Quả...)
    brand: { type: String },                // Thương hiệu
    unit: { type: String, default: 'kg' },  // Đơn vị tính
    inStock: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);