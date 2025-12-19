// ============================================================
// public/Admin/js/orders-handler.js - QUẢN LÝ ĐƠN HÀNG
// ============================================================

import { adminAPI } from "./admin-auth.js";

// Format ngày giờ
function formatDateTime(date) {
  return new Date(date).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Màu trạng thái
const statusColors = {
  pending: "warning",
  confirmed: "info",
  shipping: "primary",
  delivered: "success",
  cancelled: "danger",
};

// Tiếng Việt trạng thái
const statusLabels = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};

// Load thống kê đơn hàng
async function loadOrderStats() {
  try {
    const data = await adminAPI("/stats/overview");

    if (data.success) {
      const stats = data.data.ordersByStatus;

      // Cập nhật các card
      const cards = document.querySelectorAll(".card-single h1");
      if (cards.length >= 4) {
        cards[0].textContent = stats.delivered || 0; // Đã giao
        cards[1].textContent = stats.shipping || 0; // Đang giao
        cards[2].textContent = stats.confirmed || 0; // Đang xử lý
        cards[3].textContent = stats.pending || 0; // Yêu cầu mới
      }

      console.log("✅ Loaded order stats");
    }
  } catch (error) {
    console.error("❌ Error loading order stats:", error);
  }
}

// Load danh sách đơn hàng
async function loadOrders(month = null, year = null) {
  try {
    let endpoint = "/orders?limit=50";
    
    // Lấy tháng hiện tại nếu không có
    if (!month && !year) {
      const now = new Date();
      month = now.getMonth() + 1;
      year = now.getFullYear();
    }

    if (month && year) {
      endpoint += `&month=${month}&year=${year}`;
    }

    const data = await adminAPI(endpoint);

    if (data.success) {
      const orders = data.data;
      renderOrdersTable(orders);
      console.log(`✅ Loaded ${orders.length} orders`);
    }
  } catch (error) {
    console.error("❌ Error loading orders:", error);
    alert("Không thể tải danh sách đơn hàng");
  }
}

// Render bảng đơn hàng
function renderOrdersTable(orders) {
  const tbody = document.querySelector(".projects table tbody");

  if (!tbody) {
    console.error("❌ Không tìm thấy tbody");
    return;
  }

  tbody.innerHTML = ""; // Xóa dữ liệu cũ

  if (orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 20px;">
          Không có đơn hàng nào
        </td>
      </tr>
    `;
    return;
  }

  orders.forEach((order) => {
    const row = createOrderRow(order);
    tbody.appendChild(row);
  });

  attachEventListeners();
}

// Tạo dòng đơn hàng
function createOrderRow(order) {
  const tr = document.createElement("tr");
  tr.dataset.orderId = order._id;

  tr.innerHTML = `
    <td>${order.orderNumber}</td>
    <td>${order.customer.name}</td>
    <td>${order.customer.address}</td>
    <td>${formatDateTime(order.createdAt)}</td>
    <td class="section">
      <select class="status-select" data-order-id="${order._id}">
        <option value="pending" ${order.status === "pending" ? "selected" : ""}>
          Chờ xác nhận
        </option>
        <option value="confirmed" ${order.status === "confirmed" ? "selected" : ""}>
          Đã xác nhận
        </option>
        <option value="shipping" ${order.status === "shipping" ? "selected" : ""}>
          Đang giao
        </option>
        <option value="delivered" ${order.status === "delivered" ? "selected" : ""}>
          Đã giao
        </option>
        <option value="cancelled" ${order.status === "cancelled" ? "selected" : ""}>
          Đã hủy
        </option>
      </select>
    </td>
  `;

  return tr;
}

// Cập nhật trạng thái đơn hàng
async function updateOrderStatus(orderId, newStatus) {
  try {
    const data = await adminAPI(`/orders/${orderId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status: newStatus }),
    });

    if (data.success) {
      console.log(`✅ Updated order ${orderId} to ${newStatus}`);
      // Reload stats
      loadOrderStats();
    } else {
      alert("❌ " + data.message);
    }
  } catch (error) {
    console.error("❌ Error updating order status:", error);
    alert("Không thể cập nhật trạng thái đơn hàng");
  }
}

// Gắn event listeners
function attachEventListeners() {
  document.querySelectorAll(".status-select").forEach((select) => {
    select.addEventListener("change", function () {
      const orderId = this.dataset.orderId;
      const newStatus = this.value;

      if (confirm(`Xác nhận thay đổi trạng thái đơn hàng?`)) {
        updateOrderStatus(orderId, newStatus);
      } else {
        // Revert selection
        const row = this.closest("tr");
        const currentStatus = row.dataset.status;
        this.value = currentStatus;
      }
    });
  });
}

// Lọc đơn hàng theo tháng
function setupMonthFilter() {
  const cardHeader = document.querySelector(".card-header");

  if (cardHeader) {
    const filterHTML = `
      <div style="display: flex; gap: 10px; align-items: center;">
        <select id="monthFilter" style="padding: 5px;">
          ${Array.from({ length: 12 }, (_, i) => {
            const month = i + 1;
            return `<option value="${month}">Tháng ${month}</option>`;
          }).join("")}
        </select>
        <select id="yearFilter" style="padding: 5px;">
          ${[2024, 2025].map(year => 
            `<option value="${year}">${year}</option>`
          ).join("")}
        </select>
        <button id="filterBtn" style="padding: 5px 15px;">Lọc</button>
      </div>
    `;

    const existingHeader = cardHeader.querySelector("h2");
    if (existingHeader && !cardHeader.querySelector("#monthFilter")) {
      cardHeader.innerHTML = `
        <div style="display: flex; justify-content: space-between; width: 100%;">
          <h2>Đơn hàng</h2>
          ${filterHTML}
        </div>
      `;

      // Set tháng hiện tại
      const now = new Date();
      document.getElementById("monthFilter").value = now.getMonth() + 1;
      document.getElementById("yearFilter").value = now.getFullYear();

      // Event listener
      document.getElementById("filterBtn").addEventListener("click", () => {
        const month = document.getElementById("monthFilter").value;
        const year = document.getElementById("yearFilter").value;
        loadOrders(month, year);
      });
    }
  }
}

// Khởi động
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    loadOrderStats();
    loadOrders(); // Load tháng hiện tại
    setupMonthFilter();
  }, 500);
});