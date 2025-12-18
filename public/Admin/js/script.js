const body = document.querySelector("body"),
sidebarToggle = body.querySelector(".sidebar-toggle"),
sidebar = body.querySelector(".sidebar");


sidebarToggle.addEventListener("click" ,() => {
sidebar.classList.toggle("close");
})
const modal = document.querySelector(".modal");
const trigger = document.querySelector(".trigger");
const closeButton = document.querySelector(".close-button");

function toggleModal() {
    modal.classList.toggle("show-modal");
}

function windowOnClick(event) {
    if (event.target === modal) {
        toggleModal();
    }
}
trigger.addEventListener("click", toggleModal);
closeButton.addEventListener("click", toggleModal);
window.addEventListener("click", windowOnClick);
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.delete-button').forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.product-item').remove();
        });
    });
});
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.edit-button').forEach(button => {
        button.addEventListener('click', function() {
            var quantityElement = this.closest('.product-item').querySelector('.quantity');
            var currentQuantity = parseInt(quantityElement.textContent);
            var newQuantity = prompt('Nhập số lượng mới:', currentQuantity);
            if (newQuantity >0 && !isNaN(newQuantity) && newQuantity < 999) 
                quantityElement.textContent = parseInt(newQuantity);
            else {
                    alert('Vui lòng nhập một số hợp lệ.');
                }
            
        });
    });
});
function getCategoryTableId(category) {
    switch (category) {
        case "traiCay":
            return "traicaytable";
        case "Nam":
            return "namtable";
        case "Rau":
            return "rautable";
        case "cuaQua":
            return "cuquatable";
        default:
            return null;
    }
}
document.getElementById("addProductForm").addEventListener("submit", function(event) {
    event.preventDefault();
    var category = document.getElementById("productCategory").value;
    var productImage = document.getElementById("productImageInput").value;
    var productID = document.getElementById("productIDInput").value;
    var productName = document.getElementById("productNameInput").value;
    var productPrice = document.getElementById("productPriceInput").value;
    var productQuantity = document.getElementById("productQuantityInput").value;
    if (category === "" || productImage === "" || productID === "" || productName === "" || productPrice === "" || productQuantity === "") {
        alert("Vui lòng nhập đầy đủ thông tin sản phẩm!");
        return;
    }
    var tableId = getCategoryTableId(category); // Lấy ID của bảng dựa vào danh mục
    var table = document.getElementById(tableId).getElementsByTagName("tbody")[0];
    var newRow = table.insertRow(table.rows.length);
    var cell1 = newRow.insertCell(0);
    cell1.innerHTML = productID;
    var cell2 = newRow.insertCell(1);
    cell2.innerHTML = productName;
    var cell3 = newRow.insertCell(2);
    cell3.innerHTML = "<img src='" + productImage + "' style='width: 100%' alt='' srcset='' />";
    var cell4 = newRow.insertCell(3);
    cell4.innerHTML = productPrice;
    var cell5 = newRow.insertCell(4);
    cell5.innerHTML = productQuantity;
    var cell6 = newRow.insertCell(5);
    cell6.innerHTML = "<button><i class='bx bx-pencil edit-button'></i></button> <button><i class='bx bx-trash delete-button'></i></button>";

   console.log(productImage);
    document.getElementById("myModal").style.display = "none";
});

function openModal() {
    var modal = document.getElementById("myModal");
    modal.style.display = "block";
}
document.getElementsByClassName("close-button")[0].addEventListener("click", function() {
    closeModal();
});
document.getElementById("addProductForm").addEventListener("reset", function(event) {
    closeModal();
});

function closeModal() {
    var modal = document.getElementById("myModal");
    modal.style.display = "none";
}