// ../js/script.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getFirestore, collection, addDoc, serverTimestamp, query,
    orderBy, onSnapshot, where, doc, setDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
    getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
    signInWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { firebaseConfig, RZP_KEY_ID, currentUser as legacyUser } from "./config.js";
import { pages } from "./pages.js";
import { initAIRecommender } from "./ai-handler.js";
import { initCookieConsent } from "./cookie-handler.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

let activeChannelId = null;
let unsubscribeMessages = null;

// --- 1. AUTHENTICATION LOGIC ---

export async function handleSignUp(email, password) {
    try {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", res.user.uid), {
            email: email,
            plan: 'free',
            createdAt: serverTimestamp()
        });
        window.location.reload();
    } catch (err) { alert(err.message); }
}

export async function handleLogin(email, password) {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.reload();
    } catch (err) { alert(err.message); }
}

// --- 2. DYNAMIC NAVBAR & UI STATE ---

onAuthStateChanged(auth, (user) => {
    const navUl = document.querySelector('.navbar ul');
    if (!navUl) return;

    if (user) {
        navUl.innerHTML = `
            <li><a href="/home">Home</a></li>
            <li><a href="/main">Architect</a></li>
            <li><a href="/pricing">Pricing</a></li>
            <li><a href="#" id="nav-logout">Logout</a></li>
        `;
        const logoutBtn = document.getElementById('nav-logout');
        if (logoutBtn) logoutBtn.onclick = () => signOut(auth).then(() => window.location.reload());
    } else {
        navUl.innerHTML = `
            <li><a href="/home">Home</a></li>
            <li><a href="/pricing">Pricing</a></li>
            <li><a href="/contact">Contact</a></li>
            <li><button class="btn-login-nav" onclick="openAuthModal()">Login</button></li>
        `;
    }
});

// --- 3. PRICING & PAYMENTS ---

function initPricingLogic() {
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
            pDisplay.innerText = total.toLocaleString('en-IN');
        };

        sSlider.oninput = update;
        aSlider.oninput = update;
        update();
    };

    setupSlider('s', 500, 10, 50);
    setupSlider('p', 1500, 8, 40);
    setupSlider('e', 2500, 5, 30);
}

export async function processPayment(planName, amount) {
    if (!auth.currentUser) {
        alert("Please login to upgrade.");
        return openAuthModal();
    }

    try {
        // --- FIX: STRIP COMMAS & CONVERT TO NUMBER ---
        const cleanAmount = typeof amount === 'string'
            ? parseInt(amount.replace(/[^0-9]/g, ''))
            : Math.round(amount);

        if (isNaN(cleanAmount)) throw new Error("Invalid amount");

        const response = await fetch('/api/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: cleanAmount, planName })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Server Error");
        }

        const order = await response.json();

        const options = {
            key: RZP_KEY_ID,
            amount: order.amount,
            currency: "INR",
            name: "FlowTide",
            description: `Plan: ${planName}`,
            order_id: order.id,
            handler: async (res) => {
                await updateDoc(doc(db, "users", auth.currentUser.uid), {
                    plan: planName,
                    paymentId: res.razorpay_payment_id
                });
                alert("Success! Welcome to " + planName);
                window.location.reload();
            },
            theme: { color: "#00d2ff" }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();

    } catch (err) {
        console.error("RZP Initialization Error:", err);
        alert("Payment initialization failed: " + err.message);
    }
}

// --- 4. NAVIGATION & CHAT (SPA) ---

function loadPage(pageKey) {
    const content = document.getElementById('app-content');
    if (content && pages[pageKey]) {
        content.innerHTML = pages[pageKey];
        content.className = 'page-animate';
    }
    if (pageKey === 'chat') initForgeChat();
    if (pageKey === 'ai') initAIRecommender();
    if (pageKey === 'pricing') initPricingLogic();
}

function initForgeChat() {
    const list = document.getElementById('channel-list');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');

    if (!list) return;

    const q = query(collection(db, "channels"), where("companyId", "==", legacyUser.companyId), orderBy("name", "asc"));
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

    if (chatForm) {
        chatForm.onsubmit = async (e) => {
            e.preventDefault();
            if (!activeChannelId || !chatInput.value.trim()) return;

            const text = chatInput.value;
            chatInput.value = "";

            await addDoc(collection(db, "channels", activeChannelId, "messages"), {
                text: text,
                senderId: auth.currentUser?.uid || legacyUser.id,
                senderName: auth.currentUser?.email.split('@')[0] || legacyUser.name,
                timestamp: serverTimestamp()
            });
        };
    }
}

function switchChannel(id, name) {
    activeChannelId = id;
    const nameHeader = document.getElementById('active-channel-name');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');

    if (nameHeader) nameHeader.innerText = `# ${name}`;
    if (chatInput) chatInput.disabled = false;
    if (sendBtn) sendBtn.disabled = false;

    if (unsubscribeMessages) unsubscribeMessages();
    const msgQuery = query(collection(db, "channels", id, "messages"), orderBy("timestamp", "asc"));

    unsubscribeMessages = onSnapshot(msgQuery, (snapshot) => {
        const stream = document.getElementById('message-stream');
        if (!stream) return;
        stream.innerHTML = "";
        snapshot.forEach(docSnap => {
            const msg = docSnap.data();
            const isMe = msg.senderId === (auth.currentUser?.uid || legacyUser.id);
            stream.insertAdjacentHTML('beforeend', `
                <div class="message-row ${isMe ? 'me' : 'them'}">
                    <div class="bubble">
                        <small>${msg.senderName}</small>
                        <p>${msg.text}</p>
                    </div>
                </div>`);
        });
        stream.scrollTop = stream.scrollHeight;
    });
}

// --- 5. INITIALIZATION ---

document.addEventListener('click', (e) => {
    const navItem = e.target.closest('.nav-item');
    if (navItem) {
        const page = navItem.getAttribute('data-page');
        loadPage(page);
    }
});

window.onload = () => {
    initCookieConsent();

    window.openAuthModal = () => {
        const modal = document.getElementById('auth-modal');
        if (modal) modal.style.display = 'flex';
    };
    window.closeAuthModal = () => {
        const modal = document.getElementById('auth-modal');
        if (modal) modal.style.display = 'none';
    };

    const appContainer = document.getElementById('app-content');
    const path = window.location.pathname;

    const isStaticPage = path === '/' || path.endsWith('index.html') || path.endsWith('contact.html') || path.includes('/legal/');

    if (appContainer && !isStaticPage) {
        if (path.includes('pricing.html')) {
            initPricingLogic();
        } else {
            loadPage('dashboard');
        }
    }

    if (document.getElementById('s-storage')) {
        initPricingLogic();
    }
};