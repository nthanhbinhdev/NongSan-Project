async function loadUserProfile() {
  const user = API.Auth.getCurrentUser();

  if (!user) {
    alert("Vui lòng đăng nhập");
    window.location.href = "/login.html";
    return;
  }

  try {
    const token = localStorage.getItem("accessToken");
    const response = await fetch(`/api/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      displayUserProfile(data.user || user);
    } else {
      displayUserProfile(user);
    }
  } catch (error) {
    console.error("Error loading profile:", error);
    displayUserProfile(user);
  }
}

function displayUserProfile(user) {
  const container = document.getElementById("profile-container");
  if (!container) return;

  container.innerHTML = `
    <div class="row">
      <div class="col-md-4">
        <div class="card">
          <div class="card-body text-center">
            <div class="avatar mb-3">
              <div class="avatar-circle bg-success text-white" style="width: 100px; height: 100px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto; font-size: 2.5rem;">
                ${user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
              </div>
            </div>
            <h4>${user.fullName || "Người dùng"}</h4>
            <p class="text-muted">${user.email}</p>
            <span class="badge bg-${
              user.role === "admin" ? "danger" : "primary"
            }">
              ${user.role === "admin" ? "Quản trị viên" : "Khách hàng"}
            </span>
          </div>
        </div>

        <div class="card mt-3">
          <div class="card-body">
            <h6 class="card-title">Menu</h6>
            <div class="list-group list-group-flush">
              <a href="#info" class="list-group-item list-group-item-action active" onclick="showTab('info')">
                <i class="ti-user"></i> Thông tin cá nhân
              </a>
              <a href="#orders" class="list-group-item list-group-item-action" onclick="showTab('orders')">
                <i class="ti-shopping-cart"></i> Đơn hàng của tôi
              </a>
              <a href="#password" class="list-group-item list-group-item-action" onclick="showTab('password')">
                <i class="ti-lock"></i> Đổi mật khẩu
              </a>
              <a href="/logout" class="list-group-item list-group-item-action text-danger" onclick="handleLogout(event)">
                <i class="ti-power-off"></i> Đăng xuất
              </a>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-8">
        <div id="info-tab" class="tab-content">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Thông tin cá nhân</h5>
            </div>
            <div class="card-body">
              <form id="profile-form">
                <div class="mb-3">
                  <label for="fullName" class="form-label">Họ và tên</label>
                  <input type="text" class="form-control" id="fullName" value="${
                    user.fullName || ""
                  }" required>
                </div>
                <div class="mb-3">
                  <label for="email" class="form-label">Email</label>
                  <input type="email" class="form-control" id="email" value="${
                    user.email
                  }" readonly>
                </div>
                <div class="mb-3">
                  <label for="phone" class="form-label">Số điện thoại</label>
                  <input type="tel" class="form-control" id="phone" value="${
                    user.phone || ""
                  }">
                </div>
                <div class="mb-3">
                  <label for="address" class="form-label">Địa chỉ</label>
                  <textarea class="form-control" id="address" rows="3">${
                    user.address || ""
                  }</textarea>
                </div>
                <button type="submit" class="btn btn-success">Cập nhật thông tin</button>
              </form>
            </div>
          </div>
        </div>

        <div id="orders-tab" class="tab-content" style="display: none;">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Đơn hàng gần đây</h5>
            </div>
            <div class="card-body">
              <div id="recent-orders-list">
                <div class="text-center py-3">
                  <div class="spinner-border text-success"></div>
                  <p>Đang tải...</p>
                </div>
              </div>
              <a href="/orders.html" class="btn btn-outline-success mt-3">Xem tất cả đơn hàng</a>
            </div>
          </div>
        </div>

        <div id="password-tab" class="tab-content" style="display: none;">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Đổi mật khẩu</h5>
            </div>
            <div class="card-body">
              <form id="password-form">
                <div class="mb-3">
                  <label for="currentPassword" class="form-label">Mật khẩu hiện tại</label>
                  <input type="password" class="form-control" id="currentPassword" required>
                </div>
                <div class="mb-3">
                  <label for="newPassword" class="form-label">Mật khẩu mới</label>
                  <input type="password" class="form-control" id="newPassword" required minlength="6">
                </div>
                <div class="mb-3">
                  <label for="confirmPassword" class="form-label">Xác nhận mật khẩu mới</label>
                  <input type="password" class="form-control" id="confirmPassword" required minlength="6">
                </div>
                <button type="submit" class="btn btn-success">Đổi mật khẩu</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  setupEventListeners();
  loadRecentOrders();
}

function showTab(tabName) {
  event.preventDefault();

  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.style.display = "none";
  });

  document.querySelectorAll(".list-group-item").forEach((item) => {
    item.classList.remove("active");
  });

  document.getElementById(`${tabName}-tab`).style.display = "block";
  event.currentTarget.classList.add("active");

  if (tabName === "orders") {
    loadRecentOrders();
  }
}

function setupEventListeners() {
  const profileForm = document.getElementById("profile-form");
  if (profileForm) {
    profileForm.addEventListener("submit", handleProfileUpdate);
  }

  const passwordForm = document.getElementById("password-form");
  if (passwordForm) {
    passwordForm.addEventListener("submit", handlePasswordChange);
  }
}

async function handleProfileUpdate(event) {
  event.preventDefault();

  const fullName = document.getElementById("fullName").value;
  const phone = document.getElementById("phone").value;
  const address = document.getElementById("address").value;

  try {
    const token = localStorage.getItem("accessToken");
    const user = API.Auth.getCurrentUser();

    const response = await fetch(`/api/auth/profile`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fullName, phone, address }),
    });

    if (response.ok) {
      const data = await response.json();

      const updatedUser = { ...user, fullName, phone, address };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      alert("Cập nhật thông tin thành công!");
      loadUserProfile();
    } else {
      alert("Không thể cập nhật thông tin");
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    alert("Có lỗi xảy ra khi cập nhật thông tin");
  }
}

async function handlePasswordChange(event) {
  event.preventDefault();

  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (newPassword !== confirmPassword) {
    alert("Mật khẩu mới không khớp!");
    return;
  }

  if (newPassword.length < 6) {
    alert("Mật khẩu phải có ít nhất 6 ký tự!");
    return;
  }

  try {
    const token = localStorage.getItem("accessToken");

    const response = await fetch(`/api/auth/change-password`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (response.ok) {
      alert("Đổi mật khẩu thành công!");
      document.getElementById("password-form").reset();
    } else {
      const data = await response.json();
      alert(data.message || "Không thể đổi mật khẩu");
    }
  } catch (error) {
    console.error("Error changing password:", error);
    alert("Có lỗi xảy ra khi đổi mật khẩu");
  }
}

async function loadRecentOrders() {
  const container = document.getElementById("recent-orders-list");
  if (!container) return;

  try {
    const user = API.Auth.getCurrentUser();
    const token = localStorage.getItem("accessToken");

    const response = await fetch(`/api/orders?userId=${user._id}&limit=5`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        renderRecentOrders(data.data, container);
      } else {
        container.innerHTML = '<p class="text-muted">Chưa có đơn hàng nào</p>';
      }
    }
  } catch (error) {
    console.error("Error loading recent orders:", error);
    container.innerHTML = '<p class="text-danger">Không thể tải đơn hàng</p>';
  }
}

function renderRecentOrders(orders, container) {
  const statusLabels = {
    pending: { text: "Chờ xác nhận", class: "warning" },
    confirmed: { text: "Đã xác nhận", class: "info" },
    shipping: { text: "Đang giao", class: "primary" },
    delivered: { text: "Đã giao", class: "success" },
    cancelled: { text: "Đã hủy", class: "danger" },
  };

  let html = '<div class="list-group">';

  orders.forEach((order) => {
    const status = statusLabels[order.status] || {
      text: order.status,
      class: "secondary",
    };

    html += `
      <div class="list-group-item">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-1">#${order.orderNumber}</h6>
            <small class="text-muted">${new Date(
              order.createdAt
            ).toLocaleDateString("vi-VN")}</small>
          </div>
          <div class="text-end">
            <div class="fw-bold text-success">${formatPrice(
              order.finalAmount
            )}đ</div>
            <span class="badge bg-${status.class}">${status.text}</span>
          </div>
        </div>
      </div>
    `;
  });

  html += "</div>";
  container.innerHTML = html;
}

function handleLogout(event) {
  event.preventDefault();

  if (confirm("Bạn có chắc muốn đăng xuất?")) {
    API.Auth.logout();
  }
}

function formatPrice(number) {
  return new Intl.NumberFormat("vi-VN").format(Math.round(number));
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.includes("profile.html")) {
    loadUserProfile();
  }
});

window.showTab = showTab;
window.handleLogout = handleLogout;

window.ProfileHandler = {
  loadUserProfile,
  handleProfileUpdate,
  handlePasswordChange,
};
