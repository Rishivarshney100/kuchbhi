import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAGJ1HJwFzGivaRpDq9sO7mHTNHH8_n0O0",
  authDomain: "bse2025-7be22.firebaseapp.com",
  projectId: "bse2025-7be22",
  storageBucket: "bse2025-7be22.firebasestorage.app",
  messagingSenderId: "460693482401",
  appId: "1:460693482401:web:b1ae6ff762d031cc2f79e0",
  measurementId: "G-2SBT1G9X29"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth }; 