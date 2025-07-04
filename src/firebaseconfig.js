import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBbI6ZsOKlUAJfOZplfEqltkm-nwNZe41w",
  authDomain: "mini-foro-c4924.firebaseapp.com",
  projectId: "mini-foro-c4924",
  storageBucket: "mini-foro-c4924.firebasestorage.app",
  messagingSenderId: "679515058037",
  appId: "1:679515058037:web:9a330aa41046de83bded3c"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Obtiene los servicios
const auth = getAuth(app);
const storage = getStorage(app);
const db = getFirestore(app);

// Exporta todos los servicios necesarios
export { app, auth, storage, db };