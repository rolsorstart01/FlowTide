//  ../js/ai-handler.js
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
}