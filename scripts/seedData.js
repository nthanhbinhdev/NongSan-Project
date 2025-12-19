require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../src/models/Product");

// Dữ liệu sản phẩm mẫu từ products.json
const sampleProducts = [
  {
    id: "TC001",
    name: "Ổi trân châu ruột đỏ (1kg)",
    category: "trái cây",
    price: 31000,
    discount: 0.4,
    rating: "4/5",
    stock: 100,
    image: "/img/poster_oi.jpg",
    images: ["/img/oi1.jpg", "/img/oi2.jpg", "/img/oi3.jpg", "/img/oi4.jpg"],
    description:
      "Ổi trân châu ruột đỏ giòn ngọt, tươi ngon, trái to, không bị dập.",
    descriptionDetail:
      "Ổi trân châu ruột đỏ giòn ngọt, tươi ngon, trái to, không bị dập. Ổi có ruột màu đỏ hồng vô cùng hấp dẫn, ổi ngọt ngon. Ổi ngon, được đóng gói cẩn thận, tiện lợi, là loại trái cây cung cấp nhiều dưỡng chất cho cơ thể.",
    unit: "kg",
    origin: "Việt Nam",
    certifications: ["VietGAP"],
  },
  {
    id: "TC002",
    name: "Xoài keo (2-3 trái)",
    category: "trái cây",
    price: 25000,
    discount: 0.2,
    rating: "4.5/5",
    stock: 100,
    image: "/img/poster_xoai.jpg",
    images: [
      "/img/xoai1.jpg",
      "/img/xoai2.jpg",
      "/img/xoai3.jpg",
      "/img/xoai4.jpg",
    ],
    description: "Xoài keo chất lượng, tươi ngon, trái to, sống, căng trái.",
    descriptionDetail:
      "Xoài keo chất lượng, tươi ngon, trái to, sống, căng trái, khi ăn khá giòn. Xoài keo thường được ăn sống, khi mua về có thể sử dụng ngay.",
    unit: "kg",
    certifications: ["ATTP"],
  },
  {
    id: "RL001",
    name: "Rau muống (500g)",
    category: "rau lá",
    price: 14000,
    discount: 0.2,
    rating: "4.5/5",
    stock: 100,
    image: "/img/poster_raumuong.jpg",
    images: ["/img/raumuong1.jpg"],
    description:
      "Rau muống hạt là cây thân thảo, thường mọc bò trên mặt nước hoặc trên cạn.",
    unit: "bó",
  },
  {
    id: "CQ001",
    name: "Cà rốt (500g)",
    category: "củ quả",
    price: 10000,
    discount: 0,
    rating: "3/5",
    stock: 100,
    image: "/img/poster_carot.jpg",
    images: ["/img/carot1.jpg"],
    description: "Cà rốt giàu vitamin A, tốt cho mắt.",
    unit: "kg",
  },
  {
    id: "N004",
    name: "Nấm tuyết Vietfresh (50g)",
    category: "nấm",
    price: 30000,
    discount: 0,
    rating: "4/5",
    stock: 100,
    image: "/img/poster_namtuyet.jpg",
    images: ["/img/namtuyet1.jpg"],
    description: "Nấm tuyết giàu dinh dưỡng, vitamin và khoáng chất.",
    unit: "gói",
  },
];

async function seedDatabase() {
  try {
    // Kết nối MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Đã kết nối MongoDB");

    // Xóa dữ liệu cũ
    await Product.deleteMany({});
    console.log("🗑️  Đã xóa dữ liệu cũ");

    // Thêm dữ liệu mới
    const result = await Product.insertMany(sampleProducts);
    console.log(`✅ Đã thêm ${result.length} sản phẩm mẫu`);

    // Hiển thị danh sách
    console.log("\n📋 Danh sách sản phẩm:");
    result.forEach((p) => {
      console.log(
        `- ${p.name} | Giá: ${p.price.toLocaleString()}đ | Danh mục: ${
          p.category
        }`
      );
    });

    console.log("\n✨ Hoàn thành! Database đã sẵn sàng.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  }
}

// Chạy script
seedDatabase();
