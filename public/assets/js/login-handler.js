// public/assets/js/login-handler.js
import { auth, signInWithEmailAndPassword, getIdToken } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorMsg = document.getElementById('error-message'); // Nơi hiển thị lỗi

            try {
                // 1. Đăng nhập với Firebase
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                
                // 2. Lấy Token
                const idToken = await getIdToken(user);

                // 3. Gửi Token về Backend để lấy thông tin Role (Admin/Khách)
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Lỗi đăng nhập Backend');
                }

                // 4. Lưu thông tin vào LocalStorage
                localStorage.setItem('accessToken', idToken);
                localStorage.setItem('user', JSON.stringify(data.user));

                alert('Đăng nhập thành công!');

                // 5. Chuyển hướng dựa trên Role
                if (data.user.role === 'admin') {
                    window.location.href = '/Admin/dashboard.html';
                } else {
                    window.location.href = '/index.html';
                }

            } catch (error) {
                console.error("Login Error:", error);
                let message = "Đăng nhập thất bại.";
                
                // Xử lý các lỗi Firebase thường gặp
                if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                    message = "Email hoặc mật khẩu không đúng.";
                } else if (error.code === 'auth/wrong-password') {
                     message = "Mật khẩu không đúng.";
                } else {
                    message = error.message; // Lỗi từ Backend trả về
                }

                if(errorMsg) {
                    errorMsg.textContent = message;
                    errorMsg.style.display = 'block';
                } else {
                    alert(message);
                }
            }
        });
    }
});