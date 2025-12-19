// public/assets/js/auth-handler.js
import { auth, createUserWithEmailAndPassword, getIdToken } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.querySelector('#signup-form'); // Hãy đảm bảo form có ID này

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Lấy dữ liệu từ các ô input
            const email = document.querySelector('#email').value;
            const password = document.querySelector('#password').value;
            const fullName = document.querySelector('#fullname').value;
            const phone = document.querySelector('#phone').value;
            const address = document.querySelector('#address').value;

            try {
                // Bước 1: Đăng ký trên Firebase
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Bước 2: Lấy ID Token để gửi về Backend
                const idToken = await getIdToken(user);

                // Bước 3: Gọi API Backend (Node.js) để lưu vào MongoDB
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        idToken,
                        fullName,
                        phone,
                        address
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    alert('Đăng ký thành công!');
                    window.location.href = '/login.html'; // Chuyển hướng sang đăng nhập
                } else {
                    throw new Error(result.message || 'Lỗi lưu thông tin vào DB');
                }

            } catch (error) {
                console.error("Lỗi:", error);
                alert("Đăng ký thất bại: " + error.message);
            }
        });
    }
});