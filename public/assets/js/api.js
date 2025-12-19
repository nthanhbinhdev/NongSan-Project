// ============================================================
// public/assets/js/api.js - GỌI API BACKEND
// ============================================================

const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000/api"
    : "/api"; // Tự động chuyển sang production URL

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// Lấy token từ localStorage
function getAuthToken() {
  return localStorage.getItem("accessToken");
}

// Fetch wrapper với authentication
async function fetchAPI(url, options = {}) {
  const token = getAuthToken();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Có lỗi xảy ra");
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

// ============================================================
// PRODUCT API
// ============================================================

const ProductAPI = {
  // Lấy danh sách sản phẩm
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchAPI(`/products?${queryString}`);
  },

  // Lấy chi tiết 1 sản phẩm
  getById: async (id) => {
    return fetchAPI(`/products/${id}`);
  },

  // Tìm kiếm sản phẩm
  search: async (keyword, category = "") => {
    const params = { search: keyword };
    if (category) params.category = category;
    return ProductAPI.getAll(params);
  },

  // Lọc theo giá
  filterByPrice: async (minPrice, maxPrice) => {
    return ProductAPI.getAll({ minPrice, maxPrice });
  },

  // Sắp xếp
  sort: async (sortBy) => {
    return ProductAPI.getAll({ sort: sortBy });
  },

  // [ADMIN] Thêm sản phẩm
  create: async (formData) => {
    return fetchAPI("/products", {
      method: "POST",
      body: formData,
      headers: {}, // FormData tự set Content-Type
    });
  },

  // [ADMIN] Cập nhật sản phẩm
  update: async (id, formData) => {
    return fetchAPI(`/products/${id}`, {
      method: "PUT",
      body: formData,
      headers: {},
    });
  },

  // [ADMIN] Xóa sản phẩm
  delete: async (id) => {
    return fetchAPI(`/products/${id}`, { method: "DELETE" });
  },
};

// ============================================================
// ORDER API
// ============================================================

const OrderAPI = {
  // Tạo đơn hàng mới
  create: async (orderData) => {
    return fetchAPI("/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
  },

  // Lấy danh sách đơn hàng
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchAPI(`/orders?${queryString}`);
  },

  // Lấy chi tiết đơn hàng
  getById: async (id) => {
    return fetchAPI(`/orders/${id}`);
  },

  // Lấy đơn hàng của user hiện tại
  getMyOrders: async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) throw new Error("Chưa đăng nhập");
    return OrderAPI.getAll({ userId: user._id });
  },

  // [ADMIN] Cập nhật trạng thái đơn hàng
  updateStatus: async (id, status) => {
    return fetchAPI(`/orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  },
};

// ============================================================
// CART API (LocalStorage + Backend Sync)
// ============================================================

const CartAPI = {
  // Lấy giỏ hàng từ localStorage
  getLocal: () => {
    try {
      return JSON.parse(localStorage.getItem("cart")) || [];
    } catch {
      return [];
    }
  },

  // Lưu giỏ hàng vào localStorage
  saveLocal: (cart) => {
    localStorage.setItem("cart", JSON.stringify(cart));
  },

  // Thêm sản phẩm vào giỏ
  addItem: (productId, quantity = 1) => {
    const cart = CartAPI.getLocal();
    const existingItem = cart.find((item) => item.productId === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({ productId, quantity });
    }

    CartAPI.saveLocal(cart);
    return cart;
  },

  // Cập nhật số lượng
  updateQuantity: (productId, quantity) => {
    const cart = CartAPI.getLocal();
    const item = cart.find((item) => item.productId === productId);

    if (item) {
      item.quantity = quantity;
      CartAPI.saveLocal(cart);
    }

    return cart;
  },

  // Xóa sản phẩm khỏi giỏ
  removeItem: (productId) => {
    let cart = CartAPI.getLocal();
    cart = cart.filter((item) => item.productId !== productId);
    CartAPI.saveLocal(cart);
    return cart;
  },

  // Xóa toàn bộ giỏ hàng
  clear: () => {
    localStorage.removeItem("cart");
  },

  // Lấy tổng số sản phẩm
  getCount: () => {
    const cart = CartAPI.getLocal();
    return cart.reduce((total, item) => total + item.quantity, 0);
  },
};

// ============================================================
// AUTH API
// ============================================================

const AuthAPI = {
  // Đăng nhập (sử dụng Firebase)
  login: async (idToken) => {
    return fetchAPI("/auth/login", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    });
  },

  // Đăng ký (sử dụng Firebase)
  register: async (idToken, userData) => {
    return fetchAPI("/auth/register", {
      method: "POST",
      body: JSON.stringify({ idToken, ...userData }),
    });
  },

  // Đăng xuất
  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    CartAPI.clear();
    window.location.href = "/login.html";
  },

  // Kiểm tra đăng nhập
  isLoggedIn: () => {
    return !!getAuthToken();
  },

  // Lấy thông tin user hiện tại
  getCurrentUser: () => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  },
};

// ============================================================
// EXPORT
// ============================================================

// Expose to global scope
window.API = {
  Product: ProductAPI,
  Order: OrderAPI,
  Cart: CartAPI,
  Auth: AuthAPI,
};

// ============================================================
// USAGE EXAMPLES
// ============================================================

/*
// Tìm kiếm sản phẩm
const products = await API.Product.search('cam');

// Thêm vào giỏ hàng
API.Cart.addItem('TC001', 2);

// Lấy số lượng trong giỏ
const count = API.Cart.getCount();

// Tạo đơn hàng
const order = await API.Order.create({
  customer: {
    name: 'Nguyễn Văn A',
    phone: '0909123456',
    email: 'test@gmail.com',
    address: 'TP.HCM'
  },
  items: API.Cart.getLocal(),
  paymentMethod: 'cod'
});

// Đăng xuất
API.Auth.logout();
*/
