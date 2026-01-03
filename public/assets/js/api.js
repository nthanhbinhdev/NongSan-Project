// ============================================================
// public/assets/js/api.js
// Cập nhật lần cuối: 03/01/2026
// Mô tả: Module xử lý toàn bộ các gọi API tới Backend
// ============================================================

const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000/api"
    : "/api";

// ============================================================
// 1. CORE HELPER FUNCTIONS (Xử lý Request/Response)
// ============================================================

/**
 * Lấy token xác thực từ LocalStorage
 */
function getAuthToken() {
  return localStorage.getItem("accessToken");
}

/**
 * Wrapper cho fetch API với các tính năng:
 * - Tự động đính kèm Token
 * - Tự động xử lý Content-Type (JSON vs FormData)
 * - Xử lý lỗi tập trung
 */
async function fetchAPI(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = { ...options.headers };

  // Logic quan trọng:
  // Nếu body là FormData, trình duyệt sẽ tự động set Content-Type là multipart/form-data kèm boundary.
  // Ta KHÔNG ĐƯỢC set thủ công application/json trong trường hợp này.
  const isFormData = options.body instanceof FormData;

  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Xử lý trường hợp 204 No Content (thành công nhưng không có body)
    if (response.status === 204) {
      return null;
    }

    // Cố gắng parse JSON an toàn
    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      // Fallback nếu server trả về text hoặc HTML lỗi
      data = { message: await response.text() };
    }

    // Nếu response không OK (status 4xx, 5xx)
    if (!response.ok) {
      throw new Error(data.message || `Lỗi API: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error);
    // Ném lỗi tiếp để UI component có thể bắt được và hiển thị alert
    throw error;
  }
}

// ============================================================
// 2. AUTHENTICATION API
// ============================================================

const AuthAPI = {
  login: async (idToken) => {
    return fetchAPI("/auth/login", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    });
  },

  register: async (idToken, userData) => {
    return fetchAPI("/auth/register", {
      method: "POST",
      body: JSON.stringify({ idToken, ...userData }),
    });
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    CartAPI.clear(); // Xóa giỏ hàng local khi đăng xuất
    window.location.href = "/login.html";
  },

  isLoggedIn: () => !!getAuthToken(),

  getCurrentUser: () => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  },
};

// ============================================================
// 3. PRODUCT API
// ============================================================

const ProductAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchAPI(`/products?${queryString}`);
  },

  getById: async (id) => {
    return fetchAPI(`/products/${id}`);
  },

  search: async (keyword, category = "") => {
    const params = { search: keyword };
    if (category) params.category = category;
    return ProductAPI.getAll(params);
  },

  filterByPrice: async (minPrice, maxPrice) => {
    return ProductAPI.getAll({ minPrice, maxPrice });
  },

  sort: async (sortBy) => {
    return ProductAPI.getAll({ sort: sortBy });
  },

  // [ADMIN] - FormData được truyền trực tiếp, fetchAPI sẽ tự xử lý headers
  create: async (formData) => {
    return fetchAPI("/products", {
      method: "POST",
      body: formData,
    });
  },

  // [ADMIN]
  update: async (id, formData) => {
    return fetchAPI(`/products/${id}`, {
      method: "PUT",
      body: formData,
    });
  },

  // [ADMIN]
  delete: async (id) => {
    return fetchAPI(`/products/${id}`, { method: "DELETE" });
  },
};

// ============================================================
// 4. ORDER API (Đã gộp EnhancedOrder vào đây)
// ============================================================

const OrderAPI = {
  create: async (orderData) => {
    return fetchAPI("/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
  },

  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchAPI(`/orders?${queryString}`);
  },

  getById: async (id) => {
    return fetchAPI(`/orders/${id}`);
  },

  // Lấy danh sách đơn của user hiện tại
  getMyOrders: async () => {
    // Lưu ý: Tốt nhất Backend nên tự lấy userId từ Token.
    // Cách này là fallback nếu backend yêu cầu userId trên query params.
    const user = AuthAPI.getCurrentUser();
    if (!user) throw new Error("Vui lòng đăng nhập để xem đơn hàng");
    return fetchAPI(`/orders?userId=${user._id}`);
  },

  // Lịch sử đơn hàng (Phân trang)
  getHistory: async (userId, page = 1) => {
    return fetchAPI(`/orders/history?userId=${userId}&page=${page}`);
  },

  // Timeline trạng thái đơn hàng
  getTimeline: async (orderId) => {
    return fetchAPI(`/orders/${orderId}/timeline`);
  },

  // Hủy đơn hàng
  cancel: async (orderId, reason) => {
    const user = AuthAPI.getCurrentUser();
    return fetchAPI(`/orders/${orderId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason, userId: user?._id }),
    });
  },

  // [ADMIN] Cập nhật trạng thái
  updateStatus: async (id, status) => {
    return fetchAPI(`/orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  },
};

// ============================================================
// 5. CART API (Local Storage Logic)
// ============================================================

const CartAPI = {
  getLocal: () => {
    try {
      return JSON.parse(localStorage.getItem("cart")) || [];
    } catch {
      return [];
    }
  },

  saveLocal: (cart) => {
    localStorage.setItem("cart", JSON.stringify(cart));
    // Có thể bắn custom event để update UI header realtime
    window.dispatchEvent(new Event("cart-updated"));
  },

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

  updateQuantity: (productId, quantity) => {
    const cart = CartAPI.getLocal();
    const item = cart.find((item) => item.productId === productId);

    if (item) {
      item.quantity = Number(quantity); // Đảm bảo là số
      CartAPI.saveLocal(cart);
    }
    return cart;
  },

  removeItem: (productId) => {
    let cart = CartAPI.getLocal();
    cart = cart.filter((item) => item.productId !== productId);
    CartAPI.saveLocal(cart);
    return cart;
  },

  clear: () => {
    localStorage.removeItem("cart");
    window.dispatchEvent(new Event("cart-updated"));
  },

  getCount: () => {
    const cart = CartAPI.getLocal();
    return cart.reduce((total, item) => total + item.quantity, 0);
  },
};

// ============================================================
// 6. PAYMENT & SHIPPING API
// ============================================================

const PaymentAPI = {
  getMethods: async () => {
    return fetchAPI("/payment/methods");
  },

  process: async (orderId, paymentMethod) => {
    return fetchAPI("/payment/process", {
      method: "POST",
      body: JSON.stringify({ orderId, paymentMethod }),
    });
  },

  getStatus: async (orderId) => {
    return fetchAPI(`/payment/status/${orderId}`);
  },
};

const ShippingAPI = {
  calculateFee: async (address, weight) => {
    return fetchAPI("/shipping/calculate", {
      method: "POST",
      body: JSON.stringify({ address, weight }),
    });
  },

  tracking: async (orderId) => {
    return fetchAPI(`/shipping/tracking/${orderId}`);
  },
};

// ============================================================
// 7. EXPORT TO GLOBAL SCOPE
// ============================================================

// Gom tất cả vào một object duy nhất để tránh ghi đè
window.API = {
  Auth: AuthAPI,
  Product: ProductAPI,
  Order: OrderAPI, // Bao gồm cả tính năng Enhanced
  Cart: CartAPI,
  Payment: PaymentAPI,
  Shipping: ShippingAPI,
};

console.log("API Module Loaded Successfully");
