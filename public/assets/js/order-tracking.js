async function loadMyOrders() {
  const user = API.Auth.getCurrentUser();

  if (!user) {
    alert("Vui lòng đăng nhập để xem đơn hàng");
    window.location.href = "/login.html";
    return;
  }

  try {
    const container = document.getElementById("orders-container");
    if (!container) return;

    container.innerHTML =
      '<div class="text-center"><div class="spinner-border text-success"></div><p>Đang tải...</p></div>';

    const response = await API.Order.getMyOrders();

    if (response.success && response.data.length > 0) {
      renderOrders(response.data, container);
    } else {
      container.innerHTML = `
        <div class="empty-orders text-center py-5">
          <i class="ti-shopping-cart" style="font-size: 4rem; color: #ccc;"></i>
          <h4 class="mt-3">Chưa có đơn hàng nào</h4>
          <p class="text-secondary">Hãy đặt hàng để theo dõi đơn hàng của bạn</p>
          <a href="/product.html" class="btn btn-success mt-2">Mua sắm ngay</a>
        </div>
      `;
    }
  } catch (error) {
    console.error("Error loading orders:", error);
    alert("Không thể tải danh sách đơn hàng");
  }
}

function renderOrders(orders, container) {
  const statusLabels = {
    pending: { text: "Chờ xác nhận", class: "warning" },
    confirmed: { text: "Đã xác nhận", class: "info" },
    shipping: { text: "Đang giao", class: "primary" },
    delivered: { text: "Đã giao", class: "success" },
    cancelled: { text: "Đã hủy", class: "danger" },
  };

  let html = '<div class="orders-list">';

  orders.forEach((order) => {
    const status = statusLabels[order.status] || {
      text: order.status,
      class: "secondary",
    };
    const orderDate = new Date(order.createdAt).toLocaleDateString("vi-VN");

    html += `
      <div class="order-card card mb-3">
        <div class="card-header d-flex justify-content-between align-items-center">
          <div>
            <h5 class="mb-0">Đơn hàng #${order.orderNumber}</h5>
            <small class="text-muted">Ngày đặt: ${orderDate}</small>
          </div>
          <span class="badge bg-${status.class}">${status.text}</span>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-8">
              <h6>Sản phẩm:</h6>
              <ul class="list-unstyled">
                ${order.items
                  .slice(0, 3)
                  .map(
                    (item) => `
                  <li class="mb-2">
                    <strong>${item.name}</strong> x${
                      item.quantity
                    } - ${formatPrice(item.subtotal)}đ
                  </li>
                `
                  )
                  .join("")}
                ${
                  order.items.length > 3
                    ? `<li class="text-muted">và ${
                        order.items.length - 3
                      } sản phẩm khác...</li>`
                    : ""
                }
              </ul>
            </div>
            <div class="col-md-4 text-end">
              <h6>Tổng tiền:</h6>
              <h4 class="text-success">${formatPrice(order.finalAmount)}đ</h4>
              <small class="text-muted">Phương thức: ${getPaymentMethodName(
                order.paymentMethod
              )}</small>
            </div>
          </div>
          <hr>
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <strong>Địa chỉ:</strong> ${order.customer.address}
            </div>
            <div>
              <button class="btn btn-sm btn-outline-primary" onclick="viewOrderDetail('${
                order._id
              }')">
                Chi tiết
              </button>
              <button class="btn btn-sm btn-outline-info" onclick="trackOrder('${
                order._id
              }')">
                Theo dõi
              </button>
              ${
                order.status === "pending"
                  ? `
                <button class="btn btn-sm btn-outline-danger" onclick="cancelOrder('${order._id}')">
                  Hủy đơn
                </button>
              `
                  : ""
              }
            </div>
          </div>
        </div>
      </div>
    `;
  });

  html += "</div>";
  container.innerHTML = html;
}

async function viewOrderDetail(orderId) {
  try {
    const response = await API.Order.getById(orderId);

    if (response.success) {
      const order = response.data;
      showOrderDetailModal(order);
    }
  } catch (error) {
    console.error("Error loading order detail:", error);
    alert("Không thể tải chi tiết đơn hàng");
  }
}

function showOrderDetailModal(order) {
  const modal = document.createElement("div");
  modal.className = "modal fade show";
  modal.style.display = "block";
  modal.style.backgroundColor = "rgba(0,0,0,0.5)";

  const statusLabels = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    shipping: "Đang giao",
    delivered: "Đã giao",
    cancelled: "Đã hủy",
  };

  modal.innerHTML = `
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Chi tiết đơn hàng #${order.orderNumber}</h5>
          <button type="button" class="btn-close" onclick="this.closest('.modal').remove()"></button>
        </div>
        <div class="modal-body">
          <div class="row mb-3">
            <div class="col-md-6">
              <h6>Thông tin khách hàng:</h6>
              <p class="mb-1"><strong>Tên:</strong> ${order.customer.name}</p>
              <p class="mb-1"><strong>SĐT:</strong> ${order.customer.phone}</p>
              <p class="mb-1"><strong>Email:</strong> ${
                order.customer.email || "N/A"
              }</p>
              <p class="mb-1"><strong>Địa chỉ:</strong> ${
                order.customer.address
              }</p>
            </div>
            <div class="col-md-6">
              <h6>Thông tin đơn hàng:</h6>
              <p class="mb-1"><strong>Trạng thái:</strong> ${
                statusLabels[order.status]
              }</p>
              <p class="mb-1"><strong>Thanh toán:</strong> ${getPaymentMethodName(
                order.paymentMethod
              )}</p>
              <p class="mb-1"><strong>Ngày đặt:</strong> ${new Date(
                order.createdAt
              ).toLocaleString("vi-VN")}</p>
              ${
                order.note
                  ? `<p class="mb-1"><strong>Ghi chú:</strong> ${order.note}</p>`
                  : ""
              }
            </div>
          </div>
          
          <h6>Sản phẩm:</h6>
          <table class="table table-bordered">
            <thead>
              <tr>
                <th>Tên sản phẩm</th>
                <th>Đơn giá</th>
                <th>SL</th>
                <th>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${order.items
                .map(
                  (item) => `
                <tr>
                  <td>${item.name}</td>
                  <td>${formatPrice(item.price)}đ</td>
                  <td>${item.quantity}</td>
                  <td>${formatPrice(item.subtotal)}đ</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" class="text-end"><strong>Tạm tính:</strong></td>
                <td><strong>${formatPrice(order.totalAmount)}đ</strong></td>
              </tr>
              <tr>
                <td colspan="3" class="text-end">Phí vận chuyển:</td>
                <td>${formatPrice(order.shippingFee)}đ</td>
              </tr>
              <tr class="table-success">
                <td colspan="3" class="text-end"><strong>Tổng cộng:</strong></td>
                <td><strong>${formatPrice(order.finalAmount)}đ</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Đóng</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

async function trackOrder(orderId) {
  try {
    const response = await API.Shipping.tracking(orderId);

    if (response.success) {
      showTrackingModal(response.data);
    }
  } catch (error) {
    console.error("Error tracking order:", error);
    alert("Không thể theo dõi đơn hàng");
  }
}

function showTrackingModal(data) {
  const modal = document.createElement("div");
  modal.className = "modal fade show";
  modal.style.display = "block";
  modal.style.backgroundColor = "rgba(0,0,0,0.5)";

  const timeline = data.tracking.timeline;

  modal.innerHTML = `
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Theo dõi đơn hàng #${
            data.order.orderNumber
          }</h5>
          <button type="button" class="btn-close" onclick="this.closest('.modal').remove()"></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-info">
            <strong>Trạng thái hiện tại:</strong> ${data.tracking.currentStatus}
            <br>
            <strong>Vị trí:</strong> ${data.tracking.currentLocation}
            <br>
            <strong>Dự kiến giao:</strong> ${data.tracking.estimatedDelivery}
          </div>
          
          <h6 class="mb-3">Lịch sử vận chuyển:</h6>
          <div class="timeline">
            ${timeline
              .map(
                (event, index) => `
              <div class="timeline-item ${event.completed ? "completed" : ""}">
                <div class="timeline-marker ${
                  event.completed ? "bg-success" : "bg-secondary"
                }">
                  ${event.completed ? "✓" : index + 1}
                </div>
                <div class="timeline-content">
                  <h6 class="mb-1">${event.title}</h6>
                  <p class="mb-1 text-muted">${event.description}</p>
                  ${
                    event.timestamp
                      ? `
                    <small class="text-muted">
                      ${new Date(event.timestamp).toLocaleString("vi-VN")}
                    </small>
                  `
                      : event.estimated
                      ? `
                    <small class="text-info">Dự kiến: ${event.estimated}</small>
                  `
                      : ""
                  }
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Đóng</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

async function cancelOrder(orderId) {
  const reason = prompt("Vui lòng cho biết lý do hủy đơn:");

  if (!reason) return;

  const user = API.Auth.getCurrentUser();

  try {
    const response = await API.Order.cancel(orderId, reason, user?._id);

    if (response.success) {
      alert("Đã hủy đơn hàng thành công");
      loadMyOrders();
    } else {
      alert("Không thể hủy đơn hàng: " + response.message);
    }
  } catch (error) {
    console.error("Error canceling order:", error);
    alert("Có lỗi xảy ra khi hủy đơn hàng");
  }
}

function getPaymentMethodName(method) {
  const names = {
    cod: "COD",
    bank_transfer: "Chuyển khoản",
    momo: "MoMo",
    zalopay: "ZaloPay",
  };
  return names[method] || method;
}

function formatPrice(number) {
  return new Intl.NumberFormat("vi-VN").format(Math.round(number));
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.includes("orders.html")) {
    loadMyOrders();
  }
});

const style = document.createElement("style");
style.textContent = `
  .timeline {
    position: relative;
    padding-left: 30px;
  }
  
  .timeline::before {
    content: '';
    position: absolute;
    left: 10px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #dee2e6;
  }
  
  .timeline-item {
    position: relative;
    padding-bottom: 20px;
  }
  
  .timeline-marker {
    position: absolute;
    left: -26px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
    z-index: 1;
  }
  
  .timeline-content {
    padding: 10px;
    background: #f8f9fa;
    border-radius: 5px;
  }
  
  .timeline-item.completed .timeline-content {
    background: #d4edda;
  }
`;
document.head.appendChild(style);

window.OrderTracking = {
  loadMyOrders,
  viewOrderDetail,
  trackOrder,
  cancelOrder,
};

if (!window.API) {
  window.API = {};
}

if (!window.API.Order) {
  window.API.Order = {
    getMyOrders: async () => {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("accessToken");

      const response = await fetch(`/api/orders?userId=${user._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      return await response.json();
    },

    getById: async (id) => {
      const response = await fetch(`/api/orders/${id}`);
      return await response.json();
    },

    cancel: async (orderId, reason, userId) => {
      const token = localStorage.getItem("accessToken");

      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason, userId }),
      });

      return await response.json();
    },

    create: async (orderData) => {
      const token = localStorage.getItem("accessToken");

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      return await response.json();
    },
  };
}

if (!window.API.Shipping) {
  window.API.Shipping = {
    tracking: async (orderId) => {
      const response = await fetch(`/api/shipping/tracking/${orderId}`);
      return await response.json();
    },

    calculateFee: async (address, weight, items) => {
      const response = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, weight, items }),
      });

      return await response.json();
    },
  };
}

if (!window.API.Payment) {
  window.API.Payment = {
    getMethods: async () => {
      const response = await fetch("/api/payment/methods");
      return await response.json();
    },

    process: async (orderId, paymentMethod) => {
      const response = await fetch("/api/payment/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, paymentMethod }),
      });

      return await response.json();
    },
  };
}
