import { db, auth } from "./script.js";
import { 
    collection, addDoc, query, where, orderBy, onSnapshot, 
    doc, getDoc, updateDoc, arrayUnion, serverTimestamp, getDocs 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

const API_KEY = "YOUR_GEMINI_API_KEY";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

/**
 * CORE STATE: Tracks active conversation
 */
let currentChatId = null;
let selectedFilesForChat = []; // Temporary hold for files the user picks for the current prompt

/**
 * 1. CHECK API LIMITS & TOKEN USAGE
 */
async function validateUsage(promptText, history) {
    const user = auth.currentUser;
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    // Default limit if not set in pricing-handler
    const limit = userData?.apiLimit || 50000; 
    const used = userData?.tokensUsed || 0;

    if (used >= limit) {
        alert("API Limit Reached! Please upgrade your plan in the Pricing section.");
        return false;
    }

    // Pre-calculate tokens
    const result = await model.countTokens({
        contents: [...history, { role: "user", parts: [{ text: promptText }] }]
    });
    
    return { canProceed: true, estimated: result.totalTokens, currentUsed: used, userRef };
}

/**
 * 2. INITIALIZE AI INTERFACE
 */
export function initAIWorkspace() {
    const input = document.getElementById('ai-user-input');
    const sendBtn = document.getElementById('ai-send-btn');
    const chatWindow = document.getElementById('ai-chat-window');

    if (!input || !sendBtn) return;

    // Load available chats for this team/user
    loadChatSidebar();

    sendBtn.onclick = async () => {
        const text = input.value.trim();
        if (!text || !currentChatId) return;

        // UI: Show loading
        input.value = '';
        const loadingDiv = appendMessage('ai', '<div class="typing-indicator"><span></span><span></span><span></span></div>');

        try {
            // Get History from Firestore
            const historyQ = query(collection(db, "ai_chats", currentChatId, "messages"), orderBy("timestamp", "asc"));
            const historySnap = await getDocs(historyQ);
            const history = historySnap.docs.map(d => ({ role: d.data().role, parts: [{ text: d.data().text }] }));

            // Check Limits
            const usage = await validateUsage(text, history);
            if (!usage.canProceed) return;

            // Prepare Gemini Parts (Text + Files)
            const parts = [{ text: text }];
            for (const file of selectedFilesForChat) {
                const filePart = await urlToGenerativePart(file.url, file.mimeType);
                parts.push(filePart);
            }

            // Call AI
            const chat = model.startChat({ history });
            const result = await chat.sendMessage(parts);
            const response = result.response.text();

            // Save to Firestore
            await addDoc(collection(db, "ai_chats", currentChatId, "messages"), {
                role: "user", text: text, sender: user.uid, timestamp: serverTimestamp()
            });
            await addDoc(collection(db, "ai_chats", currentChatId, "messages"), {
                role: "model", text: response, timestamp: serverTimestamp()
            });

            // Update usage
            await updateDoc(usage.userRef, { 
                tokensUsed: usage.currentUsed + result.response.usageMetadata.totalTokenCount 
            });

            loadingDiv.remove();
            appendMessage('ai', response);
            selectedFilesForChat = []; // Clear attachments after use
            updateAttachmentUI();

        } catch (err) {
            console.error(err);
            loadingDiv.innerText = "Error: " + err.message;
        }
    };
}

/**
 * 3. SHARED CHAT & HISTORY LOGIC
 */
function loadChatSidebar() {
    const user = auth.currentUser;
    const q = query(collection(db, "ai_chats"), where("participants", "array-contains", user.uid));

    onSnapshot(q, (snap) => {
        const list = document.getElementById('ai-chat-list');
        if (!list) return;
        list.innerHTML = snap.docs.map(d => `
            <div class="chat-item ${d.id === currentChatId ? 'active' : ''}" onclick="window.switchAIChat('${d.id}')">
                <i class="ph ph-chats-circle"></i>
                <span>${d.data().name}</span>
            </div>
        `).join('') + `<button onclick="window.createNewAIChat()" class="btn-new">+ New Analysis</button>`;
    });
}

window.switchAIChat = (id) => {
    currentChatId = id;
    const chatWindow = document.getElementById('ai-chat-window');
    chatWindow.innerHTML = ''; // Clear UI
    
    // Listen to messages for this specific shared chat
    const q = query(collection(db, "ai_chats", id, "messages"), orderBy("timestamp", "asc"));
    onSnapshot(q, (snap) => {
        chatWindow.innerHTML = '';
        snap.forEach(doc => appendMessage(doc.data().role, doc.data().text));
    });
};

window.createNewAIChat = async () => {
    const name = prompt("Enter Analysis Name (e.g. Sales Report Q1):");
    if (!name) return;
    const docRef = await addDoc(collection(db, "ai_chats"), {
        name: name,
        participants: [auth.currentUser.uid],
        createdAt: serverTimestamp()
    });
    window.switchAIChat(docRef.id);
};

// Helper: Convert URL to Gemini Blob
async function urlToGenerativePart(url, mimeType) {
    const response = await fetch(url);
    const data = await response.blob();
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve({ inlineData: { data: reader.result.split(',')[1], mimeType } });
        reader.readAsDataURL(data);
    });
}

function appendMessage(role, text) {
    const chatWindow = document.getElementById('ai-chat-window');
    const div = document.createElement('div');
    div.className = `ai-message ${role}`;
    div.innerHTML = `<div class="bubble">${text}</div>`;
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return div;
}