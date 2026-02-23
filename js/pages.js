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
        <div class="page-animate ai-workspace" style="display: flex; height: calc(100vh - 70px);">
            <aside style="width: 250px; border-right: 1px solid #222; padding: 20px; background: #0a0a0a;">
                <h4 style="font-size: 0.7rem; color: #555; letter-spacing: 1px; margin-bottom: 15px;">CONVERSATIONS</h4>
                <div id="ai-chat-list"></div>
            </aside>

            <section style="flex-grow: 1; display: flex; flex-direction: column;">
                <div id="ai-chat-window" style="flex-grow: 1; overflow-y: auto; padding: 30px;">
                    <div class="ai-message system"><div class="bubble">Select or create a chat to begin analysis.</div></div>
                </div>

                <div id="attachment-preview" style="padding: 0 20px; display: flex; gap: 10px;"></div>

                <div class="ai-input-area" style="padding: 20px; border-top: 1px solid #222;">
                    <div style="display: flex; background: #181818; border-radius: 12px; padding: 10px;">
                        <button onclick="window.openFileSelector()" style="background:none; border:none; color:#555; padding:0 15px; cursor:pointer;">
                            <i class="ph ph-paperclip" style="font-size: 1.2rem;"></i>
                        </button>
                        <input type="text" id="ai-user-input" placeholder="Ask AI to analyze reports..." style="flex-grow:1; background:none; border:none; color:white; outline:none;" />
                        <button id="ai-send-btn" class="btn-primary" style="border-radius: 8px; padding: 8px 15px;">Send</button>
                    </div>
                </div>
            </section>
        </div>
    `,
    chat: `
   <div class="forge-chat-container" style="display: flex; height: calc(100vh - 70px);">
        <aside class="chat-inner-sidebar" style="width: 260px; border-right: 1px solid #222; padding: 20px;">
            <div class="sidebar-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <span style="font-weight: bold; letter-spacing: 1px;">MY TEAM</span>
                <button id="add-channel-btn" class="plus-btn" style="background: none; border: none; color: #555; cursor: pointer;">
                    <i class="ph ph-plus-circle" style="font-size: 1.2rem;"></i>
                </button>
            </div>
            <div id="channel-list" class="channel-list-items"></div>
        </aside>

        <section class="chat-main" style="flex-grow: 1; display: flex; flex-direction: column;">
            <div class="chat-top-bar" style="padding: 15px 25px; border-bottom: 1px solid #222;">
                <h2 id="active-channel-name" style="font-size: 1.1rem;">Select Team Chat</h2>
            </div>
            <div id="message-stream" class="message-stream" style="flex-grow: 1; overflow-y: auto; padding: 20px;"></div>
            <form id="chat-form" class="chat-input-area" style="padding: 20px; background: #0a0a0a;">
                <div class="input-wrapper" style="display: flex; background: #181818; border-radius: 8px; padding: 5px 15px;">
                    <input type="text" id="chat-input" placeholder="Type a message..." style="flex-grow: 1; background: none; border: none; color: white; padding: 10px;" disabled>
                    <button type="submit" id="send-btn" style="background: none; border: none; color: #00d2ff;" disabled>
                        <i class="ph ph-paper-plane-right-fill"></i>
                    </button>
                </div>
            </form>
        </section>

        <div id="channel-modal" class="modal-overlay" style="display:none; position: fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:1000; align-items:center; justify-content:center;">
            <div class="modal-card" style="background:#181818; padding:30px; border-radius:12px; width:350px; border:1px solid #333;">
                <h3 style="margin-bottom:20px; color:white;">New Channel</h3>
                <input type="text" id="new-channel-input" placeholder="channel-name" style="width:100%; background:#0a0a0a; border:1px solid #333; color:white; padding:10px; border-radius:6px; margin-bottom:20px;">
                <div style="display:flex; justify-content:flex-end; gap:10px;">
                    <button id="close-modal" style="background:none; border:none; color:#888; cursor:pointer;">Cancel</button>
                    <button id="confirm-channel" style="background:#000; color:white; border:none; padding:8px 16px; border-radius:6px; font-weight:bold; cursor:pointer;">Create</button>
                </div>
            </div>
        </div>
    </div>`
};