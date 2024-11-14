// Import necessary Firebase modules
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration - Replace these values with your Firebase project settings
const firebaseConfig = {
  apiKey: "AIzaSyB1u7Rf0oKzOzp1uUc-LuSx4xKxjD-_8LU",
  authDomain: "sandproductionriskapp.firebaseapp.com",
  projectId: "sandproductionriskapp",
  storageBucket: "sandproductionriskapp.firebasestorage.app",
  messagingSenderId: "560913730671",
  appId: "1:560913730671:web:90e5060d3e413bbb1bd19a",
  measurementId: "G-6F2LNGZ405"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// Export initialized services for use in other files
export { auth, db, analytics };
