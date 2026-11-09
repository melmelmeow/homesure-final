/* ═══════════════════════════════════════════════════════════════════════════
   CHATBOT WIDGET
   AI-powered chatbot with auto-escalation to human agents
   ═══════════════════════════════════════════════════════════════════════════ */

const ChatbotWidget = (function() {

  let isOpen = false;
  let messages = [];
  let isTyping = false;
  let hasEscalated = false;

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZE WIDGET
  // ═══════════════════════════════════════════════════════════════════════════

  function init() {
    if (document.getElementById('chatbotWidget')) return;

    const widgetHTML = `
      <!-- Chat Bubble -->
      <div class="chatbot-bubble" id="chatbotBubble" onclick="ChatbotWidget.toggle()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </div>

      <!-- Chat Window -->
      <div class="chatbot-window" id="chatbotWindow">
        <div class="chatbot-header">
          <div class="chatbot-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2a4 4 0 0 1 4 4v2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h2V6a4 4 0 0 1 4-4z"/>
              <circle cx="12" cy="14" r="2"/>
            </svg>
          </div>
          <div class="chatbot-header-info">
            <div class="chatbot-header-title">HomeSure Assistant</div>
            <div class="chatbot-header-status">
              <span class="chatbot-status-dot"></span>
              Online
            </div>
          </div>
          <button class="chatbot-close" onclick="ChatbotWidget.close()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="chatbot-messages" id="chatbotMessages"></div>

        <div class="chatbot-input-area">
          <div class="chatbot-input-wrap">
            <textarea
              class="chatbot-input"
              id="chatbotInput"
              placeholder="Type your message..."
              rows="1"
              onkeydown="ChatbotWidget.handleKeyDown(event)"
            ></textarea>
            <button class="chatbot-send-btn" id="chatbotSendBtn" onclick="ChatbotWidget.sendMessage()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', widgetHTML);

    // Send welcome message
    setTimeout(() => {
      addBotMessage('Hi! 👋 I\'m your HomeSure assistant. How can I help you today?', true);
    }, 500);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TOGGLE WIDGET
  // ═══════════════════════════════════════════════════════════════════════════

  function toggle() {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }

  function open() {
    isOpen = true;
    document.getElementById('chatbotWindow').classList.add('open');
    document.getElementById('chatbotBubble').classList.add('hidden');
    document.getElementById('chatbotInput').focus();
  }

  function close() {
    isOpen = false;
    document.getElementById('chatbotWindow').classList.remove('open');
    document.getElementById('chatbotBubble').classList.remove('hidden');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SEND MESSAGE
  // ═══════════════════════════════════════════════════════════════════════════

  function sendMessage() {
    const input = document.getElementById('chatbotInput');
    const text = input.value.trim();

    if (!text || isTyping) return;

    // Add user message
    addUserMessage(text);
    input.value = '';

    // Process with bot
    setTimeout(() => {
      processUserMessage(text);
    }, 600);
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ADD MESSAGES
  // ═══════════════════════════════════════════════════════════════════════════

  function addUserMessage(text) {
    messages.push({ type: 'user', text });
    renderMessages();
  }

  function addBotMessage(text, withQuickActions = false) {
    messages.push({ type: 'bot', text, withQuickActions });
    renderMessages();
  }

  function renderMessages() {
    const container = document.getElementById('chatbotMessages');

    container.innerHTML = messages.map(msg => {
      if (msg.type === 'user') {
        return `
          <div class="chatbot-message user">
            <div class="chatbot-message-avatar">ME</div>
            <div class="chatbot-message-bubble">${msg.text}</div>
          </div>
        `;
      } else {
        const quickActionsHTML = msg.withQuickActions ? `
          <div class="chatbot-quick-actions">
            <button class="chatbot-quick-btn" onclick="ChatbotWidget.quickAction('How do I list a property?')">List Property</button>
            <button class="chatbot-quick-btn" onclick="ChatbotWidget.quickAction('How do payments work?')">Payments</button>
            <button class="chatbot-quick-btn" onclick="ChatbotWidget.quickAction('How to verify my account?')">Verification</button>
          </div>
        ` : '';

        return `
          <div class="chatbot-message bot">
            <div class="chatbot-message-avatar">🏠</div>
            <div>
              <div class="chatbot-message-bubble">${msg.text}</div>
              ${quickActionsHTML}
            </div>
          </div>
        `;
      }
    }).join('');

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
  }

  function showTyping() {
    isTyping = true;
    const container = document.getElementById('chatbotMessages');
    container.insertAdjacentHTML('beforeend', `
      <div class="chatbot-typing" id="chatbotTyping">
        <div class="chatbot-message-avatar">🏠</div>
        <div class="chatbot-message-bubble">
          <div class="chatbot-typing-dot"></div>
          <div class="chatbot-typing-dot"></div>
          <div class="chatbot-typing-dot"></div>
        </div>
      </div>
    `);
    container.scrollTop = container.scrollHeight;
  }

  function hideTyping() {
    isTyping = false;
    const typing = document.getElementById('chatbotTyping');
    if (typing) typing.remove();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROCESS USER MESSAGE (AI LOGIC)
  // ═══════════════════════════════════════════════════════════════════════════

  function processUserMessage(text) {
    showTyping();

    const lowerText = text.toLowerCase();
    let response = '';
    let shouldEscalate = false;

    // Check if complex question (auto-escalate triggers)
    const complexKeywords = ['problem', 'issue', 'not working', 'error', 'complaint', 'refund', 'legal', 'lawyer', 'scam', 'fraud', 'help me', 'urgent'];
    const hasComplexKeyword = complexKeywords.some(keyword => lowerText.includes(keyword));

    // FAQ Responses
    if (lowerText.includes('list') && (lowerText.includes('property') || lowerText.includes('house') || lowerText.includes('apartment'))) {
      response = 'To list a property:\n1. Complete identity verification first\n2. Click "Post Property" from your dashboard\n3. Fill in property details, upload photos\n4. Submit required documents (TCT/Deed of Sale)\n5. Wait for admin approval (1-2 business days)';
    }
    else if (lowerText.includes('payment') || lowerText.includes('pay') && lowerText.includes('how')) {
      response = 'HomeSure uses QRPH for secure payments. You can pay via:\n• GCash\n• Maya (Maya)\n• Credit/Debit Card\n\nPayments are confirmed instantly and sellers receive notifications.';
    }
    else if (lowerText.includes('verify') || lowerText.includes('verification')) {
      response = 'To verify your account:\n1. Go to your Profile page\n2. Click "Re-verify Account"\n3. Take photos of your ID and selfie using your camera\n4. Submit for review\n5. Approval within 24 hours\n\nVerification is required to message sellers and list properties.';
    }
    else if (lowerText.includes('message') || lowerText.includes('contact seller')) {
      response = 'To message a seller:\n1. Make sure your account is verified\n2. Click on a property listing\n3. Click "Message Seller" button\n4. Start your conversation!\n\nYou can discuss property details, schedule viewings, and receive payment requests via messages.';
    }
    else if (lowerText.includes('multi') && lowerText.includes('unit')) {
      response = 'For properties with multiple units (apartments, condos):\n1. Enable "Multiple Units" toggle when listing\n2. Set total units and available units\n3. Each booking automatically decreases available units\n4. You can adjust availability anytime from your listings page\n\nPerfect for apartment buildings!';
    }
    else if (lowerText.includes('camera') || lowerText.includes('photo')) {
      response = 'HomeSure uses live camera capture for:\n• Identity verification (ID + selfie)\n• Property documents (TCT, permits)\n• Multiple pages supported\n\nTake photos of ALL pages (front & back if applicable). No file size limits!';
    }
    else if (lowerText.includes('close') && lowerText.includes('listing')) {
      response = 'After receiving payment, you\'ll be prompted to close the listing. You can also:\n• Close manually from your listings page\n• Admin can close if you forget\n• For multi-unit properties, adjust availability instead\n\nClosed listings can be reopened anytime.';
    }
    else if (lowerText.includes('hello') || lowerText.includes('hi ') || lowerText === 'hi') {
      response = 'Hello! How can I assist you today? I can help with:\n• Listing properties\n• Payments\n• Verification\n• Messages\n• Multi-unit properties';
    }
    else if (hasComplexKeyword) {
      // Complex question detected - escalate
      shouldEscalate = true;
      response = 'I understand this requires more detailed assistance. Let me connect you with a human agent who can better help you with this.';
    }
    else {
      // Unknown question - escalate
      shouldEscalate = true;
      response = 'I\'m not sure about that specific question. Would you like me to connect you with a human agent for better assistance?';
    }

    // Simulate delay
    setTimeout(() => {
      hideTyping();
      addBotMessage(response);

      // Show escalation card if needed
      if (shouldEscalate && !hasEscalated) {
        showEscalationCard();
      }
    }, 1500);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ESCALATION TO HUMAN AGENT
  // ═══════════════════════════════════════════════════════════════════════════

  function showEscalationCard() {
    const container = document.getElementById('chatbotMessages');
    container.insertAdjacentHTML('beforeend', `
      <div class="chatbot-message bot">
        <div class="chatbot-message-avatar">🏠</div>
        <div style="max-width:75%;">
          <div class="chatbot-escalation">
            <div class="chatbot-escalation-text">
              Need more help? Connect with our support team or contact the property seller directly.
            </div>
            <button class="chatbot-escalation-btn" onclick="ChatbotWidget.escalate()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Talk to Support Team
            </button>
          </div>
        </div>
      </div>
    `);
    container.scrollTop = container.scrollHeight;
    hasEscalated = true;
  }

  function escalate() {
    // Redirect to messages page or show contact form
    addBotMessage('Redirecting you to our support team... Please check your Messages page or email us at support@homesure.com');

    setTimeout(() => {
      window.location.href = window.location.pathname.includes('/module/')
        ? 'messages.html'
        : 'module/buyer/messages.html';
    }, 2000);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QUICK ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  function quickAction(question) {
    addUserMessage(question);
    setTimeout(() => {
      processUserMessage(question);
    }, 600);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FULL PAGE MODE (for dedicated help page)
  // ═══════════════════════════════════════════════════════════════════════════

  function initFullPage() {
    // Send welcome message for full-page mode
    setTimeout(() => {
      addBotMessage('Hi! 👋 I\'m your HomeSure assistant. How can I help you today?', true);
    }, 500);

    // Focus input
    document.getElementById('chatbotInput').focus();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════

  return {
    init,
    initFullPage,
    toggle,
    open,
    close,
    sendMessage,
    handleKeyDown,
    escalate,
    quickAction
  };

})();

// Note: Auto-initialization disabled. Call ChatbotWidget.init() for floating mode
// or ChatbotWidget.initFullPage() for dedicated help page mode.

console.log('✅ Chatbot Widget loaded');
