//Dropdown in productpage
const toggle = document.querySelector('#button');
const menu = document.querySelector('.menu-filter');
toggle.addEventListener("click", () => menu.classList.toggle("active"));