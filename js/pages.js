// ../js/pages.js

export const pages = {
    dashboard: `
        <div class="page-animate">
            <section class="hero">
                <div class="container">
                    <h1>Founder Dashboard</h1>
                    <p>Welcome to your central OS. Finish what you start.</p>
                    <div class="pricing-grid">
                        <div class="pricing-card">
                            <h3>New Messages</h3>
                            <p class="price"></p>
                        </div>
                        <div class="pricing-card popular">
                            <div class="badge">AI Priority</div>
                            <h3>Daily Tip</h3>
                            <p style="font-size: 0.95rem; margin-top: 10px;">Automate your outreach to save 4 hours today.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>`,

    files: `
        <div class="page-animate">
            <section class="container" style="padding: 60px 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h1 style="font-size: 2rem; font-weight: 700; letter-spacing: -0.02em;">File Storage</h1>
                        <p style="color: var(--text-secondary); margin-top: 4px;">Manage assets and project documentation.</p>
                    </div>
                    <button class="btn btn-primary" onclick="triggerUpload()">
                        <i class="ph ph-upload-simple"></i> Upload File
                    </button>
                </div>

                <div style="margin-top: 40px; padding: 80px 24px; border: 1px dashed var(--border-subtle); border-radius: 12px; text-align: center; background: rgba(255,255,255,0.02);">
                    <div style="background: var(--bg-accent); width: 64px; height: 64px;顺s border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                        <i class="ph ph-folder-simple-plus" style="font-size: 2rem; color: var(--brand-color);"></i>
                    </div>
                    <h3 style="font-weight: 600;">No files yet</h3>
                    <p style="color: var(--text-secondary); max-width: 300px; margin: 8px auto 24px;">
                        Drop your project assets here or use the LLM to generate templates.
                    </p>
                    <button class="btn btn-outline">Browse Files</button>
                </div>
            </section>
        </div>
    `,

    ai: `
        <div class="page-animate">
            <section class="container" style="padding: 40px 24px; height: calc(100vh - 80px); display: flex; flex-direction: column;">
                <div class="ai-header">
                    <h1>FlowTide Intelligence</h1>
                    <p style="color: var(--text-secondary);">Powered by Gemini 2.5 Flash-Lite</p>
                </div>

                <div id="ai-chat-window" class="ai-chat-window">
                    <div class="ai-message system">
                        <div class="ai-avatar"><i class="ph ph-sparkle"></i></div>
                        <div class="bubble">
                            <p>Hello Founder. I am your Business Architect. I can help you with your business, suggest pricing strategies, draft client emails, and more. What are we optimizing today?</p>
                        </div>
                    </div>
                    </div>

                <div class="ai-input-area">
                    <input type="text" id="ai-user-input" placeholder="Ask about strategy, hiring, or optimization..." />
                    <button id="ai-send-btn" class="btn-primary"><i class="ph ph-paper-plane-right"></i></button>
                </div>
            </section>
        </div>
    `,

    chat: `
    <div class="forge-chat-container">
        <aside class="chat-inner-sidebar">
            <div class="sidebar-header">
                <span>MY TEAM</span>
                <button id="add-channel-btn" class="plus-btn"><i class="ph ph-plus-circle"></i></button>
            </div>
            <div id="channel-list" class="channel-list-items"></div>
        </aside>

        <section class="chat-main">
            <div class="chat-top-bar">
                <h2 id="active-channel-name">Select Team Chat</h2>
            </div>
            <div id="message-stream" class="message-stream"></div>
            <form id="chat-form" class="chat-input-area">
                <div class="input-wrapper">
                    <input type="text" id="chat-input" placeholder="Type a message..." disabled>
                    <button type="submit" id="send-btn" disabled><i class="ph ph-paper-plane-right-fill"></i></button>
                </div>
            </form>
        </section>

        <div id="channel-modal" class="modal-overlay" style="display:none;">
            <div class="modal-card">
                <h3>Create New Team Channel</h3>
                <input type="text" id="new-channel-input" placeholder="e.g. Marketing-Team">
                <div class="modal-btns">
                    <button id="close-modal" class="btn-secondary">Cancel</button>
                    <button id="confirm-channel" class="btn-primary">Create Channel</button>
                </div>
            </div>
        </div>
    </div>`
};