// ============================================================
// scripts/resetDatabase.js - RESET TOÀN BỘ DATABASE
// ============================================================
// Chạy: node scripts/resetDatabase.js
// ⚠️ CẢNH BÁO: Script này sẽ XÓA TẤT CẢ dữ liệu!

require("dotenv").config();
const mongoose = require("mongoose");
const readline = require("readline");
const { auth } = require("../src/config/firebase");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function resetDatabase() {
  console.log("\n╔═══════════════════════════════════════════════════════╗");
  console.log("║     ⚠️  RESET DATABASE - XÓA TẤT CẢ DỮ LIỆU ⚠️      ║");
  console.log("╚═══════════════════════════════════════════════════════╝\n");

  console.log("⚠️  Script này sẽ:");
  console.log("   1. Xóa TẤT CẢ users trong Firebase Authentication");
  console.log("   2. Xóa TẤT CẢ collections trong MongoDB");
  console.log("   3. Không thể khôi phục sau khi xóa!\n");

  const answer1 = await askQuestion(
    "❓ Bạn có CHẮC CHẮN muốn xóa tất cả dữ liệu? (yes/no): "
  );

  if (answer1.toLowerCase() !== "yes") {
    console.log("❌ Đã hủy thao tác.");
    rl.close();
    process.exit(0);
  }

  const answer2 = await askQuestion(
    '❓ Gõ "DELETE ALL" để xác nhận lần cuối: '
  );

  if (answer2 !== "DELETE ALL") {
    console.log("❌ Xác nhận không đúng. Đã hủy thao tác.");
    rl.close();
    process.exit(0);
  }

  rl.close();

  try {
    // 1. Xóa Firebase users
    console.log("\n🔥 Đang xóa Firebase users...");
    try {
      const listUsersResult = await auth.listUsers();
      const deletePromises = listUsersResult.users.map((user) =>
        auth.deleteUser(user.uid)
      );
      await Promise.all(deletePromises);
      console.log(
        `✅ Đã xóa ${listUsersResult.users.length} users từ Firebase`
      );
    } catch (firebaseError) {
      console.error("⚠️  Lỗi xóa Firebase users:", firebaseError.message);
    }

    // 2. Xóa MongoDB collections
    console.log("\n💾 Đang xóa MongoDB collections...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Đã kết nối MongoDB");

    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();

    for (const collection of collections) {
      await mongoose.connection.db.dropCollection(collection.name);
      console.log(`   ✅ Đã xóa collection: ${collection.name}`);
    }

    console.log(`✅ Đã xóa ${collections.length} collections từ MongoDB`);

    await mongoose.connection.close();

    console.log("\n╔═══════════════════════════════════════════════════════╗");
    console.log("║     ✅ RESET HOÀN TẤT - DATABASE SẠCH SẼPHÒNG         ║");
    console.log("╚═══════════════════════════════════════════════════════╝\n");

    console.log("📝 Bước tiếp theo:");
    console.log("   1. Seed lại dữ liệu: npm run seed-all");
    console.log("   2. Hoặc tạo dữ liệu mới theo ý muốn\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Lỗi:", error);
    process.exit(1);
  }
}

resetDatabase();
