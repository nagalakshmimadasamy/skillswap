// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyACyGGcVqaMlpo9BXQinr4FjJbHxPeeH78",
  authDomain: "skillsweb-8d262.firebaseapp.com",
  projectId: "skillsweb-8d262",
  storageBucket: "skillsweb-8d262.firebasestorage.app",
  messagingSenderId: "1011668610753",
  appId: "1:1011668610753:web:086ae6bd59334306bf6e40",
  measurementId: "G-603HZG3CS8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
