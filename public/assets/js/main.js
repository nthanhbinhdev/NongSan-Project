// ============================================================
// public/assets/js/main.js - ĐÃ FIX LINK API & LOGIC HIỂN THỊ
// ============================================================

// 👉 CẤU HÌNH ĐƯỜNG DẪN API (Quan trọng nhất)
// Nếu chạy local thì dùng localhost:3000, nếu deploy thì đổi link này
const BASE_URL = "http://localhost:3000";

// ===== GLOBAL STATE =====
let allProducts = [];

// ===== INIT: Load Products from API =====
async function initProducts() {
  try {
    // Fix: Thêm BASE_URL vào fetch để gọi đúng server 3000
    const response = await fetch(`${BASE_URL}/api/products?limit=100`);

    // Kiểm tra nếu server trả về HTML (lỗi) thay vì JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server không trả về JSON (Check lại cổng API 3000)");
    }

    const result = await response.json();

    if (Array.isArray(result)) {
      allProducts = result;
    } else if (result.success && Array.isArray(result.data)) {
      allProducts = result.data;
    } else {
      console.error("❌ API Error:", result.message || "Format data lạ!");
      showError("Không thể tải sản phẩm");
      return;
    }

    console.log(`✅ Đã load ${allProducts.length} sản phẩm.`);

    // 👉 FIX LỖI TRANG CHỦ: Tự động hiển thị sản phẩm nếu đang ở trang chủ
    const homeContainer = document.getElementById("productList");
    if (homeContainer) {
      // Lấy 8 sản phẩm đầu tiên hoặc sản phẩm nổi bật để hiển thị
      const featuredProducts = allProducts.slice(0, 8);
      displayProducts(featuredProducts, homeContainer);
    }
  } catch (error) {
    console.error("❌ Fetch Error:", error);
    showError(
      "Lỗi kết nối server Backend (Hãy chắc chắn ông đã chạy 'node server.js')"
    );
  }
}

// ===== SEARCH PRODUCTS =====
async function searchProduct(keyWord = "") {
  const searchInput = document.getElementById("searchInput");
  const productList = document.getElementById("productList"); // Container ở trang Product

  if (!productList) return; // Nếu không phải trang product thì thôi

  let searchResults = allProducts;

  // Search by category string (từ click menu)
  if (typeof keyWord === "string" && keyWord.length > 0) {
    const normalized = removeDiacritics(keyWord.toLowerCase());
    searchResults = allProducts.filter((product) =>
      removeDiacritics(product.category.toLowerCase()).includes(normalized)
    );
  }
  // Search by input value
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

  if (!products || products.length === 0) {
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

    // Fix: Thêm BASE_URL vào đường dẫn ảnh nếu ảnh lưu trên server
    let imageUrl = product.image;
    if (
      imageUrl &&
      !imageUrl.startsWith("http") &&
      !imageUrl.startsWith("/img/")
    ) {
      imageUrl = `${BASE_URL}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
    }

    const productHtml = `
      <div class="col-6 col-md-3 mb-4"> <div class="card h-100" style="cursor: pointer;" 
             onclick="searchProductDetail('${product._id}')">
          <img src="${imageUrl}" class="card-img-top" alt="${product.name}" 
               style="height: 200px; object-fit: cover;">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title text-truncate">${product.name}</h5>
            ${priceContainer}
            ${ratingContainer}
            <button class="btn btn-success mt-auto w-100" onclick="addToCart('${product._id}', event)">
              Thêm vào giỏ hàng
            </button>
          </div>
        </div>
      </div>
    `;

    container.innerHTML += productHtml;
  });
}

// ===== HELPER FUNCTIONS =====
function removeDiacritics(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function checkEnterKey(event) {
  if (event.code === "Enter") {
    searchProduct();
  }
}

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
  if (event) event.stopPropagation();
  const quantity = document.getElementById("quality")?.value || 1;

  if (window.API && window.API.Cart) {
    window.API.Cart.addItem(productId, Number(quantity));
    alert("✅ Đã thêm sản phẩm vào giỏ hàng!");
    updateCartCount();
  } else {
    // Fallback nếu API.Cart chưa load
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

// ===== PRODUCT DETAIL (Fix lỗi Unexpected token <) =====
// Tìm hàm này trong main.js và thay thế toàn bộ bằng đoạn dưới đây:

async function loadProductDetail(productId) {
  try {
    // 1. Kiểm tra ID
    if (!productId || productId === "null" || productId === "undefined") {
      console.error("❌ Lỗi: ID sản phẩm không hợp lệ:", productId);
      showError("Không tìm thấy ID sản phẩm");
      return;
    }

    const url = `${BASE_URL}/api/products/${productId}`;
    console.log("🔍 Đang gọi API chi tiết:", url); // <--- Log để check đường dẫn

    const response = await fetch(url);

    // 2. Kiểm tra xem Server trả về HTML hay JSON
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
      const text = await response.text();
      console.error(
        "❌ Lỗi: Server trả về HTML thay vì JSON!",
        text.substring(0, 100)
      );
      throw new Error("Đường dẫn API sai hoặc Server trả về lỗi 404 HTML");
    }

    // 3. Xử lý JSON
    const result = await response.json();

    if (result.success) {
      console.log("✅ Lấy chi tiết thành công:", result.data.name);
      displayProductDetail(result.data);
    } else {
      showError(result.message || "Không tìm thấy sản phẩm");
    }
  } catch (error) {
    console.error("❌ Error loading detail:", error);
    showError("Lỗi tải thông tin sản phẩm (Xem Console để biết chi tiết)");
  }
}

function displayProductDetail(product) {
  const container = document.querySelector(".product-main");
  if (!container) return;

  const priceAfterDiscount = product.price * (1 - product.discount);

  // Xử lý ảnh
  let images =
    product.images && product.images.length > 0
      ? product.images
      : [product.image, product.image, product.image, product.image];

  // Fix link ảnh
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
                    (img, index) => `
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

// ===== CART PAGE (Fix lỗi giỏ hàng trống) =====
function loadCart() {
  const container = document.querySelector(".cart-container"); // Ông nhớ thêm class này vào div chứa giỏ hàng ở file HTML nha
  // Hoặc đổi selector thành document.getElementById("cart") nếu file HTML dùng ID

  // Fallback selector nếu không tìm thấy
  const cartTableBody = document.querySelector("tbody");

  if (!window.API || !window.API.Cart) return;
  const cart = window.API.Cart.getLocal();

  if (!cart || cart.length === 0) {
    if (cartTableBody)
      cartTableBody.innerHTML =
        '<tr><td colspan="7" class="text-center">Giỏ hàng trống</td></tr>';
    return;
  }

  loadCartItems(cart);
}

async function loadCartItems(cart) {
  const tbody = document.querySelector("tbody");
  if (!tbody) return;

  tbody.innerHTML = ""; // Xóa cũ
  let total = 0;

  for (const item of cart) {
    try {
      // Fix: Thêm BASE_URL
      const response = await fetch(
        `${BASE_URL}/api/products/${item.productId}`
      );
      const result = await response.json(); // Lỗi Unexpected token < sẽ hết ở đây

      if (result.success) {
        const product = result.data;
        const price = product.price * (1 - product.discount);
        const subtotal = price * item.quantity;
        total += subtotal;

        // Fix link ảnh
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
      console.error("Lỗi load item giỏ hàng:", error);
    }
  }

  // Cập nhật tổng tiền
  const totalEl = document.getElementById("total");
  if (totalEl) totalEl.innerHTML = `Tổng tiền: ${formatPrice(total)} VNĐ`;
  sessionStorage.setItem("total", total);
}

function removeCartItem(productId) {
  window.API.Cart.removeItem(productId);
  loadCart(); // Load lại sau khi xóa
  updateCartCount();
}

// ===== ERROR HANDLING =====
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

// ===== INITIALIZE =====
document.addEventListener("DOMContentLoaded", async () => {
  // 1. Load sản phẩm (Dùng chung cho Trang chủ và Trang Product)
  await initProducts();

  // 2. Cập nhật số lượng giỏ hàng
  updateCartCount();

  // 3. Nếu đang ở trang chi tiết -> Load chi tiết
  if (window.location.pathname.includes("product-detail.html")) {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("id");
    if (productId) loadProductDetail(productId);
  }

  // 4. Nếu đang ở trang giỏ hàng -> Load giỏ hàng
  if (window.location.pathname.includes("cart.html")) {
    loadCart();
  }
});
