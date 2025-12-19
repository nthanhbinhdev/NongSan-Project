// ============================================================
// public/Admin/js/admin-auth.js - XÁC THỰC ADMIN
// ============================================================

// Import Firebase (giả sử đã có trong HTML)
// <script type="module" src="js/admin-auth.js"></script>

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

// Firebase config (thay bằng config của bạn)
const firebaseConfig = {
  apiKey: "AIzaSyABrOpxuBl16HpHgbV1f6VE2swDHaNqYI4",
  authDomain: "nongsanviet-db.firebaseapp.com",
  projectId: "nongsanviet-db",
  storageBucket: "nongsanviet-db.firebasestorage.app",
  messagingSenderId: "928368768826",
  appId: "1:928368768826:web:456f4272260415b8f50203"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Kiểm tra auth khi load trang
window.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      // Chưa đăng nhập -> redirect về login
      window.location.href = "../login.html";
      return;
    }

    try {
      // Lấy token
      const idToken = await user.getIdToken();

      // Gọi API login để lấy thông tin user
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (!data.user || data.user.role !== "admin") {
        alert("❌ Bạn không có quyền truy cập Admin!");
        await signOut(auth);
        window.location.href = "../login.html";
        return;
      }

      // Lưu thông tin admin
      localStorage.setItem("adminToken", idToken);
      localStorage.setItem("adminUser", JSON.stringify(data.user));

      console.log("✅ Admin authenticated:", data.user.email);
    } catch (error) {
      console.error("❌ Auth error:", error);
      alert("Lỗi xác thực. Vui lòng đăng nhập lại.");
      window.location.href = "../login.html";
    }
  });
});

// Xử lý logout
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.querySelector('.bottom-content a[href="../login.html"]');
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        await signOut(auth);
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        window.location.href = "../login.html";
      } catch (error) {
        console.error("❌ Logout error:", error);
      }
    });
  }
});

// Helper: Lấy token để gọi API
export function getAdminToken() {
  return localStorage.getItem("adminToken");
}

// Helper: API call với auth
export async function adminAPI(endpoint, options = {}) {
  const token = getAdminToken();

  if (!token) {
    throw new Error("Chưa đăng nhập");
  }

  const response = await fetch(`/api/admin${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (response.status === 401) {
    // Token hết hạn -> logout
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    window.location.href = "../login.html";
    throw new Error("Session expired");
  }

  return response.json();
}