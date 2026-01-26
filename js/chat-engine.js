// ../js/chat-engine.js
import {
    collection, addDoc, serverTimestamp, query,
    orderBy, onSnapshot, where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db, auth } from "./script.js";
import { currentUser as legacyUser } from "./config.js";

let activeChannelId = null;
let unsubscribeMessages = null;

/**
 * Initializes the Chat Engine.
 * Called by script.js whenever the 'chat' page is loaded.
 */
export function initDiscordChat() {
    const list = document.getElementById('channel-list');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');

    // Safety check: if elements aren't in the DOM yet, stop.
    if (!list || !chatForm) {
        console.warn("Chat DOM elements not found. Waiting for page load...");
        return;
    }

    // 1. Sync Channels (Sidebar)
    // We filter by companyId to keep teams private
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
            // Highlight the active channel
            div.className = `channel-item ${activeChannelId === docSnap.id ? 'active' : ''}`;
            div.innerHTML = `<i class="ph ph-hash"></i> ${data.name}`;

            // Channel selection logic
            div.onclick = () => {
                // UI feedback: remove active class from others
                document.querySelectorAll('.channel-item').forEach(el => el.classList.remove('active'));
                div.classList.add('active');
                switchChannel(docSnap.id, data.name);
            };
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
            chatInput.focus();
        } catch (err) {
            console.error("Firestore Chat Error:", err);
        }
    };

    // 3. Initialize UI Modals
    setupChannelModal();
}

/**
 * Switches the message stream to a specific channel
 */
function switchChannel(id, name) {
    activeChannelId = id;
    const stream = document.getElementById('message-stream');
    const header = document.getElementById('active-channel-name');
    const input = document.getElementById('chat-input');
    const btn = document.getElementById('send-btn');

    // Update UI headers
    if (header) header.innerText = `# ${name}`;
    if (input) {
        input.disabled = false;
        input.placeholder = `Message #${name}`;
        input.focus();
    }
    if (btn) btn.disabled = false;

    // Clean up previous listener to prevent memory leaks/duplicate messages
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

            // Format timestamp (with fallback for new messages that haven't hit the server yet)
            const time = msg.timestamp
                ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : "just now";

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

        // Auto-scroll to bottom
        stream.scrollTop = stream.scrollHeight;
    });
}

/**
 * Manages the "Create Channel" modal popup
 */
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
            const channelName = input.value.trim();

            if (channelName) {
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
                }
            }
        };
    }
}