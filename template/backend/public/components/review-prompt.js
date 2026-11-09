// ═══════════════════════════════════════════════════════════════════════════
//  HomeSure - Auto Review Prompt (Phone App Style)
//  Appears after payments, rentals, or randomly like mobile apps
//  Usage: ReviewPrompt.trigger({ context: 'payment', propertyName: '...' })
// ═══════════════════════════════════════════════════════════════════════════

(function (global) {
  'use strict';

  const CSS = `
    /* Review Prompt Overlay */
    .review-prompt-overlay {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(8px);
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: reviewFadeIn 0.3s ease;
    }
    .review-prompt-overlay.active {
      display: flex;
    }

    /* Review Prompt Card */
    .review-prompt-card {
      background: linear-gradient(135deg, #253347 0%, #1E293B 100%);
      border: 2px solid rgba(0, 201, 167, 0.3);
      border-radius: 24px;
      width: 100%;
      max-width: 420px;
      padding: 0;
      overflow: hidden;
      animation: reviewSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
      position: relative;
    }

    /* Accent Top Bar */
    .review-prompt-accent {
      height: 4px;
      background: linear-gradient(90deg, #00c9a7, #00a88a);
    }

    /* Header */
    .review-prompt-header {
      text-align: center;
      padding: 32px 24px 24px;
    }
    .review-prompt-emoji {
      font-size: 64px;
      margin-bottom: 16px;
      animation: reviewBounce 0.6s ease 0.3s;
    }
    .review-prompt-title {
      font-size: 22px;
      font-weight: 800;
      color: #f1f5f9;
      margin-bottom: 8px;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .review-prompt-subtitle {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.6);
      line-height: 1.5;
    }

    /* Property Info (if applicable) */
    .review-prompt-property {
      background: rgba(0, 201, 167, 0.08);
      border: 1px solid rgba(0, 201, 167, 0.2);
      border-radius: 12px;
      padding: 12px 16px;
      margin: 0 24px 24px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .review-prompt-property svg {
      width: 18px;
      height: 18px;
      color: #00c9a7;
      flex-shrink: 0;
    }
    .review-prompt-property-name {
      font-size: 13px;
      font-weight: 700;
      color: #00c9a7;
    }

    /* Star Rating */
    .review-prompt-stars {
      display: flex;
      justify-content: center;
      gap: 12px;
      padding: 0 24px 24px;
    }
    .review-star {
      font-size: 48px;
      color: rgba(255, 255, 255, 0.15);
      cursor: pointer;
      transition: all 0.2s ease;
      user-select: none;
    }
    .review-star:hover,
    .review-star.active {
      color: #fbbf24;
      transform: scale(1.1);
    }
    .review-star:active {
      transform: scale(0.95);
    }

    /* Feedback Text (optional, appears after rating) */
    .review-prompt-feedback {
      display: none;
      padding: 0 24px 24px;
    }
    .review-prompt-feedback.active {
      display: block;
      animation: reviewFadeIn 0.3s ease;
    }
    .review-prompt-textarea {
      width: 100%;
      background: #1a2739;
      border: 1.5px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 14px 16px;
      color: #f1f5f9;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 14px;
      outline: none;
      resize: vertical;
      min-height: 80px;
      max-height: 120px;
      transition: border-color 0.2s;
    }
    .review-prompt-textarea:focus {
      border-color: rgba(0, 201, 167, 0.4);
    }
    .review-prompt-textarea::placeholder {
      color: rgba(255, 255, 255, 0.3);
    }

    /* Actions */
    .review-prompt-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      padding: 24px;
      background: rgba(0, 0, 0, 0.2);
    }
    .review-prompt-btn {
      padding: 14px 20px;
      border-radius: 12px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .review-prompt-btn-later {
      background: transparent;
      border: 1.5px solid rgba(255, 255, 255, 0.15);
      color: rgba(255, 255, 255, 0.6);
    }
    .review-prompt-btn-later:hover {
      border-color: rgba(255, 255, 255, 0.3);
      color: rgba(255, 255, 255, 0.8);
    }
    .review-prompt-btn-submit {
      background: linear-gradient(135deg, #00c9a7, #00a88a);
      color: white;
      box-shadow: 0 4px 12px rgba(0, 201, 167, 0.4);
    }
    .review-prompt-btn-submit:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 201, 167, 0.5);
    }
    .review-prompt-btn-submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    /* Thank You State */
    .review-prompt-thanks {
      display: none;
      text-align: center;
      padding: 40px 24px;
    }
    .review-prompt-thanks.active {
      display: block;
      animation: reviewFadeIn 0.3s ease;
    }
    .review-prompt-thanks-emoji {
      font-size: 72px;
      margin-bottom: 20px;
    }
    .review-prompt-thanks-title {
      font-size: 24px;
      font-weight: 800;
      color: #00c9a7;
      margin-bottom: 8px;
    }
    .review-prompt-thanks-text {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.6);
    }

    /* Animations */
    @keyframes reviewFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes reviewSlideUp {
      from {
        opacity: 0;
        transform: translateY(40px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    @keyframes reviewBounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
      .review-prompt-card {
        max-width: 90%;
        border-radius: 20px;
      }
      .review-prompt-emoji {
        font-size: 56px;
      }
      .review-prompt-title {
        font-size: 20px;
      }
      .review-star {
        font-size: 42px;
        gap: 8px;
      }
    }

    @media (max-width: 480px) {
      .review-prompt-card {
        max-width: 95%;
        border-radius: 16px;
      }
      .review-prompt-header {
        padding: 24px 20px 20px;
      }
      .review-prompt-emoji {
        font-size: 52px;
        margin-bottom: 12px;
      }
      .review-prompt-title {
        font-size: 18px;
      }
      .review-prompt-subtitle {
        font-size: 13px;
      }
      .review-prompt-stars {
        gap: 8px;
        padding: 0 20px 20px;
      }
      .review-star {
        font-size: 36px;
      }
      .review-prompt-feedback {
        padding: 0 20px 20px;
      }
      .review-prompt-textarea {
        font-size: 13px;
        padding: 12px 14px;
      }
      .review-prompt-actions {
        grid-template-columns: 1fr;
        padding: 20px;
        gap: 10px;
      }
      .review-prompt-btn {
        padding: 12px 16px;
        font-size: 14px;
      }
      .review-prompt-property {
        padding: 10px 14px;
        margin: 0 20px 20px;
      }
      .review-prompt-property-name {
        font-size: 12px;
      }
    }

    @media (max-width: 360px) {
      .review-star {
        font-size: 32px;
        gap: 6px;
      }
      .review-prompt-stars {
        gap: 6px;
      }
    }
  `;

  // Inject CSS
  if (!document.getElementById('review-prompt-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'review-prompt-styles';
    styleEl.textContent = CSS;
    document.head.appendChild(styleEl);
  }

  let overlayEl = null;
  let selectedRating = 0;
  let currentContext = null;

  // Create DOM structure
  function createPromptDOM() {
    if (overlayEl) return;

    const html = `
      <div class="review-prompt-overlay" id="reviewPromptOverlay">
        <div class="review-prompt-card">
          <div class="review-prompt-accent"></div>

          <!-- Main Content -->
          <div id="reviewPromptMain">
            <div class="review-prompt-header">
              <div class="review-prompt-emoji">😊</div>
              <div class="review-prompt-title">How's your experience?</div>
              <div class="review-prompt-subtitle">Help others by sharing your feedback</div>
            </div>

            <div class="review-prompt-property" id="reviewPromptProperty" style="display: none;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              </svg>
              <div class="review-prompt-property-name" id="reviewPromptPropertyName"></div>
            </div>

            <div class="review-prompt-stars" id="reviewPromptStars">
              <span class="review-star" data-rating="1">★</span>
              <span class="review-star" data-rating="2">★</span>
              <span class="review-star" data-rating="3">★</span>
              <span class="review-star" data-rating="4">★</span>
              <span class="review-star" data-rating="5">★</span>
            </div>

            <div class="review-prompt-feedback" id="reviewPromptFeedback">
              <textarea
                class="review-prompt-textarea"
                id="reviewPromptText"
                placeholder="Tell us more about your experience... (optional)"
                maxlength="500"
              ></textarea>
            </div>

            <div class="review-prompt-actions">
              <button class="review-prompt-btn review-prompt-btn-later" onclick="ReviewPrompt.dismiss()">
                Maybe Later
              </button>
              <button class="review-prompt-btn review-prompt-btn-submit" id="reviewPromptSubmitBtn" disabled onclick="ReviewPrompt.submit()">
                Submit
              </button>
            </div>
          </div>

          <!-- Thank You State -->
          <div class="review-prompt-thanks" id="reviewPromptThanks">
            <div class="review-prompt-thanks-emoji">🎉</div>
            <div class="review-prompt-thanks-title">Thank you!</div>
            <div class="review-prompt-thanks-text">Your feedback helps us improve HomeSure</div>
          </div>
        </div>
      </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container.firstElementChild);
    overlayEl = document.getElementById('reviewPromptOverlay');

    // Setup star click handlers
    document.querySelectorAll('.review-star').forEach(star => {
      star.addEventListener('click', () => {
        selectRating(parseInt(star.dataset.rating));
      });
    });
  }

  // Select star rating
  function selectRating(rating) {
    selectedRating = rating;

    // Update stars
    document.querySelectorAll('.review-star').forEach((star, index) => {
      if (index < rating) {
        star.classList.add('active');
      } else {
        star.classList.remove('active');
      }
    });

    // Show feedback textarea
    document.getElementById('reviewPromptFeedback').classList.add('active');

    // Enable submit button
    document.getElementById('reviewPromptSubmitBtn').disabled = false;
  }

  // Show prompt
  function trigger(options = {}) {
    const {
      context = 'general', // payment, rental, random
      propertyName = null,
      delay = 1000, // ms delay before showing
    } = options;

    currentContext = options;

    // Check if user already reviewed or dismissed recently
    const lastPrompt = localStorage.getItem('hs_last_review_prompt');
    if (lastPrompt) {
      const daysSince = (Date.now() - parseInt(lastPrompt)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) {
        console.log('⏸️ Review prompt skipped (shown recently)');
        return; // Don't show if prompted within last 7 days
      }
    }

    createPromptDOM();

    // Set property name if provided
    if (propertyName) {
      document.getElementById('reviewPromptProperty').style.display = 'flex';
      document.getElementById('reviewPromptPropertyName').textContent = propertyName;
    }

    // Show with delay
    setTimeout(() => {
      overlayEl.classList.add('active');
      localStorage.setItem('hs_last_review_prompt', Date.now().toString());
    }, delay);
  }

  // Dismiss prompt
  function dismiss() {
    overlayEl.classList.remove('active');
    selectedRating = 0;

    // Reset state after animation
    setTimeout(() => {
      document.getElementById('reviewPromptFeedback').classList.remove('active');
      document.getElementById('reviewPromptText').value = '';
      document.querySelectorAll('.review-star').forEach(star => star.classList.remove('active'));
      document.getElementById('reviewPromptSubmitBtn').disabled = true;
    }, 300);
  }

  // Submit review
  function submit() {
    if (selectedRating === 0) return;

    const feedbackText = document.getElementById('reviewPromptText').value;

    // Log review data (in production, send to backend)
    console.log('📝 Review submitted:', {
      rating: selectedRating,
      feedback: feedbackText,
      context: currentContext,
      timestamp: new Date().toISOString(),
    });

    // Show thank you state
    document.getElementById('reviewPromptMain').style.display = 'none';
    document.getElementById('reviewPromptThanks').classList.add('active');

    // Close after 2 seconds
    setTimeout(() => {
      overlayEl.classList.remove('active');

      // Reset after animation
      setTimeout(() => {
        document.getElementById('reviewPromptMain').style.display = 'block';
        document.getElementById('reviewPromptThanks').classList.remove('active');
        document.getElementById('reviewPromptFeedback').classList.remove('active');
        document.getElementById('reviewPromptText').value = '';
        document.querySelectorAll('.review-star').forEach(star => star.classList.remove('active'));
        document.getElementById('reviewPromptSubmitBtn').disabled = true;
        selectedRating = 0;
      }, 300);
    }, 2000);
  }

  // Public API
  global.ReviewPrompt = {
    trigger,
    dismiss,
    submit,
  };

})(window);
