let currentProducts = [];
let currentPage = 1;
let totalPages = 1;

// ============================================================
// LOAD PRODUCTS FROM API
// ============================================================

async function loadProducts(params = {}) {
  try {
    showLoading();

    const response = await API.Product.getAll({
      page: currentPage,
      limit: 12,
      ...params,
    });

    if (Array.isArray(response)) {
      // Trường hợp 1: Backend trả về mảng trực tiếp (như log ông vừa thấy)
      currentProducts = response;
      totalPages = 1; // Vì trả về hết 1 cục nên coi như chỉ có 1 trang
    } else {
      // Trường hợp 2: Backend trả về object chuẩn (có phân trang)
      currentProducts = response.data || [];
      totalPages = response.pagination?.pages || 1;
    }

    displayProducts(currentProducts);
    updatePagination();
  } catch (error) {
    console.error("Lỗi load sản phẩm:", error);
    showError("Không thể tải sản phẩm. Vui lòng thử lại.");
  } finally {
    hideLoading();
  }
}

// ============================================================
// DISPLAY PRODUCTS
// ============================================================

function displayProducts(products) {
  const container = document.getElementById("productList");

  if (!products || products.length === 0) {
    container.innerHTML =
      '<p class="text-center">Không tìm thấy sản phẩm phù hợp.</p>';
    return;
  }

  let html = "";

  products.forEach((product) => {
    const priceAfterDiscount = product.price * (1 - product.discount);
    const hasDiscount = product.discount > 0;

    html += `
      <div class="col-3 mb-3">
        <div class="card mt-3" onclick="viewProductDetail('${product._id}')">
          <img src="${product.image || "img/no-image.jpg"}" alt="${
      product.name
    }" class="card-img-top">
          <div class="card-body">
            <h5 class="card-title">${product.name}</h5>
            
            ${
              hasDiscount
                ? `
              <div class="cost-container">
                <p class="cost">${formatPrice(product.price)}đ</p>
                <span class="discount">-${Math.round(
                  product.discount * 100
                )}%</span>
              </div>
              <p class="current-price">${formatPrice(priceAfterDiscount)}đ</p>
            `
                : `
              <p class="current-price">${formatPrice(product.price)}đ</p>
            `
            }
            
            <div class="product-rating">
              ${renderStars(product.rating)}
              <span>${product.rating}</span>
            </div>
            
            <button class="btn btn-success btn-sm mt-2" onclick="addToCart('${
              product._id
            }', event)">
              Thêm vào giỏ
            </button>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// ============================================================
// SEARCH & FILTER
// ============================================================

// Tìm kiếm
async function searchProducts() {
  const keyword = document.getElementById("searchInput").value;
  currentPage = 1;
  await loadProducts({ search: keyword });
}

// Lọc theo danh mục
async function filterByCategory(category) {
  currentPage = 1;
  await loadProducts({ category });
}

// Sắp xếp
async function sortProducts(sortBy) {
  await loadProducts({ sort: sortBy });
}

// ============================================================
// PRODUCT DETAIL
// ============================================================

async function viewProductDetail(productId) {
  window.location.href = `product-detail.html?id=${productId}`;
}

async function loadProductDetail() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("id");

    if (!productId) {
      showError("Không tìm thấy sản phẩm");
      return;
    }

    showLoading();
    const response = await API.Product.getById(productId);
    const product = response.data;

    displayProductDetail(product);
  } catch (error) {
    console.error("Lỗi load chi tiết:", error);
    showError("Không thể tải thông tin sản phẩm");
  } finally {
    hideLoading();
  }
}

function displayProductDetail(product) {
  const container = document.querySelector(".product-main");
  const priceAfterDiscount = product.price * (1 - product.discount);
  const hasDiscount = product.discount > 0;

  // Lấy danh sách ảnh (nếu có)
  const images =
    product.images && product.images.length > 0
      ? product.images
      : [product.image, product.image, product.image, product.image];

  let html = `
    <div class="card-wrapper">
      <div class="card">
        <!-- Ảnh sản phẩm -->
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

        <!-- Thông tin sản phẩm -->
        <div class="product-content">
          <h2 class="product-detail-title">${product.name}</h2>
          
          <div class="product-rating">
            ${renderStars(product.rating)}
            <span>${product.rating}</span>
          </div>

          <div class="product-price">
            ${
              hasDiscount
                ? `
              <div class="cost-container">
                <p class="cost">${formatPrice(product.price)}đ</p>
                <span class="discount">-${Math.round(
                  product.discount * 100
                )}%</span>
              </div>
              <p class="current-price">${formatPrice(priceAfterDiscount)}đ</p>
            `
                : `
              <p class="current-price">${formatPrice(product.price)}đ</p>
            `
            }
          </div>

          <div class="purchase-info">
            <input type="number" min="1" value="1" id="quantity">
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
              ${
                product.certifications && product.certifications.length > 0
                  ? `<li>Chứng nhận: <span>${product.certifications.join(
                      ", "
                    )}</span></li>`
                  : ""
              }
            </ul>
          </div>

          ${
            product.reviews && product.reviews.length > 0
              ? `
            <div class="reviews">
              <h3>Đánh giá từ khách hàng</h3>
              ${product.reviews
                .map(
                  (review) => `
                <div class="review-item">
                  <strong>${review.reviewer}</strong> - ${renderStars(
                    review.rating + "/5"
                  )}
                  <p>${review.comment}</p>
                  <small>${new Date(review.date).toLocaleDateString(
                    "vi-VN"
                  )}</small>
                </div>
              `
                )
                .join("")}
            </div>
          `
              : ""
          }
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

// ============================================================
// CART FUNCTIONS
// ============================================================

function addToCart(productId, event) {
  if (event) {
    event.stopPropagation(); // Ngăn chặn click vào card
  }

  const quantity = document.getElementById("quantity")?.value || 1;

  API.Cart.addItem(productId, Number(quantity));

  showNotification("Đã thêm vào giỏ hàng!", "success");
  updateCartCount();
}

function updateCartCount() {
  const count = API.Cart.getCount();
  const badge = document.getElementById("cart-count");
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? "inline" : "none";
  }
}

// ============================================================
// PAGINATION
// ============================================================

function updatePagination() {
  const paginationContainer = document.getElementById("pagination");
  if (!paginationContainer) return;

  let html = '<nav><ul class="pagination">';

  // Previous button
  html += `
    <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
      <a class="page-link" href="#" onclick="changePage(${
        currentPage - 1
      }); return false;">Trước</a>
    </li>
  `;

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    html += `
      <li class="page-item ${i === currentPage ? "active" : ""}">
        <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
      </li>
    `;
  }

  // Next button
  html += `
    <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
      <a class="page-link" href="#" onclick="changePage(${
        currentPage + 1
      }); return false;">Sau</a>
    </li>
  `;

  html += "</ul></nav>";
  paginationContainer.innerHTML = html;
}

async function changePage(page) {
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  await loadProducts();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN").format(Math.round(price));
}

function renderStars(rating) {
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

  return stars;
}

function slideImage(index) {
  const displayWidth = document.querySelector(".img-showcase img").clientWidth;
  document.querySelector(".img-showcase").style.transform = `translateX(-${
    (index - 1) * displayWidth
  }px)`;
}

function showLoading() {
  const container = document.getElementById("productList");
  if (container) {
    container.innerHTML =
      '<div class="text-center"><div class="spinner-border text-success" role="status"></div></div>';
  }
}

function hideLoading() {
  // Loading đã được xóa khi hiển thị sản phẩm
}

function showError(message) {
  const container = document.getElementById("productList");
  if (container) {
    container.innerHTML = `<div class="alert alert-danger text-center">${message}</div>`;
  }
}

function showNotification(message, type = "success") {
  // Tạo thông báo toast đơn giản
  const notification = document.createElement("div");
  notification.className = `alert alert-${type} notification`;
  notification.style.cssText =
    "position: fixed; top: 20px; right: 20px; z-index: 9999;";
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  // Kiểm tra trang hiện tại
  if (window.location.pathname.includes("product-detail.html")) {
    loadProductDetail();
  } else if (window.location.pathname.includes("product.html")) {
    loadProducts();
  }

  // Cập nhật số lượng giỏ hàng
  updateCartCount();

  // Setup search
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        searchProducts();
      }
    });
  }
});
