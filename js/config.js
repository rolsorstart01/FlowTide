// ../js/config.js
export const firebaseConfig = {
  // If we are on localhost, use the real key. If not, Vercel handles it via environment variables.
  apiKey: window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost"
    ? "AIzaSyA72C67ZUUcQYdXlzmojvglxkuV8PxUcag"
    : "REPLACE_WITH_FIREBASE_KEY",
  authDomain: "forgecodefirebase.firebaseapp.com",
  projectId: "forgecodefirebase",
  storageBucket: "forgecodefirebase.firebasestorage.app",
  messagingSenderId: "343783791551",
  appId: "1:343783791551:web:c9887aa925dd8eec1e9f0a",
  measurementId: "G-JBKJ2YFLHQ"
};

export const RZP_KEY_ID = "rzp_live_S61J7p7YKjOlxz";

export const currentUser = {
  id: "user_001",
  name: "Founder",
  companyId: "forge_internal_team"
};