// ../js/waitlist-handler.js
import { db } from "./script.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export function initWaitlist() {
    const openBtn = document.getElementById('open-waitlist');
    const closeBtn = document.getElementById('close-popup');
    const overlay = document.getElementById('popup-overlay');
    const waitlistForm = document.getElementById('waitlist-form');

    if (!overlay) return;

    // --- Modal Controls ---
    const openPopup = (e) => {
        if (e) e.preventDefault();
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    };

    const closePopup = () => {
        overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    };

    if (openBtn) openBtn.onclick = openPopup;
    if (closeBtn) closeBtn.onclick = closePopup;

    // Close when clicking outside the modal box
    overlay.onclick = (e) => {
        if (e.target === overlay) closePopup();
    };

    // --- Firebase Submission ---
    if (waitlistForm) {
        waitlistForm.onsubmit = async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('email-input');
            const submitBtn = document.getElementById('submit-btn');

            if (!emailInput || !emailInput.value) return;

            // Loading State
            submitBtn.innerText = "Joining...";
            submitBtn.disabled = true;

            try {
                await addDoc(collection(db, "waitlist"), {
                    email: emailInput.value.trim().toLowerCase(),
                    timestamp: serverTimestamp(),
                    status: "pending"
                });

                // Success UI Transition
                document.getElementById('form-container').style.display = 'none';
                document.getElementById('success-message').style.display = 'block';

                // Auto-close after 3 seconds
                setTimeout(closePopup, 3000);

            } catch (error) {
                console.error("Waitlist Error:", error);
                alert("Something went wrong. Please try again.");
                submitBtn.innerText = "Notify Me";
                submitBtn.disabled = false;
            }
        };
    }
}