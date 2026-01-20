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

    workflows: `
        <div class="page-animate">
            <section class="container" style="padding: 60px 24px;">
                <h1>Workflows</h1>
                <p style="color: var(--text-secondary);">Your automated business pipelines.</p>
                <div style="margin-top: 30px; padding: 50px; border: 1px dashed var(--border-subtle); border-radius: 16px; text-align: center;">
                    <i class="ph ph-git-merge" style="font-size: 3rem; color: var(--border-subtle);"></i>
                    <p style="margin-top: 15px;">No automations running yet.</p>
                    <button class="btn" style="margin-top: 20px;">+ Create New Flow</button>
                </div>
            </section>
        </div>`,

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
                            <p>Hello Founder. I am your Business Architect. I can analyze your workflows, suggest pricing strategies, or draft client emails. What are we optimizing today?</p>
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