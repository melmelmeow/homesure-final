// ─────────────────────────────────────────────────────────────────────────────
//  HomeSure – AI Customer Service Widget (Hugging Face Integration)
//  Usage:
//    Automatically mounted on Buyer & Seller pages via topbar.js
//    Manual trigger: HomeSureCustomerService.open() or .ask('Question')
// ─────────────────────────────────────────────────────────────────────────────
(function (global) {
  'use strict';

  let initialized = false;
  let isOpen = false;
  let currentRole = 'buyer';
  let conversationHistory = [];

  const CSS = `
    /* Floating Customer Service Button */
    .hs-cs-fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99990;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 18px;
      background: linear-gradient(135deg, #00c9a7 0%, #008f7a 100%);
      color: #ffffff;
      border: none;
      border-radius: 50px;
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(0, 201, 167, 0.35);
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 13px;
      font-weight: 700;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .hs-cs-fab:hover {
      transform: translateY(-3px) scale(1.02);
      box-shadow: 0 12px 30px rgba(0, 201, 167, 0.45);
    }
    .hs-cs-fab-icon {
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .hs-cs-fab-pulse {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 9px;
      height: 9px;
      background: #10b981;
      border: 2px solid #ffffff;
      border-radius: 50%;
      animation: hsPulse 1.8s infinite;
    }
    @keyframes hsPulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { transform: scale(1.1); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }

    /* Chat Widget Window */
    .hs-cs-window {
      position: fixed;
      bottom: 86px;
      right: 24px;
      width: 390px;
      max-width: calc(100vw - 32px);
      height: 560px;
      max-height: calc(100vh - 120px);
      background: #1e293b;
      color: #f8fafc;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 18px;
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 201, 167, 0.15);
      z-index: 99995;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: 'Plus Jakarta Sans', sans-serif;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      opacity: 0;
      pointer-events: none;
      transform: translateY(20px) scale(0.96);
    }
    .hs-cs-window.open {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0) scale(1);
    }

    /* Window Header */
    .hs-cs-header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 14px 18px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .hs-cs-agent {
      display: flex;
      align-items: center;
      gap: 11px;
    }
    .hs-cs-avatar {
      position: relative;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: linear-gradient(135deg, #00c9a7, #0284c7);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-weight: 800;
      font-size: 14px;
      box-shadow: 0 4px 10px rgba(0, 201, 167, 0.25);
    }
    .hs-cs-avatar-dot {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 10px;
      height: 10px;
      background: #10b981;
      border: 2px solid #0f172a;
      border-radius: 50%;
    }
    .hs-cs-name {
      font-size: 14px;
      font-weight: 700;
      color: #ffffff;
      line-height: 1.2;
    }
    .hs-cs-sub {
      font-size: 11px;
      color: #00c9a7;
      display: flex;
      align-items: center;
      gap: 4px;
      font-weight: 500;
    }
    .hs-cs-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .hs-cs-btn-icon {
      background: rgba(255, 255, 255, 0.06);
      border: none;
      color: rgba(255, 255, 255, 0.7);
      width: 28px;
      height: 28px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.18s, color 0.18s;
    }
    .hs-cs-btn-icon:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
    }

    /* Message Thread */
    .hs-cs-body {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #0f172a;
    }
    .hs-cs-body::-webkit-scrollbar { width: 5px; }
    .hs-cs-body::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 4px; }

    .hs-cs-msg {
      display: flex;
      flex-direction: column;
      max-width: 86%;
      animation: hsFadeIn 0.22s ease-out;
    }
    @keyframes hsFadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .hs-cs-msg.bot {
      align-self: flex-start;
    }
    .hs-cs-msg.user {
      align-self: flex-end;
    }
    .hs-cs-bubble {
      padding: 10px 14px;
      border-radius: 14px;
      font-size: 13px;
      line-height: 1.5;
      word-break: break-word;
    }
    .hs-cs-msg.bot .hs-cs-bubble {
      background: #1e293b;
      color: #f1f5f9;
      border-bottom-left-radius: 3px;
      border: 1px solid rgba(255, 255, 255, 0.07);
    }
    .hs-cs-msg.user .hs-cs-bubble {
      background: linear-gradient(135deg, #00c9a7, #009688);
      color: #ffffff;
      border-bottom-right-radius: 3px;
    }
    .hs-cs-msg-time {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.35);
      margin-top: 4px;
      align-self: flex-start;
      padding: 0 4px;
    }
    .hs-cs-msg.user .hs-cs-msg-time {
      align-self: flex-end;
    }

    /* Typing Indicator */
    .hs-cs-typing {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 10px 14px;
      background: #1e293b;
      border-radius: 14px;
      border-bottom-left-radius: 3px;
      width: fit-content;
      border: 1px solid rgba(255, 255, 255, 0.07);
    }
    .hs-cs-typing span {
      width: 6px;
      height: 6px;
      background: #00c9a7;
      border-radius: 50%;
      animation: hsBounce 1.4s infinite;
    }
    .hs-cs-typing span:nth-child(2) { animation-delay: 0.2s; }
    .hs-cs-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes hsBounce {
      0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
      40% { transform: translateY(-5px); opacity: 1; }
    }

    /* Quick Prompts Carousel */
    .hs-cs-prompts {
      padding: 10px 14px;
      background: #151f30;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      gap: 8px;
      overflow-x: auto;
      white-space: nowrap;
    }
    .hs-cs-prompts::-webkit-scrollbar { display: none; }
    .hs-cs-chip {
      background: rgba(0, 201, 167, 0.12);
      border: 1px solid rgba(0, 201, 167, 0.25);
      color: #2dd4bf;
      padding: 5px 11px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.18s;
      flex-shrink: 0;
    }
    .hs-cs-chip:hover {
      background: rgba(0, 201, 167, 0.25);
      color: #ffffff;
      border-color: #00c9a7;
    }

    /* Input Footer */
    .hs-cs-footer {
      padding: 12px 14px;
      background: #1e293b;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }
    .hs-cs-form {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 24px;
      padding: 6px 6px 6px 14px;
      transition: border-color 0.2s;
    }
    .hs-cs-form:focus-within {
      border-color: #00c9a7;
    }
    .hs-cs-input {
      flex: 1;
      background: transparent;
      border: none;
      color: #ffffff;
      font-family: inherit;
      font-size: 13px;
      outline: none;
    }
    .hs-cs-input::placeholder { color: rgba(255, 255, 255, 0.35); }
    .hs-cs-send {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #00c9a7;
      border: none;
      color: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.18s, background 0.18s;
      flex-shrink: 0;
    }
    .hs-cs-send:hover {
      background: #2dd4bf;
      transform: scale(1.06);
    }
    .hs-cs-send svg { width: 14px; height: 14px; }

    .hs-cs-badge {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 4px;
      font-size: 10px;
      color: rgba(255, 255, 255, 0.35);
      margin-top: 6px;
    }
    .hs-cs-badge svg { width: 12px; height: 12px; fill: currentColor; }

    @media (max-width: 480px) {
      .hs-cs-fab span.hs-cs-fab-text { display: none; }
      .hs-cs-fab { padding: 14px; border-radius: 50%; }
      .hs-cs-window {
        bottom: 80px;
        right: 14px;
        width: calc(100vw - 28px);
        height: 75vh;
      }
    }
  `;

  function injectCSS() {
    if (document.getElementById('hs-customer-service-css')) return;
    const style = document.createElement('style');
    style.id = 'hs-customer-service-css';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function formatTime(d = new Date()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function formatMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.1);padding:1px 4px;border-radius:4px;font-size:11px;">$1</code>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n• /g, '<br/>• ')
      .replace(/\n(\d+)\. /g, '<br/>$1. ');
  }

  function getPromptSuggestions(role) {
    if (role === 'seller' || role === 'landlord') {
      return [
        { label: '📝 Post a Property', q: 'How do I post a new property listing?' },
        { label: '📍 Pin Google Maps', q: 'How do I pin my property location on Google Maps?' },
        { label: '📑 Verification Requirements', q: 'What documents are required for seller verification?' },
        { label: '💰 Escrow Payouts', q: 'How and when do I receive payouts via escrow?' },
        { label: '📅 Viewing Requests', q: 'How do I approve or reschedule buyer viewing requests?' }
      ];
    }
    return [
      { label: '🏠 Schedule Viewing', q: 'How do I schedule a viewing appointment?' },
      { label: '🛡️ Escrow Protection', q: 'How does buyer payment escrow protection work?' },
      { label: '✅ Verified Sellers', q: 'How do I know if a seller is legitimate and verified?' },
      { label: '💳 Payment Methods', q: 'What payment options are accepted for reservations?' },
      { label: '🔒 Setup 2FA', q: 'How do I enable Two-Factor Authentication for my account?' }
    ];
  }

  function buildDOM() {
    if (document.getElementById('hs-cs-root')) return;

    const root = document.createElement('div');
    root.id = 'hs-cs-root';

    // 1. Floating Button
    const fab = document.createElement('button');
    fab.className = 'hs-cs-fab';
    fab.id = 'hsCsFab';
    fab.setAttribute('aria-label', 'Open AI Customer Service');
    fab.innerHTML = `
      <div class="hs-cs-fab-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span class="hs-cs-fab-pulse"></span>
      </div>
      <span class="hs-cs-fab-text">Support AI</span>
    `;

    // 2. Chat Window
    const win = document.createElement('div');
    win.className = 'hs-cs-window';
    win.id = 'hsCsWindow';

    const prompts = getPromptSuggestions(currentRole);
    const chipsHTML = prompts.map(p => `<button class="hs-cs-chip" data-query="${p.q}">${p.label}</button>`).join('');

    win.innerHTML = `
      <div class="hs-cs-header">
        <div class="hs-cs-agent">
          <div class="hs-cs-avatar">
            HS
            <span class="hs-cs-avatar-dot"></span>
          </div>
          <div>
            <div class="hs-cs-name">HomeSure Support AI</div>
            <div class="hs-cs-sub">
              <span>●</span> Online • Hugging Face AI
            </div>
          </div>
        </div>
        <div class="hs-cs-actions">
          <button class="hs-cs-btn-icon" id="hsCsClearBtn" title="Clear Chat">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
          <button class="hs-cs-btn-icon" id="hsCsCloseBtn" title="Close Chat">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>

      <div class="hs-cs-body" id="hsCsBody">
        <!-- Messages will be appended here -->
      </div>

      <div class="hs-cs-prompts" id="hsCsPrompts">
        ${chipsHTML}
      </div>

      <div class="hs-cs-footer">
        <form class="hs-cs-form" id="hsCsForm">
          <input type="text" class="hs-cs-input" id="hsCsInput" placeholder="Ask anything about HomeSure..." autocomplete="off" />
          <button type="submit" class="hs-cs-send" id="hsCsSendBtn" aria-label="Send Message">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
        <div class="hs-cs-badge">
          <span>Powered by Hugging Face & HomeSure AI</span>
        </div>
      </div>
    `;

    root.appendChild(fab);
    root.appendChild(win);
    document.body.appendChild(root);

    // Initial greeting
    addGreeting();

    // Event listeners
    fab.addEventListener('click', toggle);
    win.querySelector('#hsCsCloseBtn').addEventListener('click', close);
    win.querySelector('#hsCsClearBtn').addEventListener('click', clearChat);

    const form = win.querySelector('#hsCsForm');
    form.addEventListener('submit', handleFormSubmit);

    // Quick prompt chips
    win.querySelector('#hsCsPrompts').addEventListener('click', (e) => {
      const chip = e.target.closest('.hs-cs-chip');
      if (!chip) return;
      const q = chip.getAttribute('data-query');
      if (q) sendMessage(q);
    });
  }

  function addGreeting() {
    const body = document.getElementById('hsCsBody');
    if (!body) return;
    body.innerHTML = '';
    const welcome = currentRole === 'seller' || currentRole === 'landlord'
      ? "Kumusta! 👋 I'm your **HomeSure Seller Assistant**, powered by Hugging Face AI. How can I assist you with publishing properties, pinning map locations, verification, or escrow payouts today?"
      : "Kumusta! 👋 I'm your **HomeSure AI Assistant**, powered by Hugging Face AI. Looking to schedule a viewing, verify property credentials, or learn about our secure escrow payments?";
    
    appendMessage('bot', welcome);
  }

  function appendMessage(sender, text) {
    const body = document.getElementById('hsCsBody');
    if (!body) return;

    const div = document.createElement('div');
    div.className = `hs-cs-msg ${sender}`;
    div.innerHTML = `
      <div class="hs-cs-bubble">${formatMarkdown(text)}</div>
      <span class="hs-cs-msg-time">${formatTime()}</span>
    `;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;

    conversationHistory.push({
      role: sender === 'bot' ? 'assistant' : 'user',
      content: text
    });
  }

  function showTypingIndicator() {
    const body = document.getElementById('hsCsBody');
    if (!body || document.getElementById('hsCsTyping')) return;

    const typing = document.createElement('div');
    typing.id = 'hsCsTyping';
    typing.className = 'hs-cs-msg bot';
    typing.innerHTML = `
      <div class="hs-cs-typing">
        <span></span><span></span><span></span>
      </div>
    `;
    body.appendChild(typing);
    body.scrollTop = body.scrollHeight;
  }

  function removeTypingIndicator() {
    const typing = document.getElementById('hsCsTyping');
    if (typing) typing.remove();
  }

  async function sendMessage(text) {
    if (!text || !text.trim()) return;
    const cleanText = text.trim();

    appendMessage('user', cleanText);
    showTypingIndicator();

    try {
      let userName = 'Valued User';
      let userEmail = '';
      if (global.HS && global.HS.auth && typeof global.HS.auth.getUser === 'function') {
        const u = global.HS.auth.getUser();
        if (u) {
          userName = u.name || (u.first_name ? `${u.first_name} ${u.last_name || ''}` : '') || u.email || 'Valued User';
          userEmail = u.email || '';
        }
      }

      const res = await fetch('/api/ai/customer-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationHistory,
          role: currentRole,
          user: { name: userName, email: userEmail }
        })
      });

      removeTypingIndicator();

      if (!res.ok) {
        throw new Error('Customer service response failed');
      }

      const data = await res.json();
      const reply = data.reply || "I'm here to help! Please feel free to ask any other questions about HomeSure.";
      appendMessage('bot', reply);
    } catch (err) {
      removeTypingIndicator();
      console.warn('Customer Service Widget error:', err);
      appendMessage('bot', "I apologize, but I encountered a temporary connection glitch. Please feel free to reach our customer care desk directly at **support@homesure.ph** or call **+63 (02) 8123-4567**.");
    }
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    const input = document.getElementById('hsCsInput');
    if (!input) return;
    const val = input.value;
    input.value = '';
    sendMessage(val);
  }

  function open() {
    isOpen = true;
    const win = document.getElementById('hsCsWindow');
    if (win) {
      win.classList.add('open');
      const input = document.getElementById('hsCsInput');
      if (input) setTimeout(() => input.focus(), 150);
    }
  }

  function close() {
    isOpen = false;
    const win = document.getElementById('hsCsWindow');
    if (win) win.classList.remove('open');
  }

  function toggle() {
    if (isOpen) close();
    else open();
  }

  function clearChat() {
    conversationHistory = [];
    addGreeting();
  }

  function detectRole() {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('/seller/') || path.includes('/landlord/')) return 'seller';
    if (path.includes('/buyer/')) return 'buyer';
    if (global.HS && global.HS.auth && typeof global.HS.auth.getUser === 'function') {
      const u = global.HS.auth.getUser();
      if (u && (u.role === 'seller' || u.role === 'landlord')) return 'seller';
    }
    return 'buyer';
  }

  function init(options = {}) {
    if (initialized) return;
    initialized = true;

    currentRole = options.role || detectRole();
    injectCSS();
    buildDOM();
  }

  // Auto-init on load if in buyer or seller pages
  function autoInit() {
    const path = window.location.pathname.toLowerCase();
    // Only auto-initialize on Help & Support pages
    if (path.includes('help.html') || path.endsWith('/help')) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => init());
      } else {
        init();
      }
    }
  }

  autoInit();

  // Export to global scope
  global.HomeSureCustomerService = {
    init,
    open,
    close,
    toggle,
    ask: (q) => {
      open();
      sendMessage(q);
    }
  };

})(window);
