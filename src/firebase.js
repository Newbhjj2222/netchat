// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database"; // ✅ Realtime Database

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyANRYaHPDS0KLwqC6RecIJaxGUiDEOy3Vg",
  authDomain: "netchat-96198.firebaseapp.com",
  databaseURL: "https://netchat-96198-default-rtdb.firebaseio.com",
  projectId: "netchat-96198",
  storageBucket: "netchat-96198.appspot.com",
  messagingSenderId: "328062279730",
  appId: "1:328062279730:web:9f91e036e1dd5033925c2b",
  measurementId: "G-GWKM3FMDYH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Export Realtime Database
export const db = getDatabase(app);
