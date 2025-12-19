// ============================================================
// scripts/seedAll.js - CHẠY TẤT CẢ SCRIPTS SEED DATA
// ============================================================
// Chạy: node scripts/seedAll.js

const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

const scripts = [
  {
    name: "Tạo Users (Firebase + MongoDB)",
    command: "node scripts/createFirebaseUsers.js",
  },
  { name: "Tạo Sản phẩm", command: "node scripts/seedProducts.js" },
  { name: "Tạo Đơn hàng", command: "node scripts/seedOrders.js" },
];

async function runAllSeeds() {
  console.log("╔═══════════════════════════════════════════════════════╗");
  console.log("║     🌾 NÔNG SẢN VIỆT - SEED DATA AUTOMATION 🌾      ║");
  console.log("╚═══════════════════════════════════════════════════════╝\n");

  for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i];
    console.log(`\n[${i + 1}/${scripts.length}] ${script.name}`);
    console.log("─".repeat(60));

    try {
      const { stdout, stderr } = await execPromise(script.command);
      console.log(stdout);
      if (stderr && !stderr.includes("DeprecationWarning")) {
        console.error(stderr);
      }
      console.log(`✅ ${script.name} - HOÀN THÀNH\n`);
    } catch (error) {
      console.error(`❌ ${script.name} - LỖI:`, error.message);
      process.exit(1);
    }
  }

  console.log("\n╔═══════════════════════════════════════════════════════╗");
  console.log("║          🎉 HOÀN THÀNH TẤT CẢ! 🎉                   ║");
  console.log("╚═══════════════════════════════════════════════════════╝");
  console.log("\n✨ Database đã sẵn sàng với dữ liệu đầy đủ!");
  console.log("\n🚀 Bạn có thể khởi động server:");
  console.log("   npm start");
  console.log("\n🔐 Đăng nhập với:");
  console.log("   Admin: admin@gmail.com / admin123456");
  console.log("   User:  nguyenvana@gmail.com / user123456\n");
}

runAllSeeds();
