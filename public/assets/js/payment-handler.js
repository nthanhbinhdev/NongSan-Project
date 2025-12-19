// ============================================================
// public/assets/js/payment-handler.js - XỬ LÝ THANH TOÁN
// ============================================================

// Load thông tin giỏ hàng và hiển thị tổng tiền
function loadPaymentSummary() {
  const cart = API.Cart.getLocal();
  const totalElement = document.getElementById("totalProductPrice");
  const shipFeeElement = document.getElementById("shipFee");
  const totalPaymentElement = document.getElementById("totalPayment");

  if (!cart || cart.length === 0) {
    alert("Giỏ hàng trống! Vui lòng thêm sản phẩm trước khi thanh toán.");
    window.location.href = "/product.html";
    return;
  }

  // Tính tổng tiền sản phẩm
  let totalAmount = 0;
  cart.forEach((item) => {
    // Giả sử mỗi item có { productId, quantity }
    // Cần fetch thông tin sản phẩm để tính giá
    // Để đơn giản, ta lấy từ sessionStorage nếu đã tính trước
    const itemTotal = parseFloat(
      sessionStorage.getItem(`item_${item.productId}_total`) || 0
    );
    totalAmount += itemTotal * item.quantity;
  });

  const shippingFee = 20000;
  const finalAmount = totalAmount + shippingFee;

  // Hiển thị
  if (totalElement) {
    totalElement.textContent = formatPrice(totalAmount) + " VNĐ";
  }
  if (shipFeeElement) {
    shipFeeElement.textContent = formatPrice(shippingFee) + " VNĐ";
  }
  if (totalPaymentElement) {
    totalPaymentElement.innerHTML = `<p class="current-price">${formatPrice(
      finalAmount
    )} VNĐ</p>`;
  }

  // Lưu vào sessionStorage để dùng khi submit
  sessionStorage.setItem("finalAmount", finalAmount);
  sessionStorage.setItem("totalAmount", totalAmount);
  sessionStorage.setItem("shippingFee", shippingFee);
}

// Xử lý submit form thanh toán
async function handlePaymentSubmit(event) {
  event.preventDefault();

  // Lấy thông tin từ form
  const name = document.getElementById("name").value.trim();
  const tel = document.getElementById("tel").value.trim();
  const email = document.getElementById("email").value.trim();
  const address = document.getElementById("place").value.trim();
  const note = document.getElementById("note")?.value.trim() || "";

  // Validate
  if (!name || !tel || !address) {
    alert("Vui lòng điền đầy đủ thông tin giao hàng!");
    return;
  }

  // Validate số điện thoại
  const phoneRegex = /^(0|\+84)[0-9]{9}$/;
  if (!phoneRegex.test(tel)) {
    alert("Số điện thoại không hợp lệ! Vui lòng nhập đúng định dạng.");
    return;
  }

  // Validate email (nếu có)
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Email không hợp lệ!");
      return;
    }
  }

  // Lấy giỏ hàng
  const cart = API.Cart.getLocal();
  if (!cart || cart.length === 0) {
    alert("Giỏ hàng trống!");
    return;
  }

  // Lấy thông tin user (nếu đã đăng nhập)
  const user = API.Auth.getCurrentUser();

  // Chuẩn bị dữ liệu đơn hàng
  const orderData = {
    customer: {
      userId: user?._id || null,
      name: name,
      email: email,
      phone: tel,
      address: address,
    },
    items: cart.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    })),
    note: note,
    paymentMethod: "cod", // Mặc định là COD
  };

  try {
    // Hiển thị loading
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Đang xử lý...";

    // Gọi API tạo đơn hàng
    const response = await API.Order.create(orderData);

    if (response.success) {
      // Xóa giỏ hàng
      API.Cart.clear();
      sessionStorage.clear();

      // Thông báo thành công
      alert(
        "🎉 Đặt hàng thành công!\n\nMã đơn hàng: " +
          response.data.orderNumber +
          "\n\nChúng tôi sẽ liên hệ với bạn sớm nhất!"
      );

      // Chuyển về trang chủ
      window.location.href = "/index.html";
    } else {
      throw new Error(response.message || "Có lỗi xảy ra");
    }
  } catch (error) {
    console.error("Lỗi đặt hàng:", error);
    alert("❌ Đặt hàng thất bại: " + error.message + "\n\nVui lòng thử lại!");

    // Reset button
    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.disabled = false;
    submitBtn.textContent = "Xác nhận đặt hàng";
  }
}

// Áp dụng mã giảm giá (nếu có)
function applyDiscount() {
  const discountCode = document.getElementById("code").value.trim();
  const validCodes = {
    NONGSANVIET: 0.1, // Giảm 10%
    GIAMGIA50K: 50000, // Giảm 50k
  };

  const totalAmount = parseFloat(sessionStorage.getItem("totalAmount")) || 0;
  const shippingFee = parseFloat(sessionStorage.getItem("shippingFee")) || 0;
  let discount = 0;

  if (validCodes[discountCode]) {
    const discountValue = validCodes[discountCode];

    if (discountValue < 1) {
      // Giảm theo %
      discount = totalAmount * discountValue;
    } else {
      // Giảm cố định
      discount = discountValue;
    }

    const finalAmount = totalAmount + shippingFee - discount;

    document.getElementById("totalPayment").innerHTML = `
      <div class="cost-container">
        <p class="cost">${formatPrice(totalAmount + shippingFee)}đ</p>
        <p class="discount">-${formatPrice(discount)}đ</p>
      </div>
      <p class="current-price">${formatPrice(finalAmount)} VNĐ</p>
    `;

    alert(
      "✅ Áp dụng mã giảm giá thành công! Giảm " + formatPrice(discount) + "đ"
    );
  } else {
    alert("❌ Mã giảm giá không hợp lệ!");
  }
}

// Format số tiền
function formatPrice(number) {
  return new Intl.NumberFormat("vi-VN").format(Math.round(number));
}

// Khởi tạo khi trang load
document.addEventListener("DOMContentLoaded", () => {
  // Load thông tin thanh toán
  loadPaymentSummary();

  // Gắn sự kiện submit
  const paymentForm = document.querySelector("#payment-form");
  if (paymentForm) {
    paymentForm.addEventListener("submit", handlePaymentSubmit);
  }

  // Gắn sự kiện áp dụng mã giảm giá
  const applyBtn = document.getElementById("apply-discount-btn");
  if (applyBtn) {
    applyBtn.addEventListener("click", applyDiscount);
  }
});

// Export để dùng ở các file khác
window.PaymentHandler = {
  loadPaymentSummary,
  handlePaymentSubmit,
  applyDiscount,
};
