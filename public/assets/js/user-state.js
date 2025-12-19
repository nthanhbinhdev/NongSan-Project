// public/assets/js/user-state.js

document.addEventListener("DOMContentLoaded", () => {
  updateUserInterface();
});

function updateUserInterface() {
  const userStr = localStorage.getItem("user");
  
  // 1. Tìm đúng cái menu dropdown trong HTML của ông
  const accountDropdown = document.querySelector(".account-dropdown");
  
  if (!accountDropdown) return; // Không thấy menu thì thôi

  if (userStr) {
    // --- ĐÃ ĐĂNG NHẬP ---
    const user = JSON.parse(userStr);

    // Thay đổi danh sách <li> bên trong dropdown
    accountDropdown.innerHTML = `
        <li><span class="dropdown-item-text fw-bold text-success" style="font-size: 0.9rem">Xin chào, ${user.fullName}</span></li>
        <li><hr class="dropdown-divider"></li>
        ${user.role === 'admin' ? '<li><a class="dropdown-item" href="/admin">Trang quản trị</a></li>' : ''}
        <li><a class="dropdown-item" href="profile.html">Hồ sơ cá nhân</a></li>
        <li><a class="dropdown-item" href="orders.html">Đơn mua</a></li>
        <li><hr class="dropdown-divider"></li>
        <li><a class="dropdown-item text-danger" href="#" id="logout-btn">Đăng xuất</a></li>
    `;

    // Gắn lại sự kiện logout (vì nút logout mới vừa được tạo ra bằng HTML string)
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        handleLogout();
      });
    }

  } else {
    // --- CHƯA ĐĂNG NHẬP ---
    // Đảm bảo menu hiển thị Login/Signup (Phòng trường hợp user vừa logout xong)
    accountDropdown.innerHTML = `
        <li><a class="dropdown-item text-secondary" href="login.html">Đăng Nhập</a></li>
        <li><a class="dropdown-item text-secondary" href="signup.html">Đăng Ký</a></li>
    `;
  }
}

function handleLogout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
  
  // Xóa giỏ hàng local để tránh lộ thông tin (hoặc giữ lại tùy nghiệp vụ)
  // localStorage.removeItem("cart"); 

  alert("Đã đăng xuất!");
  window.location.href = "index.html";
}