// ============================================================
// public/Admin/js/admin-handler.js - FIXED VERSION
// ============================================================

const BASE_URL = window.location.hostname === "localhost" 
  ? "http://localhost:3000" 
  : "";

// ===== Kiểm tra quyền admin =====
function checkAdminAccess() {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("accessToken");

  if (!user || !token || user.role !== "admin") {
    alert("⛔ Bạn không có quyền truy cập trang này!");
    window.location.href = "/login.html";
    return false;
  }
  return true;
}

// ===== QUẢN LÝ SẢN PHẨM =====
async function loadProductsAdmin() {
  try {
    const response = await fetch(`${BASE_URL}/api/products?limit=100`);
    const result = await response.json();

    if (result.success) {
      displayProductsAdmin(result.data);
    }
  } catch (error) {
    console.error("❌ Lỗi load sản phẩm admin:", error);
    alert("Không thể tải danh sách sản phẩm");
  }
}

function displayProductsAdmin(products) {
  const container = document.getElementById("admin-products-list");
  if (!container) return;

  let html = `
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Mã SP</th>
          <th>Tên</th>
          <th>Hình ảnh</th>
          <th>Giá</th>
          <th>Tồn kho</th>
          <th>Danh mục</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
  `;

  products.forEach((product) => {
    const priceAfterDiscount = product.price * (1 - product.discount);
    html += `
      <tr>
        <td>${product.id || product._id}</td>
        <td>${product.name}</td>
        <td><img src="${product.image}" width="50" alt="${product.name}"></td>
        <td>${formatPrice(priceAfterDiscount)}đ</td>
        <td>${product.stock}</td>
        <td>${product.category}</td>
        <td>
          <button class="btn btn-sm btn-warning" onclick="editProduct('${
            product._id
          }')">
            <i class='bx bx-pencil'></i>
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteProduct('${
            product._id
          }', '${product.name}')">
            <i class='bx bx-trash'></i>
          </button>
        </td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}

async function deleteProduct(productId, productName) {
  if (!confirm(`Bạn có chắc muốn xóa sản phẩm "${productName}"?`)) return;

  try {
    const token = localStorage.getItem("accessToken");
    const response = await fetch(`${BASE_URL}/api/products/${productId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await response.json();

    if (result.success) {
      alert("✅ Xóa sản phẩm thành công!");
      loadProductsAdmin();
    } else {
      alert("❌ Lỗi: " + result.message);
    }
  } catch (error) {
    console.error("❌ Lỗi xóa sản phẩm:", error);
    alert("Có lỗi xảy ra khi xóa sản phẩm");
  }
}

// ===== QUẢN LÝ ĐƠN HÀNG =====
async function loadOrdersAdmin() {
  try {
    const response = await fetch(`${BASE_URL}/api/orders?limit=50`);
    const result = await response.json();

    if (result.success) {
      displayOrdersAdmin(result.data);
    }
  } catch (error) {
    console.error("❌ Lỗi load đơn hàng:", error);
    alert("Không thể tải danh sách đơn hàng");
  }
}

function displayOrdersAdmin(orders) {
  const container = document.getElementById("admin-orders-list");
  if (!container) return;

  let html = `
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Mã ĐH</th>
          <th>Khách hàng</th>
          <th>Số điện thoại</th>
          <th>Địa chỉ</th>
          <th>Tổng tiền</th>
          <th>Trạng thái</th>
          <th>Ngày đặt</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
  `;

  orders.forEach((order) => {
    const statusBadge = getStatusBadge(order.status);
    const orderDate = new Date(order.createdAt).toLocaleString("vi-VN");

    html += `
      <tr>
        <td><strong>${order.orderNumber}</strong></td>
        <td>${order.customer.name}</td>
        <td>${order.customer.phone}</td>
        <td>${order.customer.address}</td>
        <td>${formatPrice(order.finalAmount)}đ</td>
        <td>${statusBadge}</td>
        <td>${orderDate}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="viewOrderDetail('${
            order._id
          }')">
            <i class='bx bx-show'></i>
          </button>
          <button class="btn btn-sm btn-success" onclick="updateOrderStatus('${
            order._id
          }', '${order.status}')">
            <i class='bx bx-check'></i>
          </button>
        </td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}

function getStatusBadge(status) {
  const statusMap = {
    pending: '<span class="badge bg-warning">Chờ xử lý</span>',
    confirmed: '<span class="badge bg-info">Đã xác nhận</span>',
    shipping: '<span class="badge bg-primary">Đang giao</span>',
    delivered: '<span class="badge bg-success">Đã giao</span>',
    cancelled: '<span class="badge bg-danger">Đã hủy</span>',
  };
  return statusMap[status] || status;
}

async function updateOrderStatus(orderId, currentStatus) {
  const statusOptions = [
    "pending",
    "confirmed",
    "shipping",
    "delivered",
    "cancelled",
  ];
  const statusNames = {
    pending: "Chờ xử lý",
    confirmed: "Đã xác nhận",
    shipping: "Đang giao",
    delivered: "Đã giao",
    cancelled: "Đã hủy",
  };

  const newStatus = prompt(
    `Chọn trạng thái mới (nhập: pending, confirmed, shipping, delivered, cancelled):`,
    currentStatus
  );

  if (!newStatus || newStatus === currentStatus) return;
  if (!statusOptions.includes(newStatus)) {
    alert("Trạng thái không hợp lệ!");
    return;
  }

  try {
    const token = localStorage.getItem("accessToken");
    const response = await fetch(`${BASE_URL}/api/orders/${orderId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });

    const result = await response.json();

    if (result.success) {
      alert("✅ Cập nhật trạng thái thành công!");
      loadOrdersAdmin();
    } else {
      alert("❌ Lỗi: " + result.message);
    }
  } catch (error) {
    console.error("❌ Lỗi cập nhật trạng thái:", error);
    alert("Có lỗi xảy ra khi cập nhật trạng thái");
  }
}

async function viewOrderDetail(orderId) {
  try {
    const response = await fetch(`${BASE_URL}/api/orders/${orderId}`);
    const result = await response.json();

    if (result.success) {
      const order = result.data;
      let itemsHtml = "";

      order.items.forEach((item) => {
        itemsHtml += `
          <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>${formatPrice(item.price)}đ</td>
            <td>${formatPrice(item.subtotal)}đ</td>
          </tr>
        `;
      });

      const detailHtml = `
        <h5>Chi tiết đơn hàng ${order.orderNumber}</h5>
        <h6>Thông tin khách hàng:</h6>
        <p>Tên: ${order.customer.name}</p>
        <p>SĐT: ${order.customer.phone}</p>
        <p>Email: ${order.customer.email || "N/A"}</p>
        <p>Địa chỉ: ${order.customer.address}</p>
        
        <h6>Sản phẩm:</h6>
        <table class="table">
          <thead>
            <tr>
              <th>Tên</th>
              <th>SL</th>
              <th>Đơn giá</th>
              <th>Thành tiền</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        
        <p><strong>Tổng tiền: ${formatPrice(order.finalAmount)}đ</strong></p>
      `;

      alert(detailHtml); // Hoặc hiển thị trong modal
    }
  } catch (error) {
    console.error("❌ Lỗi xem chi tiết:", error);
  }
}

// ===== DASHBOARD STATS =====
async function loadDashboardStats() {
  try {
    const [productsRes, ordersRes] = await Promise.all([
      fetch(`${BASE_URL}/api/products?limit=1`),
      fetch(`${BASE_URL}/api/orders?limit=1`),
    ]);

    const products = await productsRes.json();
    const orders = await ordersRes.json();

    const totalProducts = products.pagination?.total || 0;
    const totalOrders = orders.pagination?.total || 0;

    // Cập nhật số liệu
    const box1 = document.querySelector(".box1 .number");
    const box2 = document.querySelector(".box2 .number");

    if (box1) box1.textContent = totalProducts;
    if (box2) box2.textContent = totalOrders;
  } catch (error) {
    console.error("❌ Lỗi load thống kê:", error);
  }
}

// ===== HELPER =====
function formatPrice(number) {
  return new Intl.NumberFormat("vi-VN").format(Math.round(number));
}

// ===== INITIALIZATION =====
document.addEventListener("DOMContentLoaded", () => {
  if (!checkAdminAccess()) return;

  const currentPage = window.location.pathname;

  if (currentPage.includes("products.html")) {
    loadProductsAdmin();
  } else if (currentPage.includes("invoice.html")) {
    loadOrdersAdmin();
  } else if (currentPage.includes("dashboard.html")) {
    loadDashboardStats();
  }
});

// Export
window.AdminHandler = {
  checkAdminAccess,
  loadProductsAdmin,
  deleteProduct,
  loadOrdersAdmin,
  updateOrderStatus,
  viewOrderDetail,
};
