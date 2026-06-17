import './style.css';
import { 
  mergePDFs, 
  splitPDF, 
  splitPDFIntoIndividual, 
  removePages,
  organizePDF,
  compressPDF,
  repairPDF,
  ocrPDF,
  imagesToPDF,
  officeToPDF,
  htmlToPDF,
  pdfToOffice,
  rotatePDF,
  addPageNumbers,
  addWatermark,
  cropPDF,
  editPDF,
  fillPDFForms,
  protectPDF,
  unlockPDF,
  signPDF,
  redactPDF,
  comparePDFs,
  pdfToImages,
  generatePagePreviews,
  getPDFFirstPageThumbnail,
  aiAssistantPDF,
  aiSummarizePDF,
  aiTranslatePDF,
  aiRemoveBackground,
  aiUpscaleImage
} from './pdf-tools.js';

// Application State
let currentTool = null;
let uploadedFiles = [];
let pagePreviews = [];
let pageRotations = {};
let selectedPages = new Set();
let signatureDataUrl = null;
let signaturePlacement = null; // { page: 0, x: 0, y: 0, w: 100, h: 50 }
let redactionBoxes = []; // [ { page: 0, x, y, w, h } ]
let editTextBoxes = []; // [ { page: 0, x: 0, y: 0, text: '', size: 12, type: 'text' } ]

// Safe storage wrapper to prevent DOMException when Tracking Prevention blocks storage access
const memoryStorage = {};
const safeStorage = {
  getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('Storage access blocked. Falling back to in-memory storage.', e);
      return memoryStorage[key] || null;
    }
  },
  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('Storage access blocked. Falling back to in-memory storage.', e);
      memoryStorage[key] = value;
    }
  },
  removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('Storage access blocked. Falling back to in-memory storage.', e);
      delete memoryStorage[key];
    }
  }
};

const memorySessionStorage = {};
const safeSessionStorage = {
  getItem(key) {
    try {
      return sessionStorage.getItem(key);
    } catch (e) {
      console.warn('Session storage access blocked. Falling back to in-memory storage.', e);
      return memorySessionStorage[key] || null;
    }
  },
  setItem(key, value) {
    try {
      sessionStorage.setItem(key, value);
    } catch (e) {
      console.warn('Session storage access blocked. Falling back to in-memory storage.', e);
      memorySessionStorage[key] = value;
    }
  }
};

// User Auth State
let token = safeStorage.getItem('token') || null;
let currentUser = null;

// Cumulative Size Session Tracking Helpers
function getCumulativeUploadSize() {
  const size = safeSessionStorage.getItem('cumulative_upload_size');
  return size ? parseInt(size, 10) : 0;
}
function addCumulativeUploadSize(bytes) {
  const current = getCumulativeUploadSize();
  safeSessionStorage.setItem('cumulative_upload_size', current + bytes);
}

// Dev environment browser redirect helper
function performCheckoutRedirect(url) {
  let targetUrl = url;
  if (targetUrl.startsWith('/') && window.location.port === '5173') {
    targetUrl = `http://localhost:3000${targetUrl}`;
  }
  window.location.href = targetUrl;
}

// Global Fetch Interceptor to auto-inject auth token and cumulative session upload size
const originalFetch = window.fetch;
window.fetch = function (url, options = {}) {
  if (typeof url === 'string' && url.startsWith('/api/')) {
    if (!options.headers) {
      options.headers = {};
    }
    if (token && !options.headers['Authorization'] && !options.headers['authorization']) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    const cumulativeSize = getCumulativeUploadSize().toString();
    options.headers['x-cumulative-size'] = cumulativeSize;
  }
  return originalFetch(url, options);
};

// Webcam stream handler
let webcamStream = null;
let blogQuill = null;

// Drawing Pad state
let isDrawing = false;
let sigCtx = null;

// Tool Metadata
const TOOL_META = {
  merge: { title: 'Merge PDF', desc: 'Combine multiple PDFs into a single organized file.', uploadHeadline: 'Upload multiple PDFs to merge', uploadSubline: 'or drag and drop them here', accepts: '.pdf', multiple: true },
  split: { title: 'Split PDF', desc: 'Extract page ranges or split each page into a separate document.', uploadHeadline: 'Upload a PDF to split', uploadSubline: 'or drag and drop it here', accepts: '.pdf', multiple: false },
  'remove-pages': { title: 'Remove Pages', desc: 'Remove specific pages from a PDF document.', uploadHeadline: 'Upload a PDF to delete pages from', uploadSubline: 'or drag and drop it here', accepts: '.pdf', multiple: false },
  'extract-pages': { title: 'Extract Pages', desc: 'Save selected pages from a PDF as a new file.', uploadHeadline: 'Upload a PDF to extract pages from', uploadSubline: 'or drag and drop it here', accepts: '.pdf', multiple: false },
  'organize-pdf': { title: 'Organize PDF', desc: 'Reorder pages in a PDF visually.', uploadHeadline: 'Upload a PDF to reorder pages', uploadSubline: 'or drag and drop it here', accepts: '.pdf', multiple: false },
  'scan-to-pdf': { title: 'Scan to PDF', desc: 'Capture images from your camera and compile them to PDF.', uploadHeadline: 'Webcam snapshot tool active', uploadSubline: 'Use controls below to capture', accepts: '', multiple: true, noUpload: true },
  compress: { title: 'Compress PDF', desc: 'Optimize and shrink the file size of your PDF.', uploadHeadline: 'Upload a PDF to compress', uploadSubline: 'or drag and drop it here', accepts: '.pdf', multiple: false },
  repair: { title: 'Repair PDF', desc: 'Attempt to recover content from damaged or corrupt PDFs.', uploadHeadline: 'Upload a PDF to repair', uploadSubline: 'or drag and drop it here', accepts: '.pdf', multiple: false },
  ocr: { title: 'OCR PDF', desc: 'Recognize scanned text layers and convert to searchable formats.', uploadHeadline: 'Upload a scanned PDF to apply OCR', uploadSubline: 'or drag and drop it here', accepts: '.pdf', multiple: false },
  'img-to-pdf': { title: 'JPG to PDF', desc: 'Convert JPG and PNG images into a PDF file.', uploadHeadline: 'Upload images to convert to PDF', uploadSubline: 'or drag and drop them here', accepts: 'image/png, image/jpeg, image/jpg', multiple: true },
  'word-to-pdf': { title: 'Word to PDF', desc: 'Convert DOCX documents to formatted PDFs.', uploadHeadline: 'Upload a Word file to convert', uploadSubline: 'or drag and drop it here', accepts: '.docx', multiple: false },
  'ppt-to-pdf': { title: 'PPT to PDF', desc: 'Convert PowerPoint slides to PDFs.', uploadHeadline: 'Upload a PPTX presentation to convert', uploadSubline: 'or drag and drop it here', accepts: '.pptx', multiple: false },
  'excel-to-pdf': { title: 'Excel to PDF', desc: 'Convert XLSX spreadsheets to PDFs.', uploadHeadline: 'Upload an Excel spreadsheet to convert', uploadSubline: 'or drag and drop it here', accepts: '.xlsx', multiple: false },
  'html-to-pdf': { title: 'HTML to PDF', desc: 'Compile raw HTML code or web URLs into formatted PDFs.', uploadHeadline: 'HTML input mode active', uploadSubline: 'Configure parameters in sidebar', accepts: '', multiple: false, noUpload: true },
  'pdf-to-img': { title: 'PDF to JPG', desc: 'Extract pages from a PDF as separate PNG image downloads.', uploadHeadline: 'Upload a PDF to convert to images', uploadSubline: 'or drag and drop it here', accepts: '.pdf', multiple: false },
  'pdf-to-word': { title: 'PDF to Word', desc: 'Export PDF content text into a Word document.', uploadHeadline: 'Upload a PDF to convert to DOCX', uploadSubline: 'or drag and drop it here', accepts: '.pdf', multiple: false },
  'pdf-to-ppt': { title: 'PDF to PPT', desc: 'Export PDF pages into PowerPoint presentation slides.', uploadHeadline: 'Upload a PDF to convert to PPTX', uploadSubline: 'or drag and drop it here', accepts: '.pdf', multiple: false },
  'pdf-to-excel': { title: 'PDF to Excel', desc: 'Parse table boundaries and export data to Excel spreadsheet rows.', uploadHeadline: 'Upload a PDF to convert to XLSX', uploadSubline: 'or drag and drop it here', accepts: '.pdf', multiple: false },
  rotate: { title: 'Rotate PDF', desc: 'Set portrait/landscape rotation angles on pages.', uploadHeadline: 'Upload a PDF to rotate pages', uploadSubline: 'or drag and drop it here', accepts: '.pdf', multiple: false },
  'page-numbers': { title: 'Page Numbers', desc: 'Stamp page count numbering onto page corners.', uploadHeadline: 'Upload a PDF to add page numbers', uploadSubline: 'or drag and drop it here', accepts: '.pdf', multiple: false },
  watermark: { title: 'Add Watermark', desc: 'Overlay customized text watermarks onto all pages.', uploadHeadline: 'Upload a PDF to watermark', uploadSubline: 'or drag and drop it here', accepts: '.pdf', multiple: false },
  crop: { title: 'Crop PDF', desc: 'Visual margin boundaries clipper.', uploadHeadline: 'Upload a PDF to crop margins', uploadSubline: 'or drag and drop it here', accepts: '.pdf', multiple: false },
  'edit-pdf': { title: 'Edit PDF', desc: 'Draw annotations or type custom text overlays onto pages.', uploadHeadline: 'Upload a PDF to edit text on', uploadSubline: 'or drag and drop it here', accepts: '.pdf', multiple: false },
  'pdf-forms': { title: 'PDF Forms', desc: 'Fill out interactive form fields in documents.', uploadHeadline: 'Upload a PDF form to fill', uploadSubline: 'or drag and drop it here', accepts: '.pdf', multiple: false },
  protect: { title: 'Protect PDF', desc: 'Lock and encrypt a PDF with a password.', uploadHeadline: 'Upload a PDF to encrypt', uploadSubline: 'or drag and drop it here', accepts: '.pdf', multiple: false },
  unlock: { title: 'Unlock PDF', desc: 'Unlock password constraints from encrypted PDFs.', uploadHeadline: 'Upload an encrypted PDF to unlock', uploadSubline: 'or drag and drop it here', accepts: '.pdf', multiple: false },
  sign: { title: 'Sign PDF', desc: 'Visually stamp custom signature drawings onto pages.', uploadHeadline: 'Upload a PDF to sign', uploadSubline: 'or drag and drop it here', accepts: '.pdf', multiple: false },
  redact: { title: 'Redact PDF', desc: 'Visually black out sensitive section coordinates on pages.', uploadHeadline: 'Upload a PDF to redact sections', uploadSubline: 'or drag and drop it here', accepts: '.pdf', multiple: false },
  compare: { title: 'Compare PDF', desc: 'Validate metadata and page alignment comparisons between two PDFs.', uploadHeadline: 'Upload two PDF documents to compare', uploadSubline: 'or drag and drop them here', accepts: '.pdf', multiple: true },
  'ai-assistant': { title: 'AI PDF Assistant', desc: 'Chat, translate, summarize, or generate study notes from PDF text.', uploadHeadline: 'Upload a PDF to analyze with AI', uploadSubline: 'or drag and drop it here', accepts: '.pdf', multiple: false },
  'remove-background': { title: 'Background Remover', desc: 'Remove background from images automatically using AI.', uploadHeadline: 'Upload an image to remove background', uploadSubline: 'or drag and drop it here', accepts: 'image/png, image/jpeg, image/jpg', multiple: false },
  'upscale-image': { title: 'Image Upscaler', desc: 'Enhance resolution and quality of images.', uploadHeadline: 'Upload an image to upscale', uploadSubline: 'or drag and drop it here', accepts: 'image/png, image/jpeg, image/jpg', multiple: false }
};

document.addEventListener('DOMContentLoaded', async () => {
  // Retrieve persisted theme and update UI
  const savedTheme = safeStorage.getItem('pixelpdf_theme') || 'light';
  updateThemeUI(savedTheme === 'dark');

  setupEventListeners();
  setupSignaturePad();
  await checkAuthSession();
  setupAuthEventListeners();
  setupBlogEventListeners();

  // Process query parameters for Stripe payment success redirects
  const urlParams = new URLSearchParams(window.location.search);
  const paymentStatus = urlParams.get('payment');
  const sessionId = urlParams.get('session_id');

  if (paymentStatus) {
    if (sessionId) {
      showToast('Verifying payment with Stripe...', 'info');
      try {
        const res = await fetch('/api/stripe/verify-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ sessionId })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          currentUser = data.user;
          updateAuthNav(currentUser);
          if (paymentStatus === 'blog-success') {
            showToast('Payment verified successfully! You can now publish your blog article.', 'success');
            navigateToBlog();
          } else if (paymentStatus === 'success') {
            showToast('Subscription verified successfully! Welcome to Premium.', 'success');
          }
        } else {
          showToast(data.error || 'Payment verification failed. Please contact support.', 'error');
        }
      } catch (err) {
        console.error('Payment verification failed:', err);
        showToast('Error verifying payment with Stripe.', 'error');
      }
    } else {
      if (paymentStatus === 'blog-success') {
        showToast('Payment successful! You can now publish your blog article.', 'success');
        navigateToBlog();
      } else if (paymentStatus === 'success') {
        showToast('Subscription updated successfully! Welcome to Premium.', 'success');
      } else if (paymentStatus === 'cancel') {
        showToast('Payment cancelled.', 'info');
      }
    }
    // Clean up query parameters from the browser address bar
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  }
});

// Setup Mouse movements glow effect
function setupCardMouseEffect() {
  const cards = document.querySelectorAll('.tool-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });
}

function updateThemeUI(isDark) {
  const btn = document.getElementById('btn-toggle-dark');
  if (!btn) return;
  
  if (isDark) {
    document.body.classList.add('dark-theme');
    btn.title = "Toggle Light Mode";
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`;
  } else {
    document.body.classList.remove('dark-theme');
    btn.title = "Toggle Night Mode";
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>`;
  }
}

function setupEventListeners() {
  document.getElementById('logo-link').addEventListener('click', (e) => {
    e.preventDefault();
    navigateToDashboard();
  });
  
  document.getElementById('btn-back-to-dashboard').addEventListener('click', navigateToDashboard);

  // AI Assistant Mode Selection Change Listener
  const aiModeSelect = document.getElementById('ai-assistant-mode-select');
  if (aiModeSelect) {
    aiModeSelect.addEventListener('change', (e) => {
      const mode = e.target.value;
      // Hide all mode-specific panels
      document.querySelectorAll('.ai-mode-panel').forEach(panel => {
        panel.style.display = 'none';
      });
      // Show selected panel
      if (mode === 'summarize') {
        document.getElementById('ai-mode-description-summarize').style.display = 'block';
      } else if (mode === 'notes') {
        document.getElementById('ai-mode-description-notes').style.display = 'block';
      } else if (mode === 'chat') {
        document.getElementById('ai-mode-input-chat').style.display = 'block';
      } else if (mode === 'translate') {
        document.getElementById('ai-mode-input-translate').style.display = 'block';
      }
    });
  }
  
  // Dashboard routing cards
  document.querySelectorAll('.tool-card').forEach(card => {
    card.addEventListener('click', () => {
      navigateToTool(card.dataset.tool);
    });
  });

  // Popular Tools click routing
  document.querySelectorAll('.pop-tool-card').forEach(card => {
    card.addEventListener('click', () => {
      navigateToTool(card.dataset.tool);
    });
  });

  // Hero action buttons (launch feature modal)
  const showHeroFeatureModal = () => {
    const overlay = document.getElementById('hero-feature-overlay');
    if (overlay) overlay.classList.add('active');
  };
  const hideHeroFeatureModal = () => {
    const overlay = document.getElementById('hero-feature-overlay');
    if (overlay) overlay.classList.remove('active');
  };

  const btnHeroUpload = document.getElementById('btn-hero-upload');
  if (btnHeroUpload) {
    btnHeroUpload.addEventListener('click', showHeroFeatureModal);
  }
  const btnCloseHeroFeature = document.getElementById('btn-close-hero-feature');
  if (btnCloseHeroFeature) {
    btnCloseHeroFeature.addEventListener('click', hideHeroFeatureModal);
  }

  document.querySelectorAll('.hero-feature-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedTool = btn.dataset.tool;
      hideHeroFeatureModal();
      navigateToTool(selectedTool);
      setTimeout(() => {
        const fileInput = document.getElementById('file-input-element');
        if (fileInput) fileInput.click();
      }, 50);
    });
  });

  const scrollExplore = (e) => {
    e.preventDefault();
    navigateToDashboard();
    document.querySelector('.all-tools-header').scrollIntoView({ behavior: 'smooth' });
  };
  document.getElementById('btn-hero-explore').addEventListener('click', scrollExplore);
  document.getElementById('btn-popular-view-all').addEventListener('click', scrollExplore);

  // AI assistant CTA
  document.getElementById('btn-try-ai-assistant').addEventListener('click', () => {
    navigateToTool('ai-assistant');
  });

  // Header Nav Menu Links
  document.getElementById('nav-link-all-tools').addEventListener('click', scrollExplore);
  document.getElementById('nav-link-ai-tools').addEventListener('click', (e) => {
    e.preventDefault();
    navigateToDashboard();
    document.querySelector('.ai-assistant-side-card').scrollIntoView({ behavior: 'smooth' });
  });
  document.getElementById('nav-link-pricing').addEventListener('click', (e) => {
    e.preventDefault();
    showAuthModal('upgrade');
  });
  document.getElementById('nav-link-blog').addEventListener('click', (e) => {
    e.preventDefault();
    navigateToBlog();
  });
  
  // Dark/Night Mode Toggle
  document.getElementById('btn-toggle-dark').addEventListener('click', () => {
    const isDarkNow = !document.body.classList.contains('dark-theme');
    updateThemeUI(isDarkNow);
    safeStorage.setItem('pixelpdf_theme', isDarkNow ? 'dark' : 'light');
    showToast(isDarkNow ? 'Night mode enabled!' : 'Light mode enabled!', 'info');
  });
  
  // Upload drops
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input-element');
  
  dropzone.addEventListener('click', () => fileInput.click());
  
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) handleFilesSelected(e.dataTransfer.files);
  });
  
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleFilesSelected(e.target.files);
  });
  
  document.getElementById('btn-clear-workspace').addEventListener('click', clearWorkspace);
  document.getElementById('btn-process-action').addEventListener('click', processFiles);
  
  document.getElementById('btn-select-all-pages').addEventListener('click', () => {
    pagePreviews.forEach((_, idx) => selectedPages.add(idx));
    renderPreviewsGrid();
    updateProcessButtonState();
  });
  
  document.getElementById('btn-deselect-all-pages').addEventListener('click', () => {
    selectedPages.clear();
    renderPreviewsGrid();
    updateProcessButtonState();
  });

  // Reorder buttons & Remove
  document.getElementById('files-list').addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.btn-remove-file');
    const upBtn = e.target.closest('.btn-reorder-up');
    const downBtn = e.target.closest('.btn-reorder-down');
    
    if (removeBtn) {
      const idx = parseInt(removeBtn.dataset.index, 10);
      uploadedFiles.splice(idx, 1);
      renderFilesList();
      updateProcessButtonState();
      if (uploadedFiles.length === 0) hideOperationsArea();
    }
    
    if (upBtn) {
      const idx = parseInt(upBtn.dataset.index, 10);
      if (idx > 0) {
        const temp = uploadedFiles[idx];
        uploadedFiles[idx] = uploadedFiles[idx - 1];
        uploadedFiles[idx - 1] = temp;
        renderFilesList();
      }
    }
    
    if (downBtn) {
      const idx = parseInt(downBtn.dataset.index, 10);
      if (idx < uploadedFiles.length - 1) {
        const temp = uploadedFiles[idx];
        uploadedFiles[idx] = uploadedFiles[idx + 1];
        uploadedFiles[idx + 1] = temp;
        renderFilesList();
      }
    }
  });

  // Web camera snap trigger
  document.getElementById('btn-webcam-snap').addEventListener('click', captureWebcamSnapshot);
  document.getElementById('btn-webcam-toggle').addEventListener('click', stopWebcamStream);

  // Watermark parameters slide displays
  const wText = document.getElementById('watermark-text');
  const wSize = document.getElementById('watermark-size');
  const wRot = document.getElementById('watermark-rotation');
  const wOpac = document.getElementById('watermark-opacity');

  wSize.addEventListener('input', (e) => document.getElementById('watermark-size-val').textContent = e.target.value);
  wRot.addEventListener('input', (e) => document.getElementById('watermark-rotation-val').textContent = e.target.value);
  wOpac.addEventListener('input', (e) => document.getElementById('watermark-opacity-val').textContent = e.target.value);

  // HTML conversion controls toggle
  const htmlInputType = document.getElementById('html-input-type');
  htmlInputType.addEventListener('change', (e) => {
    if (e.target.value === 'url') {
      document.getElementById('html-code-group').style.display = 'none';
      document.getElementById('html-url-group').style.display = 'flex';
    } else {
      document.getElementById('html-code-group').style.display = 'flex';
      document.getElementById('html-url-group').style.display = 'none';
    }
    updateProcessButtonState();
  });

  document.getElementById('html-textarea').addEventListener('input', updateProcessButtonState);
  document.getElementById('html-url-input').addEventListener('input', updateProcessButtonState);
  document.getElementById('pdf-password-input').addEventListener('input', updateProcessButtonState);
  document.getElementById('pdf-unlock-password').addEventListener('input', updateProcessButtonState);
  
  document.getElementById('btn-copy-ai-result').addEventListener('click', () => {
    const text = document.getElementById('ai-results-content').textContent;
    if (text) {
      navigator.clipboard.writeText(text);
      showToast('AI content copied to clipboard!', 'success');
    }
  });

  // Category tabs filtering
  document.querySelectorAll('.category-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.dataset.category;
      filterCategoryColumns(cat);
    });
  });

  setupCardMouseEffect();
}

// Draw Pen Setup
function setupSignaturePad() {
  const canvas = document.getElementById('signature-pad');
  sigCtx = canvas.getContext('2d');
  sigCtx.strokeStyle = '#000000';
  sigCtx.lineWidth = 3;
  sigCtx.lineCap = 'round';
  
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseleave', stopDrawing);
  
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    isDrawing = true;
    sigCtx.beginPath();
    sigCtx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
  });
  
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    sigCtx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    sigCtx.stroke();
  });
  
  canvas.addEventListener('touchend', stopDrawing);
  
  document.getElementById('btn-clear-sigpad').addEventListener('click', () => {
    sigCtx.clearRect(0, 0, canvas.width, canvas.height);
    signatureDataUrl = null;
    signaturePlacement = null;
    updateProcessButtonState();
  });
}

function startDrawing(e) {
  isDrawing = true;
  sigCtx.beginPath();
  const rect = e.target.getBoundingClientRect();
  sigCtx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

function draw(e) {
  if (!isDrawing) return;
  const rect = e.target.getBoundingClientRect();
  sigCtx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
  sigCtx.stroke();
}

function stopDrawing() {
  if (!isDrawing) return;
  isDrawing = false;
  signatureDataUrl = document.getElementById('signature-pad').toDataURL('image/png');
  updateProcessButtonState();
}

// Navigation Tool Change Router
function navigateToTool(tool) {
  currentTool = tool;
  const meta = TOOL_META[tool];
  if (!meta) return;
  
  clearWorkspace();
  
  document.getElementById('current-tool-title').textContent = meta.title;
  document.getElementById('current-tool-desc').textContent = meta.desc;
  
  const dropzone = document.getElementById('dropzone');
  
  if (meta.noUpload) {
    dropzone.style.display = 'none';
    showOperationsArea();
  } else {
    dropzone.style.display = 'flex';
    document.getElementById('upload-headline').textContent = meta.uploadHeadline;
    document.getElementById('upload-subline').textContent = meta.uploadSubline;
  }
  
  const fileInput = document.getElementById('file-input-element');
  fileInput.accept = meta.accepts;
  if (meta.multiple) {
    fileInput.setAttribute('multiple', '');
  } else {
    fileInput.removeAttribute('multiple');
  }
  
  document.getElementById('dashboard-page').style.display = 'none';
  document.getElementById('blog-page').style.display = 'none';
  document.getElementById('workspace-page').style.display = 'block';
  document.getElementById('btn-back-to-dashboard').style.display = 'flex';
  
  toggleSettingsPanels(tool);
  
  // Custom camera initialization
  if (tool === 'scan-to-pdf') {
    startWebcamStream();
  }
}

function navigateToDashboard() {
  currentTool = null;
  stopWebcamStream();
  clearWorkspace();
  document.getElementById('workspace-page').style.display = 'none';
  document.getElementById('blog-page').style.display = 'none';
  document.getElementById('btn-back-to-dashboard').style.display = 'none';
  document.getElementById('dashboard-page').style.display = 'block';

  // Reset category tabs to "All Tools"
  document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
  const allTab = document.querySelector('.category-tab[data-category="all"]');
  if (allTab) allTab.classList.add('active');
  filterCategoryColumns('all');
}

function filterCategoryColumns(category) {
  const columns = document.querySelectorAll('.category-column');
  columns.forEach(col => {
    if (category === 'all') {
      col.style.display = 'flex';
    } else if (category === 'organize') {
      col.style.display = col.classList.contains('category-organize') ? 'flex' : 'none';
    } else if (category === 'optimize') {
      col.style.display = col.classList.contains('category-optimize') ? 'flex' : 'none';
    } else if (category === 'convert') {
      col.style.display = (col.classList.contains('category-to-pdf') || col.classList.contains('category-from-pdf')) ? 'flex' : 'none';
    } else if (category === 'edit') {
      col.style.display = (col.classList.contains('category-edit') || col.classList.contains('category-image-tools')) ? 'flex' : 'none';
    } else if (category === 'security') {
      col.style.display = col.classList.contains('category-security') ? 'flex' : 'none';
    }
  });
}

function toggleSettingsPanels(tool) {
  // Hide all config boxes
  const sections = [
    'settings-split', 'settings-protect', 'settings-img-to-pdf', 'settings-rotate', 
    'settings-html', 'settings-compress', 'settings-unlock', 'settings-watermark', 
    'settings-page-numbers', 'settings-sign', 'settings-redact', 'settings-crop', 
    'settings-ai-assistant', 'settings-remove-background', 
    'settings-upscale-image', 'settings-edit-pdf', 'settings-generic'
  ];
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  
  if (TOOL_META[tool] && TOOL_META[tool].noUpload) {
    document.getElementById('settings-generic').style.display = 'none';
  } else {
    document.getElementById('settings-generic').style.display = 'block';
  }
  
  if (tool === 'split' || tool === 'extract-pages') {
    document.getElementById('settings-split').style.display = 'block';
  } else if (tool === 'protect') {
    document.getElementById('settings-protect').style.display = 'block';
  } else if (tool === 'img-to-pdf' || tool === 'scan-to-pdf') {
    document.getElementById('settings-img-to-pdf').style.display = 'block';
  } else if (tool === 'rotate') {
    document.getElementById('settings-rotate').style.display = 'block';
  } else if (tool === 'html-to-pdf') {
    document.getElementById('settings-html').style.display = 'block';
  } else if (tool === 'compress') {
    document.getElementById('settings-compress').style.display = 'block';
  } else if (tool === 'unlock') {
    document.getElementById('settings-unlock').style.display = 'block';
  } else if (tool === 'watermark') {
    document.getElementById('settings-watermark').style.display = 'block';
  } else if (tool === 'page-numbers') {
    document.getElementById('settings-page-numbers').style.display = 'block';
  } else if (tool === 'sign') {
    document.getElementById('settings-sign').style.display = 'block';
  } else if (tool === 'redact') {
    document.getElementById('settings-redact').style.display = 'block';
  } else if (tool === 'crop') {
    document.getElementById('settings-crop').style.display = 'block';
  } else if (tool === 'ai-assistant') {
    document.getElementById('settings-ai-assistant').style.display = 'block';
  } else if (tool === 'remove-background') {
    document.getElementById('settings-remove-background').style.display = 'block';
  } else if (tool === 'upscale-image') {
    document.getElementById('settings-upscale-image').style.display = 'block';
  } else if (tool === 'edit-pdf') {
    document.getElementById('settings-edit-pdf').style.display = 'block';
  }
}

// Access Web camera
async function startWebcamStream() {
  const container = document.getElementById('webcam-workspace');
  container.style.display = 'flex';
  document.getElementById('files-list').style.display = 'none';
  
  try {
    webcamStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    const video = document.getElementById('webcam-video');
    video.srcObject = webcamStream;
  } catch (err) {
    showToast('Failed to access your webcam/camera. Check browser permissions.', 'error');
    navigateToDashboard();
  }
}

function stopWebcamStream() {
  if (webcamStream) {
    webcamStream.getTracks().forEach(track => track.stop());
    webcamStream = null;
  }
  document.getElementById('webcam-workspace').style.display = 'none';
}

function captureWebcamSnapshot() {
  const video = document.getElementById('webcam-video');
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  const ctx = canvas.getContext('2d');
  // mirror context representation
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  canvas.toBlob(blob => {
    const file = new File([blob], `scan-${Date.now()}.png`, { type: 'image/png' });
    uploadedFiles.push(file);
    
    // Alert the user and update lists
    showToast('Snapshot captured!', 'success');
    document.getElementById('files-list').style.display = 'grid';
    renderFilesList();
    updateProcessButtonState();
  }, 'image/png');
}

// Manage uploads selected
async function handleFilesSelected(fileList) {
  const meta = TOOL_META[currentTool];
  if (!meta) return;
  
  const files = Array.from(fileList);
  
  // File filters
  const filtered = files.filter(file => {
    if (meta.accepts.includes('.pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      showToast(`Skipped "${file.name}" - Not a PDF`, 'error');
      return false;
    }
    if (currentTool === 'img-to-pdf' && !file.type.startsWith('image/')) {
      showToast(`Skipped "${file.name}" - Not an image`, 'error');
      return false;
    }
    return true;
  });
  
  if (filtered.length === 0) return;
  
  // Size validation check
  const totalSize = filtered.reduce((sum, f) => sum + f.size, 0);
  const maxFreeSize = 10 * 1024 * 1024; // 10MB limit
  const cumulativeSize = getCumulativeUploadSize();

  if (!token || !currentUser || !currentUser.is_premium) {
    if (totalSize > maxFreeSize) {
      showToast('File size exceeds the 10MB limit. Please upgrade to Premium.', 'error');
      showAuthModal('upgrade');
      return;
    }
    if (totalSize + cumulativeSize > maxFreeSize) {
      showToast('Cumulative session upload size exceeds the 10MB limit. Please upgrade to Premium.', 'error');
      showAuthModal('upgrade');
      return;
    }
  }
  
  if (meta.multiple) {
    uploadedFiles = [...uploadedFiles, ...filtered];
  } else {
    uploadedFiles = [filtered[0]];
  }
  
  showOperationsArea();
  renderFilesList();
  
  // Interactive preview render modes (split, remove, organize, sign, redact, edit, crop)
  const previewModes = ['split', 'extract-pages', 'remove-pages', 'organize-pdf', 'sign', 'redact', 'edit-pdf', 'crop', 'pdf-forms'];
  
  if (previewModes.includes(currentTool) && uploadedFiles.length > 0) {
    document.getElementById('previews-container').style.display = 'block';
    document.getElementById('files-list').style.display = 'none';
    await loadPagePreviews(uploadedFiles[0]);
  } else if (currentTool === 'compare' && uploadedFiles.length >= 2) {
    // Run side by side comparisons
    document.getElementById('files-list').style.display = 'none';
    document.getElementById('compare-workspace').style.display = 'grid';
    await runPDFComparison();
  } else {
    document.getElementById('previews-container').style.display = 'none';
    document.getElementById('compare-workspace').style.display = 'none';
    document.getElementById('files-list').style.display = 'grid';
  }
  
  updateProcessButtonState();
}

async function loadPagePreviews(file) {
  const overlay = document.getElementById('loading-overlay');
  const loadingTitle = document.getElementById('loading-title');
  const loadingMessage = document.getElementById('loading-message');
  
  loadingTitle.textContent = 'Generating Page Previews...';
  loadingMessage.textContent = 'Generating preview thumbnails...';
  overlay.classList.add('active');
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const previews = await generatePagePreviews(arrayBuffer, (current, total) => {
      loadingMessage.textContent = `Rendering page preview ${current} of ${total}...`;
    });
    
    pagePreviews = previews;
    selectedPages.clear();
    pageRotations = {};
    redactionBoxes = [];
    signaturePlacement = null;
    
    // Auto select pages by default
    if (currentTool === 'split' || currentTool === 'extract-pages') {
      previews.forEach((_, idx) => selectedPages.add(idx));
    }
    
    renderPreviewsGrid();
  } catch (error) {
    console.error(error);
    showToast('Failed to read PDF preview. Check if file is encrypted.', 'error');
    clearWorkspace();
  } finally {
    overlay.classList.remove('active');
  }
}

// Visual Preview Grid
function renderPreviewsGrid() {
  const gridElement = document.getElementById('previews-grid-element');
  gridElement.innerHTML = '';
  
  if (pagePreviews.length === 0) return;
  
  pagePreviews.forEach((preview, index) => {
    const card = document.createElement('div');
    card.className = `preview-card ${selectedPages.has(index) ? 'selected' : ''}`;
    card.dataset.index = index;
    
    const rotationAngle = pageRotations[index] || 0;
    
    card.innerHTML = `
      ${currentTool === 'split' || currentTool === 'extract-pages' || currentTool === 'remove-pages' ? `
        <div class="preview-checkbox-overlay">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
      ` : ''}
      <div class="preview-thumbnail-wrapper">
        <img src="${preview.dataUrl}" style="transform: rotate(${rotationAngle}deg); transition: transform 0.2s ease; width: 100%; height: 100%; object-fit: contain;" alt="Page ${preview.pageNum}" />
        
        <!-- Interactive overlays -->
        ${currentTool === 'sign' ? `<div class="signature-drag-wrapper" data-page="${index}"></div>` : ''}
        ${currentTool === 'redact' ? `<div class="redact-marker-overlay" data-page="${index}"></div>` : ''}
        ${currentTool === 'edit-pdf' ? `<div class="edit-text-drag-wrapper" data-page="${index}"></div>` : ''}
      </div>
      <div class="preview-card-info">
        <span class="preview-page-number">Page ${preview.pageNum}</span>
        ${currentTool === 'rotate' ? `
          <div class="preview-card-actions">
            <button class="btn-icon btn-rotate-page" data-index="${index}" title="Rotate 90°">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.72 2.78L21 8"/><polyline points="21 3 21 8 16 8"/></svg>
            </button>
          </div>
        ` : ''}
      </div>
    `;
    
    // Page reorder drag bindings for Organize PDF
    if (currentTool === 'organize-pdf') {
      card.setAttribute('draggable', 'true');
      setupDragAndDropEvents(card, index);
    }
    
    // Interactive checklist toggle
    if (currentTool === 'split' || currentTool === 'extract-pages' || currentTool === 'remove-pages') {
      card.addEventListener('click', (e) => {
        if (selectedPages.has(index)) {
          selectedPages.delete(index);
          card.classList.remove('selected');
        } else {
          selectedPages.add(index);
          card.classList.add('selected');
        }
        updateProcessButtonState();
      });
    }
    
    gridElement.appendChild(card);
  });
  
  // Wire up signature placing
  if (currentTool === 'sign') {
    wireSignaturePlacementEvents();
  }
  
  // Wire up redaction box placements
  if (currentTool === 'redact') {
    wireRedactionBoxEvents();
  }
  
  // Wire up edit text overlay placement
  if (currentTool === 'edit-pdf') {
    wireEditTextPlacementEvents();
  }
}

// Drag & Drop reordering logic for Organize PDF
function setupDragAndDropEvents(card, index) {
  card.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', index);
  });
  
  card.addEventListener('dragover', (e) => {
    e.preventDefault();
    card.classList.add('drag-over');
  });
  
  card.addEventListener('dragleave', () => {
    card.classList.remove('drag-over');
  });
  
  card.addEventListener('drop', (e) => {
    e.preventDefault();
    card.classList.remove('drag-over');
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    
    if (dragIndex !== index) {
      // Re-order thumbnails
      const temp = pagePreviews[dragIndex];
      pagePreviews.splice(dragIndex, 1);
      pagePreviews.splice(index, 0, temp);
      renderPreviewsGrid();
      updateProcessButtonState();
    }
  });
}

// Drag signature stamps onto PDF previews
function wireSignaturePlacementEvents() {
  const wrappers = document.querySelectorAll('.signature-drag-wrapper');
  wrappers.forEach(wrapper => {
    wrapper.addEventListener('click', (e) => {
      if (!signatureDataUrl) {
        showToast('Please draw your signature in the sidebar canvas first!', 'info');
        return;
      }
      
      // Clear existing stamps
      document.querySelectorAll('.signature-stamp-element').forEach(el => el.remove());
      
      const pageIndex = parseInt(wrapper.dataset.page, 10);
      const rect = wrapper.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const stamp = document.createElement('div');
      stamp.className = 'signature-stamp-element';
      stamp.style.left = `${x - 40}px`;
      stamp.style.top = `${y - 20}px`;
      stamp.innerHTML = `<span>Signature</span>`;
      wrapper.appendChild(stamp);
      
      // Record position scaled to standard points (595.28 x 841.89 points)
      // Height coordinates are bottom-up in pdf-lib!
      const wrapperWidth = rect.width;
      const wrapperHeight = rect.height;
      const pdfWidth = 595.28;
      const pdfHeight = 841.89;
      
      const stampX = ((x - 40) / wrapperWidth) * pdfWidth;
      // Invert Y coordinate since PDF coordinate space is bottom-left origin
      const stampY = ((wrapperHeight - (y + 20)) / wrapperHeight) * pdfHeight;
      
      signaturePlacement = {
        page: pageIndex,
        x: stampX,
        y: stampY,
        w: (80 / wrapperWidth) * pdfWidth,
        h: (40 / wrapperHeight) * pdfHeight
      };
      
      updateProcessButtonState();
    });
  });
}

// Drag blackout masks for Redactions
function wireRedactionBoxEvents() {
  const overlays = document.querySelectorAll('.redact-marker-overlay');
  overlays.forEach(overlay => {
    let startX = 0, startY = 0;
    let redactBox = null;
    const pageIndex = parseInt(overlay.dataset.page, 10);
    
    overlay.addEventListener('mousedown', (e) => {
      const rect = overlay.getBoundingClientRect();
      startX = e.clientX - rect.left;
      startY = e.clientY - rect.top;
      
      redactBox = document.createElement('div');
      redactBox.className = 'redact-box-element';
      redactBox.style.left = `${startX}px`;
      redactBox.style.top = `${startY}px`;
      overlay.appendChild(redactBox);
    });
    
    overlay.addEventListener('mousemove', (e) => {
      if (!redactBox) return;
      const rect = overlay.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      
      const w = Math.abs(currentX - startX);
      const h = Math.abs(currentY - startY);
      
      redactBox.style.width = `${w}px`;
      redactBox.style.height = `${h}px`;
      redactBox.style.left = `${Math.min(currentX, startX)}px`;
      redactBox.style.top = `${Math.min(currentY, startY)}px`;
    });
    
    overlay.addEventListener('mouseup', (e) => {
      if (!redactBox) return;
      
      const rect = overlay.getBoundingClientRect();
      const finalX = e.clientX - rect.left;
      const finalY = e.clientY - rect.top;
      
      const w = Math.abs(finalX - startX);
      const h = Math.abs(finalY - startY);
      
      const leftX = Math.min(finalX, startX);
      const topY = Math.min(finalY, startY);
      
      if (w > 5 && h > 5) {
        // Record boundaries in PDF points
        const pdfWidth = 595.28;
        const pdfHeight = 841.89;
        
        const ptX = (leftX / rect.width) * pdfWidth;
        const ptY = ((rect.height - (topY + h)) / rect.height) * pdfHeight;
        
        redactionBoxes.push({
          page: pageIndex,
          x: ptX,
          y: ptY,
          w: (w / rect.width) * pdfWidth,
          h: (h / rect.height) * pdfHeight
        });
      } else {
        redactBox.remove();
      }
      redactBox = null;
      updateProcessButtonState();
    });
  });
}

function wireEditTextPlacementEvents() {
  const wrappers = document.querySelectorAll('.edit-text-drag-wrapper');
  wrappers.forEach(wrapper => {
    wrapper.addEventListener('click', (e) => {
      const textInput = document.getElementById('edit-text-input');
      const text = textInput ? textInput.value.trim() : '';
      if (!text) {
        showToast('Please type some text in the sidebar first!', 'info');
        return;
      }
      
      const fontSizeSelect = document.getElementById('edit-font-size-select');
      const fontSize = fontSizeSelect ? parseInt(fontSizeSelect.value, 10) : 16;
      
      const pageIndex = parseInt(wrapper.dataset.page, 10);
      const rect = wrapper.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const stamp = document.createElement('div');
      stamp.className = 'text-stamp-element';
      stamp.style.left = `${x}px`;
      stamp.style.top = `${y}px`;
      stamp.style.fontSize = `${fontSize * (rect.height / 841.89)}px`;
      stamp.textContent = text;
      stamp.title = 'Click to remove';
      
      stamp.addEventListener('click', (ev) => {
        ev.stopPropagation();
        stamp.remove();
        editTextBoxes = editTextBoxes.filter(box => box._element !== stamp);
        updateProcessButtonState();
      });
      
      wrapper.appendChild(stamp);
      
      const wrapperWidth = rect.width;
      const wrapperHeight = rect.height;
      const pdfWidth = 595.28;
      const pdfHeight = 841.89;
      
      const ptX = (x / wrapperWidth) * pdfWidth;
      const ptY = ((wrapperHeight - y) / wrapperHeight) * pdfHeight;
      
      editTextBoxes.push({
        page: pageIndex,
        x: ptX,
        y: ptY,
        text: text,
        size: fontSize,
        type: 'text',
        _element: stamp
      });
      
      updateProcessButtonState();
    });
  });
}

// Side by side comparisons
async function runPDFComparison() {
  const overlay = document.getElementById('loading-overlay');
  overlay.classList.add('active');
  
  try {
    const info = await comparePDFs(uploadedFiles[0], uploadedFiles[1]);
    
    document.getElementById('compare-left-title').textContent = info.fileA.name;
    document.getElementById('compare-left-meta').innerHTML = `
      <tr><td>Pages</td><td>${info.fileA.pages}</td></tr>
      <tr><td>File Size</td><td>${info.fileA.size}</td></tr>
      <tr><td>Author</td><td>${info.fileA.author}</td></tr>
      <tr><td>Title</td><td>${info.fileA.title}</td></tr>
    `;
    
    document.getElementById('compare-right-title').textContent = info.fileB.name;
    document.getElementById('compare-right-meta').innerHTML = `
      <tr><td>Pages</td><td>${info.fileB.pages}</td></tr>
      <tr><td>File Size</td><td>${info.fileB.size}</td></tr>
      <tr><td>Author</td><td>${info.fileB.author}</td></tr>
      <tr><td>Title</td><td>${info.fileB.title}</td></tr>
    `;
  } catch (err) {
    showToast('Failed to run PDF comparison details.', 'error');
    clearWorkspace();
  } finally {
    overlay.classList.remove('active');
  }
}

// Draw mock document thumbnails dynamically on canvas
function generateMockDocThumbnail(type) {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 280;
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 200, 280);
  
  // Border
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 196, 276);
  
  // Header Accent Strip
  if (type === 'word') {
    ctx.fillStyle = '#2b579a'; // Word Blue
    ctx.fillRect(10, 10, 180, 30);
  } else if (type === 'excel') {
    ctx.fillStyle = '#107c41'; // Excel Green
    ctx.fillRect(10, 10, 180, 30);
  } else if (type === 'pdf') {
    ctx.fillStyle = '#f40f0f'; // PDF Red
    ctx.fillRect(10, 10, 180, 30);
  } else {
    ctx.fillStyle = '#718096'; // Gray
    ctx.fillRect(10, 10, 180, 30);
  }
  
  // Draw lines representing text
  ctx.fillStyle = '#cbd5e1';
  if (type === 'excel') {
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    for (let y = 60; y < 260; y += 30) {
      ctx.beginPath();
      ctx.moveTo(10, y);
      ctx.lineTo(190, y);
      ctx.stroke();
    }
    for (let x = 10; x < 190; x += 44) {
      ctx.beginPath();
      ctx.moveTo(x, 50);
      ctx.lineTo(x, 260);
      ctx.stroke();
    }
  } else {
    let y = 64;
    const lineCount = 8;
    for (let i = 0; i < lineCount; i++) {
      const w = i === lineCount - 1 ? 100 : 160;
      ctx.fillRect(20, y, w, 12);
      y += 26;
    }
  }
  
  // Draw small icon badge at bottom right
  ctx.font = 'bold 24px sans-serif';
  if (type === 'word') {
    ctx.fillStyle = '#2b579a';
    ctx.fillText('W', 150, 256);
  } else if (type === 'excel') {
    ctx.fillStyle = '#107c41';
    ctx.fillText('X', 150, 256);
  } else if (type === 'pdf') {
    ctx.fillStyle = '#f40f0f';
    ctx.fillText('PDF', 130, 256);
  }
  
  return canvas.toDataURL();
}

// Generate thumbnail URL for any uploaded file type
async function generateFileThumbnail(file) {
  const type = file.type;
  const name = file.name.toLowerCase();
  
  if (type.startsWith('image/')) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }
  
  if (name.endsWith('.pdf')) {
    const dataUrl = await getPDFFirstPageThumbnail(file);
    if (dataUrl) return dataUrl;
    return generateMockDocThumbnail('pdf');
  }
  
  if (name.endsWith('.docx') || name.endsWith('.doc')) {
    return generateMockDocThumbnail('word');
  }
  
  if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) {
    return generateMockDocThumbnail('excel');
  }
  
  return generateMockDocThumbnail('generic');
}

// Display file details list with visual thumbnail pages
function renderFilesList() {
  const listElement = document.getElementById('files-list');
  listElement.innerHTML = '';
  
  if (uploadedFiles.length === 0) return;
  
  uploadedFiles.forEach((file, index) => {
    const card = document.createElement('div');
    card.className = 'file-item-card';
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    
    card.innerHTML = `
      <div class="file-actions">
        <button class="btn-icon btn-icon-danger btn-remove-file" data-index="${index}" title="Remove file">✖</button>
        ${currentTool === 'merge' || currentTool === 'img-to-pdf' || currentTool === 'scan-to-pdf' ? `
          <button class="btn-icon btn-reorder-up" data-index="${index}" ${index === 0 ? 'disabled' : ''} title="Move Left">◀</button>
          <button class="btn-icon btn-reorder-down" data-index="${index}" ${index === uploadedFiles.length - 1 ? 'disabled' : ''} title="Move Right">▶</button>
        ` : ''}
      </div>
      <div class="file-preview-card">
        <img id="file-thumb-${index}" src="" alt="Thumbnail" />
      </div>
      <div class="file-details">
        <div class="file-name" title="${file.name}">${file.name}</div>
        <div class="file-size">${sizeMB} MB</div>
      </div>
    `;
    listElement.appendChild(card);
    
    // Set placeholder thumbnail immediately
    const thumbImg = document.getElementById(`file-thumb-${index}`);
    const name = file.name.toLowerCase();
    let mockType = 'generic';
    if (name.endsWith('.pdf')) mockType = 'pdf';
    else if (name.endsWith('.docx') || name.endsWith('.doc')) mockType = 'word';
    else if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) mockType = 'excel';
    
    if (thumbImg) {
      thumbImg.src = generateMockDocThumbnail(mockType);
    }
    
    // Generate real thumbnail asynchronously
    generateFileThumbnail(file).then(dataUrl => {
      const img = document.getElementById(`file-thumb-${index}`);
      if (img && dataUrl) {
        img.src = dataUrl;
      }
    });
  });
}

function showOperationsArea() {
  const dropzone = document.getElementById('dropzone');
  if (dropzone) dropzone.style.padding = '1.5rem 1rem';
  document.getElementById('operations-area').style.display = 'grid';
}

function hideOperationsArea() {
  const dropzone = document.getElementById('dropzone');
  if (dropzone) dropzone.style.padding = '3.5rem 2rem';
  document.getElementById('operations-area').style.display = 'none';
  document.getElementById('previews-container').style.display = 'none';
  document.getElementById('compare-workspace').style.display = 'none';
}

function clearWorkspace() {
  uploadedFiles = [];
  pagePreviews = [];
  pageRotations = {};
  selectedPages.clear();
  signaturePlacement = null;
  redactionBoxes = [];
  editTextBoxes = [];
  
  const fileInput = document.getElementById('file-input-element');
  if (fileInput) fileInput.value = '';
  
  const htmlInput = document.getElementById('html-textarea');
  if (htmlInput) htmlInput.value = '';
  
  const htmlUrl = document.getElementById('html-url-input');
  if (htmlUrl) htmlUrl.value = '';
  
  const pwUnlock = document.getElementById('pdf-unlock-password');
  if (pwUnlock) pwUnlock.value = '';
  
  const pwInput = document.getElementById('pdf-password-input');
  if (pwInput) pwInput.value = '';
  
  const canvas = document.getElementById('signature-pad');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  signatureDataUrl = null;

  const aiResults = document.getElementById('ai-results-panel');
  if (aiResults) {
    aiResults.style.display = 'none';
    document.getElementById('ai-results-content').textContent = '';
  }
  
  hideOperationsArea();
  updateProcessButtonState();
}

function updateProcessButtonState() {
  const btn = document.getElementById('btn-process-action');
  
  if (currentTool === 'html-to-pdf') {
    const mode = document.getElementById('html-input-type').value;
    if (mode === 'code') {
      btn.disabled = !document.getElementById('html-textarea').value.trim();
    } else {
      btn.disabled = !document.getElementById('html-url-input').value.trim();
    }
    return;
  }
  
  if (uploadedFiles.length === 0) {
    btn.disabled = true;
    return;
  }
  
  if (currentTool === 'merge') {
    btn.disabled = uploadedFiles.length < 2;
  } else if (currentTool === 'split' || currentTool === 'extract-pages') {
    const isAllSplit = document.querySelector('input[name="split-mode"]:checked').value === 'all-split';
    btn.disabled = !isAllSplit && selectedPages.size === 0;
  } else if (currentTool === 'remove-pages') {
    btn.disabled = selectedPages.size === 0 || selectedPages.size === pagePreviews.length;
  } else if (currentTool === 'protect') {
    btn.disabled = !document.getElementById('pdf-password-input').value;
  } else if (currentTool === 'unlock') {
    btn.disabled = !document.getElementById('pdf-unlock-password').value;
  } else if (currentTool === 'sign') {
    btn.disabled = !signatureDataUrl || !signaturePlacement;
  } else if (currentTool === 'redact') {
    btn.disabled = redactionBoxes.length === 0;
  } else if (currentTool === 'edit-pdf') {
    btn.disabled = editTextBoxes.length === 0;
  } else if (currentTool === 'compare') {
    btn.disabled = uploadedFiles.length < 2;
  } else {
    btn.disabled = false;
  }
}

// API Operation Trigger Router
async function processFiles() {
  if (uploadedFiles.length === 0 && currentTool !== 'html-to-pdf') return;
  
  const overlay = document.getElementById('loading-overlay');
  const loadingTitle = document.getElementById('loading-title');
  const loadingMessage = document.getElementById('loading-message');
  
  loadingTitle.textContent = 'Processing Operation...';
  loadingMessage.textContent = 'Sending files to server-side engine...';
  overlay.classList.add('active');
  
  try {
    let outputBytes = null;
    let filename = `pixelpdf-${currentTool}.pdf`;
    let mimeType = 'application/pdf';
    
    switch (currentTool) {
      case 'merge':
        outputBytes = await mergePDFs(uploadedFiles);
        break;
        
      case 'split':
      case 'extract-pages':
        const splitMode = document.querySelector('input[name="split-mode"]:checked').value;
        if (splitMode === 'all-split') {
          const pages = await splitPDFIntoIndividual(uploadedFiles[0]);
          loadingTitle.textContent = 'Downloading Pages...';
          for (const page of pages) {
            loadingMessage.textContent = `Downloading page ${page.pageNum} of ${pages.length}...`;
            triggerFileDownload(page.bytes, `page-${page.pageNum}.pdf`, 'application/pdf');
            await new Promise(r => setTimeout(r, 200));
          }
          addCumulativeUploadSize(uploadedFiles[0].size);
          showToast(`Split ${pages.length} pages successfully!`, 'success');
          overlay.classList.remove('active');
          return;
        } else {
          const selected = Array.from(selectedPages).sort((a, b) => a - b);
          outputBytes = await splitPDF(uploadedFiles[0], selected);
          filename = 'extracted-pages.pdf';
        }
        break;
        
      case 'remove-pages':
        const toRemove = Array.from(selectedPages).sort((a, b) => a - b);
        outputBytes = await removePages(uploadedFiles[0], toRemove);
        break;
        
      case 'organize-pdf':
        const order = pagePreviews.map((p, idx) => parseInt(p.pageNum, 10) - 1);
        outputBytes = await organizePDF(uploadedFiles[0], order);
        break;
        
      case 'compress':
        const level = document.querySelector('input[name="compress-level"]:checked').value;
        outputBytes = await compressPDF(uploadedFiles[0], level);
        break;
        
      case 'repair':
        outputBytes = await repairPDF(uploadedFiles[0]);
        break;
        
      case 'ocr':
        outputBytes = await ocrPDF(uploadedFiles[0]);
        break;
        
      case 'img-to-pdf':
      case 'scan-to-pdf':
        const imgSize = document.getElementById('page-size-select').value;
        const imgOrient = document.getElementById('page-orientation-select').value;
        outputBytes = await imagesToPDF(uploadedFiles, imgSize, imgOrient);
        break;
        
      case 'word-to-pdf':
      case 'ppt-to-pdf':
      case 'excel-to-pdf':
        outputBytes = await officeToPDF(uploadedFiles[0]);
        break;
        
      case 'html-to-pdf':
        const htmlMode = document.getElementById('html-input-type').value;
        const payload = htmlMode === 'code' 
          ? { mode: 'code', html: document.getElementById('html-textarea').value }
          : { mode: 'url', url: document.getElementById('html-url-input').value };
        outputBytes = await htmlToPDF(payload);
        break;
        
      case 'pdf-to-img':
        loadingTitle.textContent = 'Rendering PNGs...';
        const images = await pdfToImages(uploadedFiles[0], (c, t) => {
          loadingMessage.textContent = `Converting page ${c} of ${t} to PNG...`;
        });
        loadingTitle.textContent = 'Downloading...';
        for (const img of images) {
          const blob = await fetch(img.dataUrl).then(r => r.blob());
          triggerBlobDownload(blob, `extracted-page-${img.pageNum}.png`);
          await new Promise(r => setTimeout(r, 200));
        }
        addCumulativeUploadSize(uploadedFiles[0].size);
        showToast('All pages extracted successfully!', 'success');
        overlay.classList.remove('active');
        return;
        
      case 'pdf-to-word':
      case 'pdf-to-ppt':
      case 'pdf-to-excel':
        const formatMap = { 'pdf-to-word': 'docx', 'pdf-to-excel': 'xlsx', 'pdf-to-ppt': 'pptx' };
        const blobFormat = formatMap[currentTool];
        const officeBlob = await pdfToOffice(uploadedFiles[0], blobFormat);
        triggerBlobDownload(officeBlob, `extracted-data.${blobFormat}`);
        addCumulativeUploadSize(uploadedFiles[0].size);
        showToast('Extracted document download started!', 'success');
        overlay.classList.remove('active');
        return;
        
      case 'rotate':
        outputBytes = await rotatePDF(uploadedFiles[0], pageRotations);
        break;
        
      case 'page-numbers':
        const numPos = document.getElementById('pagenum-position').value;
        const numFmt = document.getElementById('pagenum-format').value;
        outputBytes = await addPageNumbers(uploadedFiles[0], numPos, numFmt);
        break;
        
      case 'watermark':
        const wmText = document.getElementById('watermark-text').value;
        const wmSize = document.getElementById('watermark-size').value;
        const wmRot = document.getElementById('watermark-rotation').value;
        const wmOpac = document.getElementById('watermark-opacity').value;
        outputBytes = await addWatermark(uploadedFiles[0], wmText, wmSize, wmRot, wmOpac);
        break;
        
      case 'crop':
        const cropMargins = {
          left: parseFloat(document.getElementById('crop-left').value || '0.5'),
          right: parseFloat(document.getElementById('crop-right').value || '0.5'),
          top: parseFloat(document.getElementById('crop-top').value || '0.5'),
          bottom: parseFloat(document.getElementById('crop-bottom').value || '0.5')
        };
        outputBytes = await cropPDF(uploadedFiles[0], cropMargins);
        break;
        
      case 'pdf-forms':
        outputBytes = await fillPDFForms(uploadedFiles[0]);
        break;
        
      case 'protect':
        const pass = document.getElementById('pdf-password-input').value;
        outputBytes = await protectPDF(uploadedFiles[0], pass);
        break;
        
      case 'unlock':
        const unlockPass = document.getElementById('pdf-unlock-password').value;
        outputBytes = await unlockPDF(uploadedFiles[0], unlockPass);
        break;
        
      case 'sign':
        outputBytes = await signPDF(
          uploadedFiles[0], 
          signatureDataUrl, 
          signaturePlacement.page, 
          signaturePlacement.x, 
          signaturePlacement.y, 
          signaturePlacement.w, 
          signaturePlacement.h
        );
        break;
        
      case 'redact':
        outputBytes = await redactPDF(uploadedFiles[0], redactionBoxes);
        break;

      case 'edit-pdf':
        outputBytes = await editPDF(uploadedFiles[0], editTextBoxes);
        break;

      case 'ai-assistant':
        const aiMode = document.getElementById('ai-assistant-mode-select').value;
        const aiLang = document.getElementById('ai-translate-lang-select').value;
        const aiQuestion = document.getElementById('ai-chat-question-input').value;
        try {
          loadingTitle.textContent = 'Analyzing PDF...';
          loadingMessage.textContent = 'Parsing and executing LLM request...';
          const resData = await aiAssistantPDF(uploadedFiles[0], aiMode, { targetLanguage: aiLang, question: aiQuestion }, token);
          loadingTitle.textContent = 'Analysis Complete';
          loadingMessage.textContent = 'Rendering content...';
          
          const aiResults = document.getElementById('ai-results-panel');
          const aiContent = document.getElementById('ai-results-content');
          const aiTitle = document.getElementById('ai-results-title');
          
          let titleText = 'AI Assistant Output';
          if (aiMode === 'summarize') titleText = 'AI Document Summary';
          else if (aiMode === 'chat') titleText = `AI Chat: "${aiQuestion.substring(0, 30)}${aiQuestion.length > 30 ? '...' : ''}"`;
          else if (aiMode === 'translate') titleText = `AI Document Translation (${aiLang})`;
          else if (aiMode === 'notes') titleText = 'AI Study Notes';

          aiTitle.textContent = titleText;
          aiContent.textContent = resData.result;
          aiResults.style.display = 'block';
          aiResults.scrollIntoView({ behavior: 'smooth' });
          
          addCumulativeUploadSize(uploadedFiles[0].size);
          showToast('AI analysis completed successfully!', 'success');
        } catch (err) {
          showToast(err.message || 'AI Assistant failed', 'error');
        }
        overlay.classList.remove('active');
        return;

      case 'remove-background':
        loadingTitle.textContent = 'Removing Background...';
        outputBytes = await aiRemoveBackground(uploadedFiles[0], token);
        filename = 'bg-removed.png';
        mimeType = 'image/png';
        break;
        
      case 'upscale-image':
        const factor = document.getElementById('upscale-factor-select').value;
        loadingTitle.textContent = 'Upscaling Image...';
        outputBytes = await aiUpscaleImage(uploadedFiles[0], factor, token);
        const originalName = uploadedFiles[0].name;
        const nameParts = originalName.split('.');
        const ext = nameParts.length > 1 ? nameParts.pop() : 'png';
        filename = `${nameParts.join('.')}-upscaled.${ext}`;
        mimeType = uploadedFiles[0].type;
        break;
    }
    
    if (outputBytes) {
      triggerFileDownload(outputBytes, filename, mimeType);
      showToast('Operation completed successfully!', 'success');
      if (uploadedFiles && uploadedFiles.length > 0) {
        const batchSize = uploadedFiles.reduce((sum, f) => sum + f.size, 0);
        addCumulativeUploadSize(batchSize);
      }
    }
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Operation failed. Double check file integrity.', 'error');
  } finally {
    overlay.classList.remove('active');
  }
}

function triggerFileDownload(bytes, filename, mimeType) {
  const blob = new Blob([bytes], { type: mimeType });
  triggerBlobDownload(blob, filename);
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container-element');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconHtml = '';
  if (type === 'success') {
    iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-success)" stroke-width="2.5"><path d="M20 6 9 17 4 12"/></svg>`;
  } else if (type === 'error') {
    iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-danger)" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></svg>`;
  } else {
    iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>`;
  }
  
  toast.innerHTML = `
    ${iconHtml}
    <span>${message}</span>
  `;
  container.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/* ==========================================
   USER AUTHENTICATION SESSION HANDLERS
   ========================================== */

async function checkAuthSession() {
  token = safeStorage.getItem('token');
  if (!token) {
    updateAuthNav(null);
    return;
  }
  
  try {
    const res = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (res.ok) {
      const data = await res.json();
      currentUser = data.user;
      updateAuthNav(currentUser);
    } else {
      safeStorage.removeItem('token');
      token = null;
      currentUser = null;
      updateAuthNav(null);
    }
  } catch (err) {
    console.error('Session check failed', err);
    updateAuthNav(null);
  }
}

function updateAuthNav(user) {
  const authNav = document.getElementById('user-auth-nav');
  if (!authNav) return;
  
  if (user) {
    const badgeClass = user.is_premium ? 'auth-badge-premium' : 'auth-badge-free';
    
    const planNames = {
      free: 'Free',
      starter: 'Starter',
      base: 'Base',
      pro: 'Pro',
      enterprise: 'Enterprise',
      collaborator: 'Collaborator'
    };
    
    const currentPlan = user.subscription_plan || (user.is_premium ? 'starter' : 'free');
    const badgeText = planNames[currentPlan] || 'Premium';
    const badgeStyle = user.is_premium ? '' : 'style="cursor: pointer;" title="Upgrade to Premium"';
    const badgeId = user.is_premium ? '' : 'id="btn-nav-upgrade"';
    
    const showTeamBtn = ['base', 'pro', 'enterprise'].includes(currentPlan);
    const teamBtnHtml = showTeamBtn 
      ? `<button id="btn-nav-team" class="btn-nav-back" style="padding: 0.35rem 0.75rem; font-size: 0.85rem; border-color: var(--accent-primary); color: var(--accent-primary);">Manage Team</button>`
      : '';
    
    authNav.innerHTML = `
      <span style="font-size: 0.95rem; color: var(--text-secondary); max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500;">
        ${user.email}
      </span>
      <span ${badgeId} class="auth-badge ${badgeClass}" ${badgeStyle}>${badgeText}</span>
      ${teamBtnHtml}
      <button id="btn-logout" class="btn-nav-back" style="padding: 0.35rem 0.75rem; font-size: 0.85rem;">Logout</button>
    `;
    
    if (!user.is_premium) {
      const upgradeBtn = document.getElementById('btn-nav-upgrade');
      if (upgradeBtn) {
        upgradeBtn.addEventListener('click', () => {
          showAuthModal('upgrade');
        });
      }
    }
    
    if (showTeamBtn) {
      const teamBtn = document.getElementById('btn-nav-team');
      if (teamBtn) {
        teamBtn.addEventListener('click', () => {
          showTeamModal();
        });
      }
    }
    
    document.getElementById('btn-logout').addEventListener('click', () => {
      safeStorage.removeItem('token');
      token = null;
      currentUser = null;
      updateAuthNav(null);
      showToast('Logged out successfully', 'info');
      if (document.getElementById('blog-page').style.display === 'block') {
        renderBlogComposeSection();
      }
    });
  } else {
    authNav.innerHTML = `
      <button id="btn-show-login" class="btn-nav-back" style="border-radius: 2rem;">Login</button>
      <button id="btn-show-signup" class="btn-nav-back btn-signup-grad" style="border-radius: 2rem;">Sign Up</button>
    `;
    
    document.getElementById('btn-show-login').addEventListener('click', () => showAuthModal('login'));
    document.getElementById('btn-show-signup').addEventListener('click', () => showAuthModal('signup'));
  }
  
  if (document.getElementById('blog-page').style.display === 'block') {
    renderBlogComposeSection();
  }
}

function showAuthModal(type) {
  const overlay = document.getElementById('auth-modal-overlay');
  const login = document.getElementById('login-modal');
  const signup = document.getElementById('signup-modal');
  const upgrade = document.getElementById('upgrade-modal');
  const team = document.getElementById('team-modal');
  
  overlay.classList.add('active');
  login.style.display = 'none';
  signup.style.display = 'none';
  upgrade.style.display = 'none';
  if (team) team.style.display = 'none';
  
  if (type === 'login') {
    login.style.display = 'flex';
  } else if (type === 'signup') {
    signup.style.display = 'flex';
  } else if (type === 'upgrade') {
    upgrade.style.display = 'flex';
    const loggedOutActions = document.getElementById('upgrade-logged-out-actions');
    const cardButtons = document.querySelectorAll('.btn-plan-choose');
    
    if (token) {
      if (loggedOutActions) loggedOutActions.style.display = 'none';
      cardButtons.forEach(btn => {
        const plan = btn.getAttribute('data-plan');
        if (currentUser && currentUser.subscription_plan === plan) {
          btn.textContent = 'Current Plan';
          btn.disabled = true;
          btn.style.opacity = '0.5';
        } else {
          btn.textContent = `Choose ${plan.charAt(0).toUpperCase() + plan.slice(1)}`;
          btn.disabled = false;
          btn.style.opacity = '1';
        }
      });
    } else {
      if (loggedOutActions) loggedOutActions.style.display = 'flex';
      cardButtons.forEach(btn => {
        btn.textContent = 'Sign In to Choose';
        btn.disabled = false;
        btn.style.opacity = '1';
      });
    }
    
    // Set initial active plan based on slider
    updateActivePricingCard();
  }
}

function hideAuthModal() {
  const overlay = document.getElementById('auth-modal-overlay');
  overlay.classList.remove('active');
}

function updateActivePricingCard() {
  const slider = document.getElementById('pricing-seats-slider');
  if (!slider) return;
  const seats = parseInt(slider.value, 10);
  const seatsCount = document.getElementById('pricing-seats-count');
  
  if (seatsCount) {
    if (seats >= 30) {
      seatsCount.textContent = '30+ users (Enterprise)';
    } else {
      seatsCount.textContent = `${seats} user${seats > 1 ? 's' : ''}`;
    }
  }
  
  // Remove active-plan from all cards
  const cards = document.querySelectorAll('.pricing-card');
  cards.forEach(c => c.classList.remove('active-plan'));
  
  let targetPlan = 'starter';
  if (seats === 1) {
    targetPlan = 'starter';
  } else if (seats >= 2 && seats <= 5) {
    targetPlan = 'base';
  } else if (seats >= 6 && seats <= 15) {
    targetPlan = 'pro';
  } else {
    targetPlan = 'enterprise';
  }
  
  const targetCard = document.getElementById(`card-plan-${targetPlan}`);
  if (targetCard) {
    targetCard.classList.add('active-plan');
  }
}

function showTeamModal() {
  const overlay = document.getElementById('auth-modal-overlay');
  const login = document.getElementById('login-modal');
  const signup = document.getElementById('signup-modal');
  const upgrade = document.getElementById('upgrade-modal');
  const team = document.getElementById('team-modal');
  
  overlay.classList.add('active');
  login.style.display = 'none';
  signup.style.display = 'none';
  upgrade.style.display = 'none';
  if (team) team.style.display = 'flex';
  
  fetchTeamMembers();
}

function hideTeamModal() {
  const overlay = document.getElementById('auth-modal-overlay');
  overlay.classList.remove('active');
}

async function fetchTeamMembers() {
  if (!token) return;
  
  try {
    const res = await fetch('/api/collaboration/list', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch team list');
    
    document.getElementById('team-seat-usage').textContent = `${data.seatsUsed} / ${data.maxSeats} used`;
    
    const listContainer = document.getElementById('team-members-list');
    listContainer.innerHTML = '';
    
    if (data.collaborators.length === 0) {
      listContainer.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 1rem 0;">No team members invited yet.</p>`;
      return;
    }
    
    data.collaborators.forEach(c => {
      const row = document.createElement('div');
      row.className = 'team-member-row';
      row.innerHTML = `
        <span class="team-member-email">${c.email}</span>
        <button class="btn-remove-member" data-email="${c.email}">Remove</button>
      `;
      listContainer.appendChild(row);
    });
    
    listContainer.querySelectorAll('.btn-remove-member').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const email = e.currentTarget.getAttribute('data-email');
        if (confirm(`Are you sure you want to remove ${email} from your collaboration team?`)) {
          await removeTeamMember(email);
        }
      });
    });
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function removeTeamMember(email) {
  try {
    const res = await fetch('/api/collaboration/remove', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to remove member');
    
    showToast(data.message || 'Collaborator removed', 'success');
    fetchTeamMembers();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function setupAuthEventListeners() {
  document.getElementById('btn-close-login').addEventListener('click', hideAuthModal);
  document.getElementById('btn-close-signup').addEventListener('click', hideAuthModal);
  document.getElementById('btn-close-upgrade').addEventListener('click', hideAuthModal);
  
  document.getElementById('link-goto-signup').addEventListener('click', (e) => {
    e.preventDefault();
    showAuthModal('signup');
  });
  document.getElementById('link-goto-login').addEventListener('click', (e) => {
    e.preventDefault();
    showAuthModal('login');
  });
  document.getElementById('btn-upgrade-login').addEventListener('click', () => {
    showAuthModal('login');
  });
  document.getElementById('link-upgrade-signup').addEventListener('click', (e) => {
    e.preventDefault();
    showAuthModal('signup');
  });
  
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      
      safeStorage.setItem('token', data.token);
      token = data.token;
      currentUser = data.user;
      updateAuthNav(currentUser);
      hideAuthModal();
      showToast('Logged in successfully', 'success');
      
      document.getElementById('login-email').value = '';
      document.getElementById('login-password').value = '';
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
  
  document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signup failed');
      
      safeStorage.setItem('token', data.token);
      token = data.token;
      currentUser = data.user;
      updateAuthNav(currentUser);
      hideAuthModal();
      showToast('Account created successfully!', 'success');
      
      document.getElementById('signup-email').value = '';
      document.getElementById('signup-password').value = '';
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
  
  // Seats range slider event listener
  const pricingSlider = document.getElementById('pricing-seats-slider');
  if (pricingSlider) {
    pricingSlider.addEventListener('input', updateActivePricingCard);
  }

  // Choose pricing plan button event listeners
  document.querySelectorAll('.btn-plan-choose').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const plan = e.currentTarget.getAttribute('data-plan');
      
      if (!token) {
        showToast('Please login first to upgrade', 'error');
        showAuthModal('login');
        return;
      }
      
      try {
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ plan })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Checkout redirect failed');
        
        showToast('Redirecting to secure Stripe billing portal...', 'info');
        performCheckoutRedirect(data.url);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });

  // Team collaboration modal listeners
  const teamCloseBtn = document.getElementById('btn-close-team');
  if (teamCloseBtn) {
    teamCloseBtn.addEventListener('click', hideTeamModal);
  }

  const teamInviteForm = document.getElementById('team-invite-form');
  if (teamInviteForm) {
    teamInviteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('team-invite-email');
      const email = emailInput.value.trim();
      
      try {
        const res = await fetch('/api/collaboration/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to invite collaborator');
        
        showToast(data.message || 'Collaborator invited successfully!', 'success');
        emailInput.value = '';
        fetchTeamMembers();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
}

/* ==========================================
   BLOG CONTROLLERS & RENDERERS
   ========================================== */

function setupBlogEventListeners() {
  const btnGotoBlog = document.getElementById('btn-goto-blog');
  if (btnGotoBlog) {
    btnGotoBlog.addEventListener('click', navigateToBlog);
  }

  // Close Compose Modal handlers
  const btnCloseCompose = document.getElementById('btn-close-compose');
  if (btnCloseCompose) {
    btnCloseCompose.addEventListener('click', () => {
      const overlay = document.getElementById('blog-compose-overlay');
      if (overlay) overlay.classList.remove('active');
    });
  }
  const btnCancelCompose = document.getElementById('btn-cancel-compose');
  if (btnCancelCompose) {
    btnCancelCompose.addEventListener('click', () => {
      const overlay = document.getElementById('blog-compose-overlay');
      if (overlay) overlay.classList.remove('active');
    });
  }

  // Attach File in Blog compose modal handler
  const blogFileAttach = document.getElementById('blog-file-attach');
  if (blogFileAttach) {
    blogFileAttach.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Check size limit for blog attachments (20MB)
      const maxAttachSize = 20 * 1024 * 1024;
      if (file.size > maxAttachSize) {
        showToast('Attachment exceeds the 20MB limit.', 'error');
        e.target.value = '';
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      try {
        showToast('Uploading attachment...', 'info');
        const res = await fetch('/api/blog/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to upload attachment.');

        showToast('Attachment uploaded successfully!', 'success');

        if (!blogQuill) return;

        const range = blogQuill.getSelection() || { index: blogQuill.getLength() };
        if (file.type.startsWith('image/')) {
          blogQuill.insertEmbed(range.index, 'image', data.url);
        } else {
          // Link to file download
          blogQuill.insertText(range.index, `[Download ${file.name}]`, 'link', data.url);
        }
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        e.target.value = ''; // Reset file input
      }
    });
  }

  // Submit Blog compose modal handler
  const blogComposeForm = document.getElementById('blog-compose-form');
  if (blogComposeForm) {
    blogComposeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!blogQuill) return;

      const titleInput = document.getElementById('blog-title');
      const title = titleInput ? titleInput.value.trim() : '';
      const content = blogQuill.root.innerHTML;

      if (!title || blogQuill.getText().trim().length === 0) {
        showToast('Please enter both title and content for your article.', 'error');
        return;
      }

      try {
        showToast('Publishing article...', 'info');
        const res = await fetch('/api/blog', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ title, content })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to publish article');

        showToast('Article published successfully!', 'success');

        // Clear compose form
        if (titleInput) titleInput.value = '';
        blogQuill.setContents([]);

        // Hide modal
        const overlay = document.getElementById('blog-compose-overlay');
        if (overlay) overlay.classList.remove('active');

        // Update user state and re-render compose sidebar (permission is consumed)
        if (currentUser) {
          currentUser.can_blog = false;
          updateAuthNav(currentUser);
        }
        loadBlogPosts();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
}

function navigateToBlog() {
  currentTool = null;
  stopWebcamStream();
  clearWorkspace();
  
  document.getElementById('workspace-page').style.display = 'none';
  document.getElementById('dashboard-page').style.display = 'none';
  document.getElementById('blog-page').style.display = 'block';
  document.getElementById('btn-back-to-dashboard').style.display = 'flex';
  
  loadBlogPosts();
  renderBlogComposeSection();
}

async function loadBlogPosts() {
  const container = document.getElementById('blog-posts-list');
  if (!container) return;
  
  container.innerHTML = `
    <div class="loading-container" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 0.75rem; padding: 3rem; text-align: center; width: 100%;">
      <div class="spinner" style="margin: 0 auto 1rem auto; width: 2.5rem; height: 2.5rem;"></div>
      <div>Loading articles...</div>
    </div>
  `;
  
  try {
    const res = await fetch('/api/blog');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch blogs');
    
    if (!data.posts || data.posts.length === 0) {
      container.innerHTML = `
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 0.75rem; padding: 3rem; text-align: center; color: var(--text-secondary); width: 100%;">
          <h3>No articles published yet</h3>
          <p style="margin-top: 0.5rem;">Be the first to publish an article on PixelPDF!</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = data.posts.map(post => {
      const dateStr = new Date(post.createdAt).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      const authorName = post.author_name || post.author_email;
      return `
        <article class="blog-post-card">
          <div class="blog-post-header">
            <span class="blog-post-author">By ${escapeHTML(authorName)}</span>
            <span>${dateStr}</span>
          </div>
          <h3 style="margin-top: 0.25rem; margin-bottom: 0.5rem;">${escapeHTML(post.title)}</h3>
          <div class="blog-post-content ql-editor" style="padding: 0; height: auto; overflow-y: visible; background: transparent;">${post.content}</div>
        </article>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `
      <div style="background: var(--bg-card); border: 1px solid var(--accent-danger); border-radius: 0.75rem; padding: 2rem; text-align: center; color: var(--accent-danger); width: 100%;">
        Failed to load blog posts: ${err.message}
      </div>
    `;
  }
}

function renderBlogComposeSection() {
  const container = document.getElementById('blog-compose-container');
  if (!container) return;
  
  if (!token) {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1rem; align-items: center; text-align: center; padding: 1rem 0;">
        <p style="font-size: 0.85rem; color: var(--text-secondary);">Please login or sign up to publish blog articles.</p>
        <button id="btn-blog-login" class="btn-action" style="width: 100%;">Login to Continue</button>
      </div>
    `;
    
    document.getElementById('btn-blog-login').addEventListener('click', () => showAuthModal('login'));
    return;
  }
  
  const displayNamePlaceholder = currentUser?.display_name || currentUser?.email || 'Your Author Name';
  const displayNameValue = currentUser?.display_name || '';

  // Render display name profile box + action buttons
  let actionHtml = '';
  if (currentUser && !currentUser.can_blog) {
    actionHtml = `
      <div style="display: flex; flex-direction: column; gap: 1rem; text-align: center; padding: 0.5rem 0 0 0;">
        <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">
          You need publisher authorization. Click below to pay the $12 fee via Stripe to write an article.
        </p>
        <button id="btn-pay-blog-fee" class="btn-action" style="width: 100%; background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));">
          Pay $12 Publishing Fee
        </button>
      </div>
    `;
  } else {
    actionHtml = `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 100%;">
        <button id="btn-open-compose" class="btn-action" style="width: 100%; background: var(--accent-success); font-weight: 600; padding: 0.75rem 1rem;">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-right: 0.5rem; display: inline-block; vertical-align: middle;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Write New Article
        </button>
      </div>
    `;
  }

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 1.25rem; width: 100%;">
      <div class="blog-author-settings" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 0.75rem; padding: 1rem; width: 100%;">
        <h4 style="margin-bottom: 0.5rem; font-size: 0.9rem;">Author Profile Settings</h4>
        <form id="author-name-form" style="display: flex; flex-direction: column; gap: 0.5rem; width: 100%;">
          <div style="width: 100%;">
            <label class="input-label" style="font-size: 0.8rem; margin-bottom: 0.25rem;">Display Name</label>
            <input type="text" id="blog-author-name" class="text-input" placeholder="${escapeHTML(displayNamePlaceholder)}" value="${escapeHTML(displayNameValue)}" style="height: 36px; font-size: 0.85rem; width: 100%;" />
          </div>
          <button type="submit" class="btn-action" style="height: 36px; font-size: 0.85rem; background: var(--accent-primary); width: 100%;">Update Display Name</button>
        </form>
      </div>
      ${actionHtml}
    </div>
  `;

  // Bind display name form submit
  document.getElementById('author-name-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const displayName = document.getElementById('blog-author-name').value;
    try {
      const res = await fetch('/api/user/display-name', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ displayName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update display name');

      currentUser.display_name = data.displayName;
      showToast('Display name updated successfully!', 'success');
      loadBlogPosts();
      renderBlogComposeSection();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Bind Action Buttons
  if (currentUser && !currentUser.can_blog) {
    document.getElementById('btn-pay-blog-fee').addEventListener('click', async () => {
      try {
        const res = await fetch('/api/stripe/blog-checkout', { method: 'POST' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Stripe redirect failed');
        
        showToast('Redirecting to Stripe payment page...', 'info');
        performCheckoutRedirect(data.url);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  } else {
    document.getElementById('btn-open-compose').addEventListener('click', () => {
      document.getElementById('blog-compose-overlay').classList.add('active');
      
      // Initialize Quill if not already done
      if (!blogQuill) {
        blogQuill = new Quill('#blog-editor-quill', {
          theme: 'snow',
          placeholder: 'Write your masterpiece here...',
          modules: {
            toolbar: [
              [{ 'header': [1, 2, 3, false] }],
              ['bold', 'italic', 'underline', 'strike'],
              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
              ['link', 'blockquote', 'code-block'],
              [{ 'align': [] }],
              ['clean']
            ]
          }
        });
      }
    });
  }
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
