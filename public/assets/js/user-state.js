// public/assets/js/user-state.js

document.addEventListener("DOMContentLoaded", () => {
  updateUserInterface();
});

function updateUserInterface() {
  // 1. Lấy thông tin user từ localStorage
  const userStr = localStorage.getItem("user");
  const authContainer = document.querySelector(".navbar-collapse .navbar-nav"); // Chỗ chứa các menu

  if (!authContainer) return;

  if (userStr) {
    // --- TRƯỜNG HỢP ĐÃ ĐĂNG NHẬP ---
    const user = JSON.parse(userStr);

    // Tìm các nút Đăng nhập/Đăng ký cũ để ẩn đi (nếu cần xử lý kỹ hơn)
    // Ở đây tôi dùng cách thay thế HTML của nút cuối cùng (thường là nút Login)

    // Tạo HTML hiển thị tên user và nút đăng xuất
    const loggedInHtml = `
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle fw-bold text-success" href="#" role="button" data-bs-toggle="dropdown">
                    Xin chào, ${user.fullName}
                </a>
                <ul class="dropdown-menu">
                    ${
                      user.role === "admin"
                        ? '<li><a class="dropdown-item" href="/Admin/dashboard.html">Trang quản trị</a></li>'
                        : ""
                    }
                    <li><a class="dropdown-item" href="#">Hồ sơ cá nhân</a></li>
                    <li><a class="dropdown-item" href="#">Đơn mua</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" id="logout-btn">Đăng xuất</a></li>
                </ul>
            </li>
        `;

 
    const loginBtn = authContainer.querySelector('a[href="login.html"]');
    if (loginBtn) {
      // Thay thế thẻ <li> chứa nút login bằng dropdown user
      const liParent = loginBtn.closest("li");
      liParent.outerHTML = loggedInHtml;
    }

    // Gắn sự kiện Đăng xuất
    setTimeout(() => {
      const logoutBtn = document.getElementById("logout-btn");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
          e.preventDefault();
          handleLogout();
        });
      }
    }, 500);
  } else {
    // --- TRƯỜNG HỢP CHƯA ĐĂNG NHẬP ---
    // Giữ nguyên hoặc đảm bảo nút đăng nhập hiển thị
  }
}

function handleLogout() {
  // Xóa token và thông tin user
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");

  // Tải lại trang để cập nhật giao diện
  alert("Đã đăng xuất!");
  window.location.href = "/index.html";
}
