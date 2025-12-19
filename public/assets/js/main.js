// ============================================================
// public/assets/js/main.js - FIXED VERSION
// ============================================================

const BASE_URL = window.location.hostname === "localhost" 
  ? "http://localhost:3000" 
  : ""; // Production dùng relative URL

let allProducts = [];

// ===== INIT: Load sản phẩm từ API =====
async function initProducts() {
  try {
    const response = await fetch(`${BASE_URL}/api/products?limit=100`);
    const contentType = response.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server không trả về JSON");
    }

    const result = await response.json();
    allProducts = Array.isArray(result) ? result : result.data || [];

    console.log(`✅ Đã load ${allProducts.length} sản phẩm`);

    // Hiển thị sản phẩm nổi bật ở trang chủ
    const homeContainer = document.getElementById("productList");
    if (homeContainer) {
      const featured = allProducts.filter((p) => p.featured).slice(0, 8);
      const toShow = featured.length > 0 ? featured : allProducts.slice(0, 8);
      displayProducts(toShow, homeContainer);
    }
  } catch (error) {
    console.error("❌ Lỗi load sản phẩm:", error);
    showError("Không thể kết nối server Backend (Chạy 'node server.js')");
  }
}

// ===== SEARCH: Tìm kiếm sản phẩm =====
async function searchProduct(keyWord = "") {
  const searchInput = document.getElementById("searchInput");
  const productList = document.getElementById("productList");

  if (!productList) return;

  try {
    let url = `${BASE_URL}/api/products?limit=100`;

    // Case 1: Search theo category (từ click menu)
    if (typeof keyWord === "string" && keyWord.length > 0) {
      url += `&category=${encodeURIComponent(keyWord)}`;
    }
    // Case 2: Search theo input
    else if (searchInput && searchInput.value) {
      url += `&search=${encodeURIComponent(searchInput.value)}`;
    }

    const response = await fetch(url);
    const result = await response.json();
    const products = Array.isArray(result) ? result : result.data || [];

    displayProducts(products, productList);
  } catch (error) {
    console.error("❌ Lỗi tìm kiếm:", error);
    showError("Lỗi tìm kiếm sản phẩm");
  }
}

// ===== DISPLAY: Hiển thị danh sách sản phẩm =====
function displayProducts(products, container) {
  if (!container) return;
  container.innerHTML = "";

  if (!products || products.length === 0) {
    container.innerHTML =
      '<p class="text-center w-100">Không tìm thấy sản phẩm.</p>';
    return;
  }

  products.forEach((product) => {
    const priceAfterDiscount = product.price * (1 - product.discount);
    const priceContainer = createPriceContainer(
      product.price,
      product.discount
    );
    const ratingContainer = createRatingContainer(product.rating);

    let imageUrl = product.image;
    if (
      imageUrl &&
      !imageUrl.startsWith("http") &&
      !imageUrl.startsWith("/img/")
    ) {
      imageUrl = `${BASE_URL}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
    }

    // 🔥 FIX: Dùng product._id (MongoDB ID) thay vì product.id
    const productId = product._id;

    const productHtml = `
      <div class="col-6 col-md-3 mb-4">
        <div class="card h-100" style="cursor: pointer;" onclick="searchProductDetail('${productId}')">
          <img src="${imageUrl}" class="card-img-top" alt="${product.name}" 
               style="height: 200px; object-fit: cover;">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title text-truncate">${product.name}</h5>
            ${priceContainer}
            ${ratingContainer}
            <button class="btn btn-success mt-auto w-100" onclick="addToCart('${productId}', event)">
              Thêm vào giỏ hàng
            </button>
          </div>
        </div>
      </div>
    `;

    container.innerHTML += productHtml;
  });
}

// ===== PRODUCT DETAIL: Load chi tiết sản phẩm =====
async function loadProductDetail(productId) {
  try {
    if (!productId || productId === "null") {
      console.error("❌ ID không hợp lệ:", productId);
      showError("Không tìm thấy ID sản phẩm");
      return;
    }

    const url = `${BASE_URL}/api/products/${productId}`;
    console.log("🔍 Gọi API:", url);

    const response = await fetch(url);
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("text/html")) {
      throw new Error("Server trả về HTML thay vì JSON (API sai hoặc 404)");
    }

    const result = await response.json();

    if (result.success) {
      console.log("✅ Lấy chi tiết thành công:", result.data.name);
      displayProductDetail(result.data);
    } else {
      showError(result.message || "Không tìm thấy sản phẩm");
    }
  } catch (error) {
    console.error("❌ Lỗi load chi tiết:", error);
    showError("Lỗi tải thông tin sản phẩm");
  }
}

function displayProductDetail(product) {
  const container = document.querySelector(".product-main");
  if (!container) return;

  const priceAfterDiscount = product.price * (1 - product.discount);

  let images =
    product.images && product.images.length > 0
      ? product.images
      : [product.image, product.image, product.image, product.image];

  images = images.map((img) =>
    img && !img.startsWith("http") && !img.startsWith("/img/")
      ? `${BASE_URL}${img.startsWith("/") ? "" : "/"}${img}`
      : img
  );

  const html = `
    <div class="card-wrapper container mt-5">
      <div class="card border-0">
        <div class="row g-0">
          <div class="col-md-6 product-imgs">
            <div class="img-display mb-3">
              <div class="img-showcase">
                <img src="${images[0]}" class="w-100" id="mainImage">
              </div>
            </div>
            <div class="img-select d-flex gap-2">
              ${images
                .map(
                  (img, i) => `
                <div class="img-item" style="width:80px; cursor:pointer" 
                     onclick="document.getElementById('mainImage').src='${img}'">
                  <img src="${img}" class="w-100">
                </div>
              `
                )
                .join("")}
            </div>
          </div>

          <div class="col-md-6 product-content ps-md-5">
            <h2 class="product-title display-6">${product.name}</h2>
            ${createRatingContainer(product.rating)}
            
            <div class="product-price my-3">
              ${createPriceContainer(product.price, product.discount)}
            </div>

            <div class="purchase-info mb-4">
              <input type="number" min="1" value="1" id="quality" class="form-control d-inline-block w-25">
              <button type="button" class="btn btn-success ms-2" onclick="addToCart('${
                product._id
              }')">
                Thêm vào giỏ <i class="fa fa-shopping-cart"></i>
              </button>
            </div>

            <div class="product-detail">
              <h4>Về sản phẩm:</h4>
              <p>${
                product.descriptionDetail ||
                product.description ||
                "Đang cập nhật..."
              }</p>
              <ul class="list-unstyled">
                <li>Trạng Thái: <strong>${
                  product.inStock ? "Còn hàng" : "Hết hàng"
                }</strong></li>
                <li>Đơn vị: <strong>${product.unit || "kg"}</strong></li>
                ${
                  product.origin
                    ? `<li>Nguồn gốc: <strong>${product.origin}</strong></li>`
                    : ""
                }
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  container.innerHTML = html;
}

// ===== CART: Thêm vào giỏ hàng =====
function addToCart(productId, event) {
  if (event) event.stopPropagation();

  const quantity = document.getElementById("quality")?.value || 1;

  if (window.API && window.API.Cart) {
    window.API.Cart.addItem(productId, Number(quantity));
    alert("✅ Đã thêm sản phẩm vào giỏ hàng!");
    updateCartCount();
  } else {
    alert("Lỗi: Chưa load được thư viện Cart");
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

// ===== CART PAGE: Load giỏ hàng =====
function loadCart() {
  const cartTableBody = document.querySelector("tbody");

  if (!window.API || !window.API.Cart) return;
  const cart = window.API.Cart.getLocal();

  if (!cart || cart.length === 0) {
    if (cartTableBody) {
      cartTableBody.innerHTML =
        '<tr><td colspan="7" class="text-center">Giỏ hàng trống</td></tr>';
    }
    return;
  }

  loadCartItems(cart);
}

async function loadCartItems(cart) {
  const tbody = document.querySelector("tbody");
  if (!tbody) return;

  tbody.innerHTML = "";
  let total = 0;

  for (const item of cart) {
    try {
      const response = await fetch(
        `${BASE_URL}/api/products/${item.productId}`
      );
      const result = await response.json();

      if (result.success) {
        const product = result.data;
        const price = product.price * (1 - product.discount);
        const subtotal = price * item.quantity;
        total += subtotal;

        let imgUrl = product.image;
        if (
          imgUrl &&
          !imgUrl.startsWith("http") &&
          !imgUrl.startsWith("/img/")
        ) {
          imgUrl = `${BASE_URL}${imgUrl.startsWith("/") ? "" : "/"}${imgUrl}`;
        }

        const row = `
          <tr>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td><img src="${imgUrl}" alt="${
          product.name
        }" style="width: 50px;"></td>
            <td>${formatPrice(price)} VNĐ</td>
            <td>${item.quantity}</td>
            <td>${formatPrice(subtotal)} VNĐ</td>
            <td>
              <button class="btn btn-danger btn-sm" onclick="removeCartItem('${
                item.productId
              }')">Xóa</button>
            </td>
          </tr>
        `;
        tbody.innerHTML += row;
      }
    } catch (error) {
      console.error("❌ Lỗi load item giỏ hàng:", error);
    }
  }

  const totalEl = document.getElementById("total");
  if (totalEl) totalEl.innerHTML = `Tổng tiền: ${formatPrice(total)} VNĐ`;
  sessionStorage.setItem("total", total);
}

function removeCartItem(productId) {
  window.API.Cart.removeItem(productId);
  loadCart();
  updateCartCount();
}

// ===== HELPER FUNCTIONS =====
function formatPrice(number) {
  return new Intl.NumberFormat("vi-VN").format(Math.round(number));
}

function createPriceContainer(price, discount) {
  const priceAfterDiscount = price * (1 - discount);
  if (discount > 0) {
    return `
      <div class="d-flex justify-content-between align-items-center">
        <span class="text-decoration-line-through text-muted small">${formatPrice(
          price
        )}đ</span>
        <span class="badge bg-danger">-${Math.round(discount * 100)}%</span>
      </div>
      <div class="fw-bold text-success">${formatPrice(
        priceAfterDiscount
      )}đ</div>
    `;
  }
  return `<div class="fw-bold text-success">${formatPrice(price)}đ</div>`;
}

function createRatingContainer(rating) {
  const ratingNumber = parseFloat((rating || "0").split("/")[0]) || 0;
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    if (i <= ratingNumber) stars += '<i class="fa fa-star text-warning"></i>';
    else if (i - ratingNumber < 1)
      stars += '<i class="fa fa-star-half-o text-warning"></i>';
    else stars += '<i class="fa fa-star-o text-warning"></i>';
  }
  return `<div class="small mb-2">${stars}</div>`;
}

function searchProductDetail(productId) {
  window.location.href = `product-detail.html?id=${productId}`;
}

function searchProductsByCategory(category) {
  window.location.href = `product.html?category=${encodeURIComponent(
    category
  )}`;
}

function showError(message) {
  const container =
    document.getElementById("productList") ||
    document.querySelector(".product-main");
  if (container) {
    container.innerHTML = `<div class="alert alert-danger text-center w-100">${message}</div>`;
  } else {
    alert(message);
  }
}

function checkEnterKey(event) {
  if (event.code === "Enter") searchProduct();
}

// ===== INITIALIZE =====
document.addEventListener("DOMContentLoaded", async () => {
  await initProducts();
  updateCartCount();

  if (window.location.pathname.includes("product-detail.html")) {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("id");
    if (productId) loadProductDetail(productId);
  }

  if (window.location.pathname.includes("cart.html")) {
    loadCart();
  }
});
