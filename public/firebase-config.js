// Import the functions you need from the SDKs you need
//import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBhSWditPBxTSBnX5UMeg91ipBbk2vGe1o",
  authDomain: "pomclear-ec893.firebaseapp.com",
  databaseURL: "https://pomclear-ec893-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "pomclear-ec893",
  storageBucket: "pomclear-ec893.firebasestorage.app",
  messagingSenderId: "653956233480",
  appId: "1:653956233480:web:a79de9e542ed77969994bd",
  measurementId: "G-PSWZX25Q6F"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database();
  // Initialize Firebase
  //const app = initializeApp(firebaseConfig);
  //const analytics = getAnalytics(app);