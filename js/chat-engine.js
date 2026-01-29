// ../js/chat-engine.js
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db, auth } from "./script.js";
import { currentUser as legacyUser } from "./config.js";

let activeChannelId = null;
let unsubscribeMessages = null;

export function initDiscordChat() {
    const list = document.getElementById('channel-list');
    if (!list) return;

    // 1. Load Channels
    const q = query(collection(db, "channels"), where("companyId", "==", legacyUser.companyId), orderBy("name", "asc"));
    onSnapshot(q, (snapshot) => {
        list.innerHTML = "";
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const div = document.createElement('div');
            div.style.cssText = "padding: 10px; cursor: pointer; border-radius: 5px; margin-bottom: 5px; color: #aaa;";
            div.className = `channel-item ${activeChannelId === docSnap.id ? 'active' : ''}`;
            div.innerHTML = `<i class="ph ph-hash"></i> ${data.name}`;
            div.onclick = () => switchChannel(docSnap.id, data.name);
            list.appendChild(div);
        });
    });

    // 2. Message Form
    const chatForm = document.getElementById('chat-form');
    if (chatForm) {
        chatForm.onsubmit = async (e) => {
            e.preventDefault();
            const input = document.getElementById('chat-input');
            const text = input.value.trim();
            if (!text || !activeChannelId) return;

            try {
                await addDoc(collection(db, "channels", activeChannelId, "messages"), {
                    text,
                    senderId: auth.currentUser?.uid || legacyUser.id,
                    senderName: auth.currentUser?.displayName || legacyUser.name,
                    timestamp: serverTimestamp()
                });
                input.value = "";
            } catch (err) { console.error("Write error:", err); }
        };
    }

    setupChannelModal();
}

function setupChannelModal() {
    const modal = document.getElementById('channel-modal');
    const openBtn = document.getElementById('add-channel-btn');
    const closeBtn = document.getElementById('close-modal');
    const confirmBtn = document.getElementById('confirm-channel');

    if (openBtn) {
        openBtn.onclick = () => { modal.style.display = 'flex'; };
    }

    if (closeBtn) {
        closeBtn.onclick = () => { modal.style.display = 'none'; };
    }

    if (confirmBtn) {
        confirmBtn.onclick = async () => {
            const input = document.getElementById('new-channel-input');
            const name = input.value.trim().toLowerCase().replace(/\s+/g, '-');
            if (name) {
                try {
                    await addDoc(collection(db, "channels"), {
                        name,
                        companyId: legacyUser.companyId,
                        createdAt: serverTimestamp()
                    });
                    modal.style.display = 'none';
                    input.value = "";
                } catch (err) { alert("Permission denied."); }
            }
        };
    }
}

function switchChannel(id, name) {
    activeChannelId = id;
    const stream = document.getElementById('message-stream');
    const header = document.getElementById('active-channel-name');
    const input = document.getElementById('chat-input');
    const btn = document.getElementById('send-btn');

    if (header) header.innerText = `# ${name}`;
    if (input) { input.disabled = false; input.placeholder = `Message #${name}`; input.focus(); }
    if (btn) btn.disabled = false;

    if (unsubscribeMessages) unsubscribeMessages();

    const msgQuery = query(collection(db, "channels", id, "messages"), orderBy("timestamp", "asc"));
    unsubscribeMessages = onSnapshot(msgQuery, (snapshot) => {
        if (!stream) return;
        stream.innerHTML = "";
        snapshot.forEach(docSnap => {
            const msg = docSnap.data();
            const isMe = msg.senderId === (auth.currentUser?.uid || legacyUser.id);
            const time = msg.timestamp ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

            stream.insertAdjacentHTML('beforeend', `
<div style="margin-bottom: 15px; display: flex; flex-direction: column; align-items: ${isMe ? 'flex-end' : 'flex-start'};">
    <div style="background: ${isMe ? '#ffffff' : '#000000'}; color: ${isMe ? '#000000' : '#ffffff'}; padding: 10px 15px; border-radius: 15px; max-width: 70%; border: ${isMe ? '1px solid #ffffffff' : 'none'};">
        <small style="display: block; font-size: 0.7rem; opacity: 10;">${msg.senderName}</small>
        <p style="margin: 5px 0 0 0;">${msg.text}</p>
    </div>
    
    <span style="font-size: 0.65rem; color: #ffffffff; margin-top: 4px;">${time}</span>
</div>
            `);
        });
        stream.scrollTop = stream.scrollHeight;
    });
}