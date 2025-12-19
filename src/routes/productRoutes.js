// ============================================================
// src/routes/productRoutes.js - API SẢN PHẨM
// ============================================================
const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const multer = require("multer");
const path = require("path");

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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
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

// ===== GET: Lấy danh sách sản phẩm (có filter, search, sort) =====
router.get("/", async (req, res) => {
  try {
    const {
      category, // Lọc theo danh mục
      search, // Tìm kiếm tên
      minPrice, // Giá tối thiểu
      maxPrice, // Giá tối đa
      sort, // Sắp xếp: price_asc, price_desc, name_asc, rating_desc
      page = 1, // Phân trang
      limit = 12, // Số sản phẩm mỗi trang
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
    let sortOption = { createdAt: -1 }; // Mặc định: mới nhất
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
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const productData = {
      ...req.body,
      price: Number(req.body.price),
      stock: Number(req.body.stock) || 0,
      discount: Number(req.body.discount) || 0,
    };

    // Nếu có upload ảnh
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
});

// ===== PUT: Cập nhật sản phẩm (Admin only) =====
router.put("/:id", upload.single("image"), async (req, res) => {
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
});

// ===== DELETE: Xóa sản phẩm (Admin only) =====
router.delete("/:id", async (req, res) => {
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

// ============================================================
// src/routes/orderRoutes.js - API ĐƠN HÀNG
// ============================================================
const Order = require("../models/Order");

// ===== POST: Tạo đơn hàng mới =====
router.post("/", async (req, res) => {
  try {
    const { customer, items, note, paymentMethod } = req.body;

    // Validate
    if (!customer || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Thông tin đơn hàng không hợp lệ",
      });
    }

    // Tính tổng tiền
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.inStock) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm ${item.productId} không còn hàng`,
        });
      }

      const subtotal = product.price * item.quantity;
      totalAmount += subtotal;

      orderItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        subtotal,
      });
    }

    const shippingFee = 20000;
    const finalAmount = totalAmount + shippingFee;

    // Tạo đơn hàng
    const newOrder = new Order({
      customer,
      items: orderItems,
      totalAmount,
      shippingFee,
      finalAmount,
      note,
      paymentMethod: paymentMethod || "cod",
    });

    const savedOrder = await newOrder.save();

    // Giảm số lượng tồn kho
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      });
    }

    res.status(201).json({
      success: true,
      message: "Đặt hàng thành công!",
      data: savedOrder,
    });
  } catch (error) {
    console.error("Lỗi POST /orders:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== GET: Lấy danh sách đơn hàng (Admin hoặc user của mình) =====
router.get("/", async (req, res) => {
  try {
    const { userId, status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (userId) query["customer.userId"] = userId;
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(skip)
        .populate("items.productId"),
      Order.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Lỗi GET /orders:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== GET: Chi tiết 1 đơn hàng =====
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "items.productId"
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error("Lỗi GET /orders/:id:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== PUT: Cập nhật trạng thái đơn hàng (Admin) =====
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = [
      "pending",
      "confirmed",
      "shipping",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ",
      });
    }

    const updateData = { status };

    // Cập nhật thời gian theo trạng thái
    if (status === "confirmed") updateData.confirmedAt = Date.now();
    if (status === "shipping") updateData.shippedAt = Date.now();
    if (status === "delivered") updateData.deliveredAt = Date.now();
    if (status === "cancelled") updateData.cancelledAt = Date.now();

    const order = await Order.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    res.json({
      success: true,
      message: "Cập nhật trạng thái thành công",
      data: order,
    });
  } catch (error) {
    console.error("Lỗi PUT /orders/:id/status:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
