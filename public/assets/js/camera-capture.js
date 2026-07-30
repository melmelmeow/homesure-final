/* ═══════════════════════════════════════════════════════════════════════════
   CAMERA CAPTURE
   Live camera capture for verification photos
   ═══════════════════════════════════════════════════════════════════════════ */

const CameraCapture = (function() {

  let stream = null;
  let capturedImage = null;
  let currentCallback = null;
  let videoElement = null;
  let canvasElement = null;

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZE MODAL
  // ═══════════════════════════════════════════════════════════════════════════

  function initModal() {
    if (document.getElementById('cameraBackdrop')) return;

    const modalHTML = `
      <div id="cameraBackdrop" class="camera-backdrop">
        <div class="camera-modal">
          <div class="camera-header">
            <div class="camera-title" id="cameraTitle">Take Photo</div>
            <button class="camera-close" onclick="CameraCapture.close()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="camera-body" id="cameraBody">
            <!-- Content will be inserted here -->
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Create hidden canvas for capture
    canvasElement = document.createElement('canvas');

    // Close on backdrop click
    document.getElementById('cameraBackdrop').addEventListener('click', (e) => {
      if (e.target.id === 'cameraBackdrop') {
        close();
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // OPEN CAMERA
  // ═══════════════════════════════════════════════════════════════════════════

  function open(options = {}) {
    /*
      options: {
        title: 'Take ID Photo',
        instructions: ['Center your ID', 'Make sure text is readable'],
        onCapture: (imageDataURL) => { ... }
      }
    */

    initModal();
    currentCallback = options.onCapture || null;

    // Set title
    document.getElementById('cameraTitle').textContent = options.title || 'Take Photo';

    // Show loading state
    showLoading();

    // Show modal
    document.getElementById('cameraBackdrop').classList.add('active');

    // Start camera
    startCamera(options.instructions);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // START CAMERA
  // ═══════════════════════════════════════════════════════════════════════════

  async function startCamera(instructions = []) {
    const body = document.getElementById('cameraBody');

    try {
      // Request camera access
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Front camera (use 'environment' for back camera)
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      // Build instructions HTML
      const instructionsHTML = instructions.length > 0
        ? `<div class="camera-instructions">
             <div class="camera-instructions-title">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <circle cx="12" cy="12" r="10"/>
                 <line x1="12" y1="16" x2="12" y2="12"/>
                 <line x1="12" y1="8" x2="12.01" y2="8"/>
               </svg>
               Instructions
             </div>
             <ul class="camera-instructions-list">
               ${instructions.map(i => `<li>${i}</li>`).join('')}
             </ul>
           </div>`
        : '';

      // Show camera view
      body.innerHTML = `
        ${instructionsHTML}
        <div class="camera-viewport">
          <video id="cameraVideo" class="camera-video" autoplay playsinline></video>
          <img id="cameraPreview" class="camera-preview" alt="Preview" />
          <div class="camera-guide"></div>
          <button class="camera-capture-btn" id="cameraCaptureBtn" onclick="CameraCapture.capture()"></button>
        </div>
        <div class="camera-actions">
          <button class="camera-btn camera-btn-secondary" onclick="CameraCapture.close()">
            Cancel
          </button>
          <button class="camera-btn camera-btn-primary" id="cameraUseBtn" onclick="CameraCapture.use()" style="display:none;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Use Photo
          </button>
          <button class="camera-btn camera-btn-secondary" id="cameraRetakeBtn" onclick="CameraCapture.retake()" style="display:none;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
            </svg>
            Retake
          </button>
        </div>
      `;

      // Attach stream to video
      videoElement = document.getElementById('cameraVideo');
      videoElement.srcObject = stream;

    } catch (error) {
      console.error('Camera access error:', error);
      showError(error);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CAPTURE PHOTO
  // ═══════════════════════════════════════════════════════════════════════════

  function capture() {
    if (!videoElement) return;

    // Set canvas size to match video
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;

    // Draw video frame to canvas
    const ctx = canvasElement.getContext('2d');
    ctx.drawImage(videoElement, 0, 0);

    // Get image data
    capturedImage = canvasElement.toDataURL('image/jpeg', 0.9);

    // Show preview
    const previewElement = document.getElementById('cameraPreview');
    previewElement.src = capturedImage;
    previewElement.classList.add('active');

    // Hide video and capture button
    videoElement.style.display = 'none';
    document.getElementById('cameraCaptureBtn').style.display = 'none';
    document.querySelector('.camera-guide').style.display = 'none';

    // Show use/retake buttons
    document.getElementById('cameraUseBtn').style.display = 'flex';
    document.getElementById('cameraRetakeBtn').style.display = 'flex';

    // Stop camera stream
    stopStream();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RETAKE PHOTO
  // ═══════════════════════════════════════════════════════════════════════════

  function retake() {
    capturedImage = null;

    // Hide preview
    const previewElement = document.getElementById('cameraPreview');
    previewElement.classList.remove('active');

    // Show video and capture button
    videoElement.style.display = 'block';
    document.getElementById('cameraCaptureBtn').style.display = 'block';
    document.querySelector('.camera-guide').style.display = 'block';

    // Hide use/retake buttons
    document.getElementById('cameraUseBtn').style.display = 'none';
    document.getElementById('cameraRetakeBtn').style.display = 'none';

    // Restart camera
    startCamera();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // USE PHOTO
  // ═══════════════════════════════════════════════════════════════════════════

  function use() {
    if (capturedImage && currentCallback) {
      currentCallback(capturedImage);
    }
    close();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CLOSE MODAL
  // ═══════════════════════════════════════════════════════════════════════════

  function close() {
    stopStream();
    capturedImage = null;
    currentCallback = null;
    videoElement = null;

    const backdrop = document.getElementById('cameraBackdrop');
    if (backdrop) {
      backdrop.classList.remove('active');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STOP CAMERA STREAM
  // ═══════════════════════════════════════════════════════════════════════════

  function stopStream() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SHOW LOADING STATE
  // ═══════════════════════════════════════════════════════════════════════════

  function showLoading() {
    const body = document.getElementById('cameraBody');
    body.innerHTML = `
      <div class="camera-viewport">
        <div class="camera-loading">
          <div class="camera-loading-spinner"></div>
          <div>Starting camera...</div>
        </div>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SHOW ERROR STATE
  // ═══════════════════════════════════════════════════════════════════════════

  function showError(error) {
    const body = document.getElementById('cameraBody');

    let errorMessage = 'Could not access camera. Please check your browser permissions.';
    if (error.name === 'NotAllowedError') {
      errorMessage = 'Camera access was denied. Please allow camera access in your browser settings.';
    } else if (error.name === 'NotFoundError') {
      errorMessage = 'No camera found on this device.';
    }

    body.innerHTML = `
      <div class="camera-error">
        <svg class="camera-error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <div class="camera-error-title">Camera Not Available</div>
        <div class="camera-error-message">${errorMessage}</div>
        <button class="camera-btn camera-btn-primary" onclick="CameraCapture.close()">
          Close
        </button>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════

  return {
    open,
    capture,
    retake,
    use,
    close
  };

})();

console.log('✅ Camera Capture loaded');
