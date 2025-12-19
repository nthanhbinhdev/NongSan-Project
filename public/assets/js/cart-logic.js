// ============================================================
// LOGIC XỬ LÝ GIỎ HÀNG
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Trang Cart đã load, bắt đầu gọi hàm loadCart()...");
  await loadCart();
});

// Hàm chính: Tải và hiển thị giỏ hàng
async function loadCart() {
  const container = document.querySelector(".cart-container");
  if (!container) {
    console.error("❌ Không tìm thấy class .cart-container trong HTML!");
    return;
  }

  // 1. Lấy dữ liệu từ LocalStorage
  // Lưu ý: Logic này đang ưu tiên lấy LocalStorage để test giao diện trước
  // Khi Backend ổn định, ông có thể đổi thành: const cartItems = await API.Cart.get();
  let cartItems = JSON.parse(localStorage.getItem("cart")) || [];

  console.log("📦 Dữ liệu giỏ hàng thô:", cartItems);

  // 2. Check giỏ trống
  if (cartItems.length === 0) {
    renderEmptyCart(container);
    return;
  }

  // Hiển thị loading
  container.innerHTML = `
        <div class="text-center my-5">
            <div class="spinner-border text-success" role="status"></div>
            <p class="mt-2 text-secondary">Đang tải thông tin sản phẩm...</p>
        </div>
    `;

  try {
    // 3. Lấy thông tin chi tiết từng sản phẩm từ API (Map qua từng ID để lấy ảnh, tên, giá)
    const cartDetails = await Promise.all(
      cartItems.map(async (item) => {
        try {
          // Gọi API lấy thông tin sản phẩm theo ID
          const response = await API.Product.getById(item.productId);

          // API thường trả về dạng { data: {...} } hoặc trực tiếp {...} tuỳ backend
          const productData = response.data || response;

          if (!productData) return null;

          return {
            ...productData,
            qtyInCart: item.quantity,
          };
        } catch (err) {
          console.warn(`⚠️ Lỗi load sản phẩm ID ${item.productId}:`, err);
          return null; // Bỏ qua sản phẩm lỗi
        }
      })
    );

    // Lọc bỏ sản phẩm lỗi (null)
    const validItems = cartDetails.filter((item) => item !== null);

    if (validItems.length === 0) {
      container.innerHTML =
        '<div class="alert alert-warning text-center">Có sản phẩm trong giỏ nhưng không tải được thông tin (Lỗi API hoặc ID sai).</div>';
      return;
    }

    // 4. Vẽ bảng ra màn hình
    renderCartTable(validItems, container);
    console.log("✅ Đã render giỏ hàng thành công!");
  } catch (error) {
    console.error("❌ Lỗi loadCart:", error);
    container.innerHTML = `<div class="alert alert-danger text-center">Có lỗi xảy ra: ${error.message}</div>`;
  }
}

// Hàm render giao diện khi giỏ hàng trống
function renderEmptyCart(container) {
  container.innerHTML = `
        <div class="text-center my-5">
            <i class="ti-shopping-cart" style="font-size: 4rem; color: #ccc;"></i>
            <h4 class="mt-3">Giỏ hàng của bạn đang trống</h4>
            <p class="text-secondary">Hãy chọn thêm sản phẩm để mua sắm nhé!</p>
            <a href="product.html" class="btn btn-success mt-2">Tiếp tục mua sắm</a>
        </div>
    `;
}

// Hàm render bảng danh sách sản phẩm
function renderCartTable(items, container) {
  let totalBill = 0;

  // Header bảng
  let html = `
        <h3 class="text-center text-success mb-4 mt-4" style="font-weight: 700;">GIỎ HÀNG CỦA BẠN</h3>
        <div class="table-responsive shadow-sm p-3 mb-5 bg-body rounded">
            <table class="table table-hover align-middle text-center">
                <thead class="table-success">
                    <tr>
                        <th scope="col">Hình ảnh</th>
                        <th scope="col">Tên sản phẩm</th>
                        <th scope="col">Đơn giá</th>
                        <th scope="col">Số lượng</th>
                        <th scope="col">Thành tiền</th>
                        <th scope="col">Xóa</th>
                    </tr>
                </thead>
                <tbody>
    `;

  // Body bảng
  items.forEach((item) => {
    const price = item.price || 0;
    const total = price * item.qtyInCart;
    totalBill += total;

    html += `
            <tr>
                <td style="width: 15%;">
                    <img src="${
                      item.image || "img/no-image.jpg"
                    }" class="img-thumbnail border-0" style="max-height: 80px;" alt="${
      item.name
    }">
                </td>
                <td class="fw-bold text-start">${item.name}</td>
                <td>${formatMoney(price)}đ</td>
                <td>
                    <div class="input-group input-group-sm justify-content-center" style="width: 120px; margin: 0 auto;">
                        <button class="btn btn-outline-secondary" onclick="updateQty('${
                          item._id
                        }', ${item.qtyInCart - 1})">-</button>
                        <input type="text" class="form-control text-center" value="${
                          item.qtyInCart
                        }" readonly>
                        <button class="btn btn-outline-secondary" onclick="updateQty('${
                          item._id
                        }', ${item.qtyInCart + 1})">+</button>
                    </div>
                </td>
                <td class="text-success fw-bold">${formatMoney(total)}đ</td>
                <td>
                    <button class="btn btn-light text-danger" onclick="removeItem('${
                      item._id
                    }')" title="Xóa sản phẩm">
                        <i class="ti-trash"></i>
                    </button>
                </td>
            </tr>
        `;
  });

  // Footer bảng và nút thanh toán
  html += `
                </tbody>
            </table>
        </div>

        <div class="row justify-content-end mb-5">
            <div class="col-md-4">
                <div class="card border-success">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h5 class="card-title mb-0">Tổng tiền thanh toán:</h5>
                            <h4 class="text-danger fw-bold mb-0">${formatMoney(
                              totalBill
                            )}đ</h4>
                        </div>
                        <p class="text-muted small">Phí vận chuyển sẽ được tính khi thanh toán.</p>
                        <button class="btn btn-success w-100 py-2 fw-bold text-uppercase" onclick="window.location.href='checkout.html'">
                            Tiến hành đặt hàng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

  container.innerHTML = html;
}

// --- CÁC HÀM XỬ LÝ SỰ KIỆN (Gắn vào window để HTML gọi được) ---

// 1. Format tiền tệ
function formatMoney(amount) {
  return new Intl.NumberFormat("vi-VN").format(amount);
}

// 2. Cập nhật số lượng
window.updateQty = async function (productId, newQty) {
  if (newQty < 1) return; // Không cho giảm dưới 1

  // Tính toán độ chênh lệch để gọi API addItem (hoặc dùng updateQuantity nếu API hỗ trợ)
  const currentQty = getCurrentQty(productId);
  const diff = newQty - currentQty;

  if (diff !== 0) {
    // Cập nhật LocalStorage / API
    await API.Cart.addItem(productId, diff);

    // Load lại giỏ hàng để cập nhật giao diện và giá tiền
    await loadCart();

    // Cập nhật số trên icon giỏ hàng (nếu header có hàm này)
    if (typeof updateCartCount === "function") updateCartCount();
  }
};

// 3. Xóa sản phẩm
window.removeItem = async function (productId) {
  if (confirm("Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?")) {
    API.Cart.removeItem(productId);
    await loadCart();

    if (typeof updateCartCount === "function") updateCartCount();
  }
};

// Helper: Lấy số lượng hiện tại từ LocalStorage
function getCurrentQty(productId) {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const item = cart.find((i) => i.productId === productId);
  return item ? item.quantity : 1;
}
