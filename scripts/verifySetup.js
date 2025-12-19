// ============================================================
// scripts/verifySetup.js - KIỂM TRA CẤU HÌNH HỆ THỐNG
// ============================================================
// Chạy: node scripts/verifySetup.js

require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Màu sắc cho console
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bright: "\x1b[1m",
};

const { green, red, yellow, cyan, bright, reset } = colors;

let hasErrors = false;

function success(msg) {
  console.log(`${green}✓${reset} ${msg}`);
}

function error(msg) {
  console.log(`${red}✗${reset} ${msg}`);
  hasErrors = true;
}

function warning(msg) {
  console.log(`${yellow}⚠${reset} ${msg}`);
}

function info(msg) {
  console.log(`${cyan}ℹ${reset} ${msg}`);
}

async function verifySetup() {
  console.log(
    `\n${bright}${cyan}╔═══════════════════════════════════════════════════════╗${reset}`
  );
  console.log(
    `${bright}${cyan}║     🔍 KIỂM TRA CẤU HÌNH HỆ THỐNG 🔍                ║${reset}`
  );
  console.log(
    `${bright}${cyan}╚═══════════════════════════════════════════════════════╝${reset}\n`
  );

  // 1. Kiểm tra file .env
  console.log(`${bright}[1] Kiểm tra File .env${reset}`);
  console.log("─".repeat(60));

  if (fs.existsSync(".env")) {
    success("File .env tồn tại");
  } else {
    error("File .env không tồn tại!");
    warning("Tạo file .env từ .env.example: cp .env.example .env");
  }

  // 2. Kiểm tra biến môi trường
  console.log(`\n${bright}[2] Kiểm tra Biến Môi Trường${reset}`);
  console.log("─".repeat(60));

  if (process.env.MONGO_URI) {
    success("MONGO_URI: Đã cấu hình");
    info(`   URI: ${process.env.MONGO_URI.substring(0, 30)}...`);
  } else {
    error("MONGO_URI: Chưa cấu hình!");
  }

  if (process.env.PORT) {
    success(`PORT: ${process.env.PORT}`);
  } else {
    warning("PORT: Chưa cấu hình (sẽ dùng mặc định 3000)");
  }

  if (process.env.NODE_ENV) {
    success(`NODE_ENV: ${process.env.NODE_ENV}`);
  } else {
    warning("NODE_ENV: Chưa cấu hình (sẽ dùng mặc định development)");
  }

  // 3. Kiểm tra Firebase
  console.log(`\n${bright}[3] Kiểm tra Firebase Configuration${reset}`);
  console.log("─".repeat(60));

  const serviceAccountPath = path.join(
    __dirname,
    "../src/config/serviceAccountKey.json"
  );

  if (fs.existsSync(serviceAccountPath)) {
    success("serviceAccountKey.json: Tồn tại");

    try {
      const serviceAccount = require(serviceAccountPath);
      if (serviceAccount.project_id) {
        success(`Project ID: ${serviceAccount.project_id}`);
      }
      if (serviceAccount.client_email) {
        success(`Client Email: ${serviceAccount.client_email}`);
      }
    } catch (err) {
      error("serviceAccountKey.json: File không hợp lệ!");
      info(
        "   Tải lại từ Firebase Console > Project Settings > Service Accounts"
      );
    }
  } else {
    error("serviceAccountKey.json: Không tồn tại!");
    info("   Tải từ Firebase Console > Project Settings > Service Accounts");
    info(`   Lưu vào: ${serviceAccountPath}`);
  }

  // 4. Kiểm tra kết nối MongoDB
  console.log(`\n${bright}[4] Kiểm tra Kết Nối MongoDB${reset}`);
  console.log("─".repeat(60));

  if (process.env.MONGO_URI) {
    try {
      info("Đang kết nối...");
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      success("MongoDB: Kết nối thành công!");

      // Kiểm tra collections
      const collections = await mongoose.connection.db
        .listCollections()
        .toArray();
      if (collections.length > 0) {
        success(`Tìm thấy ${collections.length} collections:`);
        collections.forEach((col) => {
          console.log(`   - ${col.name}`);
        });
      } else {
        warning("Database chưa có collections (chưa seed data)");
        info("   Chạy: npm run seed-all");
      }

      await mongoose.connection.close();
    } catch (err) {
      error(`MongoDB: Không thể kết nối!`);
      info(`   Lỗi: ${err.message}`);
      info("   Kiểm tra:");
      info("   - MONGO_URI có đúng không?");
      info("   - Network Access đã allow IP chưa?");
      info("   - Database user có quyền không?");
    }
  } else {
    error("Không thể kiểm tra MongoDB (thiếu MONGO_URI)");
  }

  // 5. Kiểm tra Dependencies
  console.log(`\n${bright}[5] Kiểm tra Dependencies${reset}`);
  console.log("─".repeat(60));

  const packagePath = path.join(__dirname, "../package.json");
  if (fs.existsSync(packagePath)) {
    success("package.json: Tồn tại");

    if (fs.existsSync(path.join(__dirname, "../node_modules"))) {
      success("node_modules: Đã cài đặt");
    } else {
      error("node_modules: Chưa cài đặt!");
      info("   Chạy: npm install");
    }
  } else {
    error("package.json: Không tồn tại!");
  }

  // 6. Kiểm tra cấu trúc thư mục
  console.log(`\n${bright}[6] Kiểm tra Cấu Trúc Thư Mục${reset}`);
  console.log("─".repeat(60));

  const requiredDirs = [
    "src/models",
    "src/routes",
    "src/config",
    "src/middleware",
    "scripts",
    "public",
  ];

  requiredDirs.forEach((dir) => {
    if (fs.existsSync(path.join(__dirname, "..", dir))) {
      success(`${dir}/`);
    } else {
      error(`${dir}/: Không tồn tại!`);
    }
  });

  // Tổng kết
  console.log(
    `\n${bright}╔═══════════════════════════════════════════════════════╗${reset}`
  );
  if (hasErrors) {
    console.log(
      `${bright}${red}║     ❌ CÓ LỖI - VUI LÒNG KIỂM TRA LẠI ❌            ║${reset}`
    );
    console.log(
      `${bright}${cyan}╚═══════════════════════════════════════════════════════╝${reset}\n`
    );
    console.log(`${yellow}⚠ Khắc phục lỗi trước khi tiếp tục!${reset}\n`);
    process.exit(1);
  } else {
    console.log(
      `${bright}${green}║     ✅ TẤT CẢ ĐỀU ỔN - SẴN SÀNG CHẠY! ✅           ║${reset}`
    );
    console.log(
      `${bright}${cyan}╚═══════════════════════════════════════════════════════╝${reset}\n`
    );
    console.log(`${green}🎉 Hệ thống đã sẵn sàng!${reset}\n`);
    console.log(`${cyan}📝 Các bước tiếp theo:${reset}`);
    console.log(`   1. Seed data: ${bright}npm run seed-all${reset}`);
    console.log(`   2. Start server: ${bright}npm start${reset}`);
    console.log(
      `   3. Test API: ${bright}curl http://localhost:3000/api/health${reset}\n`
    );
    process.exit(0);
  }
}

verifySetup().catch((err) => {
  console.error(`\n${red}❌ Lỗi không mong muốn:${reset}`, err);
  process.exit(1);
});
