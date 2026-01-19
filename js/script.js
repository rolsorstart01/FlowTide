import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getFirestore, collection, addDoc, serverTimestamp, query,
    orderBy, onSnapshot, where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { firebaseConfig, currentUser } from "./config.js";
import { pages } from "./pages.js";
import { initAIRecommender } from "./ai-handler.js";
import { initCookieConsent } from "./cookie-handler.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// EXPORT db so index.html/contact.html can import it for form submissions
export const db = getFirestore(app);

let activeChannelId = null;
let unsubscribeMessages = null;

// --- PRICING LOGIC ---
function initPricingLogic() {
    console.log("Pricing Logic Triggered");

    const setupSlider = (planId, margin, storageRate, apiRate) => {
        const sSlider = document.getElementById(`${planId}-storage`);
        const aSlider = document.getElementById(`${planId}-api`);
        const sDisplay = document.getElementById(`${planId}-storage-val`);
        const aDisplay = document.getElementById(`${planId}-api-val`);
        const pDisplay = document.getElementById(`${planId}-price`);

        if (!sSlider || !aSlider || !pDisplay) return;

        const update = () => {
            const sVal = parseInt(sSlider.value);
            const aVal = parseInt(aSlider.value);

            if (sDisplay) sDisplay.innerText = sVal;
            if (aDisplay) aDisplay.innerText = aVal;

            const total = margin + (sVal * storageRate) + (aVal * apiRate);
            pDisplay.innerText = total.toLocaleString();
        };

        sSlider.addEventListener('input', update);
        aSlider.addEventListener('input', update);
        update();
    };

    // Initialize the three tiers (Starter, Pro, Enterprise)
    setupSlider('s', 500, 10, 150);
    setupSlider('p', 1500, 8, 800);
    setupSlider('e', 2500, 5, 1200);
}

// --- NAVIGATION & CHAT ---
function loadPage(pageKey) {
    const content = document.getElementById('app-content');
    if (content && pages[pageKey]) {
        content.innerHTML = pages[pageKey];
        content.className = 'page-animate';
    }
    // Context-specific initializers
    if (pageKey === 'chat') initForgeChat();
    if (pageKey === 'ai') initAIRecommender();
    if (pageKey === 'pricing') initPricingLogic();
}

function initForgeChat() {
    const list = document.getElementById('channel-list');
    if (!list) return;

    const q = query(
        collection(db, "channels"),
        where("companyId", "==", currentUser.companyId),
        orderBy("name", "asc")
    );

    onSnapshot(q, (snapshot) => {
        list.innerHTML = "";
        snapshot.forEach(docSnap => {
            const div = document.createElement('div');
            div.className = `channel-item ${activeChannelId === docSnap.id ? 'active' : ''}`;
            div.innerHTML = `<i class="ph ph-hash"></i> ${docSnap.data().name}`;
            div.onclick = () => switchChannel(docSnap.id, docSnap.data().name);
            list.appendChild(div);
        });
    });
}

function switchChannel(id, name) {
    activeChannelId = id;
    if (document.getElementById('active-channel-name')) {
        document.getElementById('active-channel-name').innerText = `# ${name}`;
    }

    if (unsubscribeMessages) unsubscribeMessages();

    const msgQuery = query(
        collection(db, "channels", id, "messages"),
        orderBy("timestamp", "asc")
    );

    unsubscribeMessages = onSnapshot(msgQuery, (snapshot) => {
        const stream = document.getElementById('message-stream');
        if (!stream) return;
        stream.innerHTML = "";
        snapshot.forEach(docSnap => {
            const msg = docSnap.data();
            const isMe = msg.senderId === currentUser.id;
            stream.insertAdjacentHTML('beforeend', `
                <div class="message-row ${isMe ? 'me' : 'them'}">
                    <div class="bubble">
                        <small>${msg.senderName}</small>
                        <p>${msg.text}</p>
                    </div>
                </div>
            `);
        });
        stream.scrollTop = stream.scrollHeight;
    });
}

// --- GLOBAL EVENT LISTENERS ---

// Sidebar Navigation click handler
document.addEventListener('click', (e) => {
    const navItem = e.target.closest('.nav-item');
    if (navItem) {
        const page = navItem.getAttribute('data-page');
        loadPage(page);
    }
});

// INITIALIZE ON LOAD
window.onload = () => {
    // 1. Always initialize Cookie Consent
    initCookieConsent();

    const appContainer = document.getElementById('app-content');
    const path = window.location.pathname;

    // 2. Define "Static Pages" where the Dashboard SPA should NOT auto-load.
    // This prevents the script from overwriting your index.html/contact.html content.
    const isStaticPage = path === '/' ||
        path.endsWith('index.html') ||
        path.endsWith('contact.html') ||
        path.includes('/legal/');

    // 3. SPA Route Protection
    if (appContainer && !isStaticPage) {
        // If we are on the dedicated pricing page, just load pricing
        if (path.includes('pricing.html')) {
            initPricingLogic();
        } else {
            // Default behavior for main.html / workspace: load the dashboard
            loadPage('dashboard');
        }
    }

    // 4. Standalone Feature Check 
    // This ensures pricing sliders work if they are hardcoded into any HTML page
    if (document.getElementById('s-storage')) {
        initPricingLogic();
    }
};