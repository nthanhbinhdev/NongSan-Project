// ============================================================
// public/assets/js/main.js - REFACTORED & FIXED
// ============================================================

// ===== GLOBAL STATE =====
let allProducts = [];

// ===== INIT: Load Products from API =====
async function initProducts() {
  try {
    const response = await fetch("/api/products?limit=100");
    const result = await response.json();

    if (Array.isArray(result)) {
      // Trường hợp 1: Server trả về nguyên mảng sản phẩm
      allProducts = result;
      console.log("✅ Load được (dạng mảng):", allProducts.length);
    } else if (result.success && Array.isArray(result.data)) {
      // Trường hợp 2: Server trả về object chuẩn { success: true, data: [] }
      allProducts = result.data;
      console.log("✅ Load được (dạng chuẩn):", allProducts.length);
    } else {
      // Trường hợp lỗi
      console.error(
        "❌ API Error:",
        result.message || "Format lạ quá Bình ơi!"
      );
      showError("Không thể tải sản phẩm");
    }
  } catch (error) {
    console.error("❌ Fetch Error:", error);
    showError("Lỗi kết nối server");
  }
}

// ===== SEARCH PRODUCTS =====
async function searchProduct(keyWord = "") {
  const searchInput = document.getElementById("searchInput");
  const productList = document.getElementById("productList");

  if (!productList) return;

  let searchResults = allProducts;

  // Search by ID array
  if (Array.isArray(keyWord)) {
    searchResults = allProducts.filter((p) => keyWord.includes(p.id));
  }
  // Search by category
  else if (keyWord) {
    const normalized = removeDiacritics(keyWord.toLowerCase());
    searchResults = allProducts.filter((product) =>
      removeDiacritics(product.category.toLowerCase()).includes(normalized)
    );
  }
  // Search by input
  else if (searchInput && searchInput.value) {
    const keyword = removeDiacritics(searchInput.value.toLowerCase());
    searchResults = allProducts.filter(
      (product) =>
        removeDiacritics(product.name.toLowerCase()).includes(keyword) ||
        removeDiacritics(product.category.toLowerCase()).includes(keyword)
    );
  }

  displayProducts(searchResults, productList);
}

// ===== DISPLAY PRODUCTS =====
function displayProducts(products, container) {
  if (!container) return;

  container.innerHTML = "";

  if (products.length === 0) {
    container.innerHTML =
      '<p class="text-center w-100">Không tìm thấy sản phẩm phù hợp.</p>';
    return;
  }

  products.forEach((product) => {
    const priceAfterDiscount = product.price * (1 - product.discount);
    const priceContainer = createPriceContainer(
      product.price,
      product.discount
    );
    const ratingContainer = createRatingContainer(product.rating);

    const productHtml = `
      <div class="col-3 mb-3" style="margin-top:20px;">
        <div class="card mt-3" style="margin-left: 30px; cursor: pointer;" 
             onclick="searchProductDetail('${product._id}')">
          <img src="${product.image}" alt="${product.name}">
          <div class="card-body">
            <h5 class="card-title" style="margin-bottom: 0px">${product.name}</h5>
            ${priceContainer}
            ${ratingContainer}
            <button class="btn btn-success" onclick="addToCart('${product._id}', event)">
              Thêm vào giỏ hàng
            </button>
          </div>
        </div>
      </div>
    `;

    container.innerHTML += productHtml;
  });
}

// ===== HELPER: Remove diacritics =====
function removeDiacritics(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// ===== HELPER: Check Enter Key =====
function checkEnterKey(event) {
  if (event.code === "Enter") {
    searchProduct();
  }
}

// ===== HELPER: Format Price =====
function formatPrice(number) {
  return new Intl.NumberFormat("vi-VN").format(Math.round(number));
}

// ===== HELPER: Create Price Container =====
function createPriceContainer(price, discount) {
  const priceAfterDiscount = price * (1 - discount);

  if (discount > 0) {
    return `
      <div class="cost-container">
        <p class="card-text cost">${formatPrice(price)}đ</p>
        <p class="discount">-${Math.round(discount * 100)}%</p>
      </div>
      <div>
        <p class="current-price">${formatPrice(priceAfterDiscount)}đ</p>
      </div>
    `;
  }

  return `
    <div class="cost-container">
      <p class="card-text cost"></p>
    </div>
    <div>
      <p class="current-price">${formatPrice(price)}đ</p>
    </div>
  `;
}

// ===== HELPER: Create Rating Container =====
function createRatingContainer(rating) {
  const ratingNumber = parseFloat(rating.split("/")[0]) || 0;
  let stars = "";

  for (let i = 1; i <= 5; i++) {
    if (i <= ratingNumber) {
      stars += '<i class="fa fa-star"></i>';
    } else if (i - ratingNumber < 1) {
      stars += '<i class="fa fa-star-half-o"></i>';
    } else {
      stars += '<i class="fa fa-star-o"></i>';
    }
  }

  return `
    <div class="product-rating">
      ${stars}
      <span>${ratingNumber}</span>
    </div>
  `;
}

// ===== NAVIGATION =====
function searchProductDetail(productId) {
  window.location.href = `product-detail.html?id=${productId}`;
}

function searchProductsByCategory(category) {
  window.location.href = `product.html?category=${encodeURIComponent(
    category
  )}`;
}

// ===== CART FUNCTIONS =====
function addToCart(productId, event) {
  if (event) {
    event.stopPropagation();
  }

  const quantity = document.getElementById("quality")?.value || 1;

  if (window.API && window.API.Cart) {
    window.API.Cart.addItem(productId, Number(quantity));
    alert("✅ Đã thêm sản phẩm vào giỏ hàng!");
    updateCartCount();
  } else {
    console.error("API.Cart not found");
  }
}

function updateCartCount() {
  if (window.API && window.API.Cart) {
    const count = window.API.Cart.getCount();
    const badge = document.getElementById("cart-count");
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? "inline" : "none";
    }
  }
}

// ===== PRODUCT DETAIL =====
async function loadProductDetail(productId) {
  try {
    const response = await fetch(`/api/products/${productId}`);
    const result = await response.json();

    if (result.success) {
      displayProductDetail(result.data);
    } else {
      showError("Không tìm thấy sản phẩm");
    }
  } catch (error) {
    console.error("Error loading product detail:", error);
    showError("Lỗi tải thông tin sản phẩm");
  }
}

function displayProductDetail(product) {
  const container = document.querySelector(".product-main");
  if (!container) return;

  const priceAfterDiscount = product.price * (1 - product.discount);
  const images =
    product.images && product.images.length > 0
      ? product.images
      : [product.image, product.image, product.image, product.image];

  const html = `
    <div class="card-wrapper">
      <div class="card">
        <div class="product-imgs">
          <div class="img-display">
            <div class="img-showcase">
              ${images
                .map((img) => `<img src="${img}" alt="${product.name}">`)
                .join("")}
            </div>
          </div>
          <div class="img-select">
            ${images
              .map(
                (img, index) => `
              <div class="img-item" onclick="slideImage(${index + 1})">
                <img src="${img}" alt="">
              </div>
            `
              )
              .join("")}
          </div>
        </div>

        <div class="product-content">
          <h2 class="product-detail-title">${product.name}</h2>
          ${createRatingContainer(product.rating)}
          
          <div class="product-price">
            ${createPriceContainer(product.price, product.discount)}
          </div>

          <div class="purchase-info">
            <input type="number" min="1" value="1" id="quality">
            <button type="button" class="buttn" onclick="addToCart('${
              product._id
            }')">
              Thêm vào giỏ <i class="fa fa-shopping-cart"></i>
            </button>
          </div>

          <div class="product-detail">
            <h2>Về sản phẩm:</h2>
            <p>${
              product.descriptionDetail ||
              product.description ||
              "Đang cập nhật..."
            }</p>
            <ul>
              <li>Trạng Thái: <span>${
                product.inStock ? "Còn hàng" : "Hết hàng"
              }</span></li>
              <li>Đơn vị: <span>${product.unit || "kg"}</span></li>
              ${
                product.origin
                  ? `<li>Nguồn gốc: <span>${product.origin}</span></li>`
                  : ""
              }
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

function slideImage(index) {
  const displayWidth = document.querySelector(".img-showcase img").clientWidth;
  document.querySelector(".img-showcase").style.transform = `translateX(-${
    (index - 1) * displayWidth
  }px)`;
}

// ===== CART PAGE =====
function loadCart() {
  const container = document.querySelector(".cart-container");
  if (!container) return;

  if (!window.API || !window.API.Cart) {
    console.error("API.Cart not found");
    return;
  }

  const cart = window.API.Cart.getLocal();

  if (!cart || cart.length === 0) {
    container.innerHTML = `
      <div class="text-center">
        <span style="font-size: 24px">Bạn chưa có sản phẩm trong giỏ hàng</span>
      </div>
      <div class="d-flex justify-content-between mt-3">
        <a href="product.html" class="btn btn-success buy-extra">Mua thêm sản phẩm</a>
      </div>
    `;
    return;
  }

  // Load cart items with product details
  loadCartItems(cart, container);
}

async function loadCartItems(cart, container) {
  let html = `
    <table class="table" id="cart">
      <thead>
        <tr>
          <th class="col-2">Tên</th>
          <th class="col-1">Loại</th>
          <th class="col-1">Hình ảnh</th>
          <th class="col-1">Đơn giá</th>
          <th class="col-1">Số lượng</th>
          <th class="col-1">Thành tiền</th>
          <th class="col-1"></th>
        </tr>
      </thead>
      <tbody>
  `;

  let total = 0;

  for (const item of cart) {
    try {
      const response = await fetch(`/api/products/${item.productId}`);
      const result = await response.json();

      if (result.success) {
        const product = result.data;
        const price = product.price * (1 - product.discount);
        const subtotal = price * item.quantity;
        total += subtotal;

        html += `
          <tr>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td><img src="${product.image}" alt="${product.name}"></td>
            <td>${formatPrice(price)} VNĐ</td>
            <td>${item.quantity}</td>
            <td>${formatPrice(subtotal)} VNĐ</td>
            <td>
              <button class="btn btn-danger" onclick="removeCartItem('${
                item.productId
              }')">
                Xóa
              </button>
            </td>
          </tr>
        `;
      }
    } catch (error) {
      console.error("Error loading product:", error);
    }
  }

  html += `
      </tbody>
    </table>
    <div style="margin-top: 50px">
      <b style="text-align: right; font-size: larger;">
        <p id="total">Tổng tiền: ${formatPrice(total)} VNĐ</p>
      </b>
      <div class="d-flex justify-content-between">
        <a href="product.html" class="btn btn-secondary buy-extra">Mua thêm sản phẩm</a>
        <a href="payment.html" class="btn btn-success">Thanh toán</a>
      </div>
    </div>
  `;

  container.innerHTML = html;
  sessionStorage.setItem("total", total);
}

function removeCartItem(productId) {
  if (window.API && window.API.Cart) {
    window.API.Cart.removeItem(productId);
    loadCart();
  }
}

// ===== PAYMENT PAGE =====
function loadTotal() {
  const total = parseFloat(sessionStorage.getItem("total")) || 0;
  const shipFee = 20000;

  const totalElement = document.getElementById("totalProductPrice");
  const shipElement = document.getElementById("shipFee");
  const totalPaymentElement = document.getElementById("totalPayment");

  if (totalElement) totalElement.textContent = formatPrice(total) + " VNĐ";
  if (shipElement) shipElement.textContent = formatPrice(shipFee) + " VNĐ";
  if (totalPaymentElement) {
    totalPaymentElement.innerHTML = createPriceContainer(total + shipFee, 0);
  }

  sessionStorage.setItem("shipFee", shipFee);
}

function applyDiscount() {
  const discountCode = "anhhieudeptrai";
  const codeValue = document.getElementById("code").value;
  const total = parseFloat(sessionStorage.getItem("total")) || 0;
  const shipFee = parseFloat(sessionStorage.getItem("shipFee")) || 0;
  const totalPayment = total + shipFee;

  if (codeValue === discountCode) {
    document.getElementById("totalPayment").innerHTML = createPriceContainer(
      totalPayment,
      0.5
    );
    alert("✅ Áp dụng mã giảm giá thành công!");
  } else {
    document.getElementById("totalPayment").innerHTML = createPriceContainer(
      totalPayment,
      0
    );
    alert("❌ Mã giảm giá không hợp lệ");
  }
}

// ===== ERROR HANDLING =====
function showError(message) {
  const container = document.getElementById("productList");
  if (container) {
    container.innerHTML = `
      <div class="alert alert-danger text-center w-100">
        ${message}
      </div>
    `;
  }
}

// ===== INITIALIZE =====
document.addEventListener("DOMContentLoaded", async () => {
  await initProducts();
  updateCartCount();
});
