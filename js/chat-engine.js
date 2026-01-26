// ../js/chat-engine.js
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

    if (!list || !chatForm) return;

    // 1. Sync Channels
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

    // 2. Handle Message Sending
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
            console.error("Chat Error:", err);
        }
    };

    // 3. CRITICAL FIX: Re-run Modal Setup
    setupChannelModal();
}

function setupChannelModal() {
    const modal = document.getElementById('channel-modal');
    const openBtn = document.getElementById('add-channel-btn');
    const closeBtn = document.getElementById('close-modal');
    const confirmBtn = document.getElementById('confirm-channel');
    const input = document.getElementById('new-channel-input');

    if (!modal || !confirmBtn) {
        console.error("Modal elements not found in DOM");
        return;
    }

    // Toggle Modal Visibility
    if (openBtn) openBtn.onclick = () => { modal.style.display = 'flex'; input.focus(); };
    if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';

    // Create Channel Action
    confirmBtn.onclick = async () => {
        const channelName = input.value.trim();
        if (!channelName) return;

        confirmBtn.disabled = true; // Prevent double-clicks
        confirmBtn.innerText = "Creating...";

        try {
            await addDoc(collection(db, "channels"), {
                name: channelName,
                companyId: legacyUser.companyId,
                createdAt: serverTimestamp()
            });

            modal.style.display = 'none';
            input.value = "";
        } catch (err) {
            console.error("Error creating channel:", err);
            alert("Failed to create channel.");
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.innerText = "Create Channel";
        }
    };
}

function switchChannel(id, name) {
    activeChannelId = id;
    const stream = document.getElementById('message-stream');
    const header = document.getElementById('active-channel-name');
    const input = document.getElementById('chat-input');
    const btn = document.getElementById('send-btn');

    if (header) header.innerText = `# ${name}`;
    if (input) { input.disabled = false; input.placeholder = `Message #${name}`; }
    if (btn) btn.disabled = false;

    if (unsubscribeMessages) unsubscribeMessages();

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
            const time = msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || "just now";

            const html = `
                <div class="message-row ${isMe ? 'me' : 'them'}">
                    <div class="bubble">
                        <div class="msg-meta">
                            <span class="sender">${msg.senderName}</span>
                            <span class="time">${time}</span>
                        </div>
                        <p>${msg.text}</p>
                    </div>
                </div>`;
            stream.insertAdjacentHTML('beforeend', html);
        });
        stream.scrollTop = stream.scrollHeight;
    });
}