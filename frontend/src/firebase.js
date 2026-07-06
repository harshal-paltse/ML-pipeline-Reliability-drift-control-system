import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Mock configuration to allow the app to build.
// Real configuration should be provided by the user.
const firebaseConfig = {
  apiKey: "AIzaSyD-mock-api-key",
  authDomain: "mock-project.firebaseapp.com",
  projectId: "mock-project",
  storageBucket: "mock-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:mock123"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
