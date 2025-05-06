// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAJiH8amOaaeIP4JVrxW1i3tVcTMj8iW5o",
  authDomain: "subtracker-b2643.firebaseapp.com",
  projectId: "subtracker-b2643",
  storageBucket: "subtracker-b2643.firebasestorage.app",
  messagingSenderId: "542927848015",
  appId: "1:542927848015:web:e128a81bfd1b53389da03a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider }; 