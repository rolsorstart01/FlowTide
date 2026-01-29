import {
    collection, addDoc, serverTimestamp, query,
    orderBy, onSnapshot, where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db, auth } from "./script.js";
import { currentUser as legacyUser } from "./config.js";

let activeChannelId = null;
let unsubscribeMessages = null;

export function initDiscordChat() {
    const list = document.getElementById('channel-list');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');

    if (!list) return;

    // 1. Load Channels Real-time
    const q = query(
        collection(db, "channels"),
        where("companyId", "==", legacyUser.companyId),
        orderBy("name", "asc")
    );

    onSnapshot(q, (snapshot) => {
        list.innerHTML = "";
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const div = document.createElement('div');
            div.className = `channel-item ${activeChannelId === docSnap.id ? 'active' : ''}`;
            div.innerHTML = `<i class="ph ph-hash"></i> ${data.name}`;
            div.onclick = () => switchChannel(docSnap.id, data.name);
            list.appendChild(div);
        });
    });

    // 2. Message Submission
    if (chatForm) {
        chatForm.onsubmit = async (e) => {
            e.preventDefault();
            const text = chatInput.value.trim();
            if (!text || !activeChannelId) return;

            try {
                await addDoc(collection(db, "channels", activeChannelId, "messages"), {
                    text: text,
                    senderId: auth.currentUser?.uid || legacyUser.id,
                    senderName: auth.currentUser?.displayName || legacyUser.name,
                    timestamp: serverTimestamp()
                });
                chatInput.value = "";
            } catch (err) {
                console.error("Firestore Error:", err);
            }
        };
    }

    setupChannelModal();
}

function switchChannel(id, name) {
    activeChannelId = id;
    const stream = document.getElementById('message-stream');
    const header = document.getElementById('active-channel-name');
    const input = document.getElementById('chat-input');
    const btn = document.getElementById('send-btn');

    // UI Updates
    if (header) header.innerText = `# ${name}`;
    if (input) {
        input.disabled = false;
        input.placeholder = `Message #${name}`;
        input.focus();
    }
    if (btn) btn.disabled = false;

    // Cleanup previous listener
    if (unsubscribeMessages) unsubscribeMessages();

    // Start listening to the specific channel's messages
    const msgQuery = query(
        collection(db, "channels", id, "messages"),
        orderBy("timestamp", "asc")
    );

    unsubscribeMessages = onSnapshot(msgQuery, (snapshot) => {
        if (!stream) return;
        stream.innerHTML = "";

        snapshot.forEach(docSnap => {
            const msg = docSnap.data();
            const isMe = msg.senderId === (auth.currentUser?.uid || legacyUser.id);
            const timeStr = msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || "";

            const html = `
                <div class="message-row ${isMe ? 'me' : 'them'}">
                    <div class="bubble">
                        <div class="msg-meta">
                            <span class="sender">${msg.senderName}</span>
                            <span class="time">${timeStr}</span>
                        </div>
                        <p>${msg.text}</p>
                    </div>
                </div>`;
            stream.insertAdjacentHTML('beforeend', html);
        });
        // Auto-scroll to bottom
        stream.scrollTop = stream.scrollHeight;
    });
}

function setupChannelModal() {
    const modal = document.getElementById('channel-modal');
    const openBtn = document.getElementById('add-channel-btn');
    const closeBtn = document.getElementById('close-modal');
    const confirmBtn = document.getElementById('confirm-channel');

    if (openBtn) openBtn.onclick = () => modal.style.display = 'flex';
    if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';

    if (confirmBtn) {
        confirmBtn.onclick = async () => {
            const input = document.getElementById('new-channel-input');
            const name = input.value.trim().toLowerCase().replace(/\s+/g, '-');

            if (name) {
                await addDoc(collection(db, "channels"), {
                    name: name,
                    companyId: legacyUser.companyId,
                    createdAt: serverTimestamp()
                });
                modal.style.display = 'none';
                input.value = "";
            }
        };
    }
}