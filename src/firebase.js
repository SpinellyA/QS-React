// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBp4VdZiuEd4t9TP02ndMn98AoFuJnuRCY",
  authDomain: "qsreact.firebaseapp.com",
  projectId: "qsreact",
  storageBucket: "qsreact.firebasestorage.app",
  messagingSenderId: "785713285916",
  appId: "1:785713285916:web:ae1b686c5c4028740d88d9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export { db };