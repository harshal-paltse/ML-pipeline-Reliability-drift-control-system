/**
 * Firebase configuration.
 *
 * All values are read from environment variables so no credentials
 * are ever committed to version control.
 *
 * Set the following in your .env file (copy from .env.example):
 *   REACT_APP_FIREBASE_API_KEY
 *   REACT_APP_FIREBASE_AUTH_DOMAIN
 *   REACT_APP_FIREBASE_PROJECT_ID
 *   REACT_APP_FIREBASE_STORAGE_BUCKET
 *   REACT_APP_FIREBASE_MESSAGING_SENDER_ID
 *   REACT_APP_FIREBASE_APP_ID
 *   REACT_APP_FIREBASE_DATABASE_URL  (optional — only if using Realtime DB)
 */
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
};

// Only initialise if the required config is present (avoids errors in CI / local dev without Firebase)
const app = firebaseConfig.apiKey ? initializeApp(firebaseConfig) : null;

export const database = app ? getDatabase(app) : null;
export default app;
