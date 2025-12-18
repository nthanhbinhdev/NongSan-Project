function confrimContactForm() {
    const name = document.getElementById('name');
    const tel = document.getElementById('tel');
    const telRegex = /^\d{10}$/;
    const email = document.getElementById('email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    let check = true;

    if (name.value.length == 0) {
        check = false;
        name.parentNode.classList.add('error');
        name.parentNode.parentNode.querySelector('.mess-error').innerText = 'Vui lòng nhập họ tên';
    } else {
        name.parentNode.classList.remove('error');
        name.parentNode.parentNode.querySelector('.mess-error').innerText = '';
    }

    if (tel.value.length == 0) {
        check = false;
        tel.parentNode.classList.add('error');
        tel.parentNode.parentNode.querySelector('.mess-error').innerText = 'Vui lòng nhập số điện thoại';
    } else if (!telRegex.test(tel.value)) {
        check = false;
        tel.parentNode.classList.add('error');
        tel.parentNode.parentNode.querySelector('.mess-error').innerText = 'Số điện thoại không hợp lệ';
    } else {
        tel.parentNode.classList.remove('error');
        tel.parentNode.parentNode.querySelector('.mess-error').innerText = '';
    }

    if (email.value.length == 0) {
        check = false;
        email.parentNode.classList.add('error');
        email.parentNode.parentNode.querySelector('.mess-error').innerText = 'Vui lòng nhập địa chỉ email';
    } else if (!emailRegex.test(email.value)) {
        check = false;
        email.parentNode.classList.add('error');
        email.parentNode.parentNode.querySelector('.mess-error').innerText = 'Email không hợp lệ';
    } else {
        email.parentNode.classList.remove('error');
        email.parentNode.parentNode.querySelector('.mess-error').innerText = '';
    }

    if (check) {
        location.reload();
        alert('Gửi thông tin thành công, chúng tôi sẽ liên hệ tới bạn sau!!!');
    }

}

function resetContactForm() {
    const name = document.getElementById('name');
    const tel = document.getElementById('tel');
    const email = document.getElementById('email');

    name.parentNode.classList.remove('error');
    name.parentNode.parentNode.querySelector('.mess-error').innerText = '';

    tel.parentNode.classList.remove('error');
    tel.parentNode.parentNode.querySelector('.mess-error').innerText = '';

    email.parentNode.classList.remove('error');
    email.parentNode.parentNode.querySelector('.mess-error').innerText = '';
}

function comfirm() {
    const name = document.getElementById('name');
    const tel = document.getElementById('tel');
    const telRegex = /^\d{10}$/;
    const email = document.getElementById('email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const place = document.getElementById('place');

    let check = true;

    if (name.value.length == 0) {
        check = false;
        name.parentNode.classList.add('error');
        name.parentNode.parentNode.querySelector('.mess-error').innerText = 'Vui lòng nhập họ tên';
    } else {
        name.parentNode.classList.remove('error');
        name.parentNode.parentNode.querySelector('.mess-error').innerText = '';
    }

    if (tel.value.length == 0) {
        check = false;
        tel.parentNode.classList.add('error');
        tel.parentNode.parentNode.querySelector('.mess-error').innerText = 'Vui lòng nhập số điện thoại';
    } else if (!telRegex.test(tel.value)) {
        check = false;
        tel.parentNode.classList.add('error');
        tel.parentNode.parentNode.querySelector('.mess-error').innerText = 'Số điện thoại không hợp lệ';
    } else {
        tel.parentNode.classList.remove('error');
        tel.parentNode.parentNode.querySelector('.mess-error').innerText = '';
    }

    if (email.value.length == 0) {
        check = false;
        email.parentNode.classList.add('error');
        email.parentNode.parentNode.querySelector('.mess-error').innerText = 'Vui lòng nhập địa chỉ email';
    } else if (!emailRegex.test(email.value)) {
        check = false;
        email.parentNode.classList.add('error');
        email.parentNode.parentNode.querySelector('.mess-error').innerText = 'Email không hợp lệ';
    } else {
        email.parentNode.classList.remove('error');
        email.parentNode.parentNode.querySelector('.mess-error').innerText = '';
    }

    if (place.value.length == 0){
        check = false;
        place.parentNode.classList.add('error');
        place.parentNode.parentNode.querySelector('.mess-error').innerText = 'Vui lòng nhập đại chỉ';
    } else {
        place.parentNode.classList.remove('error');
        place.parentNode.parentNode.querySelector('.mess-error').innerText = '';
    }

    if (check) {
        location.reload();
        alert('Đặt hàng thành công, chúng tôi sẽ liên hệ tới bạn sau ít phút!!!');
        localStorage.removeItem('cart');    
        sessionStorage.removeItem('total');
        window.location.href = 'cart.html';
    }

}