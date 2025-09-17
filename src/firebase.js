import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// GANTI DENGAN CONFIG ANDA DARI FIREBASE CONSOLE
const firebaseConfig = {
  apiKey: "AIzaSyCEffJGt_SY9vwVnq5k3jfI5Y1N45sowi0",
  authDomain: "invoice-lababil.firebaseapp.com",
  projectId: "invoice-lababil",
  storageBucket: "invoice-lababil.firebasestorage.app",
  messagingSenderId: "839583838842",
  appId: "1:839583838842:web:cd0613f72987042383c1c3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
