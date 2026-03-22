import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// ⚠️ APNE FIREBASE PROJECT KI KEYS YAHAN DAALEIN
// Firebase Console → Project Settings → Your Apps → Web App → Config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyASupKbTu4bzFfVjUun2yd1C9zluk0CJV0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "daily-routine-app-cb077.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "daily-routine-app-cb077",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "daily-routine-app-cb077.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "523385315207",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:523385315207:web:9b34e29624924f5b01bd22",
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
