// public/assets/js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, getIdToken } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// TODO: Thay thế bằng config thực từ Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyABrOpxuBl16HpHgbV1f6VE2swDHaNqYI4",
  authDomain: "nongsanviet-db.firebaseapp.com",
  projectId: "nongsanviet-db",
  storageBucket: "nongsanviet-db.firebasestorage.app",
  messagingSenderId: "928368768826",
  appId: "1:928368768826:web:456f4272260415b8f50203"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, getIdToken };