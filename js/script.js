// ../js/script.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getFirestore, collection, addDoc, serverTimestamp, query,
    orderBy, onSnapshot, where, doc, setDoc, updateDoc, getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
    getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
    signInWithEmailAndPassword, signOut,
    GoogleAuthProvider, signInWithPopup
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

export async function handleGoogleLogin() {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Check if user exists in Firestore, if not, create them
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            await setDoc(userDocRef, {
                email: user.email,
                displayName: user.displayName || '',
                photoURL: user.photoURL || '',
                plan: 'free',
                createdAt: serverTimestamp()
            });
        }
        window.location.reload();
    } catch (err) {
        if (err.code !== 'auth/popup-closed-by-user') {
            console.error("Google Auth Error:", err);
            alert(err.message);
        }
    }
}

// Expose to window for the button click
window.loginWithGoogle = handleGoogleLogin;

export async function handleLogin(email, password) {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.reload();
    } catch (err) { alert(err.message); }
}

// --- 2. DYNAMIC NAVBAR & AUTH REDIRECT (PLAN GATE) ---

onAuthStateChanged(auth, async (user) => {
    const navUl = document.querySelector('.navbar ul');
    const path = window.location.pathname;

    if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.exists() ? userDoc.data() : null;
        const userPlan = userData ? userData.plan : 'free';

        // Redirection Logic
        const isAllowedPage = path.includes('pricing') || path.includes('contact') || path.includes('legal');

        // OWNER BYPASS: If you are the owner, skip all restrictions
        if (userPlan === 'Owner') {
            console.log("God Mode Active: Welcome, Architect.");
        }
        // STANDARD GATE: Redirect free users
        else if (userPlan === 'free' && !isAllowedPage) {
            console.log("Access Denied: Free plan detected. Redirecting to Pricing...");
            window.location.href = '/pricing';
            return;
        }

        if (navUl) {
            navUl.innerHTML = `
                <li><a href="/home">Home</a></li>
                <li><a href="/main">Architect</a></li>
                <li><a href="/pricing">Pricing</a></li>
                <li><a href="#" id="nav-logout">Logout</a></li>
            `;
            const logoutBtn = document.getElementById('nav-logout');
            if (logoutBtn) logoutBtn.onclick = () => signOut(auth).then(() => window.location.href = "/home");
        }

        // Special UI Feedback for Owner
        if (userPlan === 'Owner') {
            const avatar = document.querySelector('.avatar');
            if (avatar) {
                avatar.style.border = '2px solid #ff3e3e';
                avatar.title = 'System Architect Mode';

                // If using Google, show profile pic
                if (userData.photoURL) {
                    avatar.style.backgroundImage = `url(${userData.photoURL})`;
                    avatar.style.backgroundSize = 'cover';
                    avatar.innerText = '';
                }
            }
        }
    } else {
        if (navUl) {
            navUl.innerHTML = `
                <li><a href="/home">Home</a></li>
                <li><a href="/pricing">Pricing</a></li>
                <li><a href="/contact">Contact</a></li>
                <li><button class="btn-login-nav" onclick="openAuthModal()">Login</button></li>
            `;
        }
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

            // Check for Owner/Unlimited display logic
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
    if (!auth.currentUser) return openAuthModal();

    try {
        const cleanAmount = typeof amount === 'string'
            ? parseInt(amount.replace(/[^0-9]/g, ''))
            : Math.round(amount);

        const response = await fetch('/api/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: cleanAmount, planName })
        });

        const order = await response.json();

        const options = {
            key: RZP_KEY_ID,
            amount: order.amount,
            currency: "INR",
            name: "FlowTide",
            description: `Upgrade to ${planName}`,
            order_id: order.id,
            handler: async (res) => {
                await updateDoc(doc(db, "users", auth.currentUser.uid), {
                    plan: planName,
                    paymentId: res.razorpay_payment_id,
                    upgradedAt: serverTimestamp()
                });
                alert("Success! Your plan has been upgraded.");
                window.location.href = '/main';
            },
            theme: { color: "#00d2ff" }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
    } catch (err) { alert("Payment error: " + err.message); }
}

// --- 4. NAVIGATION & CHAT (SPA) ---

function loadPage(pageKey) {
    const content = document.getElementById('app-content');
    if (content && pages[pageKey]) {
        content.innerHTML = pages[pageKey];
    }
    if (pageKey === 'chat') initForgeChat();
    if (pageKey === 'ai') initAIRecommender();
    if (pageKey === 'pricing') initPricingLogic();
}

function initForgeChat() {
    const list = document.getElementById('channel-list');
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
}

function switchChannel(id, name) {
    activeChannelId = id;
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

// --- 5. GLOBAL INITIALIZATION & MODAL HANDLERS ---

window.openAuthModal = () => {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.style.display = 'flex';
    else window.location.href = '/home?auth=login';
};

window.closeAuthModal = () => {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.style.display = 'none';
};

document.addEventListener('click', (e) => {
    const navItem = e.target.closest('.nav-item');
    if (navItem) {
        const page = navItem.getAttribute('data-page');
        loadPage(page);
    }

    if (e.target.id === 'auth-submit') {
        const email = document.getElementById('auth-email').value;
        const pass = document.getElementById('auth-password').value;
        const isLogin = e.target.innerText === "Login";
        isLogin ? handleLogin(email, pass) : handleSignUp(email, pass);
    }

    if (e.target.id === 'auth-toggle') {
        const title = document.getElementById('auth-title');
        const submit = document.getElementById('auth-submit');
        const toggle = document.getElementById('auth-toggle');
        const isCurrentlyLogin = submit.innerText === "Login";

        title.innerText = isCurrentlyLogin ? "Create Account" : "Welcome Back";
        submit.innerText = isCurrentlyLogin ? "Sign Up" : "Login";
        toggle.innerText = isCurrentlyLogin ? "Already have an account? Login" : "Need an account? Sign Up";
    }
});

window.onload = () => {
    initCookieConsent();

    const path = window.location.pathname;
    const appContainer = document.getElementById('app-content');

    // Conditional Initialization to prevent errors on index.html
    if (path.includes('pricing') || document.getElementById('s-storage')) {
        initPricingLogic();
    }
    else if (appContainer && !path.includes('contact') && !path.includes('legal')) {
        loadPage('dashboard');
    }
};