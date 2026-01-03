// ============================================================
// src/routes/productRoutes.js - FIX: Hỗ trợ cả MongoDB _id và custom id
// ============================================================
const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const multer = require("multer");
const path = require("path");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// Cấu hình upload (giữ nguyên)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const ext = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mime = allowedTypes.test(file.mimetype);
    ext && mime
      ? cb(null, true)
      : cb(new Error("Chỉ chấp nhận ảnh (JPEG, PNG, WEBP)"));
  },
});

// ===== GET: Danh sách sản phẩm =====
router.get("/", async (req, res) => {
  try {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      sort,
      page = 1,
      limit = 12,
    } = req.query;

    const query = { inStock: true };

    if (category) query.category = new RegExp(category, "i");
    if (search)
      query.$or = [
        { name: new RegExp(search, "i") },
        { category: new RegExp(search, "i") },
      ];
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (sort === "price_asc") sortOption = { price: 1 };
    else if (sort === "price_desc") sortOption = { price: -1 };
    else if (sort === "name_asc") sortOption = { name: 1 };

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      Product.find(query).sort(sortOption).limit(Number(limit)).skip(skip),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ GET /products error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== GET: Chi tiết sản phẩm (FIX: Hỗ trợ cả MongoDB _id và custom id) =====
router.get("/:id", async (req, res) => {
  try {
    const identifier = req.params.id;
    console.log("🔍 Tìm sản phẩm với ID:", identifier);

    let product;

    // Kiểm tra xem ID có phải MongoDB ObjectId không (24 ký tự hex)
    if (/^[0-9a-fA-F]{24}$/.test(identifier)) {
      product = await Product.findById(identifier);
    } else {
      // Nếu không phải, tìm theo field "id" (custom ID như "TC001")
      product = await Product.findOne({ id: identifier });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }

    console.log("Tìm thấy:", product.name);
    res.json({ success: true, data: product });
  } catch (error) {
    console.error("GET /products/:id error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== POST: Thêm sản phẩm (Admin) =====
router.post(
  "/",
  verifyToken,
  isAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      const productData = {
        ...req.body,
        price: Number(req.body.price),
        stock: Number(req.body.stock) || 0,
        discount: Number(req.body.discount) || 0,
      };

      if (req.file) productData.image = `/uploads/${req.file.filename}`;

      const newProduct = new Product(productData);
      const savedProduct = await newProduct.save();

      res.status(201).json({
        success: true,
        message: "Thêm sản phẩm thành công",
        data: savedProduct,
      });
    } catch (error) {
      console.error("POST /products error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }
);

// ===== PUT: Cập nhật sản phẩm (Admin) =====
router.put(
  "/:id",
  verifyToken,
  isAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      const updateData = { ...req.body, updatedAt: Date.now() };
      if (req.file) updateData.image = `/uploads/${req.file.filename}`;

      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedProduct) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy sản phẩm" });
      }

      res.json({
        success: true,
        message: "Cập nhật thành công",
        data: updatedProduct,
      });
    } catch (error) {
      console.error("PUT /products/:id error:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }
);

// ===== DELETE: Xóa sản phẩm (Admin) =====
router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sản phẩm" });
    }
    res.json({ success: true, message: "Xóa sản phẩm thành công" });
  } catch (error) {
    console.error("DELETE /products/:id error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
