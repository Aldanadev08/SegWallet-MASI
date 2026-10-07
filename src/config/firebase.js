import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyD8GzKoOXrF2ROe2AoD3aK_RKe5n2e87vQ",
  authDomain: "segwalletmasi.firebaseapp.com",
  projectId: "segwalletmasi",
  storageBucket: "segwalletmasi.firebasestorage.app",
  messagingSenderId: "818283772375",
  appId: "1:818283772375:web:a6c269b207692287c07392",
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);