// ../js/script.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getFirestore, collection, addDoc, serverTimestamp, query,
    orderBy, onSnapshot, where, doc, setDoc, getDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
    getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
    signInWithEmailAndPassword, signOut, GoogleAuthProvider,
    signInWithPopup, setPersistence, browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Internal Module Imports
import { firebaseConfig, RZP_KEY_ID } from "./config.js";
import { pages } from "./pages.js";
import { initAIRecommender } from "./ai-handler.js";
import { initCookieConsent } from "./cookie-handler.js";
import { initDiscordChat } from "./chat-engine.js";
import { initTeamManagement } from "./team-handler.js";

// --- 1. INITIALIZATION ---
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Enable Auth Persistence
setPersistence(auth, browserLocalPersistence)
    .then(() => console.log("FlowTide: Auth persistence enabled."))
    .catch((error) => console.error(`Auth Error: ${error.message}`));

// --- 2. AUTHENTICATION HANDLERS ---
// Inside ../js/script.js

async function handleSignUp(email, password) {
    // 1. Check the URL for a team/company ID from an invitation link
    const urlParams = new URLSearchParams(window.location.search);
    const inviteCompanyId = urlParams.get('companyId');

    try {
        const res = await createUserWithEmailAndPassword(auth, email, password);

        // 2. Define the company logic: 
        // If they have an invite, use that ID. 
        // If not, they are a 'Founder', so their own UID becomes the companyId.
        const myCompanyId = inviteCompanyId || res.user.uid;

        await setDoc(doc(db, "users", res.user.uid), {
            email: email,
            companyId: myCompanyId,
            role: inviteCompanyId ? "member" : "admin",
            createdAt: serverTimestamp()
        });

        // 3. If they are a new Founder (no invite), create the Company document
        if (!inviteCompanyId) {
            await setDoc(doc(db, "companies", res.user.uid), {
                ownerId: res.user.uid,
                tokens: 5000, // Initial shared tokens
                storageUsed: 0,
                plan: "free"
            });
        }

        window.location.href = '/main';
    } catch (err) {
        alert(err.message);
    }
}

export async function handleGoogleLogin() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
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
        window.location.href = '/main';
    } catch (err) {
        if (err.code !== 'auth/popup-closed-by-user') alert(err.message);
    }
}

export async function handleLogin(email, password) {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.reload();
    } catch (err) { alert(err.message); }
}

// Expose to window for HTML onclick
window.loginWithGoogle = handleGoogleLogin;
window.handleLogin = handleLogin;
window.handleSignUp = handleSignUp;

// --- 3. SPA ENGINE (Routing & UI) ---

function loadPageContent(pageKey) {
    const content = document.getElementById('app-content');
    if (!content || !pages[pageKey]) return;

    content.innerHTML = pages[pageKey];

    // Re-initialize specific scripts for the new HTML content
    if (pageKey === 'chat') initDiscordChat();
    if (pageKey === 'ai') initAIRecommender();
    if (pageKey === 'team') initTeamManagement();
    if (pageKey === 'pricing') initPricingLogic();
}

// Global Auth State Observer
onAuthStateChanged(auth, async (user) => {
    const navUl = document.querySelector('.navbar ul');
    const path = window.location.pathname;

    if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.exists() ? userDoc.data() : null;
        const userPlan = userData?.plan || 'free';

        // Redirection Logic
        const isPublicPage = path.includes('pricing') || path.includes('contact') || path.includes('legal');
        if (userPlan === 'free' && !isPublicPage && path.includes('main')) {
            window.location.href = '/pricing';
            return;
        }

        if (navUl) {
            navUl.innerHTML = `
                <li><a href="/home">Home</a></li>
                <li><a href="/main">Architect</a></li>
                <li><a href="/pricing">Pricing</a></li>
                <li><a href="#" id="nav-logout">Logout</a></li>`;
            document.getElementById('nav-logout').onclick = () => signOut(auth).then(() => window.location.href = "/home");
        }
    } else {
        if (navUl) {
            navUl.innerHTML = `
                <li><a href="/home">Home</a></li>
                <li><a href="/pricing">Pricing</a></li>
                <li><button class="btn-login-nav" onclick="openAuthModal()">Login</button></li>`;
        }
    }
});

// --- 4. PRICING & PAYMENT LOGIC ---

function initPricingLogic() {
    const plans = [
        { id: 's', margin: 500, sRate: 10, aRate: 50 },
        { id: 'p', margin: 1500, sRate: 8, aRate: 40 },
        { id: 'e', margin: 2500, sRate: 5, aRate: 30 }
    ];

    plans.forEach(plan => {
        const sSlider = document.getElementById(`${plan.id}-storage`);
        const aSlider = document.getElementById(`${plan.id}-api`);
        const pDisplay = document.getElementById(`${plan.id}-price`);
        if (!sSlider || !aSlider || !pDisplay) return;

        const update = () => {
            const total = plan.margin + (parseInt(sSlider.value) * plan.sRate) + (parseInt(aSlider.value) * plan.aRate);
            pDisplay.innerText = total.toLocaleString('en-IN');

            const sValLabel = document.getElementById(`${plan.id}-storage-val`);
            const aValLabel = document.getElementById(`${plan.id}-api-val`);
            if (sValLabel) sValLabel.innerText = sSlider.value;
            if (aValLabel) aValLabel.innerText = aSlider.value;
        };
        sSlider.oninput = update;
        aSlider.oninput = update;
        update();
    });
}

export async function processPayment(planName, amount) {
    if (!auth.currentUser) return window.openAuthModal();
    try {
        const response = await fetch('/api/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, planName })
        });
        const order = await response.json();
        const options = {
            key: RZP_KEY_ID,
            amount: order.amount,
            currency: "INR",
            name: "FlowTide",
            order_id: order.id,
            handler: async (res) => {
                await updateDoc(doc(db, "users", auth.currentUser.uid), {
                    plan: planName,
                    upgradedAt: serverTimestamp()
                });
                window.location.href = '/main';
            }
        };
        new window.Razorpay(options).open();
    } catch (err) { alert("Payment error: " + err.message); }
}
window.processPayment = processPayment;

// --- 5. LIFECYCLE & EVENT LISTENERS ---

window.openAuthModal = () => {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.style.display = 'flex';
};
window.closeAuthModal = () => {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.style.display = 'none';
};

document.addEventListener('DOMContentLoaded', () => {
    initCookieConsent();
    const path = window.location.pathname;
    const appContainer = document.getElementById('app-content');

    // Default view for Dashboard
    if (appContainer && path.includes('main')) {
        loadPageContent('dashboard');
    }
    if (path.includes('pricing')) {
        initPricingLogic();
    }
});

document.addEventListener('click', (e) => {
    // Sidebar Navigation
    const navItem = e.target.closest('.nav-item');
    if (navItem) {
        const page = navItem.getAttribute('data-page');
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        navItem.classList.add('active');
        loadPageContent(page);
    }

    // Auth Modal Toggle & Submit
    if (e.target.id === 'auth-toggle') {
        const submit = document.getElementById('auth-submit');
        const isLogin = submit.innerText === "Login";
        submit.innerText = isLogin ? "Sign Up" : "Login";
        document.getElementById('auth-title').innerText = isLogin ? "Create Account" : "Welcome Back";
        e.target.innerText = isLogin ? "Already have an account? Login" : "Need an account? Sign Up";
    }

    if (e.target.id === 'auth-submit') {
        const email = document.getElementById('auth-email').value;
        const pass = document.getElementById('auth-password').value;
        const mode = e.target.innerText;
        mode === "Login" ? handleLogin(email, pass) : handleSignUp(email, pass);
    }
});