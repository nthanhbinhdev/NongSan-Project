// ============================================================
// src/routes/productRoutes.js - API SẢN PHẨM (FIXED)
// ============================================================
const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const multer = require("multer");
const path = require("path");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// Cấu hình upload ảnh
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const ext = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mime = allowedTypes.test(file.mimetype);

    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file ảnh (JPEG, PNG, WEBP)"));
    }
  },
});

// ===== GET: Lấy danh sách sản phẩm =====
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

    // Xây dựng query
    const query = { inStock: true };

    if (category) {
      query.category = new RegExp(category, "i");
    }

    if (search) {
      query.$or = [
        { name: new RegExp(search, "i") },
        { category: new RegExp(search, "i") },
      ];
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Sắp xếp
    let sortOption = { createdAt: -1 };
    if (sort === "price_asc") sortOption = { price: 1 };
    else if (sort === "price_desc") sortOption = { price: -1 };
    else if (sort === "name_asc") sortOption = { name: 1 };

    // Phân trang
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
    console.error("Lỗi GET /products:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== GET: Lấy chi tiết 1 sản phẩm =====
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    console.error("Lỗi GET /products/:id:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== POST: Thêm sản phẩm mới (Admin only) =====
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

      if (req.file) {
        productData.image = `/uploads/${req.file.filename}`;
      }

      const newProduct = new Product(productData);
      const savedProduct = await newProduct.save();

      res.status(201).json({
        success: true,
        message: "Thêm sản phẩm thành công",
        data: savedProduct,
      });
    } catch (error) {
      console.error("Lỗi POST /products:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }
);

// ===== PUT: Cập nhật sản phẩm (Admin only) =====
router.put(
  "/:id",
  verifyToken,
  isAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      const updateData = { ...req.body, updatedAt: Date.now() };

      if (req.file) {
        updateData.image = `/uploads/${req.file.filename}`;
      }

      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedProduct) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy sản phẩm",
        });
      }

      res.json({
        success: true,
        message: "Cập nhật thành công",
        data: updatedProduct,
      });
    } catch (error) {
      console.error("Lỗi PUT /products/:id:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }
);

// ===== DELETE: Xóa sản phẩm (Admin only) =====
router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }

    res.json({
      success: true,
      message: "Xóa sản phẩm thành công",
    });
  } catch (error) {
    console.error("Lỗi DELETE /products/:id:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
