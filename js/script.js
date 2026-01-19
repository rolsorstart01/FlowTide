import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getFirestore, collection, addDoc, serverTimestamp, query,
    orderBy, onSnapshot, where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { firebaseConfig, currentUser } from "./config.js";
import { pages } from "./pages.js";
import { initAIRecommender } from "./ai-handler.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let activeChannelId = null;
let unsubscribeMessages = null;

function loadPage(pageKey) {
    const content = document.getElementById('app-content');
    if (!content) return;

    content.innerHTML = pages[pageKey];
    content.className = 'page-animate';

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-page') === pageKey);
    });

    if (pageKey === 'chat') initForgeChat();
    if (pageKey === 'ai') initAIRecommender();
}

function initForgeChat() {
    const list = document.getElementById('channel-list');
    const q = query(
        collection(db, "channels"),
        where("companyId", "==", currentUser.companyId),
        orderBy("name", "asc")
    );

    onSnapshot(q, (snapshot) => {
        if (!list) return;
        list.innerHTML = "";
        snapshot.forEach(docSnap => {
            const div = document.createElement('div');
            div.className = `channel-item ${activeChannelId === docSnap.id ? 'active' : ''}`;
            div.innerHTML = `<i class="ph ph-hash"></i> ${docSnap.data().name}`;
            div.onclick = () => switchChannel(docSnap.id, docSnap.data().name);
            list.appendChild(div);
        });
    });
}

function switchChannel(id, name) {
    activeChannelId = id;
    document.getElementById('active-channel-name').innerText = `# ${name}`;
    document.getElementById('chat-input').disabled = false;
    document.getElementById('send-btn').disabled = false;

    if (unsubscribeMessages) unsubscribeMessages();

    const msgQuery = query(
        collection(db, "channels", id, "messages"),
        orderBy("timestamp", "asc")
    );

    unsubscribeMessages = onSnapshot(msgQuery, (snapshot) => {
        const stream = document.getElementById('message-stream');
        if (!stream) return;
        stream.innerHTML = "";
        snapshot.forEach(docSnap => {
            const msg = docSnap.data();
            const isMe = msg.senderId === currentUser.id;
            stream.insertAdjacentHTML('beforeend', `
                <div class="message-row ${isMe ? 'me' : 'them'}">
                    <div class="bubble">
                        <small>${msg.senderName}</small>
                        <p>${msg.text}</p>
                    </div>
                </div>`);
        });
        stream.scrollTop = stream.scrollHeight;
    });
}

document.addEventListener('click', (e) => {
    const navItem = e.target.closest('.nav-item');
    if (navItem) loadPage(navItem.getAttribute('data-page'));
});

document.addEventListener('submit', async (e) => {
    if (e.target.id === 'chat-form') {
        e.preventDefault();
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (!text || !activeChannelId) return;
        input.value = "";
        await addDoc(collection(db, "channels", activeChannelId, "messages"), {
            text, senderId: currentUser.id, senderName: currentUser.name, timestamp: serverTimestamp()
        });
    }
});

window.onload = () => loadPage('dashboard');