// ============================================================
// scripts/createFirebaseUsers.js - TẠO USERS TRÊN FIREBASE & MONGODB
// ============================================================
// Chạy: node scripts/createFirebaseUsers.js

require("dotenv").config();
const mongoose = require("mongoose");
const { auth } = require("../src/config/firebase");
const User = require("../src/models/User");

// Dữ liệu users mẫu
const usersData = [
  {
    email: "admin@gmail.com",
    password: "admin123456",
    fullName: "Quản trị viên",
    phone: "0909000111",
    address: "Số 1 Võ Văn Ngân, TP. Thủ Đức, TP.HCM",
    role: "admin",
  },
  {
    email: "nguyenvana@gmail.com",
    password: "user123456",
    fullName: "Nguyễn Văn A",
    phone: "0987654321",
    address: "123 Đường ABC, Quận 1, TP.HCM",
    role: "customer",
  },
  {
    email: "tranthib@gmail.com",
    password: "user123456",
    fullName: "Trần Thị B",
    phone: "0912345678",
    address: "456 Lê Lợi, Quận 3, TP.HCM",
    role: "customer",
  },
  {
    email: "phamvanc@gmail.com",
    password: "user123456",
    fullName: "Phạm Văn C",
    phone: "0923456789",
    address: "789 Nguyễn Huệ, Quận 1, TP.HCM",
    role: "customer",
  },
  {
    email: "levand@gmail.com",
    password: "user123456",
    fullName: "Lê Văn D",
    phone: "0934567890",
    address: "321 Trần Hưng Đạo, Quận 5, TP.HCM",
    role: "customer",
  },
  {
    email: "hoangthie@gmail.com",
    password: "user123456",
    fullName: "Hoàng Thị E",
    phone: "0945678901",
    address: "654 Lý Thường Kiệt, Quận 10, TP.HCM",
    role: "customer",
  },
];

async function createFirebaseUsers() {
  try {
    console.log("🔌 Đang kết nối MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Đã kết nối MongoDB");

    console.log("🗑️  Đang xóa users cũ trong MongoDB...");
    await User.deleteMany({});
    console.log("✅ Đã xóa dữ liệu cũ");

    console.log("\n👥 Bắt đầu tạo users...");

    for (const userData of usersData) {
      try {
        console.log(`\n📝 Đang tạo: ${userData.email}`);

        // 1. Tạo user trên Firebase Authentication
        let firebaseUser;
        try {
          firebaseUser = await auth.createUser({
            email: userData.email,
            password: userData.password,
            displayName: userData.fullName,
          });
          console.log(`   ✅ Đã tạo Firebase user: ${firebaseUser.uid}`);
        } catch (firebaseError) {
          if (firebaseError.code === "auth/email-already-exists") {
            console.log(`   ⚠️  Email đã tồn tại trên Firebase, đang lấy thông tin...`);
            firebaseUser = await auth.getUserByEmail(userData.email);
          } else {
            throw firebaseError;
          }
        }

        // 2. Tạo user trong MongoDB
        const mongoUser = new User({
          firebaseUID: firebaseUser.uid,
          email: userData.email,
          fullName: userData.fullName,
          phone: userData.phone,
          address: userData.address,
          role: userData.role,
        });

        await mongoUser.save();
        console.log(`   ✅ Đã tạo MongoDB user: ${mongoUser._id}`);
        console.log(`   🔐 Mật khẩu: ${userData.password}`);
      } catch (error) {
        console.error(`   ❌ Lỗi tạo ${userData.email}:`, error.message);
      }
    }

    // Thống kê
    const totalUsers = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: "admin" });
    const customerCount = await User.countDocuments({ role: "customer" });

    console.log("\n📊 Thống kê:");
    console.log(`   - Tổng số users: ${totalUsers}`);
    console.log(`   - Admin: ${adminCount}`);
    console.log(`   - Khách hàng: ${customerCount}`);

    console.log("\n🔐 Tài khoản đăng nhập:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("👨‍💼 ADMIN:");
    console.log("   Email: admin@gmail.com");
    console.log("   Pass:  admin123456");
    console.log("\n👤 KHÁCH HÀNG:");
    console.log("   Email: nguyenvana@gmail.com");
    console.log("   Pass:  user123456");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    console.log("\n🎉 HOÀN THÀNH!");
    console.log("\n⚠️  LƯU Ý:");
    console.log("   - Các tài khoản đã được tạo trên Firebase Authentication");
    console.log("   - Thông tin đã được đồng bộ vào MongoDB");
    console.log("   - Bạn có thể đăng nhập bằng email/password ở trên");

    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  }
}

createFirebaseUsers();