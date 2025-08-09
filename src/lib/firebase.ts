// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDVpSjwJmj-sUv0XhhGpjXV4OssBiO7Elc",
  authDomain: "social-predict.firebaseapp.com",
  projectId: "social-predict",
  storageBucket: "social-predict.firebasestorage.app",
  messagingSenderId: "1059964605195",
  appId: "1:1059964605195:web:dba76f44bad244eb3c480e",
  measurementId: "G-79HB95WJBK"
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);
const analytics = getAnalytics(firebaseApp);