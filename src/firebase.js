import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyB0EZsUfj2rAw4UZm9wv_0m09lYwc2F_X0",
  authDomain: "sccreation-b6aa0.firebaseapp.com",
  projectId: "sccreation-b6aa0",
  storageBucket: "sccreation-b6aa0.firebasestorage.app",
  messagingSenderId: "32364190871",
  appId: "1:32364190871:web:42125ce2b67eac6fd19dd2",
  measurementId: "G-C091T01M37"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
