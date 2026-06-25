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

const LOGGED_OUT_DRAWER_HTML = `
  <div class="drawer-menu-links">
    <a href="#" class="drawer-menu-link" id="mob-link-features">
      <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
      <span>Features</span>
    </a>
    <a href="#" class="drawer-menu-link" id="mob-link-about">
      <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
      <span>About us</span>
    </a>
    <hr style="border: none; border-top: 1px solid var(--border-color); margin: 1rem 0;" />
    <a href="#" class="drawer-menu-link" id="mob-link-help">
      <span>Help</span>
      <span class="drawer-arrow">›</span>
    </a>
    <a href="#" class="drawer-menu-link" id="mob-link-language">
      <span>Language</span>
      <span class="drawer-arrow">›</span>
    </a>
  </div>
  <div class="drawer-auth-actions" id="drawer-auth-actions">
    <button class="drawer-btn-login" id="mob-btn-login">Login</button>
    <button class="drawer-btn-signup" id="mob-btn-signup">Sign up</button>
  </div>
`;

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
  await loadFeaturedLandingBlogs();

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

// Global mobile drawer actions
function openToolsDrawer() {
  const toolsDrawer = document.getElementById('mobile-tools-drawer');
  if (toolsDrawer) {
    toolsDrawer.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeToolsDrawer() {
  const toolsDrawer = document.getElementById('mobile-tools-drawer');
  if (toolsDrawer) {
    toolsDrawer.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function openAuthDrawer() {
  const authDrawer = document.getElementById('mobile-auth-drawer');
  if (authDrawer) {
    authDrawer.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeAuthDrawer() {
  const authDrawer = document.getElementById('mobile-auth-drawer');
  if (authDrawer) {
    authDrawer.classList.remove('active');
    document.body.style.overflow = '';
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

  // Header Nav Menu & Mega Menu Hover Logic
  // Header Nav Menu & Mega Menu Hover Logic
  const allToolsBtn = document.getElementById('nav-link-all-tools');
  const aiToolsBtn = document.getElementById('nav-link-ai-tools');
  const megaMenu = document.getElementById('desktop-mega-menu');
  const aiToolsMenu = document.getElementById('desktop-ai-tools-menu');
  let menuTimeout;
  
  const showMenu = (menu) => {
    clearTimeout(menuTimeout);
    if (menu === megaMenu) {
      if (aiToolsMenu) aiToolsMenu.classList.remove('active');
    } else {
      if (megaMenu) megaMenu.classList.remove('active');
    }
    if (menu) menu.classList.add('active');
  };
  
  const hideMenu = (menu) => {
    menuTimeout = setTimeout(() => {
      if (menu) menu.classList.remove('active');
    }, 150);
  };
  
  if (allToolsBtn && megaMenu) {
    allToolsBtn.addEventListener('mouseenter', () => showMenu(megaMenu));
    allToolsBtn.addEventListener('mouseleave', () => hideMenu(megaMenu));
    allToolsBtn.addEventListener('click', scrollExplore);
    megaMenu.addEventListener('mouseenter', () => showMenu(megaMenu));
    megaMenu.addEventListener('mouseleave', () => hideMenu(megaMenu));
  }
  
  if (aiToolsBtn && aiToolsMenu) {
    aiToolsBtn.addEventListener('mouseenter', () => showMenu(aiToolsMenu));
    aiToolsBtn.addEventListener('mouseleave', () => hideMenu(aiToolsMenu));
    aiToolsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      navigateToDashboard();
      document.querySelector('.ai-assistant-side-card').scrollIntoView({ behavior: 'smooth' });
    });
    aiToolsMenu.addEventListener('mouseenter', () => showMenu(aiToolsMenu));
    aiToolsMenu.addEventListener('mouseleave', () => hideMenu(aiToolsMenu));
  }
  
  // Mega menu click routing
  document.querySelectorAll('.mega-menu-item').forEach(item => {
    item.addEventListener('click', () => {
      navigateToTool(item.dataset.tool);
      if (megaMenu) megaMenu.classList.remove('active');
    });
  });

  // AI Tools menu click routing
  if (aiToolsMenu) {
    aiToolsMenu.querySelectorAll('.ai-tool-card-link').forEach(item => {
      item.addEventListener('click', () => {
        navigateToTool(item.dataset.tool);
        aiToolsMenu.classList.remove('active');
      });
    });
  }

  // Mobile tools drawer toggle
  const toolsDrawer = document.getElementById('mobile-tools-drawer');
  const openToolsBtn = document.getElementById('btn-open-tools-drawer');
  const closeToolsBtn = document.getElementById('btn-close-tools-drawer');
  
  if (openToolsBtn) openToolsBtn.addEventListener('click', openToolsDrawer);
  if (closeToolsBtn) closeToolsBtn.addEventListener('click', closeToolsDrawer);
  if (toolsDrawer) {
    toolsDrawer.addEventListener('click', (e) => {
      if (e.target === toolsDrawer) closeToolsDrawer();
    });
  }
  
  // Mobile tools drawer click routing
  document.querySelectorAll('.drawer-tool-item').forEach(item => {
    item.addEventListener('click', () => {
      navigateToTool(item.dataset.tool);
      closeToolsDrawer();
    });
  });

  // Mobile auth drawer toggle
  const authDrawer = document.getElementById('mobile-auth-drawer');
  const openAuthBtn = document.getElementById('btn-open-auth-drawer');
  const closeAuthBtn = document.getElementById('btn-close-auth-drawer');
  
  if (openAuthBtn) openAuthBtn.addEventListener('click', openAuthDrawer);
  if (closeAuthBtn) closeAuthBtn.addEventListener('click', closeAuthDrawer);
  if (authDrawer) {
    authDrawer.addEventListener('click', (e) => {
      if (e.target === authDrawer) closeAuthDrawer();
    });
  }
  
  // Mobile auth drawer links click handling
  const mobLinkFeatures = document.getElementById('mob-link-features');
  if (mobLinkFeatures) {
    mobLinkFeatures.addEventListener('click', (e) => {
      e.preventDefault();
      closeAuthDrawer();
      navigateToDashboard();
      document.querySelector('.premium-stats-grid').scrollIntoView({ behavior: 'smooth' });
    });
  }
  
  const mobLinkAbout = document.getElementById('mob-link-about');
  if (mobLinkAbout) {
    mobLinkAbout.addEventListener('click', (e) => {
      e.preventDefault();
      closeAuthDrawer();
      showToast('PixelPDF - Developed by Advanced Agentic Coding team.', 'info');
    });
  }
  
  const mobLinkHelp = document.getElementById('mob-link-help');
  if (mobLinkHelp) {
    mobLinkHelp.addEventListener('click', (e) => {
      e.preventDefault();
      closeAuthDrawer();
      showToast('Need help? Contact support at support@pixelpdf.com', 'info');
    });
  }
  
  const mobLinkLanguage = document.getElementById('mob-link-language');
  if (mobLinkLanguage) {
    mobLinkLanguage.addEventListener('click', (e) => {
      e.preventDefault();
      closeAuthDrawer();
      showToast('English language selected.', 'info');
    });
  }

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

  // Footer navigation & tool links
  document.querySelectorAll('.footer-tool-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigateToTool(link.dataset.tool);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  const footerLogo = document.getElementById('footer-logo-link');
  if (footerLogo) {
    footerLogo.addEventListener('click', (e) => {
      e.preventDefault();
      navigateToDashboard();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  const footerBlog = document.getElementById('footer-link-blog');
  if (footerBlog) {
    footerBlog.addEventListener('click', (e) => {
      e.preventDefault();
      navigateToBlog();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  const footerPricing = document.getElementById('footer-link-pricing');
  if (footerPricing) {
    footerPricing.addEventListener('click', (e) => {
      e.preventDefault();
      showAuthModal('upgrade');
    });
  }

  const footerSettings = document.getElementById('footer-link-settings');
  if (footerSettings) {
    footerSettings.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentUser) {
        showSettingsModal();
      } else {
        showToast('Please login or sign up first to access account settings.', 'info');
        showAuthModal('login');
      }
    });
  }

  // Role Tabs click switching
  document.querySelectorAll('.role-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.role-tab-content').forEach(c => c.classList.remove('active'));
      
      tab.classList.add('active');
      const target = document.getElementById(`tab-${tab.dataset.tab}`);
      if (target) target.classList.add('active');
    });
  });

  // Pricing landing buttons action triggers
  const btnLandingFree = document.getElementById('btn-landing-free');
  if (btnLandingFree) {
    btnLandingFree.addEventListener('click', (e) => {
      e.preventDefault();
      const allToolsHeader = document.querySelector('.all-tools-header');
      if (allToolsHeader) {
        allToolsHeader.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  const btnLandingPremium = document.getElementById('btn-landing-premium');
  if (btnLandingPremium) {
    btnLandingPremium.addEventListener('click', (e) => {
      e.preventDefault();
      showAuthModal('upgrade');
    });
  }

  const btnLandingTeam = document.getElementById('btn-landing-team');
  if (btnLandingTeam) {
    btnLandingTeam.addEventListener('click', (e) => {
      e.preventDefault();
      showAuthModal('upgrade');
    });
  }

  const btnLandingBlogAll = document.getElementById('btn-landing-blog-all');
  if (btnLandingBlogAll) {
    btnLandingBlogAll.addEventListener('click', (e) => {
      e.preventDefault();
      navigateToBlog();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // FAQ Accordion Triggers
  document.querySelectorAll('.faq-trigger').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const item = trigger.closest('.faq-item');
      const panel = item.querySelector('.faq-panel');
      const isActive = item.classList.contains('active');
      
      // Close all other panels
      document.querySelectorAll('.faq-item').forEach(i => {
        i.classList.remove('active');
        const p = i.querySelector('.faq-panel');
        if (p) p.style.maxHeight = null;
      });
      
      if (!isActive) {
        item.classList.add('active');
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });

  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('newsletter-email');
      const email = emailInput ? emailInput.value.trim() : '';
      if (email) {
        showToast('Thank you for subscribing to our newsletter!', 'success');
        if (emailInput) emailInput.value = '';
      }
    });
  }

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

function getAvatarHtml(picUrl, sizeStr = "100%", paddingPercent = "18%") {
  if (picUrl) {
    return `<img src="${picUrl}" style="width: ${sizeStr}; height: ${sizeStr}; object-fit: cover; border-radius: 50%; display: block;" />`;
  }
  return `
    <svg width="${sizeStr}" height="${sizeStr}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--text-secondary); background: var(--bg-secondary); border-radius: 50%; width: ${sizeStr}; height: ${sizeStr}; padding: ${paddingPercent}; box-sizing: border-box; display: block;">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  `;
}

function initProfileDropdown() {
  const wrapper = document.getElementById('profile-nav-wrapper');
  const trigger = document.getElementById('btn-profile-avatar');
  const dropdown = document.getElementById('profile-dropdown');
  
  if (!wrapper || !trigger || !dropdown) return;
  
  let hoverTimeout;
  
  wrapper.addEventListener('mouseenter', () => {
    clearTimeout(hoverTimeout);
    dropdown.style.display = 'flex';
  });
  
  wrapper.addEventListener('mouseleave', () => {
    hoverTimeout = setTimeout(() => {
      dropdown.style.display = 'none';
    }, 150);
  });
  
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = dropdown.style.display === 'flex';
    dropdown.style.display = isVisible ? 'none' : 'flex';
  });
  
  // Close on click outside
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });
}

function updateAuthNav(user) {
  const authNav = document.getElementById('user-auth-nav');
  const drawerBody = document.getElementById('mobile-auth-drawer-body');
  const openAuthBtn = document.getElementById('btn-open-auth-drawer');
  
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
    
    const userDisplayName = (user.first_name && user.last_name) 
      ? `${user.first_name} ${user.last_name}` 
      : (user.display_name || user.email);

    // Dynamic email truncation for dropdown
    let truncatedEmail = user.email;
    if (truncatedEmail.length > 22) {
      truncatedEmail = truncatedEmail.substring(0, 19) + '...';
    }
    
    // 1. Desktop Profile Menu Rendering
    if (authNav) {
      authNav.innerHTML = `
        <div class="profile-nav-wrapper" id="profile-nav-wrapper">
          <button id="btn-profile-avatar" class="btn-profile-avatar-trigger" title="Account & Settings">
            ${getAvatarHtml(user.profile_pic, "100%", "18%")}
          </button>
          
          <div id="profile-dropdown" class="profile-dropdown" style="display: none;">
            <div class="profile-dropdown-header">
              <div class="profile-dropdown-avatar-wrapper">
                ${getAvatarHtml(user.profile_pic, "100%", "18%")}
              </div>
              <div class="profile-dropdown-info">
                <span class="profile-dropdown-name">${escapeHTML(userDisplayName)}</span>
                <span class="profile-dropdown-email" title="${escapeHTML(user.email)}">${escapeHTML(truncatedEmail)}</span>
                <span class="profile-dropdown-plan-badge ${user.is_premium ? 'premium' : 'free'}">${badgeText}</span>
              </div>
            </div>
            <div class="profile-dropdown-menu">
              <button class="profile-dropdown-item" id="btn-profile-settings">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                <span>Account settings</span>
              </button>
              <button class="profile-dropdown-item" id="btn-profile-team">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <span>Team</span>
              </button>
              <button class="profile-dropdown-item" id="btn-profile-upgrade">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                <span>Upgrade to Premium</span>
              </button>
              <hr class="profile-dropdown-divider" />
              <button class="profile-dropdown-item profile-dropdown-item-logout" id="btn-profile-logout">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      `;
      
      // Wire dropdown toggle
      initProfileDropdown();
    }

    // 2. Mobile Profile Trigger & Drawer Rendering
    if (openAuthBtn) {
      openAuthBtn.innerHTML = getAvatarHtml(user.profile_pic, "30px", "18%");
      openAuthBtn.style.padding = "0.2rem";
      openAuthBtn.title = "Open Account Menu";
    }

    if (drawerBody) {
      drawerBody.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1.5rem; padding: 1.25rem 1rem; height: 100%; justify-content: space-between; box-sizing: border-box;">
          <div style="display: flex; flex-direction: column; gap: 1.25rem;">
            <!-- Profile Header -->
            <div style="display: flex; align-items: center; gap: 1rem; padding-bottom: 1.25rem; border-bottom: 1px solid var(--border-color);">
              <div style="width: 54px; height: 54px; border-radius: 50%; overflow: hidden; border: 1.5px solid var(--border-color); display: flex; align-items: center; justify-content: center; background: var(--bg-secondary); flex-shrink: 0;">
                ${getAvatarHtml(user.profile_pic, "100%", "18%")}
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; text-align: left;">
                <span style="font-weight: 700; font-size: 1.05rem; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(userDisplayName)}</span>
                <span style="font-size: 0.8rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; word-break: break-all;" title="${escapeHTML(user.email)}">${escapeHTML(user.email)}</span>
                <span class="auth-badge ${badgeClass}" style="margin-top: 0.25rem; align-self: flex-start;">Plan: ${badgeText}</span>
              </div>
            </div>
            
            <!-- Menu Options -->
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
              <a href="#" class="drawer-menu-link" id="mob-btn-settings" style="display: flex; align-items: center; gap: 0.75rem; text-decoration: none; padding: 0.75rem 0.5rem; border-radius: 0.375rem; color: var(--text-secondary); transition: background 0.15s ease;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                <span>Account settings</span>
              </a>
              <a href="#" class="drawer-menu-link" id="mob-btn-team" style="display: flex; align-items: center; gap: 0.75rem; text-decoration: none; padding: 0.75rem 0.5rem; border-radius: 0.375rem; color: var(--text-secondary); transition: background 0.15s ease;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <span>Team</span>
              </a>
              <a href="#" class="drawer-menu-link" id="mob-btn-upgrade" style="display: flex; align-items: center; gap: 0.75rem; text-decoration: none; padding: 0.75rem 0.5rem; border-radius: 0.375rem; color: var(--text-secondary); transition: background 0.15s ease;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                <span>Upgrade to Premium</span>
              </a>
            </div>
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 0.5rem; border-top: 1px solid var(--border-color); padding-top: 1rem; width: 100%;">
            <a href="#" class="drawer-menu-link" id="mob-btn-logout" style="display: flex; align-items: center; gap: 0.75rem; text-decoration: none; padding: 0.75rem 0.5rem; border-radius: 0.375rem; color: var(--accent-danger); transition: background 0.15s ease;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              <span>Log out</span>
            </a>
          </div>
        </div>
      `;
    }

    // 3. Action Listeners
    const logoutAction = () => {
      safeStorage.removeItem('token');
      token = null;
      currentUser = null;
      updateAuthNav(null);
      showToast('Logged out successfully', 'info');
      closeAuthDrawer();
      if (document.getElementById('blog-page').style.display === 'block') {
        renderBlogComposeSection();
      }
    };

    const upgradeAction = (e) => {
      if (e) e.preventDefault();
      showAuthModal('upgrade');
      closeAuthDrawer();
    };

    const teamAction = (e) => {
      if (e) e.preventDefault();
      showTeamModal();
      closeAuthDrawer();
    };

    const settingsAction = (e) => {
      if (e) e.preventDefault();
      showSettingsModal();
      closeAuthDrawer();
    };

    // Desktop bindings
    const btnProfileSettings = document.getElementById('btn-profile-settings');
    if (btnProfileSettings) btnProfileSettings.addEventListener('click', settingsAction);
    
    const btnProfileTeam = document.getElementById('btn-profile-team');
    if (btnProfileTeam) btnProfileTeam.addEventListener('click', teamAction);
    
    const btnProfileUpgrade = document.getElementById('btn-profile-upgrade');
    if (btnProfileUpgrade) btnProfileUpgrade.addEventListener('click', upgradeAction);
    
    const btnProfileLogout = document.getElementById('btn-profile-logout');
    if (btnProfileLogout) btnProfileLogout.addEventListener('click', logoutAction);

    // Mobile bindings
    const mobBtnSettings = document.getElementById('mob-btn-settings');
    if (mobBtnSettings) mobBtnSettings.addEventListener('click', settingsAction);

    const mobBtnTeam = document.getElementById('mob-btn-team');
    if (mobBtnTeam) mobBtnTeam.addEventListener('click', teamAction);

    const mobBtnUpgrade = document.getElementById('mob-btn-upgrade');
    if (mobBtnUpgrade) mobBtnUpgrade.addEventListener('click', upgradeAction);

    const mobBtnLogout = document.getElementById('mob-btn-logout');
    if (mobBtnLogout) mobBtnLogout.addEventListener('click', logoutAction);

  } else {
    // Logged-out state
    if (authNav) {
      authNav.innerHTML = `
        <button id="btn-show-login" class="btn-nav-back" style="border-radius: 2rem;">Login</button>
        <button id="btn-show-signup" class="btn-nav-back btn-signup-grad" style="border-radius: 2rem;">Sign Up</button>
      `;
      document.getElementById('btn-show-login').addEventListener('click', () => showAuthModal('login'));
      document.getElementById('btn-show-signup').addEventListener('click', () => showAuthModal('signup'));
    }

    if (openAuthBtn) {
      openAuthBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="5" r="2"/>
          <circle cx="12" cy="5" r="2"/>
          <circle cx="19" cy="5" r="2"/>
          <circle cx="5" cy="12" r="2"/>
          <circle cx="12" cy="12" r="2"/>
          <circle cx="19" cy="12" r="2"/>
          <circle cx="5" cy="19" r="2"/>
          <circle cx="12" cy="19" r="2"/>
          <circle cx="19" cy="19" r="2"/>
        </svg>
      `;
      openAuthBtn.style.padding = "0.5rem";
      openAuthBtn.title = "Open Settings Menu";
    }

    if (drawerBody) {
      drawerBody.innerHTML = LOGGED_OUT_DRAWER_HTML;
      
      // Wire mobile logged out triggers
      const mobBtnLogin = document.getElementById('mob-btn-login');
      if (mobBtnLogin) {
        mobBtnLogin.addEventListener('click', () => {
          showAuthModal('login');
          closeAuthDrawer();
        });
      }
      const mobBtnSignup = document.getElementById('mob-btn-signup');
      if (mobBtnSignup) {
        mobBtnSignup.addEventListener('click', () => {
          showAuthModal('signup');
          closeAuthDrawer();
        });
      }
      
      // Wire original link items
      const mobLinkFeatures = document.getElementById('mob-link-features');
      if (mobLinkFeatures) {
        mobLinkFeatures.addEventListener('click', (e) => {
          e.preventDefault();
          closeAuthDrawer();
          navigateToDashboard();
          const stats = document.querySelector('.premium-stats-grid');
          if (stats) stats.scrollIntoView({ behavior: 'smooth' });
        });
      }
      const mobLinkAbout = document.getElementById('mob-link-about');
      if (mobLinkAbout) {
        mobLinkAbout.addEventListener('click', (e) => {
          e.preventDefault();
          closeAuthDrawer();
          navigateToDashboard();
          const contact = document.querySelector('footer');
          if (contact) contact.scrollIntoView({ behavior: 'smooth' });
        });
      }
    }
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
  const forgot = document.getElementById('forgot-password-modal');
  
  overlay.classList.add('active');
  login.style.display = 'none';
  signup.style.display = 'none';
  upgrade.style.display = 'none';
  if (team) team.style.display = 'none';
  if (forgot) forgot.style.display = 'none';
  const settings = document.getElementById('settings-modal');
  if (settings) settings.style.display = 'none';
  
  if (type === 'login') {
    login.style.display = 'flex';
    renderGoogleButtons();
  } else if (type === 'signup') {
    signup.style.display = 'flex';
    renderGoogleButtons();
  } else if (type === 'forgot') {
    if (forgot) {
      forgot.style.display = 'flex';
      document.getElementById('forgot-password-step1-form').style.display = 'flex';
      document.getElementById('forgot-password-step2-form').style.display = 'none';
      document.getElementById('forgot-email').value = '';
    }
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

function showSettingsModal() {
  const overlay = document.getElementById('auth-modal-overlay');
  const login = document.getElementById('login-modal');
  const signup = document.getElementById('signup-modal');
  const upgrade = document.getElementById('upgrade-modal');
  const team = document.getElementById('team-modal');
  const forgot = document.getElementById('forgot-password-modal');
  const googleSelector = document.getElementById('google-selector-modal');
  const settings = document.getElementById('settings-modal');
  
  overlay.classList.add('active');
  login.style.display = 'none';
  signup.style.display = 'none';
  upgrade.style.display = 'none';
  if (team) team.style.display = 'none';
  if (forgot) forgot.style.display = 'none';
  if (googleSelector) googleSelector.style.display = 'none';
  if (settings) settings.style.display = 'flex';
  
  if (currentUser) {
    document.getElementById('settings-first-name').value = currentUser.first_name || '';
    document.getElementById('settings-last-name').value = currentUser.last_name || '';
    document.getElementById('settings-email').value = currentUser.email || '';
    
    const settingsAvatarWrapper = document.querySelector('.settings-avatar-wrapper');
    if (settingsAvatarWrapper) {
      settingsAvatarWrapper.innerHTML = getAvatarHtml(currentUser.profile_pic, "100%", "18%");
    }
  }
}

function hideSettingsModal() {
  const overlay = document.getElementById('auth-modal-overlay');
  overlay.classList.remove('active');
  const settings = document.getElementById('settings-modal');
  if (settings) settings.style.display = 'none';
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
    
    const inviteForm = document.getElementById('team-invite-form');
    const seatUsage = document.getElementById('team-seat-usage');
    const listContainer = document.getElementById('team-members-list');
    
    // Clear any existing upgrade CTA banner from previous modal opens
    const existingCta = document.getElementById('team-upgrade-cta-container');
    if (existingCta) existingCta.remove();

    if (!data.canCollaborate) {
      if (inviteForm) inviteForm.style.display = 'none';
      if (seatUsage) seatUsage.textContent = '1 / 1 seat (Only you)';
      
      const userEmail = currentUser ? currentUser.email : 'you';
      const userName = currentUser ? ((currentUser.first_name && currentUser.last_name) ? `${currentUser.first_name} ${currentUser.last_name}` : (currentUser.display_name || '')) : '';
      const displayLabel = userName ? `${userName} (${userEmail})` : userEmail;
      
      listContainer.innerHTML = `
        <div class="team-member-row" style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; background: rgba(0,0,0,0.02); border-radius: 0.375rem; width: 100%;">
          <span style="font-size: 0.9rem; font-weight: 500;">${escapeHTML(displayLabel)}</span>
          <span style="font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); background: rgba(0,0,0,0.05); padding: 0.15rem 0.4rem; border-radius: 4px;">Owner</span>
        </div>
      `;
      
      // Inject Upgrade CTA banner
      const ctaContainer = document.createElement('div');
      ctaContainer.id = 'team-upgrade-cta-container';
      ctaContainer.style.cssText = 'background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 0.75rem; padding: 1rem; text-align: center; margin-top: 1.25rem; width: 100%; box-sizing: border-box;';
      ctaContainer.innerHTML = `
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0 0 0.75rem 0;">
          Upgrade to Base plan or higher to add team members and collaborate!
        </p>
        <button id="btn-team-upgrade-cta" class="btn-action" style="width: auto; padding: 0.5rem 1.25rem; font-size: 0.85rem; margin: 0 auto; display: block;">
          Upgrade Now
        </button>
      `;
      listContainer.parentNode.appendChild(ctaContainer);
      
      document.getElementById('btn-team-upgrade-cta').addEventListener('click', () => {
        hideTeamModal();
        showAuthModal('upgrade');
      });
    } else {
      if (inviteForm) inviteForm.style.display = 'flex';
      if (seatUsage) seatUsage.textContent = `${data.seatsUsed} / ${data.maxSeats} used`;
      
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
    }
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
  
  const btnCloseForgot = document.getElementById('btn-close-forgot');
  if (btnCloseForgot) btnCloseForgot.addEventListener('click', hideAuthModal);
  

  
  document.getElementById('link-goto-signup').addEventListener('click', (e) => {
    e.preventDefault();
    showAuthModal('signup');
  });
  document.getElementById('link-goto-login').addEventListener('click', (e) => {
    e.preventDefault();
    showAuthModal('login');
  });
  
  const linkForgot = document.getElementById('link-forgot-password');
  if (linkForgot) {
    linkForgot.addEventListener('click', (e) => {
      e.preventDefault();
      showAuthModal('forgot');
    });
  }
  
  const linkGotoLoginFromForgot = document.getElementById('link-goto-login-from-forgot');
  if (linkGotoLoginFromForgot) {
    linkGotoLoginFromForgot.addEventListener('click', (e) => {
      e.preventDefault();
      showAuthModal('login');
    });
  }
  
  document.getElementById('btn-upgrade-login').addEventListener('click', () => {
    showAuthModal('login');
  });
  document.getElementById('link-upgrade-signup').addEventListener('click', (e) => {
    e.preventDefault();
    showAuthModal('signup');
  });
  
  // Google Sign-In Actions
  let googleClientId = null;

  async function checkGoogleConfig() {
    try {
      const res = await fetch('/api/config/google-client-id');
      const data = await res.json();
      googleClientId = data.clientId;
    } catch (err) {
      console.error('Failed to load Google Sign-In config:', err);
    }
  }

  window.renderGoogleButtons = async function() {
    if (googleClientId === null) {
      await checkGoogleConfig();
    }

    const loginContainer = document.getElementById('google-login-btn-container');
    const signupContainer = document.getElementById('google-signup-btn-container');

    if (googleClientId) {
      // Official Google Sign-In SDK
      if (window.google) {
        try {
          google.accounts.id.initialize({
            client_id: googleClientId,
            callback: async (response) => {
              await handleGoogleAuth(response.credential);
            }
          });

          if (loginContainer) {
            loginContainer.innerHTML = '';
            google.accounts.id.renderButton(loginContainer, {
              theme: 'outline',
              size: 'large',
              width: loginContainer.offsetWidth || 300,
              text: 'signin_with'
            });
          }
          
          if (signupContainer) {
            signupContainer.innerHTML = '';
            google.accounts.id.renderButton(signupContainer, {
              theme: 'outline',
              size: 'large',
              width: signupContainer.offsetWidth || 300,
              text: 'signup_with'
            });
          }
        } catch (gsiErr) {
          console.error('GSI Button rendering failed:', gsiErr);
        }
      } else {
        console.warn('Google Identity Services SDK script not loaded.');
      }
    } else {
      // Sandbox Fallback Mode
      const sandboxButtonHtml = `
        <button type="button" class="btn-google-login" style="display: flex; align-items: center; justify-content: center; gap: 0.75rem; padding: 0.65rem 1rem; border-radius: 2rem; border: 1.5px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary); font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: background 0.2s, border-color 0.2s; width: 100%; box-sizing: border-box;">
          <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>Continue with Google</span>
        </button>
      `;

      if (loginContainer) {
        loginContainer.innerHTML = sandboxButtonHtml;
        loginContainer.querySelector('button').addEventListener('click', openGoogleAuthPopup);
      }
      
      if (signupContainer) {
        signupContainer.innerHTML = sandboxButtonHtml;
        signupContainer.querySelector('button').addEventListener('click', openGoogleAuthPopup);
      }
    }
  };

  const openGoogleAuthPopup = () => {
    const w = 520;
    const h = 600;
    const left = screen.width / 2 - w / 2;
    const top = screen.height / 2 - h / 2;
    const popup = window.open(
      '/api/auth/google/popup',
      'GoogleLoginPopup',
      `width=${w},height=${h},top=${top},left=${left},resizable=yes,scrollbars=yes,status=yes`
    );
    if (popup) popup.focus();
  };

  window.addEventListener('message', async (event) => {
    if (event.origin !== window.location.origin) return;
    const { type, email, first_name, last_name } = event.data;
    if (type === 'google-auth-success') {
      await handleGoogleAuth(null, email, first_name, last_name);
    }
  });
  
  async function handleGoogleAuth(credential, email, first_name, last_name) {
    try {
      const payload = credential 
        ? { credential } 
        : { email, first_name, last_name };

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Google Login failed');
      
      safeStorage.setItem('token', data.token);
      token = data.token;
      currentUser = data.user;
      updateAuthNav(currentUser);
      hideAuthModal();
      showToast(`Welcome, ${currentUser.first_name || currentUser.display_name}!`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // Forgot Password Forms
  const forgotStep1 = document.getElementById('forgot-password-step1-form');
  if (forgotStep1) {
    forgotStep1.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('forgot-email').value;
      try {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Password reset request failed');
        
        showToast(data.message || 'Verification code sent!', 'success');
        forgotStep1.style.display = 'none';
        document.getElementById('forgot-password-step2-form').style.display = 'flex';
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
  
  const forgotStep2 = document.getElementById('forgot-password-step2-form');
  if (forgotStep2) {
    forgotStep2.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('forgot-email').value;
      const code = document.getElementById('forgot-code').value;
      const newPassword = document.getElementById('forgot-new-password').value;
      try {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code, newPassword })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Password reset failed');
        
        showToast(data.message || 'Password reset successful!', 'success');
        showAuthModal('login');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
  
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
    const first_name = document.getElementById('signup-first-name').value;
    const last_name = document.getElementById('signup-last-name').value;
    
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, first_name, last_name })
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
      document.getElementById('signup-first-name').value = '';
      document.getElementById('signup-last-name').value = '';
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

  // Settings modal listeners
  const settingsCloseBtn = document.getElementById('btn-close-settings');
  if (settingsCloseBtn) {
    settingsCloseBtn.addEventListener('click', hideSettingsModal);
  }

  const inputProfilePic = document.getElementById('input-profile-pic');
  if (inputProfilePic) {
    inputProfilePic.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const formData = new FormData();
      formData.append('profile_pic', file);
      
      try {
        const res = await fetch('/api/user/profile-pic', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to upload profile picture');
        
        currentUser.profile_pic = data.profilePicUrl;
        
        showToast('Profile picture updated successfully', 'success');
        updateAuthNav(currentUser);
        
        const settingsAvatarWrapper = document.querySelector('.settings-avatar-wrapper');
        if (settingsAvatarWrapper) {
          settingsAvatarWrapper.innerHTML = getAvatarHtml(currentUser.profile_pic, "100%", "18%");
        }
        
        if (document.getElementById('blog-page').style.display === 'block') {
          renderBlogList();
        }
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  const settingsForm = document.getElementById('settings-form');
  if (settingsForm) {
    settingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const firstName = document.getElementById('settings-first-name').value.trim();
      const lastName = document.getElementById('settings-last-name').value.trim();
      
      try {
        const res = await fetch('/api/user/display-name', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            first_name: firstName,
            last_name: lastName
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update settings');
        
        currentUser.first_name = data.user.first_name;
        currentUser.last_name = data.user.last_name;
        currentUser.display_name = data.user.display_name;
        
        showToast('Account settings saved successfully', 'success');
        updateAuthNav(currentUser);
        hideSettingsModal();
        
        if (document.getElementById('blog-page').style.display === 'block') {
          renderBlogList();
        }
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Prefetch Google Client ID configuration
  checkGoogleConfig();
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
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <div class="blog-post-author-avatar-wrapper">
                ${getAvatarHtml(post.author_pic, "100%", "18%")}
              </div>
              <span class="blog-post-author">By ${escapeHTML(authorName)}</span>
            </div>
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

async function loadFeaturedLandingBlogs() {
  const container = document.getElementById('landing-blogs-grid');
  if (!container) return;

  try {
    const res = await fetch('/api/blog');
    const data = await res.json();
    
    if (res.ok && data.posts && data.posts.length > 0) {
      const featured = data.posts.slice(0, 3);
      container.innerHTML = featured.map(post => {
        const dateStr = new Date(post.createdAt).toLocaleDateString(undefined, {
          year: 'numeric', month: 'long', day: 'numeric'
        });
        const authorName = post.author_name || post.author_email;
        const doc = new DOMParser().parseFromString(post.content, 'text/html');
        const textContent = doc.body.textContent || "";
        const snippet = textContent.length > 120 ? textContent.substring(0, 120) + "..." : textContent;

        return `
          <article class="testimonial-card" style="font-style: normal; gap: 1rem; align-items: stretch; justify-content: space-between;">
            <div>
              <span style="font-size: 0.75rem; color: var(--accent-secondary); font-weight: 700; text-transform: uppercase;">Community Article</span>
              <h3 style="margin-top: 0.5rem; margin-bottom: 0.75rem; font-size: 1.15rem; font-weight: 700; color: var(--text-primary); line-height: 1.4;">${escapeHTML(post.title)}</h3>
              <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; font-style: normal;">${escapeHTML(snippet)}</p>
            </div>
            <div class="testimonial-user" style="margin-top: 1.25rem;">
              <div class="blog-post-author-avatar-wrapper" style="width: 2.2rem; height: 2.2rem; min-width: 2.2rem;">
                ${getAvatarHtml(post.author_pic, "100%", "18%")}
              </div>
              <div class="user-info-text">
                <h4 style="font-size: 0.85rem;">${escapeHTML(authorName)}</h4>
                <p style="font-size: 0.7rem;">${dateStr}</p>
              </div>
            </div>
          </article>
        `;
      }).join('');
      return;
    }
  } catch (err) {
    console.error("Failed to load featured landing blogs:", err);
  }

  // Fallback default featured articles if empty database or error
  container.innerHTML = `
    <article class="testimonial-card" style="font-style: normal; gap: 1rem; align-items: stretch; justify-content: space-between;">
      <div>
        <span style="font-size: 0.75rem; color: var(--accent-secondary); font-weight: 700; text-transform: uppercase;">Productivity Guide</span>
        <h3 style="margin-top: 0.5rem; margin-bottom: 0.75rem; font-size: 1.15rem; font-weight: 700; color: var(--text-primary); line-height: 1.4;">5 Simple Workflows to Automate Your Daily PDF Tasks</h3>
        <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; font-style: normal;">From batch signatures to multi-file compressions, discover the best productivity hacks to optimize your business document pipelines.</p>
      </div>
      <div class="testimonial-user" style="margin-top: 1.25rem;">
        <div class="user-avatar-silhouette" style="background: var(--grad-primary); width: 2.2rem; height: 2.2rem; min-width: 2.2rem;">PP</div>
        <div class="user-info-text">
          <h4 style="font-size: 0.85rem;">PixelPDF Editorial</h4>
          <p style="font-size: 0.7rem;">June 25, 2026</p>
        </div>
      </div>
    </article>
    
    <article class="testimonial-card" style="font-style: normal; gap: 1rem; align-items: stretch; justify-content: space-between;">
      <div>
        <span style="font-size: 0.75rem; color: var(--accent-secondary); font-weight: 700; text-transform: uppercase;">Security Report</span>
        <h3 style="margin-top: 0.5rem; margin-bottom: 0.75rem; font-size: 1.15rem; font-weight: 700; color: var(--text-primary); line-height: 1.4;">The Future of Document Security in the AI Era</h3>
        <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; font-style: normal;">Explore how local WebAssembly processing and client-side cryptography are shifting the balance of power and security back to users.</p>
      </div>
      <div class="testimonial-user" style="margin-top: 1.25rem;">
        <div class="user-avatar-silhouette" style="background: var(--grad-blue-cyan); width: 2.2rem; height: 2.2rem; min-width: 2.2rem;">SE</div>
        <div class="user-info-text">
          <h4 style="font-size: 0.85rem;">Security Council</h4>
          <p style="font-size: 0.7rem;">June 20, 2026</p>
        </div>
      </div>
    </article>

    <article class="testimonial-card" style="font-style: normal; gap: 1rem; align-items: stretch; justify-content: space-between;">
      <div>
        <span style="font-size: 0.75rem; color: var(--accent-secondary); font-weight: 700; text-transform: uppercase;">Tech Spotlight</span>
        <h3 style="margin-top: 0.5rem; margin-bottom: 0.75rem; font-size: 1.15rem; font-weight: 700; color: var(--text-primary); line-height: 1.4;">Unlocking PDF Tables: The Best Way to Export to Excel</h3>
        <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; font-style: normal;">A deep technical walkthrough explaining how our browser parser recognizes structural borders and data cells without column misalignment.</p>
      </div>
      <div class="testimonial-user" style="margin-top: 1.25rem;">
        <div class="user-avatar-silhouette" style="background: var(--grad-teal-green); width: 2.2rem; height: 2.2rem; min-width: 2.2rem;">DB</div>
        <div class="user-info-text">
          <h4 style="font-size: 0.85rem;">Database Team</h4>
          <p style="font-size: 0.7rem;">June 18, 2026</p>
        </div>
      </div>
    </article>
  `;
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
