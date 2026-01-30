// ../js/config.js

/**
 * FIREBASE CONFIGURATION
 * In production, these should be managed via Environment Variables.
 * If using Vercel, ensure these are added to the Project Settings.
 */
export const firebaseConfig = {
  // This will be replaced by your CI/CD pipeline or stay as the env variable
  apiKey: "process.env.REPLACE_WITH_FIREBASE_KEY",
  authDomain: "forgecodefirebase.firebaseapp.com",
  projectId: "forgecodefirebase",
  storageBucket: "forgecodefirebase.firebasestorage.app",
  messagingSenderId: "343783791551",
  appId: "1:343783791551:web:c9887aa925dd8eec1e9f0a",
  measurementId: "G-JBKJ2YFLHQ"
};

// Razorpay Key
export const RZP_KEY_ID = "rzp_live_S61J7p7YKjOlxz";

// User Session Default
export const currentUser = {
  id: "user_001",
  name: "Founder",
  companyId: "forge_internal_team"
};