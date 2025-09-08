import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC1J0ulpkc2mHbvYTgXOyY1Ldfh8VIY8mQ",
  authDomain: "game-project-6e98b.firebaseapp.com",
  projectId: "game-project-6e98b",
  storageBucket: "game-project-6e98b.firebasestorage.app",
  messagingSenderId: "540550416195",
  appId: "1:540550416195:web:044210bccea857bf3911f6",
  measurementId: "G-BFWVD9XKKW",
};

const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);
export const db = getFirestore(app);

