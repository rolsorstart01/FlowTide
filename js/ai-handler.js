//  ../js/ai-handler.js
import { collection, addDoc, updateDoc, arrayUnion, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db, auth } from "./script.js";
export function initAIRecommender() {
    const input = document.getElementById('ai-user-input');
    const sendBtn = document.getElementById('ai-send-btn');
    const chatWindow = document.getElementById('ai-chat-window');

    if (!sendBtn || !input) return;

    const appendAIMessage = (role, text) => {
        const div = document.createElement('div');
        div.className = `ai-message ${role}`;
        div.innerHTML = `
            <div class="bubble">
                ${role === 'ai' ? '<small>Business Architect</small>' : ''}
                <p>${text}</p>
            </div>`;
        chatWindow.appendChild(div);
        chatWindow.scrollTop = chatWindow.scrollHeight;
        return div;
    };

    const handleAISend = async () => {
        const prompt = input.value.trim();
        if (!prompt) return;

        appendAIMessage('user', prompt);
        input.value = '';

        // --- UPDATED LOADING STATE ---
        const loadingHTML = `
            <div class="typing-indicator">
                <span></span><span></span><span></span>
            </div>
        `;
        const loadingDiv = appendAIMessage('ai', loadingHTML);
        loadingDiv.classList.add('loading-pulse');

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });

            if (!response.ok) throw new Error();
            const data = await response.json();

            // Remove animation and show result
            loadingDiv.classList.remove('loading-pulse');
            loadingDiv.querySelector('p').innerHTML = data.text.replace(/\n/g, '<br>');
        } catch (err) {
            loadingDiv.classList.remove('loading-pulse');
            loadingDiv.querySelector('p').style.color = "#ff4444";
            loadingDiv.querySelector('p').innerText = "Architect connection failed.";
        }
    };

    // Fix: Button Click
    sendBtn.onclick = (e) => { e.preventDefault(); handleAISend(); };

    // Fix: Enter Key
    input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAISend();
        }
    };
};
// Example function to include in your AI logic
async function getFilesForAI() {
    const user = auth.currentUser;
    const q = query(
        collection(db, "files"), 
        where("owner", "==", user.uid), 
        where("sharedWithAI", "==", true)
    );
    
    const snap = await getDocs(q);
    // This returns a list of URLs and names that you can pass to Gemini 
    // as context for "Sales Reports" or "Optimization"
    return snap.docs.map(doc => ({ name: doc.data().name, url: doc.data().url }));
};
export async function createSharedChat(chatName) {
    const user = auth.currentUser;
    const chatRef = await addDoc(collection(db, "ai_chats"), {
        name: chatName,
        participants: [user.uid], // The creator is the first participant
        attachedFiles: [], // Files specific to this chat
        createdAt: serverTimestamp()
    });
    return chatRef.id;
}

// Call this when the user adds a team member via email/uid
export async function addParticipantToChat(chatId, newUserId) {
    const chatRef = doc(db, "ai_chats", chatId);
    await updateDoc(chatRef, {
        participants: arrayUnion(newUserId) // Adds user without duplicating
    });
}

// Call this when selecting a file from the user's storage to share with THIS chat
export async function attachFileToChat(chatId, fileUrl, mimeType) {
    const chatRef = doc(db, "ai_chats", chatId);
    await updateDoc(chatRef, {
        attachedFiles: arrayUnion({ url: fileUrl, mimeType: mimeType })
    });
};