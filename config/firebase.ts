// Import the functions you need from the SDKs you need

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAZa-gPTJjP1OtwO-3n5i7oufSjdeOVDjU",
  authDomain: "rockethacks-5d109.firebaseapp.com",
  projectId: "rockethacks-5d109",
  storageBucket: "rockethacks-5d109.firebasestorage.app",
  messagingSenderId: "137864080128",
  appId: "1:137864080128:web:d415a6006ecdf0dd1b21e5",
  measurementId: "G-DSSZ4YMRCD"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
 
export const auth = getAuth(app);
export const db = getFirestore(app);
 

