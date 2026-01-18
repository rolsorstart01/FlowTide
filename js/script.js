// Import the necessary Firebase SDK functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA72C67ZUUcQYdXlzmojvglxkuV8PxUcag",
    authDomain: "forgecodefirebase.firebaseapp.com",
    projectId: "forgecodefirebase",
    storageBucket: "forgecodefirebase.firebasestorage.app",
    messagingSenderId: "343783791551",
    appId: "1:343783791551:web:c9887aa925dd8eec1e9f0a",
    measurementId: "G-JBKJ2YFLHQ"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// --- DOM Elements ---
const overlay = document.getElementById('popup-overlay');
const openBtn = document.getElementById('open-waitlist');
const closeBtn = document.getElementById('close-popup');
const waitlistForm = document.getElementById('waitlist-form');
const formContainer = document.getElementById('form-container');
const successMessage = document.getElementById('success-message');
const emailInput = document.getElementById('email-input');
const submitBtn = document.getElementById('submit-btn');

// --- Popup UI Logic ---

// Open the modal when "Join the Waitlist" or "Get Started" is clicked
if (openBtn) {
    openBtn.onclick = (e) => {
        e.preventDefault();
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    };
}

// Close the modal when the 'X' is clicked
if (closeBtn) {
    closeBtn.onclick = () => {
        closeModal();
    };
}

// Close the modal when clicking outside of the white box
window.onclick = (e) => {
    if (e.target === overlay) {
        closeModal();
    }
};

function closeModal() {
    overlay.style.display = 'none';
    document.body.style.overflow = 'auto'; // Re-enable scrolling
}

// --- Firestore Submission Logic ---

waitlistForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailValue = emailInput.value.trim();

    // Visual feedback for the user
    submitBtn.innerText = "Joining...";
    submitBtn.disabled = true;

    try {
        // Create a new document in the "waitlist" collection
        // This matches the security rule: match /waitlist/{entry} { allow create: if true; }
        await addDoc(collection(db, "waitlist"), {
            email: emailValue,
            joinedAt: serverTimestamp(),
            status: "active",
            source: window.location.hostname
        });

        // Hide the form and show the success message
        formContainer.style.display = 'none';
        successMessage.style.display = 'block';

        // Log an event for analytics
        console.log("Success: Email saved to Firestore.");

    } catch (error) {
        console.error("Firebase Error:", error);
        alert("Oops! We couldn't add you to the list. Please check your internet or Firebase Firestore rules.");

        // Reset button if there's an error
        submitBtn.innerText = "Notify Me";
        submitBtn.disabled = false;
    }
});