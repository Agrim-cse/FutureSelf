import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  // Triple check this key from your Project Settings > Web App
  apiKey: "AIzaSyAojdspdnxrBRXBTrblXnQg4Ka1r3Z4gfY", 
  authDomain: "finquest-2abd6.firebaseapp.com",
  projectId: "finquest-2abd6",
  storageBucket: "finquest-2abd6.firebasestorage.app",
  messagingSenderId: "1082923925994",
  appId: "1:1082923925994:web:e79806c7eaced306387293",
  measurementId: "G-9FW3ZBDV7D"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);