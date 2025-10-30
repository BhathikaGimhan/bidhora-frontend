import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDSYkEBXYA0wRwL3uvwqz-gBFhUCDfL7FM",
  authDomain: "bidhora.firebaseapp.com",
  projectId: "bidhora",
  storageBucket: "bidhora.firebasestorage.app",
  messagingSenderId: "961586153701",
  appId: "1:961586153701:web:60d97885578e3634846c0c"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;