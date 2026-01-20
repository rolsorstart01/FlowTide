// ../js/ai-service.js
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

// ⚠️ SECURITY WARNING: In a real production app (2026 standards), 
// you should call this via a Firebase Cloud Function to hide your API Key.
// For this prototype, client-side is fine.
const API_KEY = "YOUR_API_KEY"; // 👈 PASTE YOUR KEY HERE
const genAI = new GoogleGenerativeAI(API_KEY);

// Initialize Gemini 2.5 Flash-Lite
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite", // The 2026 low-cost speed model
    systemInstruction: "You are FlowTide AI, a ruthless but helpful Business Architect for a startup founder. You prioritize speed, automation, and leverage. Keep answers concise, actionable, and formatted with bullet points. Never explain what you are doing, just give the solution."
});

export async function initAI() {
    const input = document.getElementById('ai-user-input');
    const sendBtn = document.getElementById('ai-send-btn');
    const chatWindow = document.getElementById('ai-chat-window');

    if (!input || !sendBtn) return;

    const sendMessage = async () => {
        const text = input.value.trim();
        if (!text) return;

        // 1. Add User Message to UI
        appendMessage('user', text);
        input.value = '';
        input.disabled = true;

        // 2. Add Loading Indicator
        const loadingId = appendLoading();

        try {
            // 3. Call Gemini
            const result = await model.generateContent(text);
            const response = result.response.text();

            // 4. Remove Loader and Add AI Response
            removeMessage(loadingId);
            appendMessage('ai', response);
        } catch (error) {
            console.error(error);
            removeMessage(loadingId);
            appendMessage('system', "Connection optimization failed. Please check your API limits.");
        } finally {
            input.disabled = false;
            input.focus();
        }
    };

    sendBtn.onclick = sendMessage;
    input.onkeypress = (e) => {
        if (e.key === 'Enter') sendMessage();
    };
}

function appendMessage(type, text) {
    const chatWindow = document.getElementById('ai-chat-window');
    const div = document.createElement('div');
    div.className = `ai-message ${type}`;

    // Formatting Markdown-style bolding for better reading
    const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');

    div.innerHTML = `
        ${type === 'ai' ? '<div class="ai-avatar"><i class="ph ph-sparkle"></i></div>' : ''}
        <div class="bubble">
            <p>${formattedText}</p>
        </div>
    `;
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return div.id = 'msg-' + Date.now();
}

function appendLoading() {
    const chatWindow = document.getElementById('ai-chat-window');
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

function removeMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}