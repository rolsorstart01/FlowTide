// ../js/ai-service.js
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";
import { doc, getDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db, auth } from "./script.js";

// ⚠️ SECURITY WARNING: In a real production app (2026 standards), 
// you should call this via a Firebase Cloud Function to hide your API Key.
const API_KEY = "YOUR_API_KEY"; // 👈 PASTE YOUR KEY HERE
const genAI = new GoogleGenerativeAI(API_KEY);

// Initialize Gemini 2.5 Flash-Lite
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    systemInstruction: "You are FlowTide AI, a ruthless but helpful Business Architect for a startup founder. You prioritize speed, automation, and leverage. Keep answers concise, actionable, and formatted with bullet points. Never explain what you are doing, just give the solution."
});

/**
 * Main AI Initialization
 */
export async function initAI() {
    const input = document.getElementById('ai-user-input');
    const sendBtn = document.getElementById('ai-send-btn');
    const chatWindow = document.getElementById('ai-chat-window');

    if (!input || !sendBtn) return;

    const sendMessage = async () => {
        const text = input.value.trim();

        // 1. Pre-flight Checks
        if (!text || !auth.currentUser) {
            if (!auth.currentUser) alert("Please login to use the AI Architect.");
            return;
        }

        let loadingId = null;

        try {
            // 2. UI Feedback: Disable input & show loading
            input.disabled = true;
            appendMessage('user', text);
            input.value = '';
            loadingId = appendLoading();

            // 3. Fetch User and Team Data
            const userRef = doc(db, "users", auth.currentUser.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) throw new Error("User profile not found.");
            const companyId = userSnap.data().companyId;

            // 4. Shared Resource Check (Team Tokens)
            const companyRef = doc(db, "companies", companyId);
            const companySnap = await getDoc(companyRef);

            if (!companySnap.exists()) {
                throw new Error("Team/Company account not found in Firestore.");
            }

            const companyData = companySnap.data();

            if (companyData.tokens <= 0) {
                removeMessage(loadingId);
                appendMessage('ai', "⚠️ Your team has run out of shared tokens. Please upgrade your plan in the Team Management tab.");
                return;
            }

            // 5. Generate Content from Gemini
            const result = await model.generateContent(text);
            const response = await result.response;
            const responseText = response.text();

            // 6. Deduct Shared Tokens from Firestore
            await updateDoc(companyRef, {
                tokens: increment(-1)
            });

            // 7. Success UI Update
            removeMessage(loadingId);
            appendMessage('ai', responseText);

        } catch (error) {
            console.error("AI Service Error:", error);
            if (loadingId) removeMessage(loadingId);
            appendMessage('ai', "❌ Architect connection failed. Please ensure your team account is set up and try again.");
        } finally {
            input.disabled = false;
            input.focus();
        }
    };

    // --- Event Listeners ---
    sendBtn.onclick = (e) => {
        e.preventDefault();
        sendMessage();
    };

    input.onkeypress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    };
}

/**
 * UI Helper: Append messages to the chat window
 */
function appendMessage(type, text) {
    const chatWindow = document.getElementById('ai-chat-window');
    if (!chatWindow) return;

    const div = document.createElement('div');
    div.className = `ai-message ${type}`;

    // Simple Markdown formatting for bold and line breaks
    const formattedText = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');

    div.innerHTML = `
        ${type === 'ai' ? '<div class="ai-avatar"><i class="ph ph-sparkle"></i></div>' : ''}
        <div class="bubble">
            <p>${formattedText}</p>
        </div>
    `;
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    const id = 'msg-' + Date.now();
    div.id = id;
    return id;
}

/**
 * UI Helper: Show typing indicator
 */
function appendLoading() {
    const chatWindow = document.getElementById('ai-chat-window');
    if (!chatWindow) return;

    const div = document.createElement('div');
    div.id = 'ai-loading';
    div.className = 'ai-message ai';
    div.innerHTML = `
        <div class="ai-avatar"><i class="ph ph-sparkle"></i></div>
        <div class="bubble processing">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return div.id;
}

/**
 * UI Helper: Remove specific elements (like the loader)
 */
function removeMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}