// ============================================================
// public/Admin/js/products-handler.js - QUẢN LÝ SẢN PHẨM
// ============================================================

import { adminAPI } from "./admin-auth.js";

// Format giá VND
function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

// Danh mục mapping
const categoryMap = {
  "trái cây": "traicaytable",
  "rau lá": "rautable",
  "củ quả": "cuquatable",
  nấm: "namtable",
};

// Load sản phẩm theo danh mục
async function loadProducts(category = null) {
  try {
    const endpoint = category
      ? `/products?category=${encodeURIComponent(category)}`
      : "/products?limit=100";

    const data = await adminAPI(endpoint);

    if (data.success) {
      const products = data.data;

      // Nhóm sản phẩm theo danh mục
      const grouped = {};
      products.forEach((product) => {
        const cat = product.category.toLowerCase();
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(product);
      });

      // Render từng danh mục
      Object.keys(categoryMap).forEach((categoryName) => {
        const tableId = categoryMap[categoryName];
        const tbody = document.querySelector(`#${tableId} tbody`);

        if (tbody && grouped[categoryName]) {
          tbody.innerHTML = ""; // Xóa dữ liệu cũ

          grouped[categoryName].forEach((product) => {
            const row = createProductRow(product);
            tbody.appendChild(row);
          });
        }
      });

      console.log(`✅ Loaded ${products.length} products`);
      attachEventListeners(); // Gắn lại event listeners
    }
  } catch (error) {
    console.error("❌ Error loading products:", error);
    alert("Không thể tải danh sách sản phẩm");
  }
}

// Tạo dòng sản phẩm
function createProductRow(product) {
  const tr = document.createElement("tr");
  tr.className = "product-item";
  tr.dataset.productId = product._id;

  tr.innerHTML = `
    <td>${product.id}</td>
    <td>${product.name}</td>
    <td style="width: 20%; height: 20%; text-align: center">
      <img src="${product.image || "/img/placeholder.jpg"}" 
           style="width: 100%; max-height: 100px; object-fit: cover" 
           alt="${product.name}" />
    </td>
    <td>${formatPrice(product.price)}</td>
    <td class="quantity">${product.stock}</td>
    <td>
      <button class="edit-button" title="Sửa số lượng">
        <i class='bx bx-pencil'></i>
      </button>
      <button class="delete-button" title="Xóa sản phẩm">
        <i class='bx bx-trash'></i>
      </button>
    </td>
  `;

  return tr;
}

// Sửa số lượng sản phẩm
async function editProductQuantity(productId, currentQuantity) {
  const newQuantity = prompt(
    "Nhập số lượng mới:",
    currentQuantity
  );

  if (newQuantity === null) return; // Cancel

  const qty = parseInt(newQuantity);

  if (isNaN(qty) || qty < 0 || qty > 9999) {
    alert("Số lượng không hợp lệ (0-9999)");
    return;
  }

  try {
    const data = await adminAPI(`/products/${productId}/quantity`, {
      method: "PUT",
      body: JSON.stringify({ quantity: qty }),
    });

    if (data.success) {
      alert("Cập nhật thành công!");
      loadProducts(); // Reload
    } else {
      alert("X " + data.message);
    }
  } catch (error) {
    console.error(" Error updating quantity:", error);
    alert("Không thể cập nhật số lượng");
  }
}

// Xóa sản phẩm
async function deleteProduct(productId, productName) {
  if (!confirm(`Bạn có chắc muốn xóa sản phẩm "${productName}"?`)) {
    return;
  }

  try {
    const data = await adminAPI(`/products/${productId}`, {
      method: "DELETE",
    });

    if (data.success) {
      alert("Đã xóa sản phẩm!");
      loadProducts(); // Reload
    } else {
      alert(" " + data.message);
    }
  } catch (error) {
    console.error(" Error deleting product:", error);
    alert("Không thể xóa sản phẩm");
  }
}

// Gắn event listeners
function attachEventListeners() {
  // Edit buttons
  document.querySelectorAll(".edit-button").forEach((btn) => {
    btn.addEventListener("click", function () {
      const row = this.closest(".product-item");
      const productId = row.dataset.productId;
      const currentQty = parseInt(
        row.querySelector(".quantity").textContent
      );
      editProductQuantity(productId, currentQty);
    });
  });

  // Delete buttons
  document.querySelectorAll(".delete-button").forEach((btn) => {
    btn.addEventListener("click", function () {
      const row = this.closest(".product-item");
      const productId = row.dataset.productId;
      const productName = row.querySelector("td:nth-child(2)").textContent;
      deleteProduct(productId, productName);
    });
  });
}

// Modal thêm sản phẩm
function setupAddProductModal() {
  const modal = document.getElementById("myModal");
  const form = document.getElementById("addProductForm");
  const closeBtn = document.querySelector(".close-button");

  // Mở modal
  window.openModal = function () {
    modal.style.display = "block";
  };

  // Đóng modal
  const closeModal = () => {
    modal.style.display = "none";
    form.reset();
  };

  closeBtn.addEventListener("click", closeModal);

  // Submit form
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = {
      id: document.getElementById("productIDInput").value,
      name: document.getElementById("productNameInput").value,
      category: document.getElementById("productCategory").value,
      price: parseFloat(document.getElementById("productPriceInput").value),
      stock: parseInt(document.getElementById("productQuantityInput").value),
      image: document.getElementById("productImageInput").value,
    };

    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert("Thêm sản phẩm thành công!");
        closeModal();
        loadProducts();
      } else {
        alert("" + data.message);
      }
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Không thể thêm sản phẩm");
    }
  });
}

// Khởi động
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    loadProducts();
    setupAddProductModal();
  }, 500);
});