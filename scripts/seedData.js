// // ============================================================
// // scripts/seedData.js - SCRIPT NHẬP DỮ LIỆU MẪU
// // ============================================================
// // Chạy: node scripts/seedData.js

// require("dotenv").config();
// const mongoose = require("mongoose");
// const Product = require("../src/models/Product");
// const User = require("../src/models/User");

// // ============================================================
// // DỮ LIỆU SẢN PHẨM MẪU
// // ============================================================
// const products = [
//   {
//     id: "TC001",
//     name: "Ổi trân châu ruột đỏ (1kg)",
//     category: "trái cây",
//     price: 31000,
//     discount: 0.4,
//     rating: "4/5",
//     stock: 100,
//     unit: "kg",
//     image: "/img/poster_oi.jpg",
//     images: ["/img/oi1.jpg", "/img/oi2.jpg", "/img/oi3.jpg", "/img/oi4.jpg"],
//     description: "Ổi trân châu ruột đỏ giòn ngọt, tươi ngon, trái to, không bị dập.",
//     descriptionDetail: "Ổi trân châu ruột đỏ giòn ngọt, tươi ngon, trái to, không bị dập. Ổi có ruột màu đỏ hồng vô cùng hấp dẫn, ổi ngọt ngon. Sản phẩm cam kết đạt chuẩn 100% AT VSTP.",
//     origin: "Tiền Giang",
//     certifications: ["VietGAP"],
//     inStock: true,
//     featured: true,
//   },
//   {
//     id: "TC002",
//     name: "Xoài keo (2-3 trái)",
//     category: "trái cây",
//     price: 25000,
//     discount: 0.2,
//     rating: "4.5/5",
//     stock: 150,
//     unit: "kg",
//     image: "/img/poster_xoai.jpg",
//     images: ["/img/xoai1.jpg", "/img/xoai2.jpg", "/img/xoai3.jpg", "/img/xoai4.jpg"],
//     description: "Xoài keo chất lượng, tươi ngon, trái to, sống, căng trái.",
//     origin: "Đồng Tháp",
//     certifications: ["VietGAP"],
//     inStock: true,
//     featured: true,
//   },
//   {
//     id: "TC003",
//     name: "Dưa hấu đỏ (1.8kg)",
//     category: "trái cây",
//     price: 38000,
//     discount: 0.1,
//     rating: "5/5",
//     stock: 80,
//     unit: "kg",
//     image: "/img/poster_duahau.jpg",
//     images: ["/img/duahau1.jpg", "/img/duahau2.jpg", "/img/duahau3.jpg", "/img/duahau4.jpg"],
//     description: "Dưa hấu đỏ ngọt, nhiều nước, giải khát tốt trong mùa nóng.",
//     origin: "Long An",
//     inStock: true,
//   },
//   {
//     id: "TC004",
//     name: "Chuối già Nam Mỹ (1kg)",
//     category: "trái cây",
//     price: 33000,
//     discount: 0.2,
//     rating: "3.5/5",
//     stock: 120,
//     unit: "kg",
//     image: "/img/poster_chuoi.jpg",
//     images: ["/img/chuoi1.jpg", "/img/chuoi2.jpg", "/img/chuoi3.jpg", "/img/chuoi4.jpg"],
//     description: "Chuối già chứa nhiều chất dinh dưỡng như kali, chất xơ, vitamin.",
//     origin: "Bình Phước",
//     inStock: true,
//   },
//   {
//     id: "TC005",
//     name: "Cam sành túi (1kg)",
//     category: "trái cây",
//     price: 25000,
//     discount: 0.2,
//     rating: "4/5",
//     stock: 90,
//     unit: "kg",
//     image: "/img/poster_cam.jpg",
//     images: ["/img/cam1.jpg", "/img/cam2.jpg", "/img/cam3.jpg", "/img/cam4.jpg"],
//     description: "Cam sành ngọt thanh, giàu vitamin C.",
//     origin: "Hà Giang",
//     inStock: true,
//     featured: true,
//   },
//   {
//     id: "RL001",
//     name: "Rau muống (500g)",
//     category: "rau lá",
//     price: 14000,
//     discount: 0.2,
//     rating: "4.5/5",
//     stock: 200,
//     unit: "bó",
//     image: "/img/poster_raumuong.jpg",
//     images: ["/img/raumuong1.jpg", "/img/raumuong2.jpg", "/img/raumuong3.jpg", "/img/raumuong4.jpg"],
//     description: "Rau muống tươi, sạch, giàu vitamin A, C và sắt.",
//     origin: "Đồng Tháp",
//     certifications: ["VietGAP"],
//     inStock: true,
//     featured: true,
//   },
//   {
//     id: "RL002",
//     name: "Cải ngọt (500g)",
//     category: "rau lá",
//     price: 15000,
//     discount: 0.3,
//     rating: "4/5",
//     stock: 180,
//     unit: "bó",
//     image: "/img/poster_caingot.jpg",
//     images: ["/img/caingot1.jpg", "/img/caingot2.jpg", "/img/caingot3.jpg", "/img/caingot4.jpg"],
//     description: "Cải ngọt vị ngọt thanh, phù hợp nhiều món ăn.",
//     origin: "Lâm Đồng",
//     inStock: true,
//   },
//   {
//     id: "RL003",
//     name: "Mồng tơi (500g)",
//     category: "rau lá",
//     price: 15000,
//     discount: 0.3,
//     rating: "5/5",
//     stock: 150,
//     unit: "bó",
//     image: "/img/poster_mongtoi.jpg",
//     images: ["/img/mongtoi1.jpg", "/img/mongtoi2.jpg", "/img/mongtoi3.jpg", "/img/mongtoi4.jpg"],
//     description: "Rau mồng tơi giàu vitamin và khoáng chất.",
//     origin: "Đồng Tháp",
//     inStock: true,
//   },
//   {
//     id: "RL004",
//     name: "Xà lách (500g)",
//     category: "rau lá",
//     price: 16000,
//     discount: 0.2,
//     rating: "4/5",
//     stock: 160,
//     unit: "bó",
//     image: "/img/poster_xalach.jpg",
//     images: ["/img/xalach1.jpg", "/img/xalach2.jpg", "/img/xalach3.jpg", "/img/xalach4.jpg"],
//     description: "Xà lách lô lô tươi, giòn, giàu vitamin.",
//     origin: "Đà Lạt",
//     inStock: true,
//   },
//   {
//     id: "RL005",
//     name: "Hành lá (100g)",
//     category: "rau lá",
//     price: 7000,
//     discount: 0.05,
//     rating: "4/5",
//     stock: 250,
//     unit: "bó",
//     image: "/img/poster_hanhla.jpg",
//     images: ["/img/hanhla1.jpg", "/img/hanhla2.jpg", "/img/hanhla3.jpg", "/img/hanhla4.jpg"],
//     description: "Hành lá tươi, thơm, bổ dưỡng.",
//     origin: "Đồng Tháp",
//     inStock: true,
//   },
//   {
//     id: "CQ001",
//     name: "Cà rốt (500g)",
//     category: "củ quả",
//     price: 10000,
//     discount: 0,
//     rating: "3/5",
//     stock: 200,
//     unit: "kg",
//     image: "/img/poster_carot.jpg",
//     images: ["/img/carot1.jpg", "/img/carot2.jpg", "/img/carot3.jpg", "/img/carot4.jpg"],
//     description: "Cà rốt tươi, giàu vitamin A, tốt cho mắt.",
//     origin: "Đà Lạt",
//     inStock: true,
//     featured: true,
//   },
//   {
//     id: "CQ002",
//     name: "Hành tây (500g)",
//     category: "củ quả",
//     price: 18000,
//     discount: 0,
//     rating: "4/5",
//     stock: 180,
//     unit: "kg",
//     image: "/img/poster_hanhtay.jpg",
//     images: ["/img/hanhtay1.jpg", "/img/hanhtay2.jpg", "/img/hanhtay3.jpg", "/img/hanhtay4.jpg"],
//     description: "Hành tây tươi, thơm, bổ dưỡng.",
//     origin: "Đà Lạt",
//     inStock: true,
//   },
//   {
//     id: "CQ003",
//     name: "Khoai tây (500g)",
//     category: "củ quả",
//     price: 15000,
//     discount: 0,
//     rating: "4.5/5",
//     stock: 220,
//     unit: "kg",
//     image: "/img/poster_khoaitay.jpg",
//     images: ["/img/khoaitay1.jpg", "/img/khoaitay2.jpg", "/img/khoaitay3.jpg", "/img/khoaitay4.jpg"],
//     description: "Khoai tây giàu tinh bột, thơm ngon.",
//     origin: "Đà Lạt",
//     inStock: true,
//   },
//   {
//     id: "N001",
//     name: "Nấm đùi gà (200g)",
//     category: "nấm",
//     price: 31000,
//     discount: 0.2,
//     rating: "5/5",
//     stock: 100,
//     unit: "hộp",
//     image: "/img/poster_namduiga.jpg",
//     images: ["/img/namduiga1.jpg", "/img/namduiga2.jpg", "/img/namduiga3.jpg", "/img/namduiga4.jpg"],
//     description: "Nấm đùi gà tươi, giàu dinh dưỡng.",
//     origin: "Đà Lạt",
//     inStock: true,
//     featured: true,
//   },
//   {
//     id: "N002",
//     name: "Nấm linh chi (150g)",
//     category: "nấm",
//     price: 33000,
//     discount: 0,
//     rating: "5/5",
//     stock: 80,
//     unit: "hộp",
//     image: "/img/poster_linhchi.jpg",
//     images: ["/img/linhchi1.jpg", "/img/linhchi2.jpg", "/img/linhchi3.jpg", "/img/linhchi4.jpg"],
//     description: "Nấm linh chi tốt cho sức khỏe.",
//     origin: "Đà Lạt",
//     inStock: true,
//   },
// ];

// // ============================================================
// // DỮ LIỆU USER MẪU
// // ============================================================
// const users = [
//   {
//     firebaseUID: "admin-uid-001",
//     email: "admin@gmail.com",
//     fullName: "Quản trị viên",
//     phone: "0909000111",
//     address: "TP. Hồ Chí Minh",
//     role: "admin",
//   },
//   {
//     firebaseUID: "user-uid-001",
//     email: "user@gmail.com",
//     fullName: "Nguyễn Văn A",
//     phone: "0987654321",
//     address: "123 Đường ABC, Quận 1, TP.HCM",
//     role: "customer",
//   },
// ];

// // ============================================================
// // HÀM SEED DATA
// // ============================================================
// async function seedDatabase() {
//   try {
//     console.log("🔌 Đang kết nối MongoDB...");
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log("✅ Đã kết nối MongoDB");

//     // Xóa dữ liệu cũ
//     console.log("🗑️  Đang xóa dữ liệu cũ...");
//     await Product.deleteMany({});
//     await User.deleteMany({});
//     console.log("✅ Đã xóa dữ liệu cũ");

//     // Nhập sản phẩm
//     console.log("📦 Đang nhập sản phẩm...");
//     const createdProducts = await Product.insertMany(products);
//     console.log(`✅ Đã nhập ${createdProducts.length} sản phẩm`);

//     // Nhập users
//     console.log("👥 Đang nhập users...");
//     const createdUsers = await User.insertMany(users);
//     console.log(`✅ Đã nhập ${createdUsers.length} users`);

//     console.log("\n🎉 HOÀN THÀNH! Dữ liệu mẫu đã được nhập thành công!");
//     console.log("\n📊 Thống kê:");
//     console.log(`   - Sản phẩm: ${createdProducts.length}`);
//     console.log(`   - Users: ${createdUsers.length}`);
//     console.log("\n🔐 Tài khoản Admin:");
//     console.log("   Email: admin@gmail.com");
//     console.log("   (Đăng nhập bằng Firebase Auth)");

//     process.exit(0);
//   } catch (error) {
//     console.error("❌ Lỗi:", error);
//     process.exit(1);
//   }
// }

// // Chạy seed
// seedDatabase();