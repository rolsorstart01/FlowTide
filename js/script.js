// ../js/script.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getFirestore, collection, addDoc, serverTimestamp, query,
    orderBy, onSnapshot, where, doc, setDoc, getDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    setPersistence,
    browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Internal Module Imports
import { firebaseConfig, RZP_KEY_ID, currentUser as legacyUser } from "./config.js";
import { pages } from "./pages.js";
import { initAIRecommender } from "./ai-handler.js";
import { initCookieConsent } from "./cookie-handler.js";
import { initDiscordChat } from "./chat-engine.js";

// --- 1. INITIALIZATION ---
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence)
    .then(() => console.log("FlowTide: Auth persistence enabled."))
    .catch((error) => console.error(`Auth Error: ${error.message}`));

// --- 2. AUTHENTICATION LOGIC ---

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

// Expose to window for HTML onclicks
window.loginWithGoogle = handleGoogleLogin;
window.handleLogin = handleLogin;
window.handleSignUp = handleSignUp;

// --- 3. THE SPA ENGINE (Routing) ---

const loadPageContent = (pageKey) => {
    const content = document.getElementById('app-content');
    if (!content) return;

    console.log(`Switching to: ${pageKey}`);

    // Load HTML from pages.js
    if (pages && pages[pageKey]) {
        content.innerHTML = pages[pageKey];
    } else {
        content.innerHTML = '<h1>Page Not Found</h1>';
    }

    // Initialize specific logic based on the page
    // Note: initDiscordChat is imported from chat-engine.js
    switch (pageKey) {
        case 'chat':
            initDiscordChat();
            break;
        case 'ai':
            initAIRecommender();
            break;
        case 'pricing':
            initPricingLogic();
            break;
    }
};

const initNavigation = () => {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            const page = item.getAttribute('data-page');
            loadPageContent(page);
        });
    });
};

// --- 4. SUBSCRIPTION & UI LOGIC ---

onAuthStateChanged(auth, async (user) => {
    const navUl = document.querySelector('.navbar ul');
    const path = window.location.pathname;

    if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.exists() ? userDoc.data() : null;
        const userPlan = userData ? userData.plan : 'free';

        // Plan Gate
        const isAllowedPage = path.includes('pricing') || path.includes('contact') || path.includes('legal');
        if (userPlan === 'free' && !isAllowedPage && path.includes('main')) {
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
            document.getElementById('nav-logout').onclick = () => signOut(auth).then(() => window.location.href = "/home");
        }
    } else {
        if (navUl) {
            navUl.innerHTML = `
                <li><a href="/home">Home</a></li>
                <li><a href="/pricing">Pricing</a></li>
                <li><button class="btn-login-nav" onclick="openAuthModal()">Login</button></li>
            `;
        }
    }
});

// Pricing Sliders Logic
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

// --- 5. GLOBAL HANDLERS ---

window.openAuthModal = () => {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.style.display = 'flex';
};

window.closeAuthModal = () => {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.style.display = 'none';
};

// --- 6. LIFECYCLE INITIALIZATION ---

document.addEventListener('DOMContentLoaded', () => {
    initCookieConsent();
    initNavigation();

    const path = window.location.pathname;
    const appContainer = document.getElementById('app-content');

    // Default view for /main
    if (appContainer && path.includes('main')) {
        loadPageContent('dashboard');
    }

    // Auto-init pricing if on pricing page
    if (path.includes('pricing')) {
        initPricingLogic();
    }
});