// 1. Import necessary Firebase SDK functions with the correct full CDN paths
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

// Import your config from your local config.js file
import { firebaseConfig } from "./config.js";

// 2. Initialize Firebase services
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// --- DOM ELEMENTS: WAITLIST POPUP ---
const waitlistOverlay = document.getElementById('popup-overlay');
const openWaitlistBtn = document.getElementById('open-waitlist');
const closeWaitlistBtn = document.getElementById('close-popup');
const waitlistForm = document.getElementById('waitlist-form');
const waitlistFormContainer = document.getElementById('form-container');
const waitlistSuccessMsg = document.getElementById('success-message');
const waitlistEmailInput = document.getElementById('email-input');
const waitlistSubmitBtn = document.getElementById('submit-btn');

// --- DOM ELEMENTS: CONTACT FORM & SUCCESS POPUP ---
const contactForm = document.querySelector('.contact-form');
const contactSuccessOverlay = document.getElementById('contact-success-overlay');
const closeContactPopupBtn = document.getElementById('close-contact-popup');

// --- UI LOGIC: MODAL FUNCTIONS ---

/**
 * Closes all active overlays and restores background scrolling
 */
function closeAllModals() {
    if (waitlistOverlay) waitlistOverlay.style.display = 'none';
    if (contactSuccessOverlay) contactSuccessOverlay.style.display = 'none';
    document.body.style.overflow = 'auto';
}

/**
 * Opens the Waitlist Overlay
 */
if (openWaitlistBtn) {
    openWaitlistBtn.onclick = (e) => {
        e.preventDefault();
        if (waitlistOverlay) {
            waitlistOverlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    };
}

// Attach Close Logic to Buttons
if (closeWaitlistBtn) closeWaitlistBtn.onclick = () => closeAllModals();
if (closeContactPopupBtn) closeContactPopupBtn.onclick = () => closeAllModals();

// Close on background click (if user clicks the dark area)
window.onclick = (e) => {
    if (e.target === waitlistOverlay || e.target === contactSuccessOverlay) {
        closeAllModals();
    }
};

// --- FIRESTORE LOGIC 1: WAITLIST SUBMISSION ---

if (waitlistForm) {
    waitlistForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailValue = waitlistEmailInput.value.trim();

        waitlistSubmitBtn.innerText = "Joining...";
        waitlistSubmitBtn.disabled = true;

        try {
            // Save to "waitlist" collection (Matches your Rule #1)
            await addDoc(collection(db, "waitlist"), {
                email: emailValue,
                joinedAt: serverTimestamp(),
                status: "active",
                source: window.location.hostname
            });

            // Show inline success message inside the popup
            if (waitlistFormContainer) waitlistFormContainer.style.display = 'none';
            if (waitlistSuccessMsg) waitlistSuccessMsg.style.display = 'block';

        } catch (error) {
            console.error("Waitlist Error:", error);
            alert("Could not join waitlist. Check console for details.");
            waitlistSubmitBtn.innerText = "Notify Me";
            waitlistSubmitBtn.disabled = false;
        }
    });
}

// --- FIRESTORE LOGIC 2: CONTACT FORM SUBMISSION ---

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Retrieve data from your HTML IDs
        const nameVal = document.getElementById('name').value.trim();
        const emailVal = document.getElementById('email').value.trim();
        const messageVal = document.getElementById('message').value.trim();
        const submitBtn = contactForm.querySelector('.submit-btn');

        // Visual feedback
        submitBtn.innerText = "Sending...";
        submitBtn.disabled = true;

        try {
            // Save to "messages" collection (Matches your Rule #2)
            await addDoc(collection(db, "messages"), {
                fullName: nameVal,
                email: emailVal,
                message: messageVal,
                submittedAt: serverTimestamp()
            });

            // 1. Reset the form fields
            contactForm.reset();

            // 2. Show the Success Popup and Lock Scroll
            if (contactSuccessOverlay) {
                contactSuccessOverlay.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            } else {
                alert("Message sent successfully!");
            }

        } catch (error) {
            console.error("Contact Form Error:", error);
            alert("Error sending message. Check console for details.");
        } finally {
            // Reset button text
            submitBtn.innerText = "Send Message";
            submitBtn.disabled = false;
        }
    });
}