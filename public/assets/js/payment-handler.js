let paymentMethods = [];
let selectedPaymentMethod = "cod";

async function loadPaymentMethods() {
  try {
    const response = await API.Payment.getMethods();
    if (response.success) {
      paymentMethods = response.data;
      renderPaymentMethods();
    }
  } catch (error) {
    console.error("Error loading payment methods:", error);
  }
}

function renderPaymentMethods() {
  const container = document.getElementById("payment-methods-container");
  if (!container) return;

  let html = '<div class="payment-methods">';

  paymentMethods.forEach((method) => {
    if (!method.enabled) return;

    html += `
      <div class="payment-method-card ${
        selectedPaymentMethod === method.id ? "selected" : ""
      }" 
           onclick="selectPaymentMethod('${method.id}')">
        <div class="payment-icon">${method.icon}</div>
        <div class="payment-info">
          <h4>${method.name}</h4>
          <p>${method.description}</p>
          ${
            method.fee > 0
              ? `<span class="fee">Phí: ${formatPrice(method.fee)}đ</span>`
              : ""
          }
        </div>
        <input type="radio" name="payment_method" value="${method.id}" 
               ${selectedPaymentMethod === method.id ? "checked" : ""}>
      </div>
    `;

    if (method.id === "bank_transfer" && method.bankInfo) {
      html += `
        <div class="bank-info ${
          selectedPaymentMethod === method.id ? "show" : ""
        }" 
             id="bank-info-${method.id}">
          <h5>Thông tin chuyển khoản:</h5>
          <div class="bank-details">
            <p><strong>Ngân hàng:</strong> ${method.bankInfo.bankName}</p>
            <p><strong>Số tài khoản:</strong> ${
              method.bankInfo.accountNumber
            }</p>
            <p><strong>Chủ tài khoản:</strong> ${
              method.bankInfo.accountName
            }</p>
            <p class="note">Vui lòng chuyển khoản với nội dung: <strong>THANHTOAN [Mã đơn hàng]</strong></p>
          </div>
        </div>
      `;
    }
  });

  html += "</div>";
  container.innerHTML = html;
}

function selectPaymentMethod(methodId) {
  selectedPaymentMethod = methodId;

  document.querySelectorAll(".payment-method-card").forEach((card) => {
    card.classList.remove("selected");
  });

  event.currentTarget.classList.add("selected");

  document.querySelectorAll(".bank-info").forEach((info) => {
    info.classList.remove("show");
  });

  const bankInfo = document.getElementById(`bank-info-${methodId}`);
  if (bankInfo) {
    bankInfo.classList.add("show");
  }
}

async function loadPaymentSummary() {
  const cart = API.Cart.getLocal();
  const totalElement = document.getElementById("totalProductPrice");
  const shipFeeElement = document.getElementById("shipFee");
  const totalPaymentElement = document.getElementById("totalPayment");

  if (!cart || cart.length === 0) {
    alert("Giỏ hàng trống! Vui lòng thêm sản phẩm trước khi thanh toán.");
    window.location.href = "/product.html";
    return;
  }

  try {
    let totalAmount = 0;
    const items = [];

    for (const item of cart) {
      const response = await API.Product.getById(item.productId);
      if (response.success) {
        const product = response.data;
        const price = product.price * (1 - product.discount);
        const subtotal = price * item.quantity;
        totalAmount += subtotal;

        items.push({
          productId: item.productId,
          quantity: item.quantity,
          weight: product.weight || 0.5,
        });
      }
    }

    const address = document.getElementById("place")?.value || "";
    const shippingResponse = await API.Shipping.calculateFee(address, 1, items);

    const shippingFee = shippingResponse.success
      ? shippingResponse.data.totalShippingFee
      : 20000;

    const finalAmount = totalAmount + shippingFee;

    if (totalElement) totalElement.textContent = formatPrice(totalAmount) + "đ";
    if (shipFeeElement)
      shipFeeElement.textContent = formatPrice(shippingFee) + "đ";
    if (totalPaymentElement) {
      totalPaymentElement.innerHTML = `<p class="current-price">${formatPrice(
        finalAmount
      )}đ</p>`;
    }

    sessionStorage.setItem("finalAmount", finalAmount);
    sessionStorage.setItem("totalAmount", totalAmount);
    sessionStorage.setItem("shippingFee", shippingFee);
  } catch (error) {
    console.error("Error loading payment summary:", error);
  }
}

async function handlePaymentSubmit(event) {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const tel = document.getElementById("tel").value.trim();
  const email = document.getElementById("email")?.value.trim() || "";
  const address = document.getElementById("place").value.trim();
  const note = document.getElementById("note")?.value.trim() || "";

  if (!name || !tel || !address) {
    alert("Vui lòng điền đầy đủ thông tin giao hàng!");
    return;
  }

  const phoneRegex = /^(0|\+84)[0-9]{9}$/;
  if (!phoneRegex.test(tel)) {
    alert("Số điện thoại không hợp lệ!");
    return;
  }

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Email không hợp lệ!");
      return;
    }
  }

  const cart = API.Cart.getLocal();
  if (!cart || cart.length === 0) {
    alert("Giỏ hàng trống!");
    return;
  }

  const user = API.Auth.getCurrentUser();

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
    paymentMethod: selectedPaymentMethod,
  };

  try {
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Đang xử lý...";

    const response = await API.Order.create(orderData);

    if (response.success) {
      const order = response.data;

      if (selectedPaymentMethod !== "cod") {
        const paymentResponse = await API.Payment.process(
          order._id,
          selectedPaymentMethod
        );

        if (paymentResponse.success) {
          if (paymentResponse.data.payment.paymentUrl) {
            alert("Chuyển đến trang thanh toán...");
            window.location.href = paymentResponse.data.payment.paymentUrl;
            return;
          }
        }
      }

      API.Cart.clear();
      sessionStorage.clear();

      alert(
        `Đặt hàng thành công!\n\nMã đơn hàng: ${order.orderNumber}\n\nChúng tôi sẽ liên hệ với bạn sớm nhất!`
      );

      window.location.href = "/index.html";
    } else {
      throw new Error(response.message || "Có lỗi xảy ra");
    }
  } catch (error) {
    console.error("Error submitting payment:", error);
    alert("Đặt hàng thất bại: " + error.message + "\n\nVui lòng thử lại!");

    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.disabled = false;
    submitBtn.textContent = "Xác nhận đặt hàng";
  }
}

function applyDiscount() {
  const discountCode = document.getElementById("code")?.value.trim();
  const validCodes = {
    NONGSANVIET: 0.1,
    GIAMGIA50K: 50000,
    WELCOME2024: 0.15,
  };

  const totalAmount = parseFloat(sessionStorage.getItem("totalAmount")) || 0;
  const shippingFee = parseFloat(sessionStorage.getItem("shippingFee")) || 0;
  let discount = 0;

  if (validCodes[discountCode]) {
    const discountValue = validCodes[discountCode];

    if (discountValue < 1) {
      discount = totalAmount * discountValue;
    } else {
      discount = discountValue;
    }

    const finalAmount = totalAmount + shippingFee - discount;

    document.getElementById("totalPayment").innerHTML = `
      <div class="cost-container">
        <p class="cost">${formatPrice(totalAmount + shippingFee)}đ</p>
        <p class="discount">-${formatPrice(discount)}đ</p>
      </div>
      <p class="current-price">${formatPrice(finalAmount)}đ</p>
    `;

    sessionStorage.setItem("discount", discount);
    sessionStorage.setItem("finalAmount", finalAmount);

    alert(
      "Áp dụng mã giảm giá thành công! Giảm " + formatPrice(discount) + "đ"
    );
  } else {
    alert("Mã giảm giá không hợp lệ!");
  }
}

function formatPrice(number) {
  return new Intl.NumberFormat("vi-VN").format(Math.round(number));
}

document.addEventListener("DOMContentLoaded", () => {
  loadPaymentMethods();
  loadPaymentSummary();

  const paymentForm = document.querySelector("#payment-form");
  if (paymentForm) {
    paymentForm.addEventListener("submit", handlePaymentSubmit);
  }

  const applyBtn = document.getElementById("apply-discount-btn");
  if (applyBtn) {
    applyBtn.addEventListener("click", applyDiscount);
  }

  const addressInput = document.getElementById("place");
  if (addressInput) {
    addressInput.addEventListener("blur", loadPaymentSummary);
  }
});

window.PaymentHandler = {
  loadPaymentSummary,
  handlePaymentSubmit,
  applyDiscount,
  selectPaymentMethod,
};
