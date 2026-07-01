import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCBYnjsBMJGeR57Kk3FX9zeIplE5EFkcIY",
  authDomain: "gmb24-raa.firebaseapp.com",
  databaseURL: "https://gmb24-raa-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gmb24-raa",
  storageBucket: "gmb24-raa.firebasestorage.app",
  messagingSenderId: "558507911211",
  appId: "1:558507911211:web:5cdc99c082fe653684626e",
  measurementId: "G-KVHFHTJVFN"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence).catch(() => {});
export default app;
