// ============================================================
// public/Admin/js/dashboard.js - DASHBOARD DATA HANDLER
// ============================================================

import { adminAPI } from "./admin-auth.js";

// Format số tiền VND
function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

// Format ngày
function formatDate(date) {
  return new Date(date).toLocaleDateString("vi-VN");
}

// Load thống kê tổng quan
async function loadOverviewStats() {
  try {
    const data = await adminAPI("/stats/overview");

    if (data.success) {
      const stats = data.data;

      // Cập nhật các box thống kê
      document.querySelector(".box1 .number").textContent = stats.totalCustomers;
      document.querySelector(".box2 .number").textContent = stats.totalOrders;
      document.querySelector(".box3 .number").textContent =
        (stats.totalRevenue / 1000000).toFixed(1) + "tr";

      console.log("Loaded overview stats");
    }
  } catch (error) {
    console.error("Error loading overview:", error);
    alert("Không thể tải dữ liệu thống kê");
  }
}

// Load hoạt động gần đây
async function loadRecentActivities() {
  try {
    const data = await adminAPI("/activities/recent");

    if (data.success && data.data.length > 0) {
      const users = data.data;

      // Cập nhật bảng hoạt động
      const namesDiv = document.querySelector(".data.names");
      const emailsDiv = document.querySelector(".data.email");
      const joinedDiv = document.querySelector(".data.joined");
      const typeDiv = document.querySelector(".data.type");

      // Xóa dữ liệu cũ (giữ lại title)
      namesDiv.innerHTML = '<span class="data-title">Tên</span>';
      emailsDiv.innerHTML = '<span class="data-title">Email</span>';
      joinedDiv.innerHTML = '<span class="data-title">Đã tham gia</span>';
      typeDiv.innerHTML = '<span class="data-title">Thành viên</span>';

      // Thêm dữ liệu mới (giới hạn 5 user)
      users.slice(0, 5).forEach((user) => {
        namesDiv.innerHTML += `<span class="data-list">${
          user.fullName || "N/A"
        }</span>`;
        emailsDiv.innerHTML += `<span class="data-list">${user.email}</span>`;
        joinedDiv.innerHTML += `<span class="data-list">${formatDate(
          user.createdAt
        )}</span>`;

        // Xác định loại thành viên dựa vào thời gian tham gia
        const joinDate = new Date(user.createdAt);
        const now = new Date();
        const daysDiff = Math.floor((now - joinDate) / (1000 * 60 * 60 * 24));

        let memberType = "mới";
        if (daysDiff > 365) memberType = "vàng";
        else if (daysDiff > 180) memberType = "bạc";

        typeDiv.innerHTML += `<span class="data-list">${memberType}</span>`;
      });

      console.log("Loaded recent activities");
    }
  } catch (error) {
    console.error("Error loading activities:", error);
  }
}

// Load dữ liệu dashboard
async function loadDashboard() {
  console.log("Loading dashboard data...");
  await Promise.all([loadOverviewStats(), loadRecentActivities()]);
}

// Khởi động khi DOM ready
document.addEventListener("DOMContentLoaded", () => {
  // Đợi auth check xong (khoảng 500ms)
  setTimeout(loadDashboard, 500);
});