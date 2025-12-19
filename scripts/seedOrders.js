// ============================================================
// scripts/seedOrders.js - TẠO ĐƠN HÀNG MẪU
// ============================================================
// Chạy: node scripts/seedOrders.js

require("dotenv").config();
const mongoose = require("mongoose");
const Order = require("../src/models/Order");
const Product = require("../src/models/Product");
const User = require("../src/models/User");

async function seedOrders() {
  try {
    console.log("🔌 Đang kết nối MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Đã kết nối MongoDB");

    // Lấy users và products
    const users = await User.find({ role: "customer" });
    const products = await Product.find().limit(30);

    if (users.length === 0) {
      console.log("⚠️  Chưa có user. Vui lòng chạy seedUsers.js trước!");
      process.exit(1);
    }

    if (products.length === 0) {
      console.log("⚠️  Chưa có sản phẩm. Vui lòng chạy seedProducts.js trước!");
      process.exit(1);
    }

    console.log("🗑️  Đang xóa đơn hàng cũ...");
    await Order.deleteMany({});

    // Tạo 50 đơn hàng mẫu
    console.log("📦 Đang tạo đơn hàng mẫu...");
    const orders = [];

    const statuses = ["pending", "confirmed", "shipping", "delivered", "cancelled"];
    const paymentMethods = ["cod", "bank_transfer", "momo", "zalopay"];

    for (let i = 0; i < 50; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      
      // Chọn ngẫu nhiên 1-5 sản phẩm
      const numItems = Math.floor(Math.random() * 5) + 1;
      const orderItems = [];
      let totalAmount = 0;

      for (let j = 0; j < numItems; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const price = product.price * (1 - product.discount);
        const subtotal = price * quantity;
        totalAmount += subtotal;

        orderItems.push({
          productId: product._id,
          name: product.name,
          price: price,
          quantity: quantity,
          subtotal: subtotal,
        });
      }

      const shippingFee = 20000;
      const finalAmount = totalAmount + shippingFee;
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      // Tạo thời gian ngẫu nhiên trong 3 tháng gần đây
      const daysAgo = Math.floor(Math.random() * 90);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);

      const orderData = {
        customer: {
          userId: user._id,
          name: user.fullName,
          email: user.email,
          phone: user.phone || "0987654321",
          address: user.address || "123 Đường ABC, Quận 1, TP.HCM",
        },
        items: orderItems,
        totalAmount: totalAmount,
        shippingFee: shippingFee,
        finalAmount: finalAmount,
        status: status,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        paymentStatus: status === "delivered" ? "paid" : "unpaid",
        createdAt: createdAt,
        updatedAt: createdAt,
      };

      // Thêm timestamps theo status
      if (status === "confirmed" || status === "shipping" || status === "delivered") {
        orderData.confirmedAt = new Date(createdAt.getTime() + 3600000); // +1 giờ
      }
      if (status === "shipping" || status === "delivered") {
        orderData.shippedAt = new Date(createdAt.getTime() + 86400000); // +1 ngày
      }
      if (status === "delivered") {
        orderData.deliveredAt = new Date(createdAt.getTime() + 259200000); // +3 ngày
      }
      if (status === "cancelled") {
        orderData.cancelledAt = new Date(createdAt.getTime() + 7200000); // +2 giờ
      }

      orders.push(orderData);
    }

    const createdOrders = await Order.insertMany(orders);
    console.log(`✅ Đã tạo ${createdOrders.length} đơn hàng`);

    // Thống kê
    const stats = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalRevenue: { $sum: "$finalAmount" },
        },
      },
    ]);

    console.log("\n📊 Thống kê đơn hàng:");
    let totalRevenue = 0;
    stats.forEach((stat) => {
      console.log(
        `   - ${stat._id}: ${stat.count} đơn (${(stat.totalRevenue / 1000000).toFixed(2)}M VNĐ)`
      );
      if (stat._id !== "cancelled") {
        totalRevenue += stat.totalRevenue;
      }
    });

    console.log(`\n💰 Tổng doanh thu: ${(totalRevenue / 1000000).toFixed(2)} triệu VNĐ`);
    console.log("\n🎉 HOÀN THÀNH!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  }
}

seedOrders();