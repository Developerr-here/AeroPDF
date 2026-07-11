import './style.css';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
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

// Corporate Billing Details for Invoices (Billed From)
const VENDOR_BILLING_INFO = {
  companyName: 'pdfbundles Technologies LLC',
  address: '100 Pine Street, Suite 1200',
  cityStateZip: 'San Francisco, CA 94111',
  country: 'United States',
  email: 'finance@pdfbundles.com'
};

// Application State
let currentTool = null;
let uploadedFiles = [];
let pricingInterval = 'month'; // 'month' or 'year'
let pricingSeats = 1; // 1 to 25
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
  <div class="drawer-menu-links" style="display: flex; flex-direction: column; gap: 0.25rem; padding: 1rem 0.75rem;">
    <!-- Other Products Dropdown -->
    <div>
      <a href="#" class="drawer-menu-link drawer-dropdown-trigger" id="mob-trigger-products">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.24h1.98a2.25 2.25 0 002.007-1.24l.885-1.77a2.25 2.25 0 012.007-1.24h3.86m-18 0h18m-18 0v-7.5A2.25 2.25 0 012.25 6h19.5a2.25 2.25 0 012.25 2.25v7.5m-18 0v-7.5m18 0v7.5" /></svg>
          <span style="font-weight: 600; font-size: 0.85rem; letter-spacing: 0.05em; text-transform: uppercase;">Other Products</span>
        </div>
        <span class="drawer-arrow">›</span>
      </a>
      <div class="drawer-submenu" id="mob-submenu-products">
        <a href="#" class="drawer-submenu-item" data-tool="merge-pdf">Merge PDF</a>
        <a href="#" class="drawer-submenu-item" data-tool="split-pdf">Split PDF</a>
        <a href="#" class="drawer-submenu-item" data-tool="compress-pdf">Compress PDF</a>
        <a href="#" class="drawer-submenu-item" data-tool="ocr-pdf">OCR PDF</a>
        <a href="#" class="drawer-submenu-item" data-tool="pdf-to-word">PDF to Word</a>
        <a href="#" class="drawer-submenu-item" data-tool="word-to-pdf">Word to PDF</a>
      </div>
    </div>

    <!-- Solutions Dropdown -->
    <div>
      <a href="#" class="drawer-menu-link drawer-dropdown-trigger" id="mob-trigger-solutions">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span style="font-weight: 600; font-size: 0.85rem; letter-spacing: 0.05em; text-transform: uppercase;">Solutions</span>
        </div>
        <span class="drawer-arrow">›</span>
      </a>
      <div class="drawer-submenu" id="mob-submenu-solutions">
        <a href="#" class="drawer-submenu-category" data-cat="organize">Organize PDF</a>
        <a href="#" class="drawer-submenu-category" data-cat="optimize">Optimize PDF</a>
        <a href="#" class="drawer-submenu-category" data-cat="convert">Convert PDF</a>
        <a href="#" class="drawer-submenu-category" data-cat="edit">Edit PDF</a>
        <a href="#" class="drawer-submenu-category" data-cat="security">PDF Security</a>
      </div>
    </div>

    <!-- Applications Dropdown -->
    <div>
      <a href="#" class="drawer-menu-link drawer-dropdown-trigger" id="mob-trigger-apps">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" /></svg>
          <span style="font-weight: 600; font-size: 0.85rem; letter-spacing: 0.05em; text-transform: uppercase;">Applications</span>
        </div>
        <span class="drawer-arrow">›</span>
      </a>
      <div class="drawer-submenu" id="mob-submenu-apps">
        <a href="#" class="drawer-submenu-item" data-tool="ai-assistant">🤖 AI Assistant</a>
        <a href="#" class="drawer-submenu-item" data-tool="upscale-image">🖼️ Upscale Image</a>
        <a href="#" class="drawer-submenu-item" data-tool="remove-background">✂️ Remove BG</a>
      </div>
    </div>

    <!-- Pricing Link -->
    <a href="#" class="drawer-menu-link" id="mob-link-pricing">
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.5 8.5h19M2.5 12h19M2.5 15.5h19" /></svg>
        <span>Pricing</span>
      </div>
    </a>

    <!-- Features Link -->
    <a href="#" class="drawer-menu-link" id="mob-link-features">
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
        <span>Features</span>
      </div>
    </a>

    <!-- About us Link -->
    <a href="#" class="drawer-menu-link" id="mob-link-about">
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.063.852l-.708 2.836a.75.75 0 001.063.852l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
        <span>About us</span>
      </div>
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
  compress: { title: 'Compress PDF', desc: 'Optimize and shrink the file size of your PDF.', uploadHeadline: 'Upload one or more PDFs to compress', uploadSubline: 'or drag and drop them here', accepts: '.pdf', multiple: true },
  repair: { title: 'Repair PDF', desc: 'Attempt to recover content from damaged or corrupt PDFs.', uploadHeadline: 'Upload one or more PDFs to repair', uploadSubline: 'or drag and drop them here', accepts: '.pdf', multiple: true },
  ocr: { title: 'OCR PDF', desc: 'Recognize scanned text layers and convert to searchable formats.', uploadHeadline: 'Upload scanned PDFs to apply OCR', uploadSubline: 'or drag and drop them here', accepts: '.pdf', multiple: true },
  'img-to-pdf': { title: 'JPG to PDF', desc: 'Convert JPG and PNG images into a PDF file.', uploadHeadline: 'Upload images to convert to PDF', uploadSubline: 'or drag and drop them here', accepts: 'image/png, image/jpeg, image/jpg', multiple: true },
  'word-to-pdf': { title: 'Word to PDF', desc: 'Convert DOCX documents to formatted PDFs.', uploadHeadline: 'Upload Word files to convert', uploadSubline: 'or drag and drop them here', accepts: '.docx', multiple: true },
  'ppt-to-pdf': { title: 'PPT to PDF', desc: 'Convert PowerPoint slides to PDFs.', uploadHeadline: 'Upload PPTX presentations to convert', uploadSubline: 'or drag and drop them here', accepts: '.pptx', multiple: true },
  'excel-to-pdf': { title: 'Excel to PDF', desc: 'Convert XLSX spreadsheets to PDFs.', uploadHeadline: 'Upload Excel spreadsheets to convert', uploadSubline: 'or drag and drop them here', accepts: '.xlsx', multiple: true },
  'html-to-pdf': { title: 'HTML to PDF', desc: 'Compile raw HTML code or web URLs into formatted PDFs.', uploadHeadline: 'HTML input mode active', uploadSubline: 'Configure parameters in sidebar', accepts: '', multiple: false, noUpload: true },
  'pdf-to-img': { title: 'PDF to JPG', desc: 'Extract pages from a PDF as separate PNG image downloads.', uploadHeadline: 'Upload one or more PDFs to convert to images', uploadSubline: 'or drag and drop them here', accepts: '.pdf', multiple: true },
  'pdf-to-word': { title: 'PDF to Word', desc: 'Export PDF content text into a Word document.', uploadHeadline: 'Upload one or more PDFs to convert to DOCX', uploadSubline: 'or drag and drop them here', accepts: '.pdf', multiple: true },
  'pdf-to-ppt': { title: 'PDF to PPT', desc: 'Export PDF pages into PowerPoint presentation slides.', uploadHeadline: 'Upload one or more PDFs to convert to PPTX', uploadSubline: 'or drag and drop them here', accepts: '.pdf', multiple: true },
  'pdf-to-excel': { title: 'PDF to Excel', desc: 'Parse table boundaries and export data to Excel spreadsheet rows.', uploadHeadline: 'Upload one or more PDFs to convert to XLSX', uploadSubline: 'or drag and drop them here', accepts: '.pdf', multiple: true },
  rotate: { title: 'Rotate PDF', desc: 'Set portrait/landscape rotation angles on pages.', uploadHeadline: 'Upload one or more PDFs to rotate pages', uploadSubline: 'or drag and drop them here', accepts: '.pdf', multiple: true },
  'page-numbers': { title: 'Page Numbers', desc: 'Stamp page count numbering onto page corners.', uploadHeadline: 'Upload one or more PDFs to add page numbers', uploadSubline: 'or drag and drop them here', accepts: '.pdf', multiple: true },
  watermark: { title: 'Add Watermark', desc: 'Overlay customized text watermarks onto all pages.', uploadHeadline: 'Upload one or more PDFs to watermark', uploadSubline: 'or drag and drop them here', accepts: '.pdf', multiple: true },
  crop: { title: 'Crop PDF', desc: 'Visual margin boundaries clipper.', uploadHeadline: 'Upload a PDF to crop margins', uploadSubline: 'or drag and drop it here', accepts: '.pdf', multiple: false },
  'edit-pdf': { title: 'Edit PDF', desc: 'Draw annotations or type custom text overlays onto pages.', uploadHeadline: 'Upload a PDF to edit text on', uploadSubline: 'or drag and drop it here', accepts: '.pdf', multiple: false },
  'pdf-forms': { title: 'PDF Forms', desc: 'Fill out interactive form fields in documents.', uploadHeadline: 'Upload a PDF form to fill', uploadSubline: 'or drag and drop it here', accepts: '.pdf', multiple: false },
  protect: { title: 'Protect PDF', desc: 'Lock and encrypt a PDF with a password.', uploadHeadline: 'Upload one or more PDFs to encrypt', uploadSubline: 'or drag and drop them here', accepts: '.pdf', multiple: true },
  unlock: { title: 'Unlock PDF', desc: 'Unlock password constraints from encrypted PDFs.', uploadHeadline: 'Upload encrypted PDFs to unlock', uploadSubline: 'or drag and drop them here', accepts: '.pdf', multiple: true },
  sign: { title: 'Sign PDF', desc: 'Visually stamp custom signature drawings onto pages.', uploadHeadline: 'Upload a PDF to sign', uploadSubline: 'or drag and drop it here', accepts: '.pdf', multiple: false },
  redact: { title: 'Redact PDF', desc: 'Visually black out sensitive section coordinates on pages.', uploadHeadline: 'Upload a PDF to redact sections', uploadSubline: 'or drag and drop it here', accepts: '.pdf', multiple: false },
  compare: { title: 'Compare PDF', desc: 'Validate metadata and page alignment comparisons between two PDFs.', uploadHeadline: 'Upload two PDF documents to compare', uploadSubline: 'or drag and drop them here', accepts: '.pdf', multiple: true },
  'ai-assistant': { title: 'AI PDF Assistant', desc: 'Chat, translate, summarize, or generate study notes from PDF text.', uploadHeadline: 'Upload a PDF to analyze with AI', uploadSubline: 'or drag and drop it here', accepts: '.pdf', multiple: false },
  'remove-background': { title: 'Background Remover', desc: 'Remove background from images automatically using AI.', uploadHeadline: 'Upload one or more images to remove background', uploadSubline: 'or drag and drop them here', accepts: 'image/png, image/jpeg, image/jpg', multiple: true },
  'upscale-image': { title: 'Image Upscaler', desc: 'Enhance resolution and quality of images.', uploadHeadline: 'Upload one or more images to upscale', uploadSubline: 'or drag and drop them here', accepts: 'image/png, image/jpeg, image/jpg', multiple: true }
};

// Success download cache
let lastProcessedFile = null;

// Tool extra content dictionary (metafields)
const TOOL_EXTRA_CONTENT = {
  merge: {
    category: 'Organizer',
    icon: '🥞',
    badges: ['FAST WORKFLOW', 'PRIVATE PROCESSING', 'SERVER-OPTIMIZED'],
    input: 'PDF files',
    engine: 'Server-optimized',
    output: 'Merged PDF',
    flow: ['Upload two or more PDFs', 'Arrange file order / rotate pages', 'Download combined result'],
    about: 'Merge PDF lets you combine multiple PDF documents, reports, invoices, or invoices into a single, organized file. Perfect for collating documents for submissions or sharing.',
    features: [
      'Combine unlimited PDF documents into one',
      'Drag and drop rows to reorder documents',
      'Rotate individual pages before compiling',
      'Encrypted transit with zero data monetization'
    ],
    whoUses: [
      'Students combining assignment sheets',
      'HR managers compiling candidate resumes',
      'Businesses organizing monthly financial statements'
    ],
    steps: [
      { title: 'Upload Files', desc: 'Select or drag and drop multiple PDF documents into the upload zone.' },
      { title: 'Reorder & Rotate', desc: 'Drag rows to rearrange page order. Rotate pages if needed.' },
      { title: 'Merge & Save', desc: 'Click "Process Files" to merge and download your single combined PDF.' }
    ],
    faqs: [
      { q: 'Is there a limit to how many files I can merge?', a: 'Free accounts can merge up to 5 files at a time. Premium accounts have no limits.' },
      { q: 'Will the formatting of my original PDFs change?', a: 'No, all layout, fonts, margins, and contents are preserved exactly as they are.' },
      { q: 'Is merging secure?', a: 'Yes, your files are processed securely and deleted automatically within 1 hour.' }
    ],
    related: ['split', 'organize-pdf', 'rotate']
  },
  split: {
    category: 'Organizer',
    icon: '✂️',
    badges: ['EXACT PAGE EXTRACTION', 'HIGH SPEED', 'SANDBOXED'],
    input: 'Single PDF',
    engine: 'Client-side Splitter',
    output: 'Split PDFs / Zip',
    flow: ['Upload your PDF', 'Select page ranges or individual pages', 'Download split documents'],
    about: 'Split PDF allows you to extract specific pages or page ranges from a document, or save every page as a standalone PDF file. Excellent for separating chapters, sections, or slides.',
    features: [
      'Extract custom page ranges (e.g. 1-5, 8, 12)',
      'Split every page into its own individual PDF',
      'Interactive visual thumbnail selection grid',
      'Fast client-side rendering with no quality loss'
    ],
    whoUses: [
      'Teachers separating lesson plans',
      'Real estate agents isolating signature pages',
      'Contractors extracting invoice receipts'
    ],
    steps: [
      { title: 'Upload PDF', desc: 'Select a PDF document to split from your computer.' },
      { title: 'Choose Pages', desc: 'Select individual page thumbnails or choose to split every page.' },
      { title: 'Download Split', desc: 'Finalize processing and download your isolated PDF pages instantly.' }
    ],
    faqs: [
      { q: 'Can I split password-protected PDFs?', a: 'Yes, but you will need to input the password first to unlock the pages before splitting.' },
      { q: 'What is "Split every page"?', a: 'This mode saves each page of your PDF as a separate single-page document packaged inside a ZIP file.' }
    ],
    related: ['merge', 'organize-pdf', 'extract-pages']
  },
  compress: {
    category: 'Optimization',
    icon: '📉',
    badges: ['SMART COMPRESSION', 'MAX REDUCTION', 'QUALITY PRESERVED'],
    input: 'PDF files',
    engine: 'Preset Compressor',
    output: 'Compressed PDF',
    flow: ['Upload your PDF', 'Choose compression quality level', 'Download shrunken PDF'],
    about: 'Compress PDF optimizes and shrinks the file size of your documents while maintaining readable text and image quality. Ideal for reducing attachment sizes for email submissions.',
    features: [
      'Three compression levels: Balanced, Extreme, Low',
      'Significant file size reduction up to 90%',
      'Maintains sharp text and acceptable image resolution',
      'Private sandboxed environment processing'
    ],
    whoUses: [
      'Job applicants matching job portal limits (often < 2MB)',
      'Government submissions with rigid size caps',
      'Archivists saving disk space on large documents'
    ],
    steps: [
      { title: 'Upload Document', desc: 'Select or drag your PDF file into the upload dropzone.' },
      { title: 'Select Level', desc: 'Choose Balanced (recommended), Extreme (lowest size), or Low.' },
      { title: 'Optimize & Save', desc: 'Process the document and download the shrunken PDF file.' }
    ],
    faqs: [
      { q: 'Will my images look blurry?', a: 'Balanced mode maintains excellent visibility. Extreme mode may degrade high-res images to maximize storage saving.' },
      { q: 'Can I compress scanned PDFs?', a: 'Yes, our compressor works exceptionally well on heavy scanned documents.' }
    ],
    related: ['merge', 'ocr', 'protect']
  },
  ocr: {
    category: 'Text Recognition',
    icon: '🔍',
    badges: ['SEARCHABLE PDF', 'ACCURATE TEXT', 'MULTI-LANGUAGE'],
    input: 'Scanned PDF',
    engine: 'Tesseract OCR Engine',
    output: 'Searchable PDF',
    flow: ['Upload scanned PDF document', 'Wait for text recognition to complete', 'Download searchable PDF'],
    about: 'OCR PDF processes scanned documents and images to recognize written text, embedding an invisible searchable text layer. This lets you search, copy, and select text in the PDF.',
    features: [
      'Extract searchable text from image-only PDFs',
      'Preserve original page formatting and layouts',
      'Allows copy-pasting of text from scanned books/records',
      'Runs securely on server with automated cleanup'
    ],
    whoUses: [
      'Lawyers processing scanned court filings',
      'Researchers search-enabling digital archive books',
      'Data entry specialists copy-pasting scanned receipts'
    ],
    steps: [
      { title: 'Upload Scanned File', desc: 'Select your scanned, non-searchable PDF file.' },
      { title: 'Apply OCR', desc: 'Process the document to run character recognition.' },
      { title: 'Save & Copy', desc: 'Download your searchable PDF and select text directly.' }
    ],
    faqs: [
      { q: 'What is OCR?', a: 'OCR stands for Optical Character Recognition. It translates image pixels of characters into editable machine text.' },
      { q: 'Will OCR make my file size larger?', a: 'Only slightly, as it only adds a text layer underneath the existing images.' }
    ],
    related: ['compress', 'pdf-to-word', 'edit-pdf']
  },
  'img-to-pdf': {
    category: 'Converter',
    icon: '🖼️',
    badges: ['IMAGE CONVERTER', 'GRID SORT', 'CUSTOM MARGINS'],
    input: 'JPG / PNG / GIF',
    engine: 'Layout Engine',
    output: 'PDF Document',
    flow: ['Upload one or more images', 'Set page layout and dimensions', 'Download compiled PDF'],
    about: 'JPG to PDF compiles your photos, screenshots, or drawings into a neat, single PDF document. You can sort images, configure page sizing (A4/Letter), and set margins.',
    features: [
      'Convert JPG, JPEG, PNG, and GIF to PDF',
      'Rearrange images visually in a grid',
      'Customize page size (A4, Letter, Fit)',
      'Adjust orientation (Portrait, Landscape)'
    ],
    whoUses: [
      'Students scanning hand-written notes via photos',
      'Developers creating PDF mockups from screenshots',
      'Receipt-collectors organizing monthly expenditures'
    ],
    steps: [
      { title: 'Upload Images', desc: 'Select one or multiple photos to convert.' },
      { title: 'Configure Pages', desc: 'Choose page size and orientation on the right sidebar.' },
      { title: 'Compile & Save', desc: 'Build and download your unified PDF document.' }
    ],
    faqs: [
      { q: 'Does it compress the images?', a: 'No, it embeds images in their full original resolution unless compressed subsequently.' }
    ],
    related: ['pdf-to-img', 'merge', 'edit-pdf']
  },
  'edit-pdf': {
    category: 'Editor',
    icon: '✍️',
    badges: ['TEXT STAMP', 'ANNOTATIONS', 'FREE-FORM'],
    input: 'PDF files',
    engine: 'Vector Overlay Engine',
    output: 'Annotated PDF',
    flow: ['Upload your PDF document', 'Type text and click to stamp it on pages', 'Download updated PDF'],
    about: 'Edit PDF lets you stamp text overlays, insert dates, or annotate pages visually. Perfect for adding notes, comments, or headers onto pre-existing documents.',
    features: [
      'Stamp text overlays anywhere on document pages',
      'Configure font sizes dynamically',
      'Remove stamps with a simple click',
      'Fast client-side vector placement'
    ],
    whoUses: [
      'Editors giving feedback on PDF drafts',
      'Accountants writing check numbers on receipts',
      'Managers stamping "APPROVED" signatures'
    ],
    steps: [
      { title: 'Upload PDF', desc: 'Select the PDF document you want to write on.' },
      { title: 'Stamp Text', desc: 'Type your overlay text, select size, and click on page to place.' },
      { title: 'Save File', desc: 'Click process to bake stamps into the PDF and download.' }
    ],
    faqs: [
      { q: 'Can I edit the existing text in the PDF?', a: 'Currently, this tool overlays new text and annotations. To replace original text, use an OCR to Word converter first.' }
    ],
    related: ['watermark', 'sign', 'redact']
  },
  'ai-assistant': {
    category: 'AI Tool',
    icon: '🔮',
    badges: ['AI SUMMARIZER', 'AI CHATBOT', 'STUDY GUIDES'],
    input: 'PDF files',
    engine: 'Grok / Groq Serverless AI',
    output: 'AI Insights Text',
    flow: ['Upload a text-based PDF', 'Select AI Mode (Chat, Summarize, Notes)', 'Read and copy generated answers'],
    about: 'AI PDF Assistant harnesses state-of-the-art Large Language Models to chat with, summarize, translate, or generate study notes from your PDF documents. Save hours of reading.',
    features: [
      'Detailed, structured executive summaries',
      'Interactive chat to ask specific document questions',
      'Instant translation to 10+ languages',
      'Automatic generation of revision notes and study quizzes'
    ],
    whoUses: [
      'Students analyzing long research papers and textbooks',
      'Professionals reviewing complex corporate reports',
      'Researchers translation-checking international papers'
    ],
    steps: [
      { title: 'Upload Document', desc: 'Select a text-rich PDF document.' },
      { title: 'Select AI Feature', desc: 'Choose summarize, chat, translate, or study notes.' },
      { title: 'Get Insights', desc: 'Submit and read the generated response on screen.' }
    ],
    faqs: [
      { q: 'What is the file size limit for AI tools?', a: 'Free accounts can upload PDFs up to 10MB. Text content is extracted securely.' },
      { q: 'Is my data secure with the AI?', a: 'Yes, we do not store your documents permanently or use them to train AI models.' }
    ],
    related: ['ocr', 'pdf-to-word', 'compress']
  },
  'remove-background': {
    category: 'AI Image',
    icon: '🎨',
    badges: ['BACKGROUND REMOVER', 'PNG EXPORT', 'AUTOMATIC SUBJECT ISOLATION'],
    input: 'JPG / PNG Image',
    engine: 'Serverless Segmentation API',
    output: 'Transparent PNG',
    flow: ['Upload your subject image', 'Wait for AI to process background removal', 'Download transparent PNG'],
    about: 'Background Remover automatically isolates the primary subject (person, product, animal) in your photo and removes the background, returning a transparent PNG file.',
    features: [
      'Fully automatic background isolation',
      'Clean edge detection around hair and clothing',
      'Export directly to high-quality transparent PNG',
      'No manual drawing or masking required'
    ],
    whoUses: [
      'E-commerce merchants isolating product photos',
      'Graphic designers preparing subject cutouts',
      'Social media creators making profile avatars'
    ],
    steps: [
      { title: 'Upload Image', desc: 'Select a clear JPEG/PNG image to cut out.' },
      { title: 'AI Isolates', desc: 'Wait a few seconds while our AI calculates the subject mask.' },
      { title: 'Download PNG', desc: 'Download your clean cutout image with transparent backing.' }
    ],
    faqs: [
      { q: 'Does this work on complex backgrounds?', a: 'Yes, our serverless segmentation models handle diverse backgrounds extremely well.' }
    ],
    related: ['upscale-image', 'img-to-pdf', 'pdf-to-img']
  },
  'upscale-image': {
    category: 'AI Image',
    icon: '🔎',
    badges: ['RESOLUTION BOOSTER', 'QUALITY ENHANCER', 'DETAILED RESCALING'],
    input: 'Image files',
    engine: 'Super-Resolution AI',
    output: 'Upscaled Image',
    flow: ['Upload low-res image', 'Select upscale factor (2x or 4x)', 'Download enhanced image'],
    about: 'Image Upscaler uses advanced AI Super-Resolution models to enlarge and boost the details of low-resolution images, generating crisp, sharp details without simple pixelation.',
    features: [
      'Upscale images by 2x or 4x resolution',
      'Synthesize crisp details rather than blurring pixels',
      'Perfect for enlarging vintage photos or small graphics',
      'Supports standard PNG and JPEG formats'
    ],
    whoUses: [
      'Print-on-demand creators upscaling design assets',
      'Family historians restoring old digital images',
      'Designers upscaling small logos and icons'
    ],
    steps: [
      { title: 'Upload Graphic', desc: 'Select the low-resolution photo to enhance.' },
      { title: 'Select Factor', desc: 'Choose 2x (double size) or 4x (ultra HD) on the sidebar.' },
      { title: 'Upscale & Download', desc: 'Process the image and download the enhanced file.' }
    ],
    faqs: [
      { q: 'Will it look fake?', a: 'Our models are trained on real details, offering highly natural enhancements.' }
    ],
    related: ['remove-background', 'img-to-pdf', 'pdf-to-img']
  }
};

function getExtraContentForTool(toolId) {
  if (TOOL_EXTRA_CONTENT[toolId]) {
    return TOOL_EXTRA_CONTENT[toolId];
  }

  const meta = TOOL_META[toolId] || { title: 'Document Tool', desc: 'Manage your documents easily.' };

  let category = 'Utility';
  let icon = '🛠️';
  if (toolId.includes('pdf-to-') || toolId.includes('-to-pdf')) {
    category = 'Converter';
    icon = '🔄';
  } else if (toolId === 'sign' || toolId === 'protect' || toolId === 'unlock' || toolId === 'redact') {
    category = 'Security';
    icon = '🔒';
  } else if (toolId === 'rotate' || toolId === 'crop' || toolId === 'page-numbers') {
    category = 'Editor';
    icon = '📏';
  }

  return {
    category: category,
    icon: icon,
    badges: ['SECURE PROCESSING', 'HIGH SPEED', 'ZERO TRUST'],
    input: 'Document files',
    engine: 'Local Compiler',
    output: 'Processed PDF',
    flow: ['Upload your file', 'Apply tool modifications', 'Download output document'],
    about: `${meta.title} provides a fast, secure online utility to ${meta.desc.toLowerCase()}`,
    features: [
      `Easily ${meta.desc.toLowerCase()}`,
      'Private client-side processing with strict encryption',
      'No registration or signup required to download',
      'Maintains original document styling and fonts'
    ],
    whoUses: [
      'Business professionals managing digital invoices',
      'Students editing academic submissions',
      'Remote teams organizing sharing workflows'
    ],
    steps: [
      { title: 'Upload File', desc: 'Select a file to process from your computer.' },
      { title: 'Process Options', desc: 'Configure processing choices in the settings sidebar.' },
      { title: 'Download Result', desc: 'Bake options into the file and download the output.' }
    ],
    faqs: [
      { q: 'Is my data secure?', a: 'Yes, your files are processed securely and deleted automatically within 1 hour.' },
      { q: 'Do I need an account to use this?', a: 'No, using this utility is completely free and account-free.' }
    ],
    related: ['merge', 'split', 'compress']
  };
}

function setWorkspaceState(state) {
  const widget = document.getElementById('tool-education-widget');
  const dropzone = document.getElementById('dropzone');
  const opsArea = document.getElementById('operations-area');
  const successPanel = document.getElementById('success-panel');
  const details = document.getElementById('tool-details-container');

  if (state === 'upload') {
    if (widget) widget.style.display = 'block';
    if (dropzone) dropzone.style.display = 'flex';
    if (opsArea) opsArea.style.display = 'none';
    if (successPanel) successPanel.style.display = 'none';
    if (details) details.style.display = 'block';
  } else if (state === 'operations') {
    if (widget) widget.style.display = 'block';
    if (dropzone) dropzone.style.display = 'flex';
    if (opsArea) opsArea.style.display = 'grid';
    if (successPanel) successPanel.style.display = 'none';
    if (details) details.style.display = 'none';
  } else if (state === 'success') {
    if (widget) widget.style.display = 'none';
    if (dropzone) dropzone.style.display = 'none';
    if (opsArea) opsArea.style.display = 'none';
    if (successPanel) successPanel.style.display = 'block';
    if (details) details.style.display = 'block';
  }
}

function showSuccessView(filename) {
  document.getElementById('success-message').textContent = `Your file "${filename}" has been processed securely and is ready for download.`;
  setWorkspaceState('success');
}

window.toggleToolFaq = function (index) {
  const panel = document.getElementById(`tool-faq-panel-${index}`);
  const icon = document.getElementById(`tool-faq-icon-${index}`);
  if (!panel || !icon) return;
  const isExpanded = panel.style.maxHeight !== '0px';
  if (isExpanded) {
    panel.style.maxHeight = '0px';
    icon.textContent = '+';
    icon.style.transform = 'rotate(0deg)';
  } else {
    panel.style.maxHeight = panel.scrollHeight + 'px';
    icon.textContent = '−';
    icon.style.transform = 'rotate(180deg)';
  }
};

async function loadToolLandingBlogs() {
  const container = document.getElementById('tool-blogs-grid');
  if (!container) return;

  const toolId = currentTool;
  if (!toolId) return;
  const meta = TOOL_META[toolId] || { title: 'Document Tool', desc: 'Manage your documents easily.' };

  try {
    const res = await fetch('/api/blog');
    const data = await res.json();
    let postsToShow = [];

    // Define tool keywords for filtering real articles
    const TOOL_KEYWORDS = {
      'merge': ['merge', 'combine', 'join', 'concatenate', 'unify'],
      'split': ['split', 'extract', 'separate', 'cut', 'pages'],
      'compress': ['compress', 'shrink', 'size', 'reduce', 'smaller', 'optimize'],
      'protect': ['protect', 'encrypt', 'password', 'lock', 'secure', 'security'],
      'unlock': ['unlock', 'decrypt', 'password', 'remove lock', 'remove protection'],
      'rotate': ['rotate', 'turn', 'orientation', 'spin', 'degree'],
      'crop': ['crop', 'trim', 'margins', 'border', 'resize'],
      'page-numbers': ['page numbers', 'paginate', 'numbering', 'header', 'footer'],
      'watermark': ['watermark', 'stamp', 'logo', 'text overlay', 'copyright'],
      'edit-pdf': ['edit', 'write', 'modify', 'annotate', 'signature'],
      'sign': ['sign', 'signature', 'e-sign', 'electronic signature', 'pen'],
      'redact': ['redact', 'blackout', 'hide', 'sensitive', 'mask', 'censor'],
      'ocr': ['ocr', 'optical character', 'text recognition', 'scanned', 'image to text'],
      'repair': ['repair', 'fix', 'corrupted', 'broken', 'recover', 'restore'],
      'organize-pdf': ['organize', 'reorder', 'move pages', 'delete pages', 'arrange'],
      'remove-pages': ['remove pages', 'delete pages', 'extract pages', 'cut'],
      'pdf-to-img': ['convert', 'pdf to image', 'pdf to jpg', 'pdf to png', 'extract image'],
      'img-to-pdf': ['convert', 'image to pdf', 'jpg to pdf', 'png to pdf', 'convert images'],
      'office-to-pdf': ['convert', 'word to pdf', 'excel to pdf', 'powerpoint to pdf', 'doc to pdf'],
      'pdf-to-office': ['convert', 'pdf to word', 'pdf to excel', 'pdf to ppt', 'pdf to doc'],
      'html-to-pdf': ['convert', 'html to pdf', 'webpage to pdf', 'url to pdf', 'website to pdf'],
      'url-to-pdf': ['convert', 'url to pdf', 'link to pdf', 'webpage to pdf'],
      'scan-to-pdf': ['scan', 'scanner', 'camera', 'photo to pdf', 'mobile scan'],
      'remove-background': ['remove background', 'background removal', 'nobg', 'cutout', 'transparent'],
      'img-upscale': ['upscale', 'super-resolution', 'enhance', 'sharpen', 'enlarge', 'image quality'],
      'ai-assistant': ['ai assistant', 'chat', 'ask', 'summarize', 'translate', 'explain', 'artificial intelligence'],
      'ai-summarize': ['summarize', 'summary', 'abstract', 'condense', 'ai', 'key points'],
      'ai-translate': ['translate', 'translation', 'language', 'multilingual', 'ai', 'interpret']
    };

    if (res.ok && data.posts && data.posts.length > 0) {
      const keywords = TOOL_KEYWORDS[toolId] || [toolId.replace('-', ' ')];
      // Filter real posts by keyword matches in title or content
      const matchedPosts = data.posts.filter(post => {
        const titleLower = (post.title || '').toLowerCase();
        const contentLower = (post.content || '').toLowerCase();
        return keywords.some(keyword => titleLower.includes(keyword) || contentLower.includes(keyword));
      });
      postsToShow = matchedPosts.slice(0, 3);
    }

    // If we have fewer than 3 real posts, generate high-quality fallback articles specific to this tool
    if (postsToShow.length < 3) {
      const fallbacks = [
        {
          id: `fallback-1-${toolId}`,
          title: `How to Use ${meta.title} to Speed Up Your Workflows`,
          content: `<p>In this comprehensive guide, we examine how to use the online ${meta.title.toLowerCase()} tool to ${meta.desc.toLowerCase()} in seconds. Client-side browser execution ensures your workflows remain fast, robust, and completely secure without installing any local applications.</p>`,
          category: 'Guide',
          createdAt: new Date().toISOString(),
          author_name: 'Document Expert',
          isFallback: true
        },
        {
          id: `fallback-2-${toolId}`,
          title: `Top 5 Best Practices for Secure ${meta.title}`,
          content: `<p>Learn how to securely ${meta.desc.toLowerCase()} while keeping your data and info completely private under a zero-trust model. By utilizing local WebAssembly execution and automated 1-hour secure server cleanups, you guarantee compliance and privacy.</p>`,
          category: 'Security',
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          author_name: 'Privacy Team',
          isFallback: true
        },
        {
          id: `fallback-3-${toolId}`,
          title: `Streamlining Document Pipelines via ${meta.title}`,
          content: `<p>Discover how browser-first tools enable teams to perform ${meta.title.toLowerCase()} on-the-fly. We discuss cloud architectures, batch uploading limits, and how our utility helps remote workers complete tasks securely.</p>`,
          category: 'Enterprise',
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
          author_name: 'Product Arch',
          isFallback: true
        }
      ];

      while (postsToShow.length < 3) {
        const fbIndex = postsToShow.length;
        postsToShow.push(fallbacks[fbIndex]);
      }
    }

    // Render posts
    container.innerHTML = postsToShow.map(post => {
      const dateStr = new Date(post.createdAt).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      const authorName = post.author_name || post.author_email || 'Author';
      const doc = new DOMParser().parseFromString(post.content, 'text/html');
      const textContent = doc.body.textContent || "";
      const snippet = textContent.length > 120 ? textContent.substring(0, 120) + "..." : textContent;

      const badgeText = post.category || (post.isFallback ? 'Guide' : 'Community Article');

      return `
        <article class="testimonial-card" style="font-style: normal; gap: 1rem; align-items: stretch; justify-content: space-between; border-radius: 0.75rem; border: 1px solid var(--border-color); background: var(--bg-card); padding: 1.25rem;">
          <div>
            <span style="font-size: 0.75rem; color: var(--accent-secondary); font-weight: 700; text-transform: uppercase;">${escapeHTML(badgeText)}</span>
            <h3 style="margin-top: 0.5rem; margin-bottom: 0.75rem; font-size: 1.15rem; font-weight: 700; color: var(--text-primary); line-height: 1.4;">${escapeHTML(post.title)}</h3>
            <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; font-style: normal; margin-bottom: 0;">${escapeHTML(snippet)}</p>
          </div>
          <div class="testimonial-user" style="margin-top: 1.25rem; display: flex; align-items: center; gap: 0.75rem;">
            <div class="blog-post-author-avatar-wrapper" style="width: 2.2rem; height: 2.2rem; min-width: 2.2rem; border-radius: 50%; overflow: hidden; background: var(--bg-secondary); border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center;">
              ${post.isFallback ? `<div style="font-weight: 700; color: var(--accent-primary); font-size: 0.85rem;">${escapeHTML(authorName.substring(0, 2).toUpperCase())}</div>` : getAvatarHtml(post.author_pic, "100%", "18%")}
            </div>
            <div class="user-info-text">
              <h4 style="font-size: 0.85rem; margin: 0; font-weight: 600; color: var(--text-primary);">${escapeHTML(authorName)}</h4>
              <p style="font-size: 0.7rem; margin: 0; color: var(--text-muted);">${dateStr}</p>
            </div>
          </div>
        </article>
      `;
    }).join('');

  } catch (err) {
    console.error(err);
  }
}

function populateToolLandingDetails(tool, meta) {
  const extra = getExtraContentForTool(tool);

  document.getElementById('edu-tool-category').textContent = extra.category;

  const iconWrapper = document.getElementById('edu-tool-icon');
  if (iconWrapper) {
    iconWrapper.textContent = extra.icon;
  }

  document.getElementById('edu-tool-title').textContent = meta.title;
  document.getElementById('edu-tool-desc').textContent = meta.desc;

  const badgesContainer = document.getElementById('edu-badges-container');
  if (badgesContainer) {
    badgesContainer.innerHTML = extra.badges.map(b => `<span class="edu-badge">${escapeHTML(b)}</span>`).join('');
  }

  document.getElementById('edu-info-input').textContent = extra.input;
  document.getElementById('edu-info-engine').textContent = extra.engine;
  document.getElementById('edu-info-output').textContent = extra.output;

  const flowContainer = document.getElementById('edu-flow-container');
  if (flowContainer) {
    flowContainer.innerHTML = extra.flow.map((step, idx) => `
      <div class="edu-flow-step">
        <span class="edu-flow-step-num">${idx + 1}</span>
        <span>${escapeHTML(step)}</span>
      </div>
    `).join('');
  }

  let relatedList = extra.related || ['merge', 'split', 'compress'];
  relatedList = relatedList.filter(id => id !== tool).slice(0, 3);
  const relatedGrid = document.getElementById('related-tools-grid');
  if (relatedGrid) {
    relatedGrid.innerHTML = relatedList.map(id => {
      const tMeta = TOOL_META[id];
      if (!tMeta) return '';
      const tExtra = getExtraContentForTool(id);
      const tIcon = tExtra.icon || '🛠️';
      return `
        <div class="related-tool-card" onclick="navigateToTool('${id}')">
          <div class="related-tool-icon">${tIcon}</div>
          <div class="related-tool-info">
            <span class="related-tool-title">${tMeta.title}</span>
            <span class="related-tool-desc">${tMeta.desc.substring(0, 55)}...</span>
          </div>
        </div>
      `;
    }).join('');
  }

  document.getElementById('detail-about-title').textContent = `About ${meta.title}`;
  document.getElementById('detail-about-text').textContent = extra.about;

  const featuresList = document.getElementById('detail-features-list');
  if (featuresList) {
    featuresList.innerHTML = extra.features.map(f => `<li>${escapeHTML(f)}</li>`).join('');
  }

  const usersList = document.getElementById('detail-users-list');
  if (usersList) {
    usersList.innerHTML = extra.whoUses.map(u => `<li>${escapeHTML(u)}</li>`).join('');
  }

  document.getElementById('detail-steps-title').textContent = `How to Use ${meta.title}`;
  const stepsTimeline = document.getElementById('detail-steps-timeline');
  if (stepsTimeline) {
    stepsTimeline.innerHTML = extra.steps.map(s => `
      <div class="stepper-node">
        <span class="stepper-node-title">${escapeHTML(s.title)}</span>
        <span class="stepper-node-desc">${escapeHTML(s.desc)}</span>
      </div>
    `).join('');
  }

  const faqAccordion = document.getElementById('tool-faq-accordion');
  if (faqAccordion) {
    faqAccordion.innerHTML = extra.faqs.map((f, index) => {
      return `
        <div class="faq-item">
          <button class="faq-trigger" type="button" onclick="toggleToolFaq(${index})">
            <span>${escapeHTML(f.q)}</span>
            <span class="faq-icon" id="tool-faq-icon-${index}">+</span>
          </button>
          <div class="faq-panel" id="tool-faq-panel-${index}" style="max-height: 0px; overflow: hidden; transition: max-height 0.3s ease-out;">
            <p style="padding: 1.25rem; margin: 0; font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; border-top: 1px solid var(--border-color);">${escapeHTML(f.a)}</p>
          </div>
        </div>
      `;
    }).join('');
  }

  loadToolLandingBlogs();

  if (meta.noUpload) {
    setWorkspaceState('operations');
  } else {
    setWorkspaceState('upload');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Retrieve persisted theme and update UI
  const savedTheme = safeStorage.getItem('pdfbundles_theme') || 'light';
  updateThemeUI(savedTheme === 'dark');

  window.navigateToTool = navigateToTool;
  window.navigateToBlog = navigateToBlog;
  setupEventListeners();
  setupSignaturePad();
  await checkAuthSession();
  setupAuthEventListeners();
  setupBlogEventListeners();
  await loadFeaturedLandingBlogs();

  // Process query parameters for Stripe payment success redirects
  const urlParams = new URLSearchParams(window.location.search);

  // Handle auto-launching a tool or tab from URL parameters
  const launchTool = urlParams.get('tool');
  if (launchTool) {
    navigateToTool(launchTool);
  }

  const launchTab = urlParams.get('tab');
  if (launchTab === 'blog') {
    navigateToBlog();
  } else if (launchTab === 'profile' || launchTab === 'billing' || launchTab === 'teams') {
    navigateToAccountDashboard(launchTab);
  }

  if (urlParams.get('contact') === 'true') {
    const salesOverlay = document.getElementById('contact-sales-overlay');
    if (salesOverlay) salesOverlay.classList.add('active');
  } else if (urlParams.get('upgrade') === 'true' || urlParams.get('pricing') === 'true') {
    showAuthModal('upgrade');
  }

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
      } else if (paymentStatus === 'newsletter-success') {
        showToast('Thank you for subscribing to our newsletter! Your subscription is active.', 'success');
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

function openCRMDrawer() {
  const crmDrawer = document.querySelector('.account-sidebar');
  const overlay = document.getElementById('crm-drawer-overlay');
  if (crmDrawer) {
    crmDrawer.classList.add('active');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeCRMDrawer() {
  const crmDrawer = document.querySelector('.account-sidebar');
  const overlay = document.getElementById('crm-drawer-overlay');
  if (crmDrawer) {
    crmDrawer.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
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

function updatePricingDisplay() {
  const isYearly = pricingInterval === 'year';
  const price = isYearly ? 4 : 7;
  const periodText = isYearly ? '/ user / month (billed yearly)' : '/ user / month';

  // Update landing page
  const landPrice = document.getElementById('landing-premium-price');
  const landPeriod = document.getElementById('landing-premium-period');
  const landToggle = document.getElementById('landing-pricing-toggle');
  const landInput = document.getElementById('input-landing-seats');

  if (landPrice) landPrice.textContent = `$${price}`;
  if (landPeriod) landPeriod.textContent = periodText;
  if (landToggle) landToggle.checked = isYearly;
  if (landInput) landInput.value = pricingSeats;

  // Toggle labels highlights for landing
  const landLblMonthly = document.getElementById('landing-toggle-label-monthly');
  const landLblYearly = document.getElementById('landing-toggle-label-yearly');
  if (landLblMonthly && landLblYearly) {
    if (isYearly) {
      landLblMonthly.classList.remove('active');
      landLblMonthly.style.color = 'var(--text-muted)';
      landLblYearly.classList.add('active');
      landLblYearly.style.color = 'var(--text-primary)';
    } else {
      landLblMonthly.classList.add('active');
      landLblMonthly.style.color = 'var(--text-primary)';
      landLblYearly.classList.remove('active');
      landLblYearly.style.color = 'var(--text-muted)';
    }
  }

  // Update upgrade modal
  const modalPrice = document.getElementById('modal-premium-price');
  const modalPeriod = document.getElementById('modal-premium-period');
  const modalToggle = document.getElementById('modal-pricing-toggle');
  const modalInput = document.getElementById('input-modal-seats');

  if (modalPrice) modalPrice.textContent = `$${price}`;
  if (modalPeriod) modalPeriod.textContent = periodText;
  if (modalToggle) modalToggle.checked = isYearly;
  if (modalInput) modalInput.value = pricingSeats;

  const modalLblMonthly = document.getElementById('modal-toggle-label-monthly');
  const modalLblYearly = document.getElementById('modal-toggle-label-yearly');
  if (modalLblMonthly && modalLblYearly) {
    if (isYearly) {
      modalLblMonthly.classList.remove('active');
      modalLblMonthly.style.color = 'var(--text-muted)';
      modalLblYearly.classList.add('active');
      modalLblYearly.style.color = 'var(--text-primary)';
    } else {
      modalLblMonthly.classList.add('active');
      modalLblMonthly.style.color = 'var(--text-primary)';
      modalLblYearly.classList.remove('active');
      modalLblYearly.style.color = 'var(--text-muted)';
    }
  }

  // Update CRM dashboard
  const crmPrice = document.getElementById('crm-premium-price');
  const crmPeriod = document.getElementById('crm-premium-period');
  const crmToggle = document.getElementById('crm-pricing-toggle');
  const crmInput = document.getElementById('input-crm-seats');

  if (crmPrice) crmPrice.textContent = `$${price}`;
  if (crmPeriod) crmPeriod.textContent = periodText;
  if (crmToggle) crmToggle.checked = isYearly;
  if (crmInput) crmInput.value = pricingSeats;

  const crmLblMonthly = document.getElementById('crm-toggle-label-monthly');
  const crmLblYearly = document.getElementById('crm-toggle-label-yearly');
  if (crmLblMonthly && crmLblYearly) {
    if (isYearly) {
      crmLblMonthly.classList.remove('active');
      crmLblMonthly.style.color = 'var(--text-muted)';
      crmLblYearly.classList.add('active');
      crmLblYearly.style.color = 'var(--text-primary)';
    } else {
      crmLblMonthly.classList.add('active');
      crmLblMonthly.style.color = 'var(--text-primary)';
      crmLblYearly.classList.remove('active');
      crmLblYearly.style.color = 'var(--text-muted)';
    }
  }
}

function initializePricingListeners() {
  // Interval Toggles
  const landToggle = document.getElementById('landing-pricing-toggle');
  if (landToggle) {
    landToggle.addEventListener('change', (e) => {
      pricingInterval = e.target.checked ? 'year' : 'month';
      updatePricingDisplay();
    });
  }
  const modalToggle = document.getElementById('modal-pricing-toggle');
  if (modalToggle) {
    modalToggle.addEventListener('change', (e) => {
      pricingInterval = e.target.checked ? 'year' : 'month';
      updatePricingDisplay();
    });
  }

  // Filesize per task Dropdown Toggle
  const headerFilesize = document.getElementById('category-filesize-header');
  const arrowFilesize = document.getElementById('category-filesize-arrow');
  if (headerFilesize && arrowFilesize) {
    headerFilesize.addEventListener('click', () => {
      const rows = document.querySelectorAll('.category-filesize-row');
      const isCollapsed = arrowFilesize.style.transform === 'rotate(0deg)' || arrowFilesize.style.transform === '';
      if (isCollapsed) {
        rows.forEach(r => r.style.display = 'table-row');
        arrowFilesize.style.transform = 'rotate(90deg)';
      } else {
        rows.forEach(r => r.style.display = 'none');
        arrowFilesize.style.transform = 'rotate(0deg)';
      }
    });
  }

  // Standard PDF Tools Dropdown Toggle
  const headerTools = document.getElementById('category-tools-header');
  const arrowTools = document.getElementById('category-tools-arrow');
  if (headerTools && arrowTools) {
    headerTools.addEventListener('click', () => {
      const rows = document.querySelectorAll('.category-tools-row');
      const isCollapsed = arrowTools.style.transform === 'rotate(0deg)' || arrowTools.style.transform === '';
      if (isCollapsed) {
        // Expand
        rows.forEach(r => r.style.display = 'table-row');
        arrowTools.style.transform = 'rotate(90deg)';
      } else {
        // Collapse
        rows.forEach(r => r.style.display = 'none');
        arrowTools.style.transform = 'rotate(0deg)';
      }
    });
  }

  // Batch Processing Dropdown Toggle
  const headerBatch = document.getElementById('category-batch-header');
  const arrowBatch = document.getElementById('category-batch-arrow');
  if (headerBatch && arrowBatch) {
    headerBatch.addEventListener('click', () => {
      const rows = document.querySelectorAll('.category-batch-row');
      const isCollapsed = arrowBatch.style.transform === 'rotate(0deg)' || arrowBatch.style.transform === '';
      if (isCollapsed) {
        rows.forEach(r => r.style.display = 'table-row');
        arrowBatch.style.transform = 'rotate(90deg)';
      } else {
        rows.forEach(r => r.style.display = 'none');
        arrowBatch.style.transform = 'rotate(0deg)';
      }
    });
  }

  // AI PDF Features Dropdown Toggle
  const headerAI = document.getElementById('category-ai-header');
  const arrowAI = document.getElementById('category-ai-arrow');
  if (headerAI && arrowAI) {
    headerAI.addEventListener('click', () => {
      const rows = document.querySelectorAll('.category-ai-row');
      const isCollapsed = arrowAI.style.transform === 'rotate(0deg)' || arrowAI.style.transform === '';
      if (isCollapsed) {
        rows.forEach(r => r.style.display = 'table-row');
        arrowAI.style.transform = 'rotate(90deg)';
      } else {
        rows.forEach(r => r.style.display = 'none');
        arrowAI.style.transform = 'rotate(0deg)';
      }
    });
  }

  // Business & Support Dropdown Toggle
  const headerBusiness = document.getElementById('category-business-header');
  const arrowBusiness = document.getElementById('category-business-arrow');
  if (headerBusiness && arrowBusiness) {
    headerBusiness.addEventListener('click', () => {
      const rows = document.querySelectorAll('.category-business-row');
      const isCollapsed = arrowBusiness.style.transform === 'rotate(0deg)' || arrowBusiness.style.transform === '';
      if (isCollapsed) {
        rows.forEach(r => r.style.display = 'table-row');
        arrowBusiness.style.transform = 'rotate(90deg)';
      } else {
        rows.forEach(r => r.style.display = 'none');
        arrowBusiness.style.transform = 'rotate(0deg)';
      }
    });
  }

  const crmToggle = document.getElementById('crm-pricing-toggle');
  if (crmToggle) {
    crmToggle.addEventListener('change', (e) => {
      pricingInterval = e.target.checked ? 'year' : 'month';
      updatePricingDisplay();
    });
  }

  // Seat control helper
  const adjustSeats = (amount) => {
    pricingSeats = Math.min(25, Math.max(1, pricingSeats + amount));
    updatePricingDisplay();
  };

  // Seat controls binding
  ['landing', 'modal', 'crm'].forEach(prefix => {
    const btnMinus = document.getElementById(`btn-${prefix}-seats-minus`);
    const btnPlus = document.getElementById(`btn-${prefix}-seats-plus`);
    if (btnMinus) btnMinus.addEventListener('click', () => adjustSeats(-1));
    if (btnPlus) btnPlus.addEventListener('click', () => adjustSeats(1));
  });

  // Contact Sales buttons binding
  ['btn-landing-business', 'btn-modal-business', 'btn-crm-business'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Hide auth modal overlay if open
        const settingsModal = document.getElementById('auth-modal-overlay');
        const upgradeModal = document.getElementById('upgrade-modal');
        if (upgradeModal && settingsModal) {
          settingsModal.classList.remove('active');
          upgradeModal.style.display = 'none';
        }
        
        // Ensure we navigate back to the main landing page first
        navigateToDashboard();
        
        // Scroll smoothly to the contact section at the bottom of the landing page
        const contactSec = document.getElementById('landing-contact-section');
        if (contactSec) {
          contactSec.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  });

  // Handle Landing Page Contact Sales form submission (SMTP-driven + Database-backed)
  const landingContactForm = document.getElementById('landing-contact-sales-form');
  if (landingContactForm) {
    landingContactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const firstName = document.getElementById('landing-sales-first-name').value.trim();
      const lastName = document.getElementById('landing-sales-last-name').value.trim();
      const companyName = document.getElementById('landing-sales-company').value.trim();
      const businessEmail = document.getElementById('landing-sales-email').value.trim();
      const message = document.getElementById('landing-sales-message').value.trim();

      try {
        const res = await fetch('/api/contact-sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firstName, lastName, companyName, businessEmail, message })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to submit inquiry');
        
        showToast(data.message || 'Thank you! Your inquiry was sent successfully.', 'success');
        landingContactForm.reset();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Initial call to sync display states
  updatePricingDisplay();
}

// function setupEventListeners() {
//   const dropzone = document.getElementById('dropzone');
//   const fileInput = document.getElementById('file-input-element');
//   const logoLink = document.getElementById('logo-link');
//   if (logoLink) {
//     logoLink.addEventListener('click', (e) => {
//       if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
//         return; // Let standard link redirect
//       }
//       e.preventDefault();
//       navigateToDashboard();
//     });
//   }

//   const backToDash = document.getElementById('btn-back-to-dashboard');
//   if (backToDash) backToDash.addEventListener('click', navigateToDashboard);

//   // AI Assistant Mode Selection Change Listener
//   const aiModeSelect = document.getElementById('ai-assistant-mode-select');
//   if (aiModeSelect) {
//     aiModeSelect.addEventListener('change', (e) => {
//       const mode = e.target.value;
//       // Hide all mode-specific panels
//       document.querySelectorAll('.ai-mode-panel').forEach(panel => {
//         panel.style.display = 'none';
//       });
//       // Show selected panel
//       if (mode === 'summarize') {
//         document.getElementById('ai-mode-description-summarize').style.display = 'block';
//       } else if (mode === 'notes') {
//         document.getElementById('ai-mode-description-notes').style.display = 'block';
//       } else if (mode === 'chat') {
//         document.getElementById('ai-mode-input-chat').style.display = 'block';
//       } else if (mode === 'translate') {
//         document.getElementById('ai-mode-input-translate').style.display = 'block';
//       }
//     });
//   }

//   // Dashboard routing cards
//   document.querySelectorAll('.tool-card').forEach(card => {
//     card.addEventListener('click', () => {
//       navigateToTool(card.dataset.tool);
//     });
//   });

//   // Popular Tools click routing
//   document.querySelectorAll('.pop-tool-card').forEach(card => {
//     card.addEventListener('click', () => {
//       navigateToTool(card.dataset.tool);
//     });
//   });

//   // Hero action buttons (launch feature modal)
//   const showHeroFeatureModal = () => {
//     const overlay = document.getElementById('hero-feature-overlay');
//     if (overlay) overlay.classList.add('active');
//   };
//   const hideHeroFeatureModal = () => {
//     const overlay = document.getElementById('hero-feature-overlay');
//     if (overlay) overlay.classList.remove('active');
//   };

//   const btnHeroUpload = document.getElementById('btn-hero-upload');
//   if (btnHeroUpload) {
//     btnHeroUpload.addEventListener('click', showHeroFeatureModal);
//   }
//   const btnCloseHeroFeature = document.getElementById('btn-close-hero-feature');
//   if (btnCloseHeroFeature) {
//     btnCloseHeroFeature.addEventListener('click', hideHeroFeatureModal);
//   }

//   document.querySelectorAll('.hero-feature-btn').forEach(btn => {
//     btn.addEventListener('click', () => {
//       const selectedTool = btn.dataset.tool;
//       hideHeroFeatureModal();
//       navigateToTool(selectedTool);
//       setTimeout(() => {
//         const fileInput = document.getElementById('file-input-element');
//         if (fileInput) fileInput.click();
//       }, 50);
//     });
//   });

//   const scrollExplore = (e) => {
//     e.preventDefault();
//     navigateToDashboard();
//     document.querySelector('.all-tools-header').scrollIntoView({ behavior: 'smooth' });
//   };
//   const heroExplore = document.getElementById('btn-hero-explore');
//   if (heroExplore) heroExplore.addEventListener('click', scrollExplore);

//   const popViewAll = document.getElementById('btn-popular-view-all');
//   if (popViewAll) popViewAll.addEventListener('click', scrollExplore);

//   // AI assistant CTA
//   const tryAi = document.getElementById('btn-try-ai-assistant');
//   if (tryAi) {
//     tryAi.addEventListener('click', () => {
//       navigateToTool('ai-assistant');
//     });
//   }

//   // Header Nav Menu & Mega Menu Hover Logic
//   // Header Nav Menu & Mega Menu Hover Logic
//   const allToolsBtn = document.getElementById('nav-link-all-tools');
//   const aiToolsBtn = document.getElementById('nav-link-ai-tools');
//   const megaMenu = document.getElementById('desktop-mega-menu');
//   const aiToolsMenu = document.getElementById('desktop-ai-tools-menu');
//   let menuTimeout;

//   const showMenu = (menu) => {
//     clearTimeout(menuTimeout);
//     if (menu === megaMenu) {
//       if (aiToolsMenu) aiToolsMenu.classList.remove('active');
//     } else {
//       if (megaMenu) megaMenu.classList.remove('active');
//     }
//     if (menu) menu.classList.add('active');
//   };

//   const hideMenu = (menu) => {
//     menuTimeout = setTimeout(() => {
//       if (menu) menu.classList.remove('active');
//     }, 150);
//   };

//   if (allToolsBtn && megaMenu) {
//     allToolsBtn.addEventListener('mouseenter', () => showMenu(megaMenu));
//     allToolsBtn.addEventListener('mouseleave', () => hideMenu(megaMenu));
//     allToolsBtn.addEventListener('click', scrollExplore);
//     megaMenu.addEventListener('mouseenter', () => showMenu(megaMenu));
//     megaMenu.addEventListener('mouseleave', () => hideMenu(megaMenu));
//   }

//   if (aiToolsBtn && aiToolsMenu) {
//     aiToolsBtn.addEventListener('mouseenter', () => showMenu(aiToolsMenu));
//     aiToolsBtn.addEventListener('mouseleave', () => hideMenu(aiToolsMenu));
//     aiToolsBtn.addEventListener('click', (e) => {
//       if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
//         return; // Native redirect
//       }
//       e.preventDefault();
//       navigateToDashboard();
//       const aiCard = document.querySelector('.ai-assistant-side-card');
//       if (aiCard) aiCard.scrollIntoView({ behavior: 'smooth' });
//     });
//     aiToolsMenu.addEventListener('mouseenter', () => showMenu(aiToolsMenu));
//     aiToolsMenu.addEventListener('mouseleave', () => hideMenu(aiToolsMenu));
//   }

//   // Mega menu click routing
//   document.querySelectorAll('.mega-menu-item').forEach(item => {
//     item.addEventListener('click', (e) => {
//       if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
//         return; // Native redirect
//       }
//       e.preventDefault();
//       navigateToTool(item.dataset.tool);
//       if (megaMenu) megaMenu.classList.remove('active');
//     });
//   });

//   // AI Tools menu click routing
//   if (aiToolsMenu) {
//     aiToolsMenu.querySelectorAll('.ai-tool-card-link').forEach(item => {
//       item.addEventListener('click', (e) => {
//         if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
//           return; // Native redirect
//         }
//         e.preventDefault();
//         navigateToTool(item.dataset.tool);
//         aiToolsMenu.classList.remove('active');
//       });
//     });
//   }

//   // Mobile tools drawer toggle
//   const toolsDrawer = document.getElementById('mobile-tools-drawer');
//   const openToolsBtn = document.getElementById('btn-open-tools-drawer');
//   const closeToolsBtn = document.getElementById('btn-close-tools-drawer');

//   if (openToolsBtn) {
//     openToolsBtn.addEventListener('click', (e) => {
//       e.preventDefault();
//       openToolsDrawer();
//     });
//   }

//   const crmTriggerBtn = document.getElementById('btn-trigger-crm');
//   if (crmTriggerBtn) {
//     crmTriggerBtn.addEventListener('click', (e) => {
//       e.preventDefault();
//       openCRMDrawer();
//     });
//   }

//   const floatingCrmHandle = document.getElementById('btn-floating-crm-handle');
//   if (floatingCrmHandle) {
//     floatingCrmHandle.addEventListener('click', (e) => {
//       e.preventDefault();
//       const accDash = document.getElementById('account-dashboard-page');
//       if (accDash && accDash.style.display === 'block') {
//         openCRMDrawer();
//       } else {
//         if (currentUser) {
//           navigateToAccountDashboard('profile');
//           setTimeout(() => openCRMDrawer(), 100);
//         } else {
//           showAuthModal('login');
//         }
//       }
//     });
//   }
//   if (closeToolsBtn) closeToolsBtn.addEventListener('click', closeToolsDrawer);
//   if (toolsDrawer) {
//     toolsDrawer.addEventListener('click', (e) => {
//       if (e.target === toolsDrawer) closeToolsDrawer();
//     });
//   }

//   // Mobile tools drawer click routing
//   document.querySelectorAll('.drawer-tool-item').forEach(item => {
//     item.addEventListener('click', (e) => {
//       if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
//         return; // Native redirect
//       }
//       e.preventDefault();
//       navigateToTool(item.dataset.tool);
//       closeToolsDrawer();
//     });
//   });

//   // Mobile auth drawer toggle
//   const authDrawer = document.getElementById('mobile-auth-drawer');
//   const openAuthBtn = document.getElementById('btn-open-auth-drawer');
//   const closeAuthBtn = document.getElementById('btn-close-auth-drawer');

//   if (openAuthBtn) {
//     openAuthBtn.addEventListener('click', (e) => {
//       e.preventDefault();
//       e.stopPropagation(); // Stop immediate click-outside closing

//       if (currentUser) {
//         if (window.innerWidth > 768) {
//           // Desktop: Toggle profile dropdown
//           const dropdown = document.getElementById('profile-dropdown');
//           if (dropdown) {
//             const isVisible = dropdown.style.display === 'flex';
//             dropdown.style.display = isVisible ? 'none' : 'flex';
//           }
//         } else {
//           // Mobile: Open settings drawer
//           openAuthDrawer();
//         }
//       } else {
//         // Logged out: Open login/signup drawer
//         openAuthDrawer();
//       }
//     });
//   }
//   if (closeAuthBtn) closeAuthBtn.addEventListener('click', closeAuthDrawer);
//   if (authDrawer) {
//     authDrawer.addEventListener('click', (e) => {
//       if (e.target === authDrawer) closeAuthDrawer();
//     });
//   }

//   // Mobile auth drawer links click handling
//   const mobLinkFeatures = document.getElementById('mob-link-features');
//   if (mobLinkFeatures) {
//     mobLinkFeatures.addEventListener('click', (e) => {
//       e.preventDefault();
//       closeAuthDrawer();
//       navigateToDashboard();
//       document.querySelector('.premium-stats-grid').scrollIntoView({ behavior: 'smooth' });
//     });
//   }

//   const mobLinkAbout = document.getElementById('mob-link-about');
//   if (mobLinkAbout) {
//     mobLinkAbout.addEventListener('click', (e) => {
//       e.preventDefault();
//       closeAuthDrawer();
//       showToast('PixelPDF - Developed by Advanced Agentic Coding team.', 'info');
//     });
//   }

//   const mobLinkHelp = document.getElementById('mob-link-help');
//   if (mobLinkHelp) {
//     mobLinkHelp.addEventListener('click', (e) => {
//       e.preventDefault();
//       closeAuthDrawer();
//       showToast('Need help? Contact support at support@pixelpdf.com', 'info');
//     });
//   }

//   const mobLinkLanguage = document.getElementById('mob-link-language');
//   if (mobLinkLanguage) {
//     mobLinkLanguage.addEventListener('click', (e) => {
//       e.preventDefault();
//       closeAuthDrawer();
//       showToast('English language selected.', 'info');
//     });
//   }

//   const navPricing = document.getElementById('nav-link-pricing');
//   if (navPricing) {
//     navPricing.addEventListener('click', (e) => {
//       e.preventDefault();
//       showAuthModal('upgrade');
//     });
//   }
//   const navBlog = document.getElementById('nav-link-blog');
//   if (navBlog) {
//     navBlog.addEventListener('click', (e) => {
//       if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
//         return; // Let standard link redirect
//       }
//       e.preventDefault();
//       navigateToBlog();
//     });
//   }

//   // Dark/Night Mode Toggle
//   const toggleDark = document.getElementById('btn-toggle-dark');
//   if (toggleDark) {
//     toggleDark.addEventListener('click', () => {
//       const isDarkNow = !document.body.classList.contains('dark-theme');
//       updateThemeUI(isDarkNow);
//       safeStorage.setItem('pixelpdf_theme', isDarkNow ? 'dark' : 'light');
//       showToast(isDarkNow ? 'Night mode enabled!' : 'Light mode enabled!', 'info');
//     });
//   }

//   // Upload drops
//   if (dropzone && fileInput) {
//     dropzone.addEventListener('click', () => fileInput.click());

//     dropzone.addEventListener('dragover', (e) => {
//       e.preventDefault();
//       dropzone.classList.add('dragover');
//     });

//     dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

//     dropzone.addEventListener('drop', (e) => {
//       e.preventDefault();
//       dropzone.classList.remove('dragover');
//       if (e.dataTransfer.files.length > 0) handleFilesSelected(e.dataTransfer.files);
//     });

//     fileInput.addEventListener('change', (e) => {
//       if (e.target.files.length > 0) handleFilesSelected(e.target.files);
//     });
//   }

//   const btnClearWorkspace = document.getElementById('btn-clear-workspace');
//   if (btnClearWorkspace) btnClearWorkspace.addEventListener('click', clearWorkspace);

//   const btnProcessAction = document.getElementById('btn-process-action');
//   if (btnProcessAction) btnProcessAction.addEventListener('click', processFiles);

//   const btnSelectAll = document.getElementById('btn-select-all-pages');
//   if (btnSelectAll) {
//     btnSelectAll.addEventListener('click', () => {
//       pagePreviews.forEach((_, idx) => selectedPages.add(idx));
//       renderPreviewsGrid();
//       updateProcessButtonState();
//     });
//   }

//   const btnDeselectAll = document.getElementById('btn-deselect-all-pages');
//   if (btnDeselectAll) {
//     btnDeselectAll.addEventListener('click', () => {
//       selectedPages.clear();
//       renderPreviewsGrid();
//       updateProcessButtonState();
//     });
//   }

//   // Reorder buttons & Remove
//   const filesList = document.getElementById('files-list');
//   if (filesList) {
//     filesList.addEventListener('click', (e) => {
//       const removeBtn = e.target.closest('.btn-remove-file');
//       const upBtn = e.target.closest('.btn-reorder-up');
//       const downBtn = e.target.closest('.btn-reorder-down');

//       if (removeBtn) {
//         const idx = parseInt(removeBtn.dataset.index, 10);
//         uploadedFiles.splice(idx, 1);
//         renderFilesList();
//         updateProcessButtonState();
//         if (uploadedFiles.length === 0) hideOperationsArea();
//       }

//       if (upBtn) {
//         const idx = parseInt(upBtn.dataset.index, 10);
//         if (idx > 0) {
//           const temp = uploadedFiles[idx];
//           uploadedFiles[idx] = uploadedFiles[idx - 1];
//           uploadedFiles[idx - 1] = temp;
//           renderFilesList();
//         }
//       }

//       if (downBtn) {
//         const idx = parseInt(downBtn.dataset.index, 10);
//         if (idx < uploadedFiles.length - 1) {
//           const temp = uploadedFiles[idx];
//           uploadedFiles[idx] = uploadedFiles[idx + 1];
//           uploadedFiles[idx + 1] = temp;
//           renderFilesList();
//         }
//       }
//     });
//   }

//   // Web camera snap trigger
//   const btnWebcamSnap = document.getElementById('btn-webcam-snap');
//   if (btnWebcamSnap) btnWebcamSnap.addEventListener('click', captureWebcamSnapshot);

//   const btnWebcamToggle = document.getElementById('btn-webcam-toggle');
//   if (btnWebcamToggle) btnWebcamToggle.addEventListener('click', stopWebcamStream);

//   // Watermark parameters slide displays
//   const wText = document.getElementById('watermark-text');
//   const wSize = document.getElementById('watermark-size');
//   const wRot = document.getElementById('watermark-rotation');
//   const wOpac = document.getElementById('watermark-opacity');

//   if (wSize) wSize.addEventListener('input', (e) => { const el = document.getElementById('watermark-size-val'); if (el) el.textContent = e.target.value; });
//   if (wRot) wRot.addEventListener('input', (e) => { const el = document.getElementById('watermark-rotation-val'); if (el) el.textContent = e.target.value; });
//   if (wOpac) wOpac.addEventListener('input', (e) => { const el = document.getElementById('watermark-opacity-val'); if (el) el.textContent = e.target.value; });

//   // HTML conversion controls toggle
//   const htmlInputType = document.getElementById('html-input-type');
//   if (htmlInputType) {
//     htmlInputType.addEventListener('change', (e) => {
//       const codeGrp = document.getElementById('html-code-group');
//       const urlGrp = document.getElementById('html-url-group');
//       if (e.target.value === 'url') {
//         if (codeGrp) codeGrp.style.display = 'none';
//         if (urlGrp) urlGrp.style.display = 'flex';
//       } else {
//         if (codeGrp) codeGrp.style.display = 'flex';
//         if (urlGrp) urlGrp.style.display = 'none';
//       }
//       updateProcessButtonState();
//     });
//   }

//   const htmlText = document.getElementById('html-textarea');
//   if (htmlText) htmlText.addEventListener('input', updateProcessButtonState);

//   const htmlUrl = document.getElementById('html-url-input');
//   if (htmlUrl) htmlUrl.addEventListener('input', updateProcessButtonState);

//   const pdfPass = document.getElementById('pdf-password-input');
//   if (pdfPass) pdfPass.addEventListener('input', updateProcessButtonState);

//   const pdfUnlockPass = document.getElementById('pdf-unlock-password');
//   if (pdfUnlockPass) pdfUnlockPass.addEventListener('input', updateProcessButtonState);

//   const copyAiResult = document.getElementById('btn-copy-ai-result');
//   if (copyAiResult) {
//     copyAiResult.addEventListener('click', () => {
//       const contentEl = document.getElementById('ai-results-content');
//       const text = contentEl ? contentEl.textContent : '';
//       if (text) {
//         navigator.clipboard.writeText(text);
//         showToast('AI content copied to clipboard!', 'success');
//       }
//     });
//   }

//   // Category tabs filtering
//   document.querySelectorAll('.category-tab').forEach(tab => {
//     tab.addEventListener('click', () => {
//       document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
//       tab.classList.add('active');
//       const cat = tab.dataset.category;
//       filterCategoryColumns(cat);
//     });
//   });

//   // Footer navigation & tool links
//   document.querySelectorAll('.footer-tool-link').forEach(link => {
//     link.addEventListener('click', (e) => {
//       e.preventDefault();
//       navigateToTool(link.dataset.tool);
//       window.scrollTo({ top: 0, behavior: 'smooth' });
//     });
//   });

//   const footerLogo = document.getElementById('footer-logo-link');
//   if (footerLogo) {
//     footerLogo.addEventListener('click', (e) => {
//       e.preventDefault();
//       navigateToDashboard();
//       window.scrollTo({ top: 0, behavior: 'smooth' });
//     });
//   }

//   const footerBlog = document.getElementById('footer-link-blog');
//   if (footerBlog) {
//     footerBlog.addEventListener('click', (e) => {
//       e.preventDefault();
//       navigateToBlog();
//       window.scrollTo({ top: 0, behavior: 'smooth' });
//     });
//   }

//   const footerPricing = document.getElementById('footer-link-pricing');
//   if (footerPricing) {
//     footerPricing.addEventListener('click', (e) => {
//       e.preventDefault();
//       showAuthModal('upgrade');
//     });
//   }

//   const footerSettings = document.getElementById('footer-link-settings');
//   if (footerSettings) {
//     footerSettings.addEventListener('click', (e) => {
//       e.preventDefault();
//       if (currentUser) {
//         navigateToAccountDashboard('profile');
//       } else {
//         showToast('Please login or sign up first to access account settings.', 'info');
//         showAuthModal('login');
//       }
//     });
//   }

//   // Role Tabs click switching
//   document.querySelectorAll('.role-tab').forEach(tab => {
//     tab.addEventListener('click', (e) => {
//       e.preventDefault();
//       document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
//       document.querySelectorAll('.role-tab-content').forEach(c => c.classList.remove('active'));

//       tab.classList.add('active');
//       const target = document.getElementById(`tab-${tab.dataset.tab}`);
//       if (target) target.classList.add('active');
//     });
//   });

//   // Pricing landing buttons action triggers
//   const btnLandingFree = document.getElementById('btn-landing-free');
//   if (btnLandingFree) {
//     btnLandingFree.addEventListener('click', (e) => {
//       e.preventDefault();
//       const allToolsHeader = document.querySelector('.all-tools-header');
//       if (allToolsHeader) {
//         allToolsHeader.scrollIntoView({ behavior: 'smooth' });
//       }
//     });
//   }

//   const btnLandingPremium = document.getElementById('btn-landing-premium');
//   if (btnLandingPremium) {
//     btnLandingPremium.addEventListener('click', (e) => {
//       e.preventDefault();
//       showAuthModal('upgrade');
//     });
//   }

//   const btnLandingTeam = document.getElementById('btn-landing-team');
//   if (btnLandingTeam) {
//     btnLandingTeam.addEventListener('click', (e) => {
//       e.preventDefault();
//       showAuthModal('upgrade');
//     });
//   }

//   const btnLandingBlogAll = document.getElementById('btn-landing-blog-all');
//   if (btnLandingBlogAll) {
//     btnLandingBlogAll.addEventListener('click', (e) => {
//       e.preventDefault();
//       navigateToBlog();
//       window.scrollTo({ top: 0, behavior: 'smooth' });
//     });
//   }

//   // FAQ Accordion Triggers
//   document.querySelectorAll('.faq-trigger').forEach(trigger => {
//     trigger.addEventListener('click', (e) => {
//       e.preventDefault();
//       const item = trigger.closest('.faq-item');
//       const panel = item.querySelector('.faq-panel');
//       const isActive = item.classList.contains('active');

//       // Close all other panels
//       document.querySelectorAll('.faq-item').forEach(i => {
//         i.classList.remove('active');
//         const p = i.querySelector('.faq-panel');
//         if (p) p.style.maxHeight = null;
//       });

//       if (!isActive) {
//         item.classList.add('active');
//         panel.style.maxHeight = panel.scrollHeight + 'px';
//       }
//     });
//   });

//   const newsletterForm = document.getElementById('newsletter-form');
//   if (newsletterForm) {
//     newsletterForm.addEventListener('submit', async (e) => {
//       e.preventDefault();
//       const emailInput = document.getElementById('newsletter-email');
//       const email = emailInput ? emailInput.value.trim() : '';
//       if (email) {
//         showToast('Redirecting to Stripe checkout...', 'info');
//         try {
//           const res = await fetch('/api/stripe/newsletter-checkout', {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({ email })
//           });
//           const data = await res.json();
//           if (!res.ok) {
//             throw new Error(data.error || 'Failed to initialize newsletter checkout');
//           }
//           if (data.url) {
//             window.location.href = data.url;
//           } else {
//             throw new Error('Checkout URL not received');
//           }
//         } catch (err) {
//           console.error(err);
//           showToast(err.message || 'Newsletter checkout failed.', 'error');
//         }
//       }
//     });
//   }

//   const eduBackBtn = document.getElementById('edu-back-btn');
//   if (eduBackBtn) {
//     eduBackBtn.addEventListener('click', navigateToDashboard);
//   }

//   const btnDownloadResult = document.getElementById('btn-download-result');
//   if (btnDownloadResult) {
//     btnDownloadResult.addEventListener('click', () => {
//       if (lastProcessedFile) {
//         triggerFileDownload(lastProcessedFile.bytes, lastProcessedFile.filename, lastProcessedFile.mimeType);
//         showToast('Download started!', 'success');
//       } else {
//         showToast('No processed file found.', 'error');
//       }
//     });
//   }

//   const btnStartAnother = document.getElementById('btn-start-another');
//   if (btnStartAnother) {
//     btnStartAnother.addEventListener('click', () => {
//       clearWorkspace();
//     });
//   }

//   initializePricingListeners();
//   setupCRMDashboardEventListeners();
//   setupCardMouseEffect();
// }

// Draw Pen Setup

function setupEventListeners() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input-element');
  const logoLink = document.getElementById('logo-link');
  
  if (logoLink) {
    logoLink.addEventListener('click', (e) => {
      if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
        return; // Let standard link redirect
      }
      e.preventDefault();
      navigateToDashboard();
    });
  }

  const backToDash = document.getElementById('btn-back-to-dashboard');
  if (backToDash) backToDash.addEventListener('click', navigateToDashboard);

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
        const fInput = document.getElementById('file-input-element');
        if (fInput) fInput.click();
      }, 50);
    });
  });

  const scrollExplore = (e) => {
    e.preventDefault();
    navigateToDashboard();
    const allToolsHeader = document.querySelector('.all-tools-header');
    if (allToolsHeader) allToolsHeader.scrollIntoView({ behavior: 'smooth' });
  };
  const heroExplore = document.getElementById('btn-hero-explore');
  if (heroExplore) heroExplore.addEventListener('click', scrollExplore);

  const popViewAll = document.getElementById('btn-popular-view-all');
  if (popViewAll) popViewAll.addEventListener('click', scrollExplore);

  // AI assistant CTA
  const tryAi = document.getElementById('btn-try-ai-assistant');
  if (tryAi) {
    tryAi.addEventListener('click', () => {
      navigateToTool('ai-assistant');
    });
  }

  // Header Nav Menu & Mega Menu Hover Logic
  const allToolsBtn = document.getElementById('nav-link-all-tools');
  const aiToolsBtn = document.getElementById('nav-link-ai-tools');
  const featuresDropdownBtn = document.getElementById('nav-link-features-dropdown');
  const megaMenu = document.getElementById('desktop-mega-menu');
  const aiToolsMenu = document.getElementById('desktop-ai-tools-menu');
  const featuresDropdownMenu = document.getElementById('desktop-features-menu');
  let menuTimeout;

  const showMenu = (menu) => {
    clearTimeout(menuTimeout);
    if (menu === megaMenu) {
      if (aiToolsMenu) aiToolsMenu.classList.remove('active');
      if (featuresDropdownMenu) featuresDropdownMenu.classList.remove('active');
    } else if (menu === aiToolsMenu) {
      if (megaMenu) megaMenu.classList.remove('active');
      if (featuresDropdownMenu) featuresDropdownMenu.classList.remove('active');
    } else {
      if (megaMenu) megaMenu.classList.remove('active');
      if (aiToolsMenu) aiToolsMenu.classList.remove('active');
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
      if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
        return; // Native redirect
      }
      e.preventDefault();
      navigateToDashboard();
      const aiCard = document.querySelector('.ai-assistant-side-card');
      if (aiCard) aiCard.scrollIntoView({ behavior: 'smooth' });
    });
    aiToolsMenu.addEventListener('mouseenter', () => showMenu(aiToolsMenu));
    aiToolsMenu.addEventListener('mouseleave', () => hideMenu(aiToolsMenu));
  }

  if (featuresDropdownBtn && featuresDropdownMenu) {
    featuresDropdownBtn.addEventListener('mouseenter', () => showMenu(featuresDropdownMenu));
    featuresDropdownBtn.addEventListener('mouseleave', () => hideMenu(featuresDropdownMenu));
    featuresDropdownMenu.addEventListener('mouseenter', () => showMenu(featuresDropdownMenu));
    featuresDropdownMenu.addEventListener('mouseleave', () => hideMenu(featuresDropdownMenu));
  }

  // Mega menu click routing
  document.querySelectorAll('.mega-menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
        return; // Native redirect
      }
      e.preventDefault();
      navigateToTool(item.dataset.tool);
      if (megaMenu) megaMenu.classList.remove('active');
    });
  });

  // AI Tools menu click routing
  if (aiToolsMenu) {
    aiToolsMenu.querySelectorAll('.ai-tool-card-link').forEach(item => {
      item.addEventListener('click', (e) => {
        if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
          return; // Native redirect
        }
        e.preventDefault();
        navigateToTool(item.dataset.tool);
        aiToolsMenu.classList.remove('active');
      });
    });
  }

  // Mobile tools drawer toggle
  const toolsDrawer = document.getElementById('mobile-tools-drawer');
  const openToolsBtn = document.getElementById('btn-open-tools-drawer');
  const closeToolsBtn = document.getElementById('btn-close-tools-drawer');

  if (openToolsBtn) {
    openToolsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openToolsDrawer();
    });
  }

  const crmTriggerBtn = document.getElementById('btn-trigger-crm');
  if (crmTriggerBtn) {
    crmTriggerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openCRMDrawer();
    });
  }

  const floatingCrmHandle = document.getElementById('btn-floating-crm-handle');
  if (floatingCrmHandle) {
    floatingCrmHandle.addEventListener('click', (e) => {
      e.preventDefault();
      const accDash = document.getElementById('account-dashboard-page');
      if (accDash && accDash.style.display === 'block') {
        openCRMDrawer();
      } else {
        if (currentUser) {
          navigateToAccountDashboard('profile');
          setTimeout(() => openCRMDrawer(), 100);
        } else {
          showAuthModal('login');
        }
      }
    });
  }
  if (closeToolsBtn) closeToolsBtn.addEventListener('click', closeToolsDrawer);
  if (toolsDrawer) {
    toolsDrawer.addEventListener('click', (e) => {
      if (e.target === toolsDrawer) closeToolsDrawer();
    });
  }

  // Mobile tools drawer click routing
  document.querySelectorAll('.drawer-tool-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
        return; // Native redirect
      }
      e.preventDefault();
      navigateToTool(item.dataset.tool);
      closeToolsDrawer();
    });
  });

  // Mobile auth drawer toggle
  const authDrawer = document.getElementById('mobile-auth-drawer');
  const openAuthBtn = document.getElementById('btn-open-auth-drawer');
  const closeAuthBtn = document.getElementById('btn-close-auth-drawer');

  if (openAuthBtn) {
    openAuthBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation(); // Stop immediate click-outside closing

      if (currentUser) {
        if (window.innerWidth > 768) {
          // Desktop: Toggle profile dropdown
          const dropdown = document.getElementById('profile-dropdown');
          if (dropdown) {
            const isVisible = dropdown.style.display === 'flex';
            dropdown.style.display = isVisible ? 'none' : 'flex';
          }
        } else {
          // Mobile: Open settings drawer
          openAuthDrawer();
        }
      } else {
        // Logged out: Open login/signup drawer
        openAuthDrawer();
      }
    });
  }
  if (closeAuthBtn) closeAuthBtn.addEventListener('click', closeAuthDrawer);
  if (authDrawer) {
    authDrawer.addEventListener('click', (e) => {
      if (e.target === authDrawer) closeAuthDrawer();
    });
  }

  // Routing listeners for new Info/SEO Pages
  const bindInfoPageLinks = () => {
    // Desktop dropdown
    document.querySelectorAll('.features-dropdown-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        if (featuresDropdownMenu) featuresDropdownMenu.classList.remove('active');
        navigateToInfoPage(link.getAttribute('data-page'));
      });
    });

    // Mobile drawer
    document.querySelectorAll('.mob-info-page-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        closeAuthDrawer();
        navigateToInfoPage(link.getAttribute('data-page'));
      });
    });

    // Footer links
    document.querySelectorAll('.footer-info-page-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        navigateToInfoPage(link.getAttribute('data-page'));
      });
    });

    // Sidebar navigation
    document.querySelectorAll('.info-nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        navigateToInfoPage(link.getAttribute('data-page'));
      });
    });
  };
  bindInfoPageLinks();

  const navPricing = document.getElementById('nav-link-pricing');
  if (navPricing) {
    navPricing.addEventListener('click', (e) => {
      e.preventDefault();
      showAuthModal('upgrade');
    });
  }
  const navBlog = document.getElementById('nav-link-blog');
  if (navBlog) {
    navBlog.addEventListener('click', (e) => {
      if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
        return; // Let standard link redirect
      }
      e.preventDefault();
      navigateToBlog();
    });
  }

  // Dark/Night Mode Toggle
  const toggleDark = document.getElementById('btn-toggle-dark');
  if (toggleDark) {
    toggleDark.addEventListener('click', () => {
      const isDarkNow = !document.body.classList.contains('dark-theme');
      updateThemeUI(isDarkNow);
      safeStorage.setItem('pdfbundles_theme', isDarkNow ? 'dark' : 'light');
      showToast(isDarkNow ? 'Night mode enabled!' : 'Light mode enabled!', 'info');
    });
  }

  // Upload drops - WRAPPED IN A SAFE CHECK
  if (dropzone && fileInput) {
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
  }

  const btnClearWorkspace = document.getElementById('btn-clear-workspace');
  if (btnClearWorkspace) btnClearWorkspace.addEventListener('click', clearWorkspace);

  const btnProcessAction = document.getElementById('btn-process-action');
  if (btnProcessAction) btnProcessAction.addEventListener('click', processFiles);

  const btnSelectAll = document.getElementById('btn-select-all-pages');
  if (btnSelectAll) {
    btnSelectAll.addEventListener('click', () => {
      pagePreviews.forEach((_, idx) => selectedPages.add(idx));
      renderPreviewsGrid();
      updateProcessButtonState();
    });
  }

  const btnDeselectAll = document.getElementById('btn-deselect-all-pages');
  if (btnDeselectAll) {
    btnDeselectAll.addEventListener('click', () => {
      selectedPages.clear();
      renderPreviewsGrid();
      updateProcessButtonState();
    });
  }

  // Reorder buttons & Remove - WRAPPED IN A SAFE CHECK
  const filesList = document.getElementById('files-list');
  if (filesList) {
    filesList.addEventListener('click', (e) => {
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
  }

  // Web camera snap trigger
  const btnWebcamSnap = document.getElementById('btn-webcam-snap');
  if (btnWebcamSnap) btnWebcamSnap.addEventListener('click', captureWebcamSnapshot);

  const btnWebcamToggle = document.getElementById('btn-webcam-toggle');
  if (btnWebcamToggle) btnWebcamToggle.addEventListener('click', stopWebcamStream);

  // Watermark parameters slide displays
  const wSize = document.getElementById('watermark-size');
  const wRot = document.getElementById('watermark-rotation');
  const wOpac = document.getElementById('watermark-opacity');

  if (wSize) wSize.addEventListener('input', (e) => { const el = document.getElementById('watermark-size-val'); if (el) el.textContent = e.target.value; });
  if (wRot) wRot.addEventListener('input', (e) => { const el = document.getElementById('watermark-rotation-val'); if (el) el.textContent = e.target.value; });
  if (wOpac) wOpac.addEventListener('input', (e) => { const el = document.getElementById('watermark-opacity-val'); if (el) el.textContent = e.target.value; });

  // HTML conversion controls toggle
  const htmlInputType = document.getElementById('html-input-type');
  if (htmlInputType) {
    htmlInputType.addEventListener('change', (e) => {
      const codeGrp = document.getElementById('html-code-group');
      const urlGrp = document.getElementById('html-url-group');
      if (e.target.value === 'url') {
        if (codeGrp) codeGrp.style.display = 'none';
        if (urlGrp) urlGrp.style.display = 'flex';
      } else {
        if (codeGrp) codeGrp.style.display = 'flex';
        if (urlGrp) urlGrp.style.display = 'none';
      }
      updateProcessButtonState();
    });
  }

  const htmlText = document.getElementById('html-textarea');
  if (htmlText) htmlText.addEventListener('input', updateProcessButtonState);

  const htmlUrl = document.getElementById('html-url-input');
  if (htmlUrl) htmlUrl.addEventListener('input', updateProcessButtonState);

  const pdfPass = document.getElementById('pdf-password-input');
  if (pdfPass) pdfPass.addEventListener('input', updateProcessButtonState);

  const pdfUnlockPass = document.getElementById('pdf-unlock-password');
  if (pdfUnlockPass) pdfUnlockPass.addEventListener('input', updateProcessButtonState);

  const copyAiResult = document.getElementById('btn-copy-ai-result');
  if (copyAiResult) {
    copyAiResult.addEventListener('click', () => {
      const contentEl = document.getElementById('ai-results-content');
      const text = contentEl ? contentEl.textContent : '';
      if (text) {
        navigator.clipboard.writeText(text);
        showToast('AI content copied to clipboard!', 'success');
      }
    });
  }

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
        navigateToAccountDashboard('profile');
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
    newsletterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('newsletter-email');
      const email = emailInput ? emailInput.value.trim() : '';
      if (email) {
        showToast('Redirecting to Stripe checkout...', 'info');
        try {
          const res = await fetch('/api/stripe/newsletter-checkout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Failed to initialize newsletter checkout');
          }
          if (data.url) {
            window.location.href = data.url;
          } else {
            throw new Error('Checkout URL not received');
          }
        } catch (err) {
          console.error(err);
          showToast(err.message || 'Newsletter checkout failed.', 'error');
        }
      }
    });
  }

  const eduBackBtn = document.getElementById('edu-back-btn');
  if (eduBackBtn) {
    eduBackBtn.addEventListener('click', navigateToDashboard);
  }

  const btnDownloadResult = document.getElementById('btn-download-result');
  if (btnDownloadResult) {
    btnDownloadResult.addEventListener('click', () => {
      if (lastProcessedFile) {
        triggerFileDownload(lastProcessedFile.bytes, lastProcessedFile.filename, lastProcessedFile.mimeType);
        showToast('Download started!', 'success');
      } else {
        showToast('No processed file found.', 'error');
      }
    });
  }

  const btnStartAnother = document.getElementById('btn-start-another');
  if (btnStartAnother) {
    btnStartAnother.addEventListener('click', () => {
      clearWorkspace();
    });
  }

  initializePricingListeners();
  setupCRMDashboardEventListeners();
  setupCardMouseEffect();
}


function setupSignaturePad() {
  const canvas = document.getElementById('signature-pad');
  if (!canvas) return;
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

  const accDash = document.getElementById('account-dashboard-page');
  if (accDash) accDash.style.display = 'none';

  document.getElementById('workspace-page').style.display = 'block';
  document.getElementById('btn-back-to-dashboard').style.display = 'flex';

  toggleSettingsPanels(tool);

  // Populate landing page details (breadcrumbs, content grids, FAQs, blogs)
  populateToolLandingDetails(tool, meta);

  // Custom camera initialization
  if (tool === 'scan-to-pdf') {
    startWebcamStream();
  }
  updateHeaderTriggers();
  window.scrollTo(0, 0);
}

function navigateToDashboard() {
  currentTool = null;
  stopWebcamStream();
  clearWorkspace();
  const workPage = document.getElementById('workspace-page');
  if (workPage) workPage.style.display = 'none';
  const blogPage = document.getElementById('blog-page');
  if (blogPage) blogPage.style.display = 'none';

  const accDash = document.getElementById('account-dashboard-page');
  if (accDash) accDash.style.display = 'none';

  const backBtn = document.getElementById('btn-back-to-dashboard');
  if (backBtn) backBtn.style.display = 'none';

  const dashPage = document.getElementById('dashboard-page');
  if (dashPage) dashPage.style.display = 'block';

  // Reset category tabs to "All Tools"
  document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
  const allTab = document.querySelector('.category-tab[data-category="all"]');
  if (allTab) allTab.classList.add('active');
  filterCategoryColumns('all');
  updateHeaderTriggers();
}

/* ==========================================
   CRM ACCOUNTS DASHBOARD NAVIGATION LOGIC
   ========================================== */
function navigateToAccountDashboard(tabName = 'profile') {
  if (!currentUser) {
    showToast('Please log in to access your accounts dashboard.', 'info');
    showAuthModal('login');
    return;
  }

  currentTool = null;
  stopWebcamStream();
  clearWorkspace();

  const workPage = document.getElementById('workspace-page');
  if (workPage) workPage.style.display = 'none';

  const dashPage = document.getElementById('dashboard-page');
  if (dashPage) dashPage.style.display = 'none';

  const blogPage = document.getElementById('blog-page');
  if (blogPage) blogPage.style.display = 'none';

  const pricingPage = document.getElementById('pricing-page');
  if (pricingPage) pricingPage.style.display = 'none';

  const accDash = document.getElementById('account-dashboard-page');
  if (accDash) accDash.style.display = 'block';

  const backBtn = document.getElementById('btn-back-to-dashboard');
  if (backBtn) backBtn.style.display = 'flex';

  // Populate sidebar profile info
  const nameLabel = document.getElementById('account-sidebar-name');
  if (nameLabel) {
    const userDisplayName = currentUser.display_name || `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.email;
    nameLabel.textContent = userDisplayName;
  }
  const badgeLabel = document.getElementById('account-sidebar-badge');
  if (badgeLabel) {
    const isPremium = currentUser.is_premium || currentUser.subscription_plan && currentUser.subscription_plan !== 'free';
    const planName = isPremium ? (currentUser.subscription_plan || 'Premium') : 'Free';
    badgeLabel.textContent = `${planName.charAt(0).toUpperCase() + planName.slice(1)} Plan`;
    badgeLabel.className = `profile-dropdown-plan-badge ${isPremium ? 'premium' : 'free'}`;
  }

  // Populate profile form inputs
  const settingsFirstName = document.getElementById('dashboard-settings-first-name');
  if (settingsFirstName) settingsFirstName.value = currentUser.first_name || '';
  const settingsLastName = document.getElementById('dashboard-settings-last-name');
  if (settingsLastName) settingsLastName.value = currentUser.last_name || '';

  const settingsEmail = document.getElementById('settings-email');
  if (settingsEmail) settingsEmail.value = currentUser.email || '';

  // Load and populate country and timezone from storage if available
  const countrySelect = document.getElementById('dashboard-settings-country');
  const timezoneInput = document.getElementById('dashboard-settings-timezone');
  if (countrySelect || timezoneInput) {
    const localProfile = safeStorage.getItem(`pdfbundles_profile_${currentUser.email}`);
    if (localProfile) {
      try {
        const parsed = JSON.parse(localProfile);
        if (countrySelect && parsed.country) countrySelect.value = parsed.country;
        if (timezoneInput && parsed.timezone) timezoneInput.value = parsed.timezone;
      } catch (e) {
        console.error(e);
      }
    } else {
      // Set defaults
      if (countrySelect) countrySelect.value = 'Pakistan';
      if (timezoneInput) timezoneInput.value = 'Asia/Karachi';
    }
  }

  // Populate connected social link email
  const crmSocialEmail = document.getElementById('crm-social-email');
  if (crmSocialEmail) {
    crmSocialEmail.textContent = currentUser.email;
  }

  // Refresh settings avatar wrapper
  document.querySelectorAll('.settings-avatar-wrapper').forEach(w => {
    w.innerHTML = getAvatarHtml(currentUser.profile_pic, "100%", "18%");
  });

  // Load business details from storage
  loadCRMBusinessDetails();

  // Handle Admin Control tab visibility
  const adminTab = document.getElementById('crm-sidebar-admin');
  if (adminTab) {
    if (currentUser.email === 'admin@pdfbundles.com') {
      adminTab.classList.remove('hidden-tab');
    } else {
      adminTab.classList.add('hidden-tab');
      if (tabName === 'admin') tabName = 'profile'; // fallback
    }
  }

  // Set the active tab
  switchAccountTab(tabName);
  updateHeaderTriggers();
}
window.navigateToAccountDashboard = navigateToAccountDashboard;

function switchAccountTab(tabName) {
  // Update sidebar links active class
  document.querySelectorAll('.account-sidebar-link').forEach(link => {
    if (link.getAttribute('data-tab') === tabName) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Update pane active class
  document.querySelectorAll('.account-tab-pane').forEach(pane => {
    if (pane.id === `pane-${tabName}`) {
      pane.classList.add('active');
      pane.style.display = 'block';
    } else {
      pane.classList.remove('active');
      pane.style.display = 'none';
    }
  });

  // Custom integrations when switching tab
  if (tabName === 'teams') {
    loadCRMTeamData();
  } else if (tabName === 'billing') {
    syncCRMBillingData();
  } else if (tabName === 'invoices') {
    renderCRMInvoices();
  } else if (tabName === 'admin') {
    loadCRMAdminInquiries();
  }
}
window.switchAccountTab = switchAccountTab;

async function loadCRMAdminInquiries() {
  const tbody = document.getElementById('admin-inquiries-tbody');
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">Fetching enterprise inquiries...</td>
    </tr>
  `;

  try {
    const res = await fetch('/api/admin/inquiries', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load inquiries');

    const inquiries = data.inquiries || [];
    if (inquiries.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">No inquiries received yet.</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = inquiries.map(inq => {
      const formattedDate = new Date(inq.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      return `
        <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-secondary);">
          <td style="padding: 1rem 0.75rem; font-weight: 600; color: var(--text-primary);">${inq.first_name} ${inq.last_name}</td>
          <td style="padding: 1rem 0.75rem;">${inq.company_name}</td>
          <td style="padding: 1rem 0.75rem;"><a href="mailto:${inq.business_email}" style="color: var(--accent-primary); text-decoration: none;">${inq.business_email}</a></td>
          <td style="padding: 1rem 0.75rem; max-width: 250px; white-space: pre-wrap; word-break: break-word;">${inq.message}</td>
          <td style="padding: 1rem 0.75rem; white-space: nowrap;">${formattedDate}</td>
          <td style="padding: 1rem 0.75rem; text-align: center;">
            <button onclick="deleteCRMInquiry(${inq.id})" class="btn-action" style="background: var(--accent-danger); border: none; padding: 0.35rem 0.75rem; font-size: 0.75rem; border-radius: 0.25rem; font-weight: 600; color: white; cursor: pointer;">
              Delete
            </button>
          </td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    console.error(err);
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem; color: var(--accent-danger); font-weight: 600;">${err.message}</td>
      </tr>
    `;
  }
}
window.loadCRMAdminInquiries = loadCRMAdminInquiries;

async function deleteCRMInquiry(id) {
  if (!confirm('Are you sure you want to permanently delete this sales inquiry?')) return;

  try {
    const res = await fetch(`/api/admin/inquiries/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete inquiry');

    showToast('Inquiry deleted successfully', 'success');
    loadCRMAdminInquiries();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
window.deleteCRMInquiry = deleteCRMInquiry;

async function loadCRMTeamData() {
  if (!token) return;

  try {
    const res = await fetch('/api/collaboration/list', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch team list');

    const inviteForm = document.getElementById('crm-team-invite-form');
    const seatUsage = document.getElementById('crm-team-seat-usage');
    const seatBar = document.getElementById('crm-team-seat-bar');
    const listContainer = document.getElementById('crm-team-members-list');

    if (!listContainer) return;

    if (!data.canCollaborate) {
      if (inviteForm) inviteForm.style.display = 'none';
      if (seatUsage) seatUsage.textContent = '1 / 1 seat (Only you)';
      if (seatBar) seatBar.style.width = '100%';

      const userEmail = currentUser ? currentUser.email : 'you';
      const userName = currentUser ? ((currentUser.first_name && currentUser.last_name) ? `${currentUser.first_name} ${currentUser.last_name}` : (currentUser.display_name || '')) : '';
      const displayLabel = userName ? `${userName} (${userEmail})` : userEmail;

      listContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: rgba(0,0,0,0.02); border: 1px solid var(--border-color); border-radius: 0.5rem; width: 100%;">
          <span style="font-size: 0.85rem; font-weight: 500; color: var(--text-primary);">${escapeHTML(displayLabel)}</span>
          <span style="font-size: 0.7rem; font-weight: 600; color: var(--text-secondary); background: rgba(0,0,0,0.05); padding: 0.15rem 0.4rem; border-radius: 4px;">Owner</span>
        </div>
        <div style="background: rgba(99, 102, 241, 0.06); border: 1px solid rgba(99, 102, 241, 0.15); border-radius: 0.75rem; padding: 1rem; text-align: center; margin-top: 0.5rem; width: 100%; box-sizing: border-box;">
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0 0 0.75rem 0;">
            Upgrade to a Base plan or higher to add team members and collaborate!
          </p>
          <button type="button" onclick="switchAccountTab('billing')" class="btn-action" style="padding: 0.5rem 1.25rem; font-size: 0.85rem; margin: 0 auto; display: block; border-radius: 0.5rem; width: auto;">
            Upgrade Now
          </button>
        </div>
      `;
    } else {
      if (inviteForm) inviteForm.style.display = 'flex';

      const percent = Math.min(100, Math.round((data.seatsUsed / data.maxSeats) * 100));
      if (seatUsage) seatUsage.textContent = `${data.seatsUsed} / ${data.maxSeats} used`;
      if (seatBar) seatBar.style.width = `${percent}%`;

      listContainer.innerHTML = '';
      if (data.collaborators.length === 0) {
        listContainer.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 2rem 0;">No team members invited yet.</p>`;
        return;
      }

      data.collaborators.forEach(c => {
        const row = document.createElement('div');
        row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 0.5rem; width: 100%; box-sizing: border-box;';
        row.innerHTML = `
          <span style="font-size: 0.85rem; font-weight: 500; color: var(--text-primary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 70%;">${escapeHTML(c.email)}</span>
          <button class="btn-remove-member-crm btn-nav-back" data-email="${c.email}" style="padding: 0.3rem 0.75rem; font-size: 0.75rem; color: var(--accent-danger); border-color: rgba(239, 68, 68, 0.2); background: rgba(239, 68, 68, 0.05); margin: 0;">Remove</button>
        `;
        listContainer.appendChild(row);
      });

      listContainer.querySelectorAll('.btn-remove-member-crm').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const email = e.currentTarget.getAttribute('data-email');
          if (confirm(`Are you sure you want to remove ${email} from your collaboration team?`)) {
            await removeTeamMemberCRM(email);
          }
        });
      });
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function removeTeamMemberCRM(email) {
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
    loadCRMTeamData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function syncCRMBillingData() {
  if (!currentUser) return;

  const isPremium = currentUser.is_premium || currentUser.subscription_plan && currentUser.subscription_plan !== 'free';
  const plan = currentUser.subscription_plan || 'free';

  const titleEl = document.getElementById('crm-billing-plan-title');
  const descEl = document.getElementById('crm-billing-plan-desc');
  const priceEl = document.getElementById('crm-billing-plan-price');
  const durationEl = document.getElementById('crm-billing-plan-duration');

  if (titleEl) {
    titleEl.textContent = `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`;
  }

  if (priceEl) {
    if (plan === 'premium') {
      const seatPrice = currentUser.subscription_interval === 'year' ? 48 : 7;
      const totalAmount = seatPrice * (currentUser.subscription_seats || 1);
      priceEl.textContent = `$${totalAmount}`;
      if (durationEl) {
        durationEl.textContent = `for ${currentUser.subscription_seats || 1} seat${(currentUser.subscription_seats || 1) > 1 ? 's' : ''} / ${currentUser.subscription_interval === 'year' ? 'year' : 'month'}`;
      }
      if (descEl) {
        descEl.textContent = `Your team workspace has access to all Premium PDF tools, OCR, and AI document assistant features.`;
      }
    } else if (plan === 'business') {
      priceEl.textContent = 'Custom';
      if (durationEl) durationEl.textContent = 'Customized Enterprise Pricing';
      if (descEl) descEl.textContent = `SSO setup, dedicated account manager, and custom SLA parameters are active.`;
    } else if (plan === 'starter' || plan === 'base' || plan === 'pro' || plan === 'enterprise') {
      // Legacy compatibility
      const prices = { starter: '$9', base: '$29', pro: '$79', enterprise: '$199' };
      priceEl.textContent = prices[plan] || '$0';
      if (durationEl) durationEl.textContent = 'per month';
    } else {
      priceEl.textContent = '$0';
      if (durationEl) durationEl.textContent = 'Forever Free';
      if (descEl) descEl.textContent = `Upgrade below to add team members, expand file size limits, and access AI OCR tools.`;
    }
  }

  // Disable button for current plan
  document.querySelectorAll('.crm-btn-plan-choose').forEach(btn => {
    const btnPlan = btn.getAttribute('data-plan');
    if (!btnPlan) return;
    if (btnPlan === plan) {
      btn.textContent = 'Current Plan';
      btn.disabled = true;
      btn.style.opacity = '0.5';
    } else {
      btn.textContent = btnPlan === 'business' ? 'Contact Sales' : `Choose ${btnPlan.charAt(0).toUpperCase() + btnPlan.slice(1)}`;
      btn.disabled = false;
      btn.style.opacity = '1';
    }
  });
}

function renderCRMInvoices() {
  const container = document.getElementById('crm-invoices-list');
  if (!container) return;

  if (!currentUser || !currentUser.subscription_plan || currentUser.subscription_plan === 'free') {
    container.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem; font-size: 0.9rem;">
          No invoices found. Upgrade your subscription to see billing history.
        </td>
      </tr>
    `;
    return;
  }

  // User is on a paid plan! Generate invoices based on active plan and account registration date
  const plan = currentUser.subscription_plan;
  const planNames = {
    starter: 'Starter Plan',
    base: 'Base Plan',
    pro: 'Pro Plan',
    enterprise: 'Enterprise Plan'
  };
  const planPrices = {
    starter: '$9.00',
    base: '$29.00',
    pro: '$79.00',
    enterprise: '$199.00'
  };

  const planName = planNames[plan] || 'Premium Plan';
  const priceText = planPrices[plan] || '$9.00';

  // Calculate historical invoice months since creation
  const registrationDate = currentUser.createdAt ? new Date(currentUser.createdAt) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago fallback
  const now = new Date();

  let invoices = [];
  let tempDate = new Date(registrationDate.getFullYear(), registrationDate.getMonth(), 15);

  // Generate invoice for each month from registration date to today
  while (tempDate <= now) {
    const monthName = tempDate.toLocaleString('default', { month: 'short' });
    const year = tempDate.getFullYear();
    const day = tempDate.getDate();

    // Period is 1 month
    const nextMonthDate = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, day);
    const endMonthName = nextMonthDate.toLocaleString('default', { month: 'short' });
    const endYear = nextMonthDate.getFullYear();

    const invoiceId = `INV-${currentUser.id.substring(0, 4).toUpperCase()}-${year}-${(tempDate.getMonth() + 1).toString().padStart(2, '0')}`;
    const dateText = `${monthName} ${day}, ${year}`;
    const periodText = `${monthName} ${day} - ${endMonthName} ${day}, ${tempDate.getMonth() + 1 > 11 ? year + 1 : year}`;

    invoices.push({
      id: invoiceId,
      date: dateText,
      period: periodText,
      amount: priceText,
      plan: planName
    });

    // Move to next month
    tempDate.setMonth(tempDate.getMonth() + 1);
  }

  // Sort reverse chronological
  invoices.reverse();

  container.innerHTML = '';
  invoices.forEach(inv => {
    const tr = document.createElement('tr');
    tr.style.cssText = 'border-bottom: 1px solid var(--border-color); color: var(--text-secondary);';
    tr.innerHTML = `
      <td style="padding: 0.75rem 1rem; font-weight: 600; color: var(--text-primary);">${escapeHTML(inv.id)}</td>
      <td style="padding: 0.75rem 1rem; color: var(--text-secondary);">${escapeHTML(inv.date)}</td>
      <td style="padding: 0.75rem 1rem; color: var(--text-muted);">${escapeHTML(inv.period)}</td>
      <td style="padding: 0.75rem 1rem; font-weight: 600; color: var(--text-primary);">${escapeHTML(inv.amount)}</td>
      <td style="padding: 0.75rem 1rem;"><span style="font-size: 0.7rem; background: var(--accent-success); color: white; padding: 0.15rem 0.4rem; border-radius: 0.25rem; font-weight: 600;">Paid</span></td>
      <td style="padding: 0.75rem 1rem; text-align: right;">
        <button type="button" class="btn-download-inv-pdf btn-nav-back" 
                data-id="${inv.id}" data-date="${inv.date}" 
                data-period="${inv.period}" data-amount="${inv.amount}"
                style="padding: 0.35rem 0.75rem; font-size: 0.75rem; margin: 0;">
          Download PDF
        </button>
      </td>
    `;
    container.appendChild(tr);
  });

  // Attach event listeners for dynamic PDF downloads
  container.querySelectorAll('.btn-download-inv-pdf').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.getAttribute('data-id');
      const date = btn.getAttribute('data-date');
      const period = btn.getAttribute('data-period');
      const amount = btn.getAttribute('data-amount');
      downloadInvoicePDF(id, date, period, amount);
    });
  });
}

function updateCRMActivePricingCard() {
  const slider = document.getElementById('crm-pricing-seats-slider');
  if (!slider) return;
  const seats = parseInt(slider.value, 10);
  const seatsCount = document.getElementById('crm-pricing-seats-count');

  if (seatsCount) {
    if (seats >= 30) {
      seatsCount.textContent = '30+ users (Enterprise)';
    } else {
      seatsCount.textContent = `${seats} user${seats > 1 ? 's' : ''}`;
    }
  }

  const cards = document.querySelectorAll('.pricing-card-crm');
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

  const targetCard = document.getElementById(`crm-card-plan-${targetPlan}`);
  if (targetCard) {
    targetCard.classList.add('active-plan');
  }
}

function saveCRMBusinessDetails() {
  const companyName = document.getElementById('business-company-name').value;
  const taxId = document.getElementById('business-tax-id').value;
  const billingEmail = document.getElementById('business-billing-email').value;

  const address1 = document.getElementById('business-address-line1').value;
  const city = document.getElementById('business-city').value;
  const zip = document.getElementById('business-zip').value;
  const state = document.getElementById('business-state').value;
  const country = document.getElementById('business-country').value;

  const bizProfile = { companyName, taxId, billingEmail, address1, city, zip, state, country };
  safeStorage.setItem('pdfbundles_business_profile', JSON.stringify(bizProfile));
  showToast('Business profile and billing address saved successfully.', 'success');
}

function loadCRMBusinessDetails() {
  const data = safeStorage.getItem('pdfbundles_business_profile');
  if (!data) return;
  try {
    const biz = JSON.parse(data);
    if (document.getElementById('business-company-name')) {
      document.getElementById('business-company-name').value = biz.companyName || '';
      document.getElementById('business-tax-id').value = biz.taxId || '';
      document.getElementById('business-billing-email').value = biz.billingEmail || '';

      document.getElementById('business-address-line1').value = biz.address1 || '';
      document.getElementById('business-city').value = biz.city || '';
      document.getElementById('business-zip').value = biz.zip || '';
      document.getElementById('business-state').value = biz.state || '';
      document.getElementById('business-country').value = biz.country || '';
    }
  } catch (e) {
    console.error(e);
  }
}

function setupCRMDashboardEventListeners() {
  // Bind sidebar tabs
  document.querySelectorAll('.account-sidebar-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = e.currentTarget.getAttribute('data-tab');
      switchAccountTab(tab);
    });
  });

  // Bind seats range slider inside Billing tab
  const crmPricingSlider = document.getElementById('crm-pricing-seats-slider');
  if (crmPricingSlider) {
    crmPricingSlider.addEventListener('input', updateCRMActivePricingCard);
  }

  // Bind password change form
  const crmSecurityForm = document.getElementById('crm-security-password-form');
  if (crmSecurityForm) {
    crmSecurityForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const currentPassword = document.getElementById('security-current-password').value;
      const newPassword = document.getElementById('security-new-password').value;
      const confirmPassword = document.getElementById('security-confirm-password').value;

      if (newPassword !== confirmPassword) {
        showToast('New passwords do not match.', 'error');
        return;
      }

      try {
        const res = await fetch('/api/user/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ currentPassword, newPassword })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update password');

        showToast('Password updated successfully', 'success');
        crmSecurityForm.reset();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Bind team invite form
  const crmTeamInviteForm = document.getElementById('crm-team-invite-form');
  if (crmTeamInviteForm) {
    crmTeamInviteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('crm-team-invite-email');
      const email = emailInput.value.trim();
      if (!email) return;

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
        if (!res.ok) throw new Error(data.error || 'Failed to invite team member');

        showToast(data.message || 'Invitation sent successfully!', 'success');
        emailInput.value = '';
        loadCRMTeamData();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Bind corporate billing profile forms
  const crmBizForm = document.getElementById('crm-business-details-form');
  if (crmBizForm) {
    crmBizForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveCRMBusinessDetails();
    });
  }
  const crmAddrForm = document.getElementById('crm-business-address-form');
  if (crmAddrForm) {
    crmAddrForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveCRMBusinessDetails();
    });
  }

  // Bind Admin Control Center user edit form
  const crmAdminForm = document.getElementById('crm-admin-set-plan-form');
  const planSelect = document.getElementById('admin-target-plan');
  const customToolsContainer = document.getElementById('admin-custom-tools-container');
  if (planSelect && customToolsContainer) {
    planSelect.addEventListener('change', () => {
      if (planSelect.value === 'custom') {
        customToolsContainer.style.display = 'block';
      } else {
        customToolsContainer.style.display = 'none';
      }
    });
  }

  if (crmAdminForm) {
    crmAdminForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('admin-target-email').value.trim();
      const plan = planSelect ? planSelect.value : 'free';
      const role = document.getElementById('admin-target-role').value;
      const seats = parseInt(document.getElementById('admin-target-seats').value, 10) || 1;
      const interval = document.getElementById('admin-target-interval').value;
      const aiCredits = parseInt(document.getElementById('admin-target-ai-credits').value, 10) || 50;
      const checkedCheckboxes = Array.from(document.querySelectorAll('.admin-tool-checkbox:checked'));
      const allowedTools = checkedCheckboxes.map(cb => cb.value);

      const customFeatures = {
        ai_credits_limit: aiCredits,
        allowedTools: allowedTools
      };

      try {
        const res = await fetch('/api/admin/set-plan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ email, plan, seats, interval, customFeatures, role })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to apply admin settings');

        showToast(data.message || 'User configuration updated successfully!', 'success');
        crmAdminForm.reset();

        // Reset credits field
        document.getElementById('admin-target-ai-credits').value = 50;
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Close CRM drawer when close button or overlay is clicked
  const btnCloseCRM = document.getElementById('btn-close-crm-drawer');
  if (btnCloseCRM) {
    btnCloseCRM.addEventListener('click', closeCRMDrawer);
  }
  const crmOverlay = document.getElementById('crm-drawer-overlay');
  if (crmOverlay) {
    crmOverlay.addEventListener('click', closeCRMDrawer);
  }

  // Auto-close CRM drawer when links inside it are clicked
  document.querySelectorAll('.account-sidebar-link').forEach(link => {
    link.addEventListener('click', () => {
      closeCRMDrawer();
    });
  });

  // Change Email Action
  const btnChangeEmail = document.getElementById('btn-change-email');
  const settingsEmail = document.getElementById('settings-email');
  const settingsEmailLabel = document.getElementById('settings-email-label');
  if (btnChangeEmail && settingsEmail && settingsEmailLabel) {
    btnChangeEmail.addEventListener('click', async () => {
      const isEditing = btnChangeEmail.textContent === 'Save Change';
      if (!isEditing) {
        // Switch to edit mode
        settingsEmail.disabled = false;
        settingsEmail.readOnly = false;
        settingsEmail.style.background = 'var(--bg-secondary)';
        settingsEmail.style.cursor = 'text';
        settingsEmail.focus();
        settingsEmail.select();
        settingsEmailLabel.textContent = 'Enter your new email address';
        btnChangeEmail.textContent = 'Save Change';
        btnChangeEmail.className = 'btn-action';
        btnChangeEmail.style.background = 'var(--accent-success)';
        btnChangeEmail.style.color = 'white';
        btnChangeEmail.style.border = 'none';
      } else {
        // Save changes
        const newEmail = settingsEmail.value.trim();
        if (!newEmail) {
          showToast('Email address cannot be empty.', 'error');
          return;
        }

        if (newEmail === currentUser.email) {
          // No change, reset
          resetChangeEmailUI();
          return;
        }

        try {
          const res = await fetch('/api/auth/change-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ newEmail })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to change email');

          // Update local state
          safeStorage.setItem('token', data.token);
          token = data.token;
          currentUser = data.user;

          showToast('Email address updated successfully!', 'success');
          
          // Re-sync display elements
          updateAuthNav();
          const settingsEmail = document.getElementById('settings-email');
          if (settingsEmail) settingsEmail.value = currentUser.email;

          resetChangeEmailUI();
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    });

    function resetChangeEmailUI() {
      settingsEmail.disabled = true;
      settingsEmail.readOnly = true;
      settingsEmail.style.background = 'rgba(0,0,0,0.03)';
      settingsEmail.style.cursor = 'not-allowed';
      settingsEmailLabel.textContent = 'Current email address (Read-only)';
      btnChangeEmail.textContent = 'Change Request';
      btnChangeEmail.className = 'btn-nav-back';
      btnChangeEmail.style.background = '';
      btnChangeEmail.style.color = '';
      btnChangeEmail.style.border = '';
    }
  }

  // Handle header triggers for mobile accounts dashboard
  window.addEventListener('resize', updateHeaderTriggers);
  updateHeaderTriggers();

  // Wire Help Modal Controls
  const btnCloseHelp = document.getElementById('btn-close-help');
  const helpModalOverlay = document.getElementById('help-modal-overlay');
  if (btnCloseHelp && helpModalOverlay) {
    btnCloseHelp.addEventListener('click', () => {
      helpModalOverlay.style.display = 'none';
    });
    helpModalOverlay.addEventListener('click', (e) => {
      if (e.target === helpModalOverlay) {
        helpModalOverlay.style.display = 'none';
      }
    });
  }
  const btnHelpFaqScroll = document.getElementById('btn-help-faq-scroll');
  if (btnHelpFaqScroll) {
    btnHelpFaqScroll.addEventListener('click', () => {
      if (helpModalOverlay) helpModalOverlay.style.display = 'none';
      navigateToDashboard();
      const faqAccordion = document.getElementById('faq-accordion') || document.querySelector('.tool-details-container');
      if (faqAccordion) {
        faqAccordion.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Wire Language Modal Controls
  const btnCloseLanguageModal = document.getElementById('btn-close-language-modal');
  const languageModalOverlay = document.getElementById('language-modal-overlay');
  if (btnCloseLanguageModal && languageModalOverlay) {
    btnCloseLanguageModal.addEventListener('click', () => {
      languageModalOverlay.style.display = 'none';
    });
    languageModalOverlay.addEventListener('click', (e) => {
      if (e.target === languageModalOverlay) {
        languageModalOverlay.style.display = 'none';
      }
    });
  }

  // Bind Language selector buttons
  const langNames = {
    en: '🇬🇧 English',
    es: '🇪🇸 Español (Spanish)',
    fr: '🇫🇷 Français (French)',
    de: '🇩🇪 Deutsch (German)',
    zh: '🇨🇳 中文 (Chinese)'
  };
  document.querySelectorAll('.lang-select-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const selectedLang = btn.getAttribute('data-lang');
      if (!selectedLang) return;

      // Update checkmark visibilities
      document.querySelectorAll('.lang-select-btn').forEach(b => {
        const check = b.querySelector('.lang-check');
        if (b === btn) {
          b.style.border = '1.5px solid var(--accent-secondary)';
          b.style.background = 'rgba(99, 102, 241, 0.05)';
          b.style.fontWeight = '600';
          b.style.color = 'var(--text-primary)';
          if (check) check.style.display = 'inline';
        } else {
          b.style.border = '1.5px solid var(--border-color)';
          b.style.background = 'transparent';
          b.style.fontWeight = '500';
          b.style.color = 'var(--text-secondary)';
          if (check) check.style.display = 'none';
        }
      });

      // Update badge label in drawer
      const badge = document.getElementById('mob-lang-badge');
      if (badge) {
        badge.textContent = selectedLang.toUpperCase();
      }

      showToast(`Language changed to ${langNames[selectedLang] || selectedLang}`, 'success');

      if (languageModalOverlay) {
        languageModalOverlay.style.display = 'none';
      }
    });
  });
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

function getBatchLimit(tool, plan) {
  const isPremium = ['starter', 'base', 'pro', 'premium'].includes(plan);
  const isBusiness = plan === 'enterprise' || plan === 'business';
  const tier = isBusiness ? 'business' : (isPremium ? 'premium' : 'free');

  const limits = {
    merge: { free: 25, premium: 500, business: 500 },
    split: { free: 1, premium: 1, business: 1 },
    'extract-pages': { free: 1, premium: 1, business: 1 },
    'remove-pages': { free: 1, premium: 1, business: 1 },
    compress: { free: 2, premium: 10, business: 10 },
    'word-to-pdf': { free: 1, premium: 10, business: 10 },
    'ppt-to-pdf': { free: 1, premium: 10, business: 10 },
    'excel-to-pdf': { free: 1, premium: 10, business: 10 },
    'pdf-to-word': { free: 1, premium: 10, business: 10 },
    'pdf-to-ppt': { free: 1, premium: 10, business: 10 },
    'pdf-to-excel': { free: 1, premium: 10, business: 10 },
    ocr: { free: 1, premium: 10, business: 10 },
    'pdf-to-img': { free: 2, premium: 10, business: 10 },
    'img-to-pdf': { free: 20, premium: 80, business: 80 },
    'page-numbers': { free: 2, premium: 10, business: 10 },
    watermark: { free: 2, premium: 10, business: 10 },
    rotate: { free: 20, premium: 80, business: 80 },
    unlock: { free: 2, premium: 10, business: 10 },
    protect: { free: 2, premium: 80, business: 80 },
    'organize-pdf': { free: 5, premium: 20, business: 20 },
    repair: { free: 1, premium: 10, business: 10 },
    'edit-pdf': { free: 1, premium: 1, business: 1 },
    sign: { free: 3, premium: 5, business: 5 },
    redact: { free: 1, premium: 1, business: 1 },
    compare: { free: 2, premium: 2, business: 2 },
    'pdf-forms': { free: 1, premium: 1, business: 1 },
    crop: { free: 1, premium: 1, business: 1 },
    'ai-assistant': { free: 1, premium: 1, business: 1 },
    'remove-background': { free: 1, premium: 10, business: 10 },
    'upscale-image': { free: 1, premium: 10, business: 10 }
  };

  const toolLimits = limits[tool];
  if (!toolLimits) return 1;
  return toolLimits[tier] || 1;
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

  const userPlan = currentUser ? (currentUser.subscription_plan || 'free') : 'free';
  const batchLimit = getBatchLimit(currentTool, userPlan);
  const newTotalCount = (meta.multiple ? uploadedFiles.length : 0) + filtered.length;

  if (newTotalCount > batchLimit) {
    showToast(`Your current plan limits batch processing to maximum ${batchLimit} files for this tool. Please upgrade.`, 'error');
    if (!currentUser || currentUser.subscription_plan === 'free') {
      showAuthModal('upgrade');
    }
    return;
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

// Helper to calculate exact rendered bounds of contained image
function getContainedImageRect(img) {
  if (!img) return { width: 1, height: 1, left: 0, top: 0 };
  const containerWidth = img.clientWidth || img.width || 1;
  const containerHeight = img.clientHeight || img.height || 1;
  const naturalWidth = img.naturalWidth || containerWidth;
  const naturalHeight = img.naturalHeight || containerHeight;

  const containerRatio = containerWidth / containerHeight;
  const imageRatio = naturalWidth / naturalHeight;

  let renderedWidth = containerWidth;
  let renderedHeight = containerHeight;
  let offsetX = 0;
  let offsetY = 0;

  if (imageRatio > containerRatio) {
    // Width is the limiting factor (letterboxed vertically)
    renderedHeight = containerWidth / imageRatio;
    offsetY = (containerHeight - renderedHeight) / 2;
  } else {
    // Height is the limiting factor (pillarboxed horizontally)
    renderedWidth = containerHeight * imageRatio;
    offsetX = (containerWidth - renderedWidth) / 2;
  }

  return {
    width: renderedWidth,
    height: renderedHeight,
    left: offsetX,
    top: offsetY
  };
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

      const imgElement = wrapper.closest('.preview-thumbnail-wrapper').querySelector('img');
      const imgRect = getContainedImageRect(imgElement);
      const preview = pagePreviews[pageIndex] || { width: 595.28, height: 841.89 };
      const pdfWidth = preview.width || 595.28;
      const pdfHeight = preview.height || 841.89;

      const leftXRel = (x - 40) - imgRect.left;
      const topYRel = (y - 20) - imgRect.top;

      const stampX = (leftXRel / imgRect.width) * pdfWidth;
      const stampY = ((imgRect.height - (topYRel + 40)) / imgRect.height) * pdfHeight;

      signaturePlacement = {
        page: pageIndex,
        x: stampX,
        y: stampY,
        w: (80 / imgRect.width) * pdfWidth,
        h: (40 / imgRect.height) * pdfHeight
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
        const imgElement = overlay.closest('.preview-thumbnail-wrapper').querySelector('img');
        const imgRect = getContainedImageRect(imgElement);
        const preview = pagePreviews[pageIndex] || { width: 595.28, height: 841.89 };
        const pdfWidth = preview.width || 595.28;
        const pdfHeight = preview.height || 841.89;

        const leftXRel = leftX - imgRect.left;
        const topYRel = topY - imgRect.top;

        const ptX = (leftXRel / imgRect.width) * pdfWidth;
        const ptY = ((imgRect.height - (topYRel + h)) / imgRect.height) * pdfHeight;

        redactionBoxes.push({
          page: pageIndex,
          x: ptX,
          y: ptY,
          w: (w / imgRect.width) * pdfWidth,
          h: (h / imgRect.height) * pdfHeight
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

      const preview = pagePreviews[pageIndex] || { width: 595.28, height: 841.89 };
      const pdfWidth = preview.width || 595.28;
      const pdfHeight = preview.height || 841.89;

      const stamp = document.createElement('div');
      stamp.className = 'text-stamp-element';
      stamp.style.left = `${x}px`;
      stamp.style.top = `${y}px`;
      stamp.style.fontSize = `${fontSize * (rect.height / pdfHeight)}px`;
      stamp.textContent = text;
      stamp.title = 'Click to remove';

      stamp.addEventListener('click', (ev) => {
        ev.stopPropagation();
        stamp.remove();
        editTextBoxes = editTextBoxes.filter(box => box._element !== stamp);
        updateProcessButtonState();
      });

      wrapper.appendChild(stamp);

      const imgElement = wrapper.closest('.preview-thumbnail-wrapper').querySelector('img');
      const imgRect = getContainedImageRect(imgElement);

      const xRel = x - imgRect.left;
      const yRel = y - imgRect.top;

      const ptX = (xRel / imgRect.width) * pdfWidth;
      const ptY = ((imgRect.height - yRel) / imgRect.height) * pdfHeight;

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
  setWorkspaceState('operations');
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
  lastProcessedFile = null;

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
  setWorkspaceState('upload');
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
    const isMultiFileTool = ['merge', 'img-to-pdf', 'scan-to-pdf', 'compare'].includes(currentTool);
    if (uploadedFiles.length > 1 && !isMultiFileTool) {
      const totalFiles = uploadedFiles.length;
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < totalFiles; i++) {
        const currentFile = uploadedFiles[i];
        loadingTitle.textContent = `Batch Processing (${i + 1}/${totalFiles})`;
        loadingMessage.textContent = `Processing "${currentFile.name}"...`;

        try {
          let outputBytes = null;
          let filename = `pdfbundles-${currentTool}-${currentFile.name.replace(/\.[^/.]+$/, "")}.pdf`;
          let mimeType = 'application/pdf';

          switch (currentTool) {
            case 'split':
            case 'extract-pages':
              const splitMode = document.querySelector('input[name="split-mode"]:checked').value;
              if (splitMode === 'all-split') {
                const pages = await splitPDFIntoIndividual(currentFile);
                for (const page of pages) {
                  triggerFileDownload(page.bytes, `${currentFile.name.replace(/\.[^/.]+$/, "")}-page-${page.pageNum}.pdf`, 'application/pdf');
                  await new Promise(r => setTimeout(r, 100));
                }
              } else {
                const selected = Array.from(selectedPages).sort((a, b) => a - b);
                outputBytes = await splitPDF(currentFile, selected);
                filename = `${currentFile.name.replace(/\.[^/.]+$/, "")}-extracted.pdf`;
              }
              break;

            case 'remove-pages':
              const toRemove = Array.from(selectedPages).sort((a, b) => a - b);
              outputBytes = await removePages(currentFile, toRemove);
              filename = `${currentFile.name.replace(/\.[^/.]+$/, "")}-removed.pdf`;
              break;

            case 'organize-pdf':
              const order = pagePreviews.map((p) => parseInt(p.pageNum, 10) - 1);
              outputBytes = await organizePDF(currentFile, order);
              filename = `${currentFile.name.replace(/\.[^/.]+$/, "")}-organized.pdf`;
              break;

            case 'compress':
              const level = document.querySelector('input[name="compress-level"]:checked').value;
              outputBytes = await compressPDF(currentFile, level);
              filename = `${currentFile.name.replace(/\.[^/.]+$/, "")}-compressed.pdf`;
              break;

            case 'repair':
              outputBytes = await repairPDF(currentFile);
              filename = `${currentFile.name.replace(/\.[^/.]+$/, "")}-repaired.pdf`;
              break;

            case 'ocr':
              outputBytes = await ocrPDF(currentFile);
              filename = `${currentFile.name.replace(/\.[^/.]+$/, "")}-ocr.pdf`;
              break;

            case 'word-to-pdf':
            case 'ppt-to-pdf':
            case 'excel-to-pdf':
              outputBytes = await officeToPDF(currentFile);
              filename = `${currentFile.name.replace(/\.[^/.]+$/, "")}.pdf`;
              break;

            case 'pdf-to-img':
              const images = await pdfToImages(currentFile, (c, t) => {
                loadingMessage.textContent = `"${currentFile.name}": Converting page ${c} of ${t} to PNG...`;
              });
              for (const img of images) {
                const blob = await fetch(img.dataUrl).then(r => r.blob());
                triggerBlobDownload(blob, `${currentFile.name.replace(/\.[^/.]+$/, "")}-page-${img.pageNum}.png`);
                await new Promise(r => setTimeout(r, 100));
              }
              addCumulativeUploadSize(currentFile.size);
              break;

            case 'pdf-to-word':
            case 'pdf-to-ppt':
            case 'pdf-to-excel':
              const formatMap = { 'pdf-to-word': 'docx', 'pdf-to-excel': 'xlsx', 'pdf-to-ppt': 'pptx' };
              const blobFormat = formatMap[currentTool];
              const officeBlob = await pdfToOffice(currentFile, blobFormat);
              triggerBlobDownload(officeBlob, `${currentFile.name.replace(/\.[^/.]+$/, "")}.${blobFormat}`);
              addCumulativeUploadSize(currentFile.size);
              break;

            case 'rotate':
              outputBytes = await rotatePDF(currentFile, pageRotations);
              filename = `${currentFile.name.replace(/\.[^/.]+$/, "")}-rotated.pdf`;
              break;

            case 'page-numbers':
              const numPos = document.getElementById('pagenum-position').value;
              const numFmt = document.getElementById('pagenum-format').value;
              outputBytes = await addPageNumbers(currentFile, numPos, numFmt);
              filename = `${currentFile.name.replace(/\.[^/.]+$/, "")}-numbered.pdf`;
              break;

            case 'watermark':
              const wmText = document.getElementById('watermark-text').value;
              const wmSize = document.getElementById('watermark-size').value;
              const wmRot = document.getElementById('watermark-rotation').value;
              const wmOpac = document.getElementById('watermark-opacity').value;
              outputBytes = await addWatermark(currentFile, wmText, wmSize, wmRot, wmOpac);
              filename = `${currentFile.name.replace(/\.[^/.]+$/, "")}-watermarked.pdf`;
              break;

            case 'crop':
              const cropMargins = {
                left: parseFloat(document.getElementById('crop-left').value || '0.5'),
                right: parseFloat(document.getElementById('crop-right').value || '0.5'),
                top: parseFloat(document.getElementById('crop-top').value || '0.5'),
                bottom: parseFloat(document.getElementById('crop-bottom').value || '0.5')
              };
              outputBytes = await cropPDF(currentFile, cropMargins);
              filename = `${currentFile.name.replace(/\.[^/.]+$/, "")}-cropped.pdf`;
              break;

            case 'protect':
              const pass = document.getElementById('pdf-password-input').value;
              outputBytes = await protectPDF(currentFile, pass);
              filename = `${currentFile.name.replace(/\.[^/.]+$/, "")}-protected.pdf`;
              break;

            case 'unlock':
              const unlockPass = document.getElementById('pdf-unlock-password').value;
              outputBytes = await unlockPDF(currentFile, unlockPass);
              filename = `${currentFile.name.replace(/\.[^/.]+$/, "")}-unlocked.pdf`;
              break;

            case 'sign':
              outputBytes = await signPDF(
                currentFile,
                signatureDataUrl,
                signaturePlacement.page,
                signaturePlacement.x,
                signaturePlacement.y,
                signaturePlacement.w,
                signaturePlacement.h
              );
              filename = `${currentFile.name.replace(/\.[^/.]+$/, "")}-signed.pdf`;
              break;

            case 'remove-background':
              const bgBlob = await removeBG(currentFile);
              triggerBlobDownload(bgBlob, `${currentFile.name.replace(/\.[^/.]+$/, "")}-no-bg.png`);
              addCumulativeUploadSize(currentFile.size);
              break;

            case 'upscale-image':
              const upscaleBlob = await upscaleImage(currentFile);
              triggerBlobDownload(upscaleBlob, `${currentFile.name.replace(/\.[^/.]+$/, "")}-upscaled.png`);
              addCumulativeUploadSize(currentFile.size);
              break;
          }

          if (outputBytes) {
            triggerFileDownload(outputBytes, filename, mimeType);
            addCumulativeUploadSize(currentFile.size);
          }
          successCount++;
        } catch (err) {
          console.error(`Failed to process ${currentFile.name}:`, err);
          failCount++;
        }
        await new Promise(r => setTimeout(r, 300));
      }

      overlay.classList.remove('active');
      if (failCount === 0) {
        showToast(`Processed batch of ${successCount} files successfully!`, 'success');
        showSuccessView('Batch processed files');
      } else {
        showToast(`Batch completed: ${successCount} succeeded, ${failCount} failed.`, 'warning');
      }
      return;
    }

    let outputBytes = null;
    let filename = `pdfbundles-${currentTool}.pdf`;
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
          lastProcessedFile = null;
          showSuccessView('Individual split page files');
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
      lastProcessedFile = {
        bytes: outputBytes,
        filename: filename,
        mimeType: mimeType
      };

      triggerFileDownload(outputBytes, filename, mimeType);

      showSuccessView(filename);

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
    const bentoBtn = document.getElementById('btn-open-auth-drawer');
    if (bentoBtn && bentoBtn.contains(e.target)) return;
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
            <!-- Left Side: Resources Columns -->
            <div class="profile-dropdown-left">
              <div class="profile-dropdown-col">
                <div class="profile-dropdown-col-title">Features & Docs</div>
                <button class="profile-dropdown-item profile-dropdown-page-item" data-page="features">
                  <span>✨ Features</span>
                </button>
                <button class="profile-dropdown-item profile-dropdown-page-item" data-page="documentation">
                  <span>📚 Documentation</span>
                </button>
                <button class="profile-dropdown-item profile-dropdown-page-item" data-page="faq">
                  <span>❓ FAQ</span>
                </button>
                <button class="profile-dropdown-item profile-dropdown-page-item" data-page="security">
                  <span>🔒 Security</span>
                </button>
              </div>
              <div class="profile-dropdown-col">
                <div class="profile-dropdown-col-title">Company & Legal</div>
                <button class="profile-dropdown-item profile-dropdown-page-item" data-page="press">
                  <span>📰 Press Room</span>
                </button>
                <button class="profile-dropdown-item profile-dropdown-page-item" data-page="privacy">
                  <span>🛡️ Privacy Policy</span>
                </button>
                <button class="profile-dropdown-item profile-dropdown-page-item" data-page="terms">
                  <span>📄 Terms & Conditions</span>
                </button>
                <button class="profile-dropdown-item profile-dropdown-page-item" data-page="about">
                  <span>👥 About Us</span>
                </button>
              </div>
            </div>

            <!-- Right Side: Account Actions -->
            <div class="profile-dropdown-right">
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
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                  <span>Account settings</span>
                </button>
                <button class="profile-dropdown-item" id="btn-profile-team">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  <span>Team</span>
                </button>
                <button class="profile-dropdown-item" id="btn-profile-upgrade">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  <span>Upgrade to Premium</span>
                </button>
                <hr class="profile-dropdown-divider" />
                <button class="profile-dropdown-item profile-dropdown-item-logout" id="btn-profile-logout">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  <span>Log out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      // Wire dropdown toggle
      initProfileDropdown();

      // Click header to navigate to profile dashboard
      const crmDropdownHeader = document.querySelector('.profile-dropdown-header');
      if (crmDropdownHeader) {
        crmDropdownHeader.style.cursor = 'pointer';
        crmDropdownHeader.addEventListener('click', (e) => {
          navigateToAccountDashboard('profile');
          const dropdown = document.getElementById('profile-dropdown');
          if (dropdown) dropdown.style.display = 'none';
        });
      }
    }

    // 2. Mobile Profile Trigger & Drawer Rendering
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
      drawerBody.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1.5rem; padding: 1.25rem 1rem; height: 100%; justify-content: space-between; box-sizing: border-box;">
          <div style="display: flex; flex-direction: column; gap: 1.25rem;">
            <!-- Profile Header -->
            <div id="mob-drawer-profile-header" style="display: flex; align-items: center; gap: 1rem; padding-bottom: 1.25rem; border-bottom: 1px solid var(--border-color); cursor: pointer;">
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
      if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
        window.location.href = '/';
        return;
      }
      navigateToDashboard();
      if (document.getElementById('blog-page') && document.getElementById('blog-page').style.display === 'block') {
        renderBlogComposeSection();
      }
    };

    const upgradeAction = (e) => {
      if (e) e.preventDefault();
      if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
        window.location.href = '/?tab=billing';
        return;
      }
      navigateToAccountDashboard('billing');
      closeAuthDrawer();
    };

    const teamAction = (e) => {
      if (e) e.preventDefault();
      if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
        window.location.href = '/?tab=teams';
        return;
      }
      navigateToAccountDashboard('teams');
      closeAuthDrawer();
    };

    const settingsAction = (e) => {
      if (e) e.preventDefault();
      if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
        window.location.href = '/?tab=profile';
        return;
      }
      navigateToAccountDashboard('profile');
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

    // Bind profile dropdown resource page links
    document.querySelectorAll('.profile-dropdown-page-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const dropdown = document.getElementById('profile-dropdown');
        if (dropdown) dropdown.style.display = 'none';
        navigateToInfoPage(item.getAttribute('data-page'));
      });
    });

    // Mobile bindings
    const mobBtnSettings = document.getElementById('mob-btn-settings');
    if (mobBtnSettings) mobBtnSettings.addEventListener('click', settingsAction);

    const mobBtnTeam = document.getElementById('mob-btn-team');
    if (mobBtnTeam) mobBtnTeam.addEventListener('click', teamAction);

    const mobBtnUpgrade = document.getElementById('mob-btn-upgrade');
    if (mobBtnUpgrade) mobBtnUpgrade.addEventListener('click', upgradeAction);

    const mobBtnLogout = document.getElementById('mob-btn-logout');
    if (mobBtnLogout) mobBtnLogout.addEventListener('click', logoutAction);

    const mobDrawerHeader = document.getElementById('mob-drawer-profile-header');
    if (mobDrawerHeader) {
      mobDrawerHeader.addEventListener('click', settingsAction);
    }

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

      // Accordion dropdown toggles
      const accordionIds = [
        { trigger: 'mob-trigger-products', submenu: 'mob-submenu-products' },
        { trigger: 'mob-trigger-solutions', submenu: 'mob-submenu-solutions' },
        { trigger: 'mob-trigger-apps', submenu: 'mob-submenu-apps' }
      ];
      accordionIds.forEach(acc => {
        const trig = document.getElementById(acc.trigger);
        const sub = document.getElementById(acc.submenu);
        if (trig && sub) {
          trig.addEventListener('click', (e) => {
            e.preventDefault();
            trig.classList.toggle('open');
            sub.classList.toggle('active');
          });
        }
      });

      // Submenu tool selection routing
      drawerBody.querySelectorAll('.drawer-submenu-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          const tool = item.getAttribute('data-tool');
          if (tool) {
            closeAuthDrawer();
            navigateToTool(tool);
          }
        });
      });

      // Submenu solution category filtering routing
      drawerBody.querySelectorAll('.drawer-submenu-category').forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          const cat = item.getAttribute('data-cat');
          if (cat) {
            closeAuthDrawer();
            navigateToDashboard();

            // Set category tab active state
            document.querySelectorAll('.category-tab').forEach(t => {
              if (t.getAttribute('data-category') === cat) {
                t.classList.add('active');
              } else {
                t.classList.remove('active');
              }
            });
            filterCategoryColumns(cat);
          }
        });
      });

      // Pricing Link
      const mobLinkPricing = document.getElementById('mob-link-pricing');
      if (mobLinkPricing) {
        mobLinkPricing.addEventListener('click', (e) => {
          e.preventDefault();
          closeAuthDrawer();
          if (currentUser) {
            navigateToAccountDashboard('billing');
          } else {
            navigateToDashboard();
            const pricing = document.getElementById('pricing-grid') || document.querySelector('.premium-stats-grid');
            if (pricing) pricing.scrollIntoView({ behavior: 'smooth' });
          }
        });
      }

      // Security Link
      const mobLinkSecurity = document.getElementById('mob-link-security');
      if (mobLinkSecurity) {
        mobLinkSecurity.addEventListener('click', (e) => {
          e.preventDefault();
          closeAuthDrawer();
          if (currentUser) {
            navigateToAccountDashboard('security');
          } else {
            navigateToDashboard();
            const securityBlock = document.querySelector('.stats-grid') || document.querySelector('footer');
            if (securityBlock) securityBlock.scrollIntoView({ behavior: 'smooth' });
          }
        });
      }

      // Features Link
      const mobLinkFeatures = document.getElementById('mob-link-features');
      if (mobLinkFeatures) {
        mobLinkFeatures.addEventListener('click', (e) => {
          e.preventDefault();
          closeAuthDrawer();
          navigateToDashboard();
          const stats = document.querySelector('.premium-stats-grid') || document.querySelector('.tools-grid');
          if (stats) stats.scrollIntoView({ behavior: 'smooth' });
        });
      }

      // About us Link
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

      // Help Link
      const mobLinkHelp = document.getElementById('mob-link-help');
      if (mobLinkHelp) {
        mobLinkHelp.addEventListener('click', (e) => {
          e.preventDefault();
          // Open help modal overlay
          document.getElementById('help-modal-overlay').style.display = 'flex';
          closeAuthDrawer();
        });
      }

      // Language Link
      const mobLinkLanguage = document.getElementById('mob-link-language');
      if (mobLinkLanguage) {
        mobLinkLanguage.addEventListener('click', (e) => {
          e.preventDefault();
          // Open language modal overlay
          document.getElementById('language-modal-overlay').style.display = 'flex';
          closeAuthDrawer();
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

  if (overlay) overlay.classList.add('active');
  if (login) login.style.display = 'none';
  if (signup) signup.style.display = 'none';
  if (upgrade) upgrade.style.display = 'none';
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
  const plan = (currentUser && currentUser.subscription_plan) || 'free';
  const cards = document.querySelectorAll('.pricing-card');
  cards.forEach(c => c.classList.remove('active-plan'));

  const targetCard = document.getElementById(`card-plan-${plan}`);
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

  if (overlay) overlay.classList.add('active');
  if (login) login.style.display = 'none';
  if (signup) signup.style.display = 'none';
  if (upgrade) upgrade.style.display = 'none';
  if (team) team.style.display = 'none';
  if (forgot) forgot.style.display = 'none';
  if (googleSelector) googleSelector.style.display = 'none';
  if (settings) settings.style.display = 'flex';

  if (currentUser) {
    const modalFirstName = document.getElementById('modal-settings-first-name');
    if (modalFirstName) modalFirstName.value = currentUser.first_name || '';
    const modalLastName = document.getElementById('modal-settings-last-name');
    if (modalLastName) modalLastName.value = currentUser.last_name || '';
    const modalEmail = document.getElementById('modal-settings-email');
    if (modalEmail) modalEmail.value = currentUser.email || '';

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

  if (overlay) overlay.classList.add('active');
  if (login) login.style.display = 'none';
  if (signup) signup.style.display = 'none';
  if (upgrade) upgrade.style.display = 'none';
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

  window.renderGoogleButtons = async function () {
    if (googleClientId === null) {
      await checkGoogleConfig();
    }

    const loginContainer = document.getElementById('google-login-btn-container');
    const signupContainer = document.getElementById('google-signup-btn-container');
    const clientId = googleClientId || 'your-google-client-id-placeholder.apps.googleusercontent.com';

    const checkAndRender = () => {
      if (window.google && window.google.accounts) {
        try {
          google.accounts.id.initialize({
            client_id: clientId,
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
            const oldWarn = loginContainer.parentNode.querySelector('.google-placeholder-warning');
            if (oldWarn) oldWarn.remove();
            if (clientId.includes('placeholder')) {
              const warn = document.createElement('p');
              warn.className = 'google-placeholder-warning';
              warn.style.fontSize = '0.75rem';
              warn.style.color = '#ef4444';
              warn.style.marginTop = '0.5rem';
              warn.style.textAlign = 'center';
              warn.innerText = '⚠️ Real Google Login requires setting GOOGLE_CLIENT_ID in your .env file.';
              loginContainer.parentNode.insertBefore(warn, loginContainer.nextSibling);
            }
          }

          if (signupContainer) {
            signupContainer.innerHTML = '';
            google.accounts.id.renderButton(signupContainer, {
              theme: 'outline',
              size: 'large',
              width: signupContainer.offsetWidth || 300,
              text: 'signup_with'
            });
            const oldWarn = signupContainer.parentNode.querySelector('.google-placeholder-warning');
            if (oldWarn) oldWarn.remove();
            if (clientId.includes('placeholder')) {
              const warn = document.createElement('p');
              warn.className = 'google-placeholder-warning';
              warn.style.fontSize = '0.75rem';
              warn.style.color = '#ef4444';
              warn.style.marginTop = '0.5rem';
              warn.style.textAlign = 'center';
              warn.innerText = '⚠️ Real Google Login requires setting GOOGLE_CLIENT_ID in your .env file.';
              signupContainer.parentNode.insertBefore(warn, signupContainer.nextSibling);
            }
          }
        } catch (gsiErr) {
          console.error('GSI Button rendering failed:', gsiErr);
        }
      } else {
        setTimeout(checkAndRender, 100);
      }
    };

    checkAndRender();
  };

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

      if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
        window.location.reload();
        return;
      }

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

      if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
        window.location.reload();
        return;
      }

      document.getElementById('signup-email').value = '';
      document.getElementById('signup-password').value = '';
      document.getElementById('signup-first-name').value = '';
      document.getElementById('signup-last-name').value = '';
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
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
          body: JSON.stringify({
            plan: plan,
            seats: pricingSeats,
            interval: pricingInterval
          })
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

  const handleProfilePicChange = async (e) => {
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

      document.querySelectorAll('.settings-avatar-wrapper').forEach(w => {
        w.innerHTML = getAvatarHtml(currentUser.profile_pic, "100%", "18%");
      });

      if (document.getElementById('blog-page').style.display === 'block') {
        renderBlogList();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const modalPic = document.getElementById('modal-input-profile-pic');
  if (modalPic) modalPic.addEventListener('change', handleProfilePicChange);
  const dashboardPic = document.getElementById('dashboard-input-profile-pic');
  if (dashboardPic) dashboardPic.addEventListener('change', handleProfilePicChange);

  const handleSettingsSubmit = async (e, prefix) => {
    e.preventDefault();

    const firstName = document.getElementById(`${prefix}-settings-first-name`).value.trim();
    const lastName = document.getElementById(`${prefix}-settings-last-name`).value.trim();

    const countrySelect = document.getElementById(`${prefix}-settings-country`);
    const timezoneInput = document.getElementById(`${prefix}-settings-timezone`);
    const country = countrySelect ? countrySelect.value : 'Pakistan';
    const timezone = timezoneInput ? timezoneInput.value : 'Asia/Karachi';

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

      // Save local country & timezone
      const profileData = { country, timezone };
      safeStorage.setItem(`pdfbundles_profile_${currentUser.email}`, JSON.stringify(profileData));

      showToast('Account settings saved successfully', 'success');
      updateAuthNav(currentUser);

      // Sync the other form fields to match!
      const syncPrefix = prefix === 'modal' ? 'dashboard' : 'modal';
      const otherFirstName = document.getElementById(`${syncPrefix}-settings-first-name`);
      if (otherFirstName) otherFirstName.value = currentUser.first_name;
      const otherLastName = document.getElementById(`${syncPrefix}-settings-last-name`);
      if (otherLastName) otherLastName.value = currentUser.last_name;
      const otherCountry = document.getElementById(`${syncPrefix}-settings-country`);
      if (otherCountry) otherCountry.value = country;
      const otherTimezone = document.getElementById(`${syncPrefix}-settings-timezone`);
      if (otherTimezone) otherTimezone.value = timezone;

      // Conditional hide for modal only
      const overlay = document.getElementById('auth-modal-overlay');
      const settingsModal = document.getElementById('settings-modal');
      if (overlay && overlay.classList.contains('active') && settingsModal && settingsModal.style.display === 'flex') {
        hideSettingsModal();
      }

      // Refresh sidebar name
      const nameLabel = document.getElementById('account-sidebar-name');
      if (nameLabel) {
        nameLabel.textContent = currentUser.display_name || `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.email;
      }

      if (document.getElementById('blog-page').style.display === 'block') {
        renderBlogList();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const modalForm = document.getElementById('modal-settings-form');
  if (modalForm) {
    modalForm.addEventListener('submit', (e) => handleSettingsSubmit(e, 'modal'));
  }
  const dashboardForm = document.getElementById('dashboard-settings-form');
  if (dashboardForm) {
    dashboardForm.addEventListener('submit', (e) => handleSettingsSubmit(e, 'dashboard'));
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

  const accDash = document.getElementById('account-dashboard-page');
  if (accDash) accDash.style.display = 'none';

  document.getElementById('blog-page').style.display = 'block';
  document.getElementById('btn-back-to-dashboard').style.display = 'flex';

  loadBlogPosts();
  renderBlogComposeSection();
  updateHeaderTriggers();
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
          <p style="margin-top: 0.5rem;">Be the first to publish an article on pdfbundles!</p>
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
          <h4 style="font-size: 0.85rem;">pdfbundles Editorial</h4>
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
              [{ 'list': 'ordered' }, { 'list': 'bullet' }],
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

// Client-Side Dynamic A4 Invoice PDF Generator
async function downloadInvoicePDF(invoiceId, date, period, amount) {
  try {
    showToast('Generating invoice PDF...', 'info');

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 dimensions (Points)

    // Embed default Helvetica fonts
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Retrieve saved corporate details
    let bizProfile = {};
    const localBizProfile = safeStorage.getItem('pdfbundles_business_profile');
    if (localBizProfile) {
      try {
        bizProfile = JSON.parse(localBizProfile);
      } catch (e) {
        console.error(e);
      }
    }

    const companyName = bizProfile.companyName || 'pdfbundles Customer';
    const taxId = bizProfile.taxId || 'N/A';
    const billingEmail = bizProfile.billingEmail || (currentUser ? currentUser.email : 'customer@pdfbundles.com');
    const address1 = bizProfile.address1 || '123 Main Street';
    const city = bizProfile.city || 'New York';
    const zip = bizProfile.zip || '10001';
    const state = bizProfile.state || 'NY';
    const country = bizProfile.country || 'United States';

    const cityStateZip = `${city}, ${state} ${zip}`;

    // Draw header background band (violet/indigo theme)
    page.drawRectangle({
      x: 0,
      y: 730,
      width: 595.28,
      height: 112,
      color: rgb(0.12, 0.11, 0.29) // Theme Dark Violet/Indigo
    });

    // Draw Header Text
    page.drawText('PDFBUNDLES', { x: 50, y: 785, size: 24, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('Free Online PDF Tools', { x: 50, y: 765, size: 10, font: fontRegular, color: rgb(0.7, 0.7, 0.8) });

    page.drawText('INVOICE', { x: 450, y: 785, size: 24, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText(invoiceId, { x: 450, y: 765, size: 12, font: fontBold, color: rgb(0.39, 0.4, 0.95) });

    // Customer / Billed To details
    let yPos = 690;
    page.drawText('BILLED TO:', { x: 50, y: yPos, size: 10, font: fontBold, color: rgb(0.5, 0.5, 0.5) });

    yPos -= 20;
    const userName = currentUser ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() : 'Customer';
    const clientHeaderName = companyName !== 'pdfbundles Customer' ? companyName : (userName || 'Customer');
    page.drawText(clientHeaderName, { x: 50, y: yPos, size: 11, font: fontBold, color: rgb(0.1, 0.1, 0.1) });

    yPos -= 15;
    page.drawText(billingEmail, { x: 50, y: yPos, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

    yPos -= 15;
    page.drawText(address1, { x: 50, y: yPos, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

    yPos -= 15;
    page.drawText(cityStateZip, { x: 50, y: yPos, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

    yPos -= 15;
    page.drawText(country, { x: 50, y: yPos, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

    if (taxId && taxId !== 'N/A') {
      yPos -= 15;
      page.drawText(`VAT / Tax ID: ${taxId}`, { x: 50, y: yPos, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
    }

    // Provider / Billed From details
    let yPosFrom = 690;
    page.drawText('BILLED FROM:', { x: 350, y: yPosFrom, size: 10, font: fontBold, color: rgb(0.5, 0.5, 0.5) });

    yPosFrom -= 20;
    page.drawText(VENDOR_BILLING_INFO.companyName, { x: 350, y: yPosFrom, size: 11, font: fontBold, color: rgb(0.1, 0.1, 0.1) });

    yPosFrom -= 15;
    page.drawText(VENDOR_BILLING_INFO.address, { x: 350, y: yPosFrom, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

    yPosFrom -= 15;
    page.drawText(VENDOR_BILLING_INFO.cityStateZip, { x: 350, y: yPosFrom, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

    yPosFrom -= 15;
    page.drawText(VENDOR_BILLING_INFO.country, { x: 350, y: yPosFrom, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

    yPosFrom -= 15;
    page.drawText(VENDOR_BILLING_INFO.email, { x: 350, y: yPosFrom, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

    // Invoice Metadata Block
    let midY = Math.min(yPos, yPosFrom) - 30;
    page.drawRectangle({
      x: 50,
      y: midY - 35,
      width: 495.28,
      height: 30,
      color: rgb(0.97, 0.97, 0.99)
    });
    page.drawText(`Date of Issue: ${date}`, { x: 60, y: midY - 23, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(`Billing Period: ${period}`, { x: 220, y: midY - 23, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(`Payment Method: Credit Card`, { x: 400, y: midY - 23, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });

    midY -= 55;

    // Items table header
    page.drawRectangle({
      x: 50,
      y: midY,
      width: 495.28,
      height: 25,
      color: rgb(0.94, 0.94, 0.96)
    });

    page.drawText('Description', { x: 60, y: midY + 8, size: 9, font: fontBold, color: rgb(0.12, 0.11, 0.29) });
    page.drawText('Period', { x: 260, y: midY + 8, size: 9, font: fontBold, color: rgb(0.12, 0.11, 0.29) });
    page.drawText('Qty', { x: 390, y: midY + 8, size: 9, font: fontBold, color: rgb(0.12, 0.11, 0.29) });
    page.drawText('Unit Price', { x: 430, y: midY + 8, size: 9, font: fontBold, color: rgb(0.12, 0.11, 0.29) });
    page.drawText('Total', { x: 500, y: midY + 8, size: 9, font: fontBold, color: rgb(0.12, 0.11, 0.29) });

    // Item line
    midY -= 30;
    const planName = amount === '$9.00' ? 'Starter' : 'Premium';
    page.drawText(`pdfbundles ${planName} Plan Subscription`, { x: 60, y: midY + 8, size: 9, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(period, { x: 260, y: midY + 8, size: 8, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
    page.drawText('1', { x: 395, y: midY + 8, size: 9, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(amount, { x: 430, y: midY + 8, size: 9, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(amount, { x: 500, y: midY + 8, size: 9, font: fontBold, color: rgb(0.1, 0.1, 0.1) });

    // Divider line
    midY -= 15;
    page.drawLine({
      start: { x: 50, y: midY },
      end: { x: 545.28, y: midY },
      thickness: 1,
      color: rgb(0.9, 0.9, 0.9)
    });

    // Summary calculation blocks
    midY -= 30;
    page.drawText('Subtotal:', { x: 390, y: midY, size: 9, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
    page.drawText(amount, { x: 500, y: midY, size: 9, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });

    midY -= 15;
    page.drawText('Tax (0.0%):', { x: 390, y: midY, size: 9, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
    page.drawText('$0.00', { x: 500, y: midY, size: 9, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });

    midY -= 20;
    page.drawText('Total Paid:', { x: 390, y: midY, size: 11, font: fontBold, color: rgb(0.12, 0.11, 0.29) });
    page.drawText(amount, { x: 500, y: midY, size: 11, font: fontBold, color: rgb(0.12, 0.11, 0.29) });

    // Paid status badge
    let badgeY = midY + 10;
    page.drawRectangle({
      x: 50,
      y: badgeY - 15,
      width: 70,
      height: 22,
      color: rgb(0.88, 0.96, 0.91),
      borderColor: rgb(0.3, 0.7, 0.4),
      borderWidth: 1
    });
    page.drawText('PAID', { x: 74, y: badgeY - 8, size: 9, font: fontBold, color: rgb(0.1, 0.5, 0.2) });
    page.drawText('This invoice is fully paid and settled.', { x: 50, y: badgeY - 30, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });

    // Footer lines
    page.drawLine({
      start: { x: 50, y: 120 },
      end: { x: 545.28, y: 120 },
      thickness: 1,
      color: rgb(0.95, 0.95, 0.95)
    });
    page.drawText('Terms & Conditions: Service is active for the duration of the billing period. All fees are in USD.', { x: 50, y: 100, size: 8, font: fontRegular, color: rgb(0.6, 0.6, 0.6) });
    page.drawText('pdfbundles - Thank you for your subscription. For support, contact support@pdfbundles.com.', { x: 50, y: 85, size: 8, font: fontRegular, color: rgb(0.6, 0.6, 0.6) });

    // Compile & Download
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pdfbundles_Invoice_${invoiceId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Invoice downloaded successfully!', 'success');
  } catch (err) {
    console.error(err);
    showToast('Failed to generate and download invoice.', 'error');
  }
}
window.downloadInvoicePDF = downloadInvoicePDF;

// Update visible header buttons (hamburger for tools) on mobile
function updateHeaderTriggers() {
  const crmBtn = document.getElementById('btn-trigger-crm');
  const hamBtn = document.getElementById('btn-open-tools-drawer');
  const accDash = document.getElementById('account-dashboard-page');

  if (!crmBtn || !hamBtn) return;

  // Never show the redundant header CRM button - the blue floating toggle handles sidebar drawer
  crmBtn.style.display = 'none';
}
window.updateHeaderTriggers = updateHeaderTriggers;

// Dynamic Information/SEO Pages content configuration
const INFO_PAGES_DATA = {
  features: {
    title: "✨ Platform Features",
    subtitle: "Work Smarter with High-Performance PDF Bundles",
    content: `
      <div style="margin-bottom: 2.5rem; text-align: left;">
        <p style="font-size: 1.1rem; color: var(--text-secondary); line-height: 1.6;">
          Managing documents shouldn't feel like a chore. Whether you are packaging monthly client reports, compiling legal discoveries, or organizing e-commerce invoices, PDF Bundles gives you a highly intuitive, lightning-fast suite of tools to process multiple files simultaneously.
        </p>
        <p style="font-size: 1.15rem; font-weight: 600; color: var(--accent-secondary); margin-top: 1rem;">
          No complex training required—just drag, drop, and bundle.
        </p>
      </div>

      <h3 style="font-size: 1.35rem; font-weight: 700; color: var(--text-primary); margin-bottom: 1rem; text-align: left;">Core Product Capabilities</h3>
      <div style="overflow-x: auto; width: 100%; margin-bottom: 2.5rem; border: 1px solid var(--border-color); border-radius: 0.75rem; box-shadow: var(--shadow-soft);">
        <table style="width: 100%; border-collapse: collapse; text-align: left; min-width: 600px; background: var(--bg-secondary);">
          <thead>
            <tr style="background: var(--bg-primary); border-bottom: 1px solid var(--border-color);">
              <th style="padding: 1rem; font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; width: 30%;">Feature Group</th>
              <th style="padding: 1rem; font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; width: 45%;">What You Can Do</th>
              <th style="padding: 1rem; font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; width: 25%;">SEO Focus</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid var(--border-color);">
              <td style="padding: 1.25rem 1rem; font-size: 0.95rem; font-weight: 700; color: var(--text-primary);">Smart Bundling & Organization</td>
              <td style="padding: 1.25rem 1rem; font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5;">Merge hundreds of files into unified master documents, extract targeted pages, or split large bundles back into individual assets.</td>
              <td style="padding: 1.25rem 1rem; font-size: 0.85rem; font-style: italic; color: var(--text-muted);">Merge PDF bundles, Split document sets</td>
            </tr>
            <tr style="border-bottom: 1px solid var(--border-color);">
              <td style="padding: 1.25rem 1rem; font-size: 0.95rem; font-weight: 700; color: var(--text-primary);">High-Fidelity Conversion</td>
              <td style="padding: 1.25rem 1rem; font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5;">Move seamlessly between PDF and formats like Word, Excel, PowerPoint, and high-res JPG without losing structural formatting.</td>
              <td style="padding: 1.25rem 1rem; font-size: 0.85rem; font-style: italic; color: var(--text-muted);">Batch PDF converter, Office to PDF</td>
            </tr>
            <tr style="border-bottom: 1px solid var(--border-color);">
              <td style="padding: 1.25rem 1rem; font-size: 0.95rem; font-weight: 700; color: var(--text-primary);">Enterprise-Grade Optimization</td>
              <td style="padding: 1.25rem 1rem; font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5;">Shrink heavy document bundles to email-friendly sizes while maintaining crystal-clear text sharpness.</td>
              <td style="padding: 1.25rem 1rem; font-size: 0.85rem; font-style: italic; color: var(--text-muted);">Compress PDF bundle, Optimize documents</td>
            </tr>
            <tr style="border-bottom: none;">
              <td style="padding: 1.25rem 1rem; font-size: 0.95rem; font-weight: 700; color: var(--text-primary);">Bundle Intelligence & Security</td>
              <td style="padding: 1.25rem 1rem; font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5;">Instantly lock entire sets with AES encryption, apply digital signatures, or generate automated AI summaries of massive document pools.</td>
              <td style="padding: 1.25rem 1rem; font-size: 0.85rem; font-style: italic; color: var(--text-muted);">Secure PDF bundles, AI PDF summary</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 style="font-size: 1.35rem; font-weight: 700; color: var(--text-primary); margin-bottom: 1.25rem; text-align: left; margin-top: 1.5rem;">Why Modern Teams Choose PDF Bundles</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem; text-align: left;">
        <div class="crm-card" style="padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 0.75rem; background: var(--bg-card);">
          <div style="font-size: 1.5rem; margin-bottom: 0.75rem;">⚡</div>
          <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">True Batch Processing Power</h4>
          <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5;">Stop handling documents one by one. Our infrastructure is built specifically to process complex, multi-file batches at maximum speed. Upload entire folders, apply your edits, and download your ready-to-go bundle in seconds.</p>
        </div>
        <div class="crm-card" style="padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 0.75rem; background: var(--bg-card);">
          <div style="font-size: 1.5rem; margin-bottom: 0.75rem;">🛡️</div>
          <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">Ironclad Privacy & Data Security</h4>
          <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5;">Your document security is non-negotiable. To ensure your private records remain entirely yours, PDF Bundles utilizes localized browser processing and strict server-side cleanup protocols—automatically deleting all processed archives from our systems within two hours.</p>
        </div>
        <div class="crm-card" style="padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 0.75rem; background: var(--bg-card);">
          <div style="font-size: 1.5rem; margin-bottom: 0.75rem;">🔄</div>
          <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">Seamless Cloud Integrations</h4>
          <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5;">Keep your workflow continuous without burning local storage or mobile data. Import your document batches directly from Google Drive or Dropbox, build your bundles on our cloud servers, and save them straight back to your shared team drives.</p>
        </div>
        <div class="crm-card" style="padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 0.75rem; background: var(--bg-card);">
          <div style="font-size: 1.5rem; margin-bottom: 0.75rem;">🎨</div>
          <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">Total Control Over Layouts</h4>
          <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5;">Organizing document sets can get messy. Our interactive dashboard lets you instantly reorder files alphabetically, inject missing pages on the fly, remove unwanted sheets, or rotate skewed scans before you compile the final master bundle.</p>
        </div>
      </div>

      <div class="crm-card" style="padding: 2rem; background: rgba(79, 70, 229, 0.03); border: 1.5px dashed rgba(79, 70, 229, 0.2); border-radius: 1rem; text-align: left; margin-top: 1rem;">
        <h3 style="font-size: 1.35rem; font-weight: 700; color: var(--accent-primary); margin-bottom: 0.75rem;">Scale Your Operations with PDF Bundles Premium</h3>
        <p style="font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.5;">When individual document limits stand in the way of your business growth, our Premium tiers are designed to lift the barriers.</p>
        <ul style="padding-left: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; color: var(--text-secondary); font-size: 0.9rem;">
          <li><strong>Expanded File Thresholds:</strong> Upload heavier gigabyte-scale datasets and increase the number of files you can process in a single batch.</li>
          <li><strong>Centralized Team Management:</strong> Create a shared corporate workspace. Standardize default branding actions, like automatically stamping every page in a bundle with your company logo or a custom page-numbering architecture.</li>
          <li><strong>Zero Distractions:</strong> Enjoy an ad-free workspace and prioritized server pipelines to bypass high-traffic queue times.</li>
        </ul>
      </div>
    `
  },
  documentation: {
    title: "📚 Platform Documentation",
    subtitle: "Welcome to the PDF Bundles User Guide",
    content: `
      <div style="margin-bottom: 2.5rem; text-align: left;">
        <p style="font-size: 1.1rem; color: var(--text-secondary); line-height: 1.6;">
          Our platform is designed to make multi-file document management completely effortless. While we have built our dashboard to be completely intuitive, this comprehensive documentation guide will show you exactly how to optimize, convert, and organize your document bundles at scale.
        </p>
      </div>

      <!-- Section 1 -->
      <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem; margin-bottom: 1.5rem; text-align: left;">1. Organizing & Creating Bundles</h3>
      <div style="display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 3rem; text-align: left;">
        <div class="crm-card" style="padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 0.75rem; background: var(--bg-card);">
          <h4 style="font-size: 1.1rem; font-weight: 700; color: var(--accent-primary); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">📥 Creating a Master Bundle (Merge PDF)</h4>
          <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 0.75rem;">To combine two or more files into a single, cohesive document bundle, select your target documents from your local machine.</p>
          <ul style="padding-left: 1.25rem; font-size: 0.875rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 0.35rem;">
            <li><strong>Custom Arrangements:</strong> Drag and drop file thumbnails to establish the exact reading order you want before compiling.</li>
            <li><strong>Secured Files:</strong> You can introduce password-protected documents into the mix. Simply enter the credential when prompted, and our engine will smoothly integrate them into your final unsecured master bundle.</li>
          </ul>
        </div>

        <div class="crm-card" style="padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 0.75rem; background: var(--bg-card);">
          <h4 style="font-size: 1.1rem; font-weight: 700; color: var(--accent-primary); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">📤 Extracting & Splitting Bundles</h4>
          <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 0.75rem;">If you have a massive master document that needs to be broken down, use our extraction engine.</p>
          <ul style="padding-left: 1.25rem; font-size: 0.875rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 0.35rem;">
            <li><strong>Split by Range:</strong> Define explicit page blocks (e.g., Pages 1–10, 15–20) to output separate, focused sub-bundles.</li>
            <li><strong>Total Extraction:</strong> Pull every individual page out into its own distinct file. Choose to download them all as a single organized .zip file or merge only the extracted pages into a brand new standalone layout.</li>
          </ul>
        </div>

        <div class="crm-card" style="padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 0.75rem; background: var(--bg-card);">
          <h4 style="font-size: 1.1rem; font-weight: 700; color: var(--accent-primary); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">✂️ Bulk Page Removal & Sorting</h4>
          <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 0.75rem;">When uploading a vast set of documents, accidental duplicates or blank trailing pages can clutter the project.</p>
          <ul style="padding-left: 1.25rem; font-size: 0.875rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 0.35rem;">
            <li><strong>Visual Color-Coding:</strong> When you upload multiple files into the workspace, thumbnails for each distinct source file are framed in matching color boundaries so you can see where one document ends and another begins.</li>
            <li><strong>One-Click Purging:</strong> Simply click on any page thumbnail to mark it for deletion. A clear cross marker will appear, and those pages will be permanently stripped when your bundle is generated.</li>
          </ul>
        </div>
      </div>

      <!-- Section 2 -->
      <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem; margin-bottom: 1.5rem; text-align: left;">2. Optimizing & Editing Asset Sets</h3>
      <div style="display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 3rem; text-align: left;">
        <div class="crm-card" style="padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 0.75rem; background: var(--bg-card);">
          <h4 style="font-size: 1.1rem; font-weight: 700; color: var(--accent-primary); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">🗜️ High-Performance Bundle Compression</h4>
          <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 1rem;">Heavy multi-file documents can easily fail email attachment size thresholds. Use our compression engine to scale down file sizes without sacrificing text clarity.</p>
          
          <div style="overflow-x: auto; width: 100%; border: 1px solid var(--border-color); border-radius: 0.5rem; margin-bottom: 0.5rem;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; background: var(--bg-secondary); min-width: 500px;">
              <thead>
                <tr style="background: var(--bg-primary); border-bottom: 1px solid var(--border-color); font-size: 0.8rem; text-transform: uppercase;">
                  <th style="padding: 0.75rem 1rem; font-weight: 700; color: var(--text-secondary);">Compression Level</th>
                  <th style="padding: 0.75rem 1rem; font-weight: 700; color: var(--text-secondary);">Target Use Case</th>
                  <th style="padding: 0.75rem 1rem; font-weight: 700; color: var(--text-secondary);">File Size Outcome</th>
                  <th style="padding: 0.75rem 1rem; font-weight: 700; color: var(--text-secondary);">Quality Retention</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid var(--border-color); font-size: 0.85rem;">
                  <td style="padding: 0.75rem 1rem; font-weight: 600; color: var(--text-primary);">Extreme Compression</td>
                  <td style="padding: 0.75rem 1rem; color: var(--text-secondary);">Quick internal reviews, archiving</td>
                  <td style="padding: 0.75rem 1rem; color: var(--text-secondary);">Maximum reduction</td>
                  <td style="padding: 0.75rem 1rem; color: var(--text-secondary);">Low image resolution</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border-color); font-size: 0.85rem;">
                  <td style="padding: 0.75rem 1rem; font-weight: 600; color: var(--text-primary);">Recommended Optimization</td>
                  <td style="padding: 0.75rem 1rem; color: var(--text-secondary);">Client delivery, formal uploads</td>
                  <td style="padding: 0.75rem 1rem; color: var(--text-secondary);">Balanced reduction</td>
                  <td style="padding: 0.75rem 1rem; color: var(--text-primary); font-weight: 600;">High clarity (Default)</td>
                </tr>
                <tr style="font-size: 0.85rem;">
                  <td style="padding: 0.75rem 1rem; font-weight: 600; color: var(--text-primary);">Low Compression</td>
                  <td style="padding: 0.75rem 1rem; color: var(--text-secondary);">High-res printing, design portfolios</td>
                  <td style="padding: 0.75rem 1rem; color: var(--text-secondary);">Minimal reduction</td>
                  <td style="padding: 0.75rem 1rem; color: var(--text-secondary);">Original pixel perfection</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="crm-card" style="padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 0.75rem; background: var(--bg-card);">
          <h4 style="font-size: 1.1rem; font-weight: 700; color: var(--accent-primary); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">📝 Watermarking & Corporate Layout Stamping</h4>
          <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 0.75rem;">Protect your intellectual property across entire collections simultaneously.</p>
          <ul style="padding-left: 1.25rem; font-size: 0.875rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 0.35rem;">
            <li><strong>Unified Placement:</strong> Upload an image logo or construct a custom text string. Our engine stamps the watermark in the exact designated coordinates across every single sheet within the compiled bundle.</li>
            <li><strong>Mass Page Numbering:</strong> Automatically calculate and stamp sequence numbers across complex file mergers. Customize typography style, size, shading, opacity, and positioning margins from the main dashboard toolbar.</li>
          </ul>
        </div>
      </div>

      <!-- Section 3 -->
      <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem; margin-bottom: 1.5rem; text-align: left;">3. Advanced Integrations & Requirements</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; text-align: left;">
        <div class="crm-card" style="padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 0.75rem; background: var(--bg-card);">
          <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">☁️</div>
          <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">Dynamic Cloud Pipelines</h4>
          <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 0.5rem;">You don't need to manually download individual files to your device before creating a bundle.</p>
          <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;"><strong>Direct Cloud Links:</strong> Ingest from Google Drive or Dropbox. Processing occurs entirely on our high-speed remote servers to save substantial local bandwidth.</p>
        </div>

        <div class="crm-card" style="padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 0.75rem; background: var(--bg-card);">
          <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">💻</div>
          <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">System & Browser Requirements</h4>
          <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 0.5rem;">To maintain rapid rendering and flawless dashboard drag-and-drop actions, verify your environment:</p>
          <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;"><strong>Supported Browsers:</strong> Google Chrome, Mozilla Firefox, Apple Safari, or Microsoft Edge (latest versions) with JavaScript enabled.</p>
        </div>
      </div>
    `
  },
  faq: {
    title: "❓ FAQ",
    subtitle: "Frequently Asked Questions",
    content: `
      <div style="margin-bottom: 2.5rem; text-align: left;">
        <p style="font-size: 1.1rem; color: var(--text-secondary); line-height: 1.6;">
          Have a question about managing your document batches? Explore our frequently asked questions below to see how PDF Bundles streamlines high-volume workflows safely and efficiently.
        </p>
      </div>

      <!-- Category 1 -->
      <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); border-left: 3px solid var(--accent-primary); padding-left: 0.75rem; margin-bottom: 1.5rem; text-align: left;">🛡️ Security & Privacy</h3>
      <div style="display: flex; flex-direction: column; gap: 1.25rem; margin-bottom: 2.5rem; text-align: left;">
        <div class="crm-card" style="padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 0.75rem; background: var(--bg-card);">
          <strong style="color: var(--text-primary); font-size: 1.05rem; display: block; margin-bottom: 0.5rem;">Do you keep a copy of my processed document bundles?</strong>
          <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.5; margin: 0;">
            Absolutely not. Your documents belong exclusively to you. While your files are processing on our high-speed architecture, they are deeply isolated and locked. We temporarily hold the compiled bundles for a maximum of two hours so you have plenty of time to download them. After that window closes, they are permanently and completely wiped from our storage servers forever.
          </p>
          <p style="color: var(--text-muted); font-size: 0.85rem; line-height: 1.4; margin-top: 0.75rem; border-top: 1px solid var(--border-color); padding-top: 0.5rem; font-style: italic;">
            <strong>Pro Tip:</strong> If you want them gone immediately, you can manually click the "Delete Instantly" icon on the download page to purge them right away. We never inspect, copy, or read your files.
          </p>
        </div>

        <div class="crm-card" style="padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 0.75rem; background: var(--bg-card);">
          <strong style="color: var(--text-primary); font-size: 1.05rem; display: block; margin-bottom: 0.5rem;">Are our sensitive corporate files safe with your service?</strong>
          <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.5; margin: 0;">
            Yes. Every single upload and download pipeline uses encrypted HTTPS/SSL protocols alongside rigid end-to-end encryption. These workflows are architected to satisfy strict corporate data privacy policies. We continuously align our data storage mechanics with global data compliance standards (including GDPR compliance) to ensure enterprise-level document protection.
          </p>
        </div>
      </div>

      <!-- Category 2 -->
      <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); border-left: 3px solid var(--accent-secondary); padding-left: 0.75rem; margin-bottom: 1.5rem; text-align: left;">⚡ Batch Processing & Workflows</h3>
      <div style="display: flex; flex-direction: column; gap: 1.25rem; margin-bottom: 2.5rem; text-align: left;">
        <div class="crm-card" style="padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 0.75rem; background: var(--bg-card);">
          <strong style="color: var(--text-primary); font-size: 1.05rem; display: block; margin-bottom: 0.5rem;">How many files can I compile into a single bundle?</strong>
          <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.5; margin: 0;">
            Free accounts can effortlessly batch up to 20 files at a time. If your workflow demands heavier document compiling, upgrading to a PDF Bundles Premium account removes these restrictions, allowing you to merge hundreds of high-res files into large master bundles simultaneously.
          </p>
        </div>

        <div class="crm-card" style="padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 0.75rem; background: var(--bg-card);">
          <strong style="color: var(--text-primary); font-size: 1.05rem; display: block; margin-bottom: 0.5rem;">Can I import documents and save bundles straight to the cloud?</strong>
          <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.5; margin: 0;">
            Yes. You don't even need the source documents saved locally on the machine or mobile device you are working from. Our dashboard connects smoothly with Google Drive and Dropbox. You can fetch files directly from your shared team folders, compile them on our remote servers, and route the finished master bundle straight back to your cloud architecture. This is a massive data saver when working on phones or tablets.
          </p>
        </div>

        <div class="crm-card" style="padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 0.75rem; background: var(--bg-card);">
          <strong style="color: var(--text-primary); font-size: 1.05rem; display: block; margin-bottom: 0.5rem;">Can I convert non-selectable, scanned documents into a searchable bundle?</strong>
          <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.5; margin: 0;">
            Yes. Our backend engine runs an advanced OCR (Optical Character Recognition) process. When you build a bundle using flat images or scanned paper records, our system isolates the text layers, transforming raw image scans into fully searchable, interactive, and editable PDF document sets.
          </p>
        </div>
      </div>

      <!-- Category 3 -->
      <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); border-left: 3px solid #10b981; padding-left: 0.75rem; margin-bottom: 1.5rem; text-align: left;">🛠️ Troubleshooting & Technical Issues</h3>
      <div style="display: flex; flex-direction: column; gap: 1.25rem; text-align: left;">
        <div class="crm-card" style="padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 0.75rem; background: var(--bg-card);">
          <strong style="color: var(--text-primary); font-size: 1.05rem; display: block; margin-bottom: 0.5rem;">Why is my bundle processing taking a long time?</strong>
          <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.5; margin-bottom: 0.5rem;">
            While our core engines are optimized for high-volume data streams, overall turnaround time comes down to three factors:
          </p>
          <ul style="padding-left: 1.25rem; font-size: 0.875rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 0.35rem;">
            <li><strong>Your internet connection:</strong> Uploading massive batches of uncompressed data depends heavily on your local upload speeds.</li>
            <li><strong>Total payload size:</strong> Compiling dozens of complex graphics-heavy pages requires slightly more crunching time.</li>
            <li><strong>Current server traffic volume:</strong> Premium users get designated VIP fast-track pipelines to completely bypass general high-traffic queues.</li>
          </ul>
        </div>

        <div class="crm-card" style="padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 0.75rem; background: var(--bg-card);">
          <strong style="color: var(--text-primary); font-size: 1.05rem; display: block; margin-bottom: 0.5rem;">What are the minimum system requirements to run PDF Bundles?</strong>
          <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.5; margin: 0;">
            We keep things incredibly lean. To enjoy smooth, latency-free drag-and-drop mechanics, we recommend using the latest stable versions of Google Chrome, Mozilla Firefox, Apple Safari, or Microsoft Edge. Make sure JavaScript is fully enabled in your browser settings. If you ever hit an unexpected render glitch on a download screen, switching your browser window to Incognito / Private Mode usually resolves it instantly by bypassing cached layout files.
          </p>
        </div>
      </div>
    `
  },
  security: {
    title: "🔒 Security & Compliance",
    subtitle: "Enterprise-Grade Security for Your Document Bundles",
    content: `
      <div style="margin-bottom: 2.5rem; text-align: left;">
        <p style="font-size: 1.1rem; color: var(--text-secondary); line-height: 1.6;">
          At PDF Bundles, the confidentiality, integrity, and availability of your business records are our absolute priorities. Whether your team compiles thousands of client records or automates internal operational folders, our cloud architecture is built to provide maximum protection at every stage of the document lifecycle.
        </p>
      </div>

      <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem; margin-bottom: 1.5rem; text-align: left;">🔒 Document Security Architecture</h3>
      <div style="display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 3rem; text-align: left;">
        <div class="crm-card" style="padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 0.75rem; background: var(--bg-card);">
          <h4 style="font-size: 1.15rem; font-weight: 700; color: var(--accent-primary); margin-bottom: 0.5rem;">1. Advanced In-Transit & At-Rest Encryption</h4>
          <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 0.5rem;">No matter which compilation or optimization tool you use, your files are protected by banking-grade security protocols.</p>
          <ul style="padding-left: 1.25rem; font-size: 0.875rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 0.35rem;">
            <li><strong>In Transit:</strong> All communications between your local browser and our processing nodes are strictly forced over Hypertext Transfer Protocol Secure (HTTPS). This traffic is fortified via Transport Layer Security (TLS/SSL) encryption, rendering intercepted packet data completely illegible.</li>
            <li><strong>At Rest:</strong> During the brief window your files sit on our processing servers, they are completely isolated inside single-user sandboxes, preventing cross-tenant data leaks.</li>
          </ul>
        </div>

        <div class="crm-card" style="padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 0.75rem; background: var(--bg-card);">
          <h4 style="font-size: 1.15rem; font-weight: 700; color: var(--accent-primary); margin-bottom: 0.5rem;">2. Strict Two-Hour Purge Mandate</h4>
          <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 0.5rem;">We do not archive, index, or sell your business content. We maintain a zero-retention philosophy for standard workflows.</p>
          <ul style="padding-left: 1.25rem; font-size: 0.875rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 0.35rem;">
            <li><strong>Automated Erasure:</strong> Within exactly two hours of processing your document batch, our system executes a permanent server-side wipe of both source documents and the compiled bundle.</li>
            <li><strong>Instant Manual Deletion:</strong> Want it gone immediately? You don't have to wait for the automated script. Simply click the trash icon on your download dashboard to execute a real-time shredding command.</li>
          </ul>
        </div>

        <div class="crm-card" style="padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 0.75rem; background: var(--bg-card);">
          <h4 style="font-size: 1.15rem; font-weight: 700; color: var(--accent-primary); margin-bottom: 0.5rem;">3. Long-Term Integrity (eIDAS & PDF/A)</h4>
          <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 0.5rem;">When building sensitive legal or corporate bundles:</p>
          <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5; padding-left: 0.5rem;"><strong>Long-Term Preservation:</strong> Convert document bundles to PDF/A standards to guarantee long-term archiving stability, keeping structural fonts and elements intact for decades without file degradation.</p>
        </div>
      </div>

      <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem; margin-bottom: 1.5rem; text-align: left;">🏢 Internal Operations & Compliance Standards</h3>
      
      <div style="overflow-x: auto; width: 100%; border: 1px solid var(--border-color); border-radius: 0.75rem; box-shadow: var(--shadow-soft); margin-bottom: 2.5rem; text-align: left;">
        <table style="width: 100%; border-collapse: collapse; min-width: 600px; background: var(--bg-secondary);">
          <thead>
            <tr style="background: var(--bg-primary); border-bottom: 1px solid var(--border-color); font-size: 0.8rem; text-transform: uppercase;">
              <th style="padding: 1rem; font-weight: 700; color: var(--text-secondary); width: 25%;">Security Category</th>
              <th style="padding: 1rem; font-weight: 700; color: var(--text-secondary); width: 35%;">Protocol Implemented</th>
              <th style="padding: 1rem; font-weight: 700; color: var(--text-secondary); width: 40%;">Business Advantage</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid var(--border-color); font-size: 0.875rem;">
              <td style="padding: 1.25rem 1rem; font-weight: 600; color: var(--text-primary);">Data Privacy</td>
              <td style="padding: 1.25rem 1rem; color: var(--text-secondary); line-height: 1.4;">Full GDPR Alignment</td>
              <td style="padding: 1.25rem 1rem; color: var(--text-secondary); line-height: 1.4;">Protects EU user data and respects fundamental user erasure/privacy rights globally.</td>
            </tr>
            <tr style="border-bottom: 1px solid var(--border-color); font-size: 0.875rem;">
              <td style="padding: 1.25rem 1rem; font-weight: 600; color: var(--text-primary);">Infrastructure Protection</td>
              <td style="padding: 1.25rem 1rem; color: var(--text-secondary); line-height: 1.4;">DDoS Shielding & Global Content Delivery Networks (CDN)</td>
              <td style="padding: 1.25rem 1rem; color: var(--text-secondary); line-height: 1.4;">Guarantees high-speed multi-file uploads while maintaining resilient uptime against malicious attacks.</td>
            </tr>
            <tr style="border-bottom: 1px solid var(--border-color); font-size: 0.875rem;">
              <td style="padding: 1.25rem 1rem; font-weight: 600; color: var(--text-primary);">Access Controls</td>
              <td style="padding: 1.25rem 1rem; color: var(--text-secondary); line-height: 1.4;">Principle of Least Privilege & Mandatory 2FA</td>
              <td style="padding: 1.25rem 1rem; color: var(--text-secondary); line-height: 1.4;">Restricts infrastructure system visibility exclusively to verified operational nodes.</td>
            </tr>
            <tr style="font-size: 0.875rem;">
              <td style="padding: 1.25rem 1rem; font-weight: 600; color: var(--text-primary);">Account Defense</td>
              <td style="padding: 1.25rem 1rem; color: var(--text-secondary); line-height: 1.4;">90-Day Forced Password Rotation</td>
              <td style="padding: 1.25rem 1rem; color: var(--text-secondary); line-height: 1.4;">Limits the window of risk for credential stuffing or brute-force profile attacks.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="crm-card" style="padding: 2rem; background: rgba(16, 185, 129, 0.03); border: 1.5px dashed rgba(16, 185, 129, 0.2); border-radius: 1rem; text-align: left; margin-top: 1rem;">
        <h3 style="font-size: 1.2rem; font-weight: 700; color: #10b981; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">🤝 Our Promise to Teams & Developers</h3>
        <p style="font-size: 0.95rem; color: var(--text-secondary); margin: 0; line-height: 1.5;">
          PDF Bundles explicitly guarantees that your processed text, image assets, and metadata are never accessed, reviewed, or used to train public or private Artificial Intelligence (AI) models. Your business data remains exclusively yours.
        </p>
      </div>
    `
  },
  press: {
    title: "📰 Press Room",
    subtitle: "Official Brand Assets & Press Materials",
    content: `
      <div style="margin-bottom: 2.5rem; text-align: left;">
        <p style="font-size: 1.1rem; color: var(--text-secondary); line-height: 1.6;">
          We are on a mission to end the friction of fragmented document management. PDF Bundles empowers global enterprises, small businesses, and digital agencies to scale their workflows through advanced batch processing, high-fidelity conversions, and multi-file automation.
        </p>
        <p style="font-size: 0.95rem; color: var(--text-muted); margin-top: 0.5rem; line-height: 1.5;">
          Discover our brand journey, grab certified media resources, or connect directly with our communications team.
        </p>
      </div>

      <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem; margin-bottom: 1.5rem; text-align: left;">📊 The PDF Bundles Story at a Glance</h3>
      
      <div style="overflow-x: auto; width: 100%; border: 1px solid var(--border-color); border-radius: 0.75rem; box-shadow: var(--shadow-soft); margin-bottom: 3rem; text-align: left;">
        <table style="width: 100%; border-collapse: collapse; min-width: 600px; background: var(--bg-secondary);">
          <thead>
            <tr style="background: var(--bg-primary); border-bottom: 1px solid var(--border-color); font-size: 0.8rem; text-transform: uppercase;">
              <th style="padding: 1rem; font-weight: 700; color: var(--text-secondary); width: 25%;">Company Metric</th>
              <th style="padding: 1rem; font-weight: 700; color: var(--text-secondary); width: 45%;">Our Core Philosophy</th>
              <th style="padding: 1rem; font-weight: 700; color: var(--text-secondary); width: 30%;">Impact Horizon</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid var(--border-color); font-size: 0.875rem;">
              <td style="padding: 1.25rem 1rem; font-weight: 600; color: var(--text-primary);">The Core Problem</td>
              <td style="padding: 1.25rem 1rem; color: var(--text-secondary); line-height: 1.4;">Teams lose hours managing individual, fragmented business documents one by one.</td>
              <td style="padding: 1.25rem 1rem; color: var(--accent-secondary); font-weight: 600;">Operational Bottlenecks</td>
            </tr>
            <tr style="border-bottom: 1px solid var(--border-color); font-size: 0.875rem;">
              <td style="padding: 1.25rem 1rem; font-weight: 600; color: var(--text-primary);">Our Solution</td>
              <td style="padding: 1.25rem 1rem; color: var(--text-secondary); line-height: 1.4;">A unified, fast dashboard built to compile, optimize, and manage multi-file document sets instantly.</td>
              <td style="padding: 1.25rem 1rem; color: var(--accent-primary); font-weight: 600;">Seamless Batch Workflows</td>
            </tr>
            <tr style="font-size: 0.875rem;">
              <td style="padding: 1.25rem 1rem; font-weight: 600; color: var(--text-primary);">Target Audience</td>
              <td style="padding: 1.25rem 1rem; color: var(--text-secondary); line-height: 1.4;">Legal firms, enterprise operations, creative agencies, and digital store owners.</td>
              <td style="padding: 1.25rem 1rem; color: var(--text-primary); font-weight: 600;">Scalable B2B Document SaaS</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="text-align: left; margin-bottom: 3rem;">
        <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem; margin-bottom: 1.5rem;">📰 Official Brand Assets & Press Materials</h3>
        <h4 style="font-size: 1.1rem; font-weight: 700; color: var(--accent-primary); margin-bottom: 0.5rem;">About PDF Bundles</h4>
        <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 1.5rem;">
          PDF Bundles is a web-based productivity application built to handle the complexities of high-volume document batch management. Launched to rescue teams from tedious, single-file processing, our software automates the aggregation, compression, conversion, and encryption of massive multi-file datasets. By moving away from rigid, isolated file utility setups, PDF Bundles delivers high-performance processing capabilities that integrate with modern cloud infrastructure like Google Drive and Dropbox.
        </p>

        <div style="padding: 1.5rem; background: rgba(79, 70, 229, 0.03); border-left: 4px solid var(--accent-primary); border-radius: 0 0.5rem 0.5rem 0; margin-bottom: 2.5rem; font-style: italic;">
          <p style="font-size: 1rem; color: var(--text-primary); margin: 0; line-height: 1.5;">
            "The future of business efficiency isn't about handling documents faster—it's about handling them collectively. PDF Bundles changes the dynamic from tedious individual management to fluid, automated workspace aggregation."
          </p>
        </div>
      </div>

      <div class="crm-card" style="padding: 1.75rem; border: 1px solid var(--border-color); border-radius: 0.75rem; background: var(--bg-card); text-align: left;">
        <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">📬 Media & Public Relations Contact</h3>
        <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 1rem;">
          Are you a journalist, tech reviewer, or industry analyst covering the evolving landscape of digital workplace productivity and SaaS tools? We would love to collaborate.
        </p>
        <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 0.5rem;">
          For interview requests, product deep-dives, exclusive insights, or custom review credentials, reach out straight to our media relations team:
        </p>
        <p style="font-size: 0.95rem; color: var(--text-primary); font-weight: 700; margin-bottom: 0.25rem;">
          📧 Press Inquiries: <a href="mailto:press@pdfbundles.com" style="color: var(--accent-secondary); text-decoration: none;">press@pdfbundles.com</a>
        </p>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">
          🕒 Response Window: Our communications desk typically responds to verified media queries within 24 business hours.
        </p>
      </div>
    `
  },
  privacy: {
    title: "🛡️ Privacy Policy",
    subtitle: "Your Privacy is Our Foundation",
    content: `
      <div style="margin-bottom: 2.5rem; text-align: left;">
        <p style="font-size: 1.1rem; color: var(--text-secondary); line-height: 1.6;">
          At PDF Bundles, we believe that data privacy isn't just a legal obligation—it is a core feature of our business model. When you upload multi-file document sets to organize, compress, or convert, your files remain completely yours. We never read, monetize, or store your documents beyond the baseline processing window.
        </p>
      </div>

      <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem; margin-bottom: 1.5rem; text-align: left;">The PDF Bundles Privacy Guarantee</h3>
      
      <div style="overflow-x: auto; width: 100%; border: 1px solid var(--border-color); border-radius: 0.75rem; box-shadow: var(--shadow-soft); margin-bottom: 3rem; text-align: left;">
        <table style="width: 100%; border-collapse: collapse; min-width: 600px; background: var(--bg-secondary);">
          <thead>
            <tr style="background: var(--bg-primary); border-bottom: 1px solid var(--border-color); font-size: 0.8rem; text-transform: uppercase;">
              <th style="padding: 1rem; font-weight: 700; color: var(--text-secondary); width: 25%;">Data Type</th>
              <th style="padding: 1rem; font-weight: 700; color: var(--text-secondary); width: 50%;">How We Handle It</th>
              <th style="padding: 1rem; font-weight: 700; color: var(--text-secondary); width: 25%;">Retention Period</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid var(--border-color); font-size: 0.875rem;">
              <td style="padding: 1.25rem 1rem; font-weight: 600; color: var(--text-primary);">Your Uploaded Files</td>
              <td style="padding: 1.25rem 1rem; color: var(--text-secondary); line-height: 1.4;">Strictly isolated, encrypted, and processed on secure servers.</td>
              <td style="padding: 1.25rem 1rem; color: #ef4444; font-weight: 600;">2 Hours (Then permanently purged)</td>
            </tr>
            <tr style="border-bottom: 1px solid var(--border-color); font-size: 0.875rem;">
              <td style="padding: 1.25rem 1rem; font-weight: 600; color: var(--text-primary);">Account Information</td>
              <td style="padding: 1.25rem 1rem; color: var(--text-secondary); line-height: 1.4;">Standard account management metrics (Email, subscription tier).</td>
              <td style="padding: 1.25rem 1rem; color: var(--text-secondary);">Active life of your account</td>
            </tr>
            <tr style="border-bottom: 1px solid var(--border-color); font-size: 0.875rem;">
              <td style="padding: 1.25rem 1rem; font-weight: 600; color: var(--text-primary);">Payment Data</td>
              <td style="padding: 1.25rem 1rem; color: var(--text-secondary); line-height: 1.4;">Processed through tier-1, PCI-DSS compliant payment gateways.</td>
              <td style="padding: 1.25rem 1rem; color: var(--text-muted); font-style: italic;">Never stored on our servers</td>
            </tr>
            <tr style="font-size: 0.875rem;">
              <td style="padding: 1.25rem 1rem; font-weight: 600; color: var(--text-primary);">Anonymized Analytics</td>
              <td style="padding: 1.25rem 1rem; color: var(--text-secondary); line-height: 1.4;">Aggregate, non-identifiable usage stats to optimize server loads.</td>
              <td style="padding: 1.25rem 1rem; color: var(--text-secondary);">Rolling analytical cycles</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="text-align: left; margin-bottom: 3rem;">
        <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem; margin-bottom: 1.5rem;">🔒 Document Processing & Ephemeral Data Control</h3>
        <h4 style="font-size: 1.1rem; font-weight: 700; color: var(--accent-primary); margin-bottom: 0.5rem;">Complete Automated File Purging</h4>
        <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 1rem;">
          When you upload folders of contracts, financial charts, or image files to create a unified asset bundle, those documents live inside a highly locked server container.
        </p>
        <ul style="padding-left: 1.25rem; font-size: 0.875rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem;">
          <li><strong>The Two-Hour Rule:</strong> The absolute second your document bundle is generated, an automated clock begins ticking. After exactly two hours, our systems trigger a deep-scrub sequence, permanently deleting both the original source elements and the compiled outputs from our storage arrays.</li>
          <li><strong>On-Demand Immediate Deletion:</strong> If you don't want to wait two hours, simply click the "Delete Instantly" trash icon on your download dashboard. This forces our system to bypass the timer and securely wipe the project data instantly.</li>
        </ul>

        <h4 style="font-size: 1.1rem; font-weight: 700; color: var(--accent-primary); margin-bottom: 0.5rem;">Zero Document Mining & Content Snooping</h4>
        <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 1.5rem;">
          We maintain a strict stance against automated data farming. PDF Bundles does not scan, read, copy, or index the underlying text, metadata, or images contained within your documents. Furthermore, we explicitly guarantee that none of your uploaded information or document datasets are ever used to train public or private Artificial Intelligence (AI) models.
        </p>
      </div>

      <div style="text-align: left; margin-bottom: 3rem;">
        <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem; margin-bottom: 1.5rem;">🇪🇺 Global Data Compliance & GDPR Alignment</h3>
        <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 1rem;">
          We recognize that our users operate within strict legal boundaries. PDF Bundles actively designs its data collection and storage pipelines to reflect leading global standards:
        </p>
        <ul style="padding-left: 1.25rem; font-size: 0.875rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem;">
          <li><strong>General Data Protection Regulation (GDPR):</strong> We protect the fundamental right to data privacy for individuals within the European Economic Area (EEA), upholding the rights of data access, rectification, and the right to be forgotten.</li>
          <li><strong>Data Transfers:</strong> All multi-file information processing routes through end-to-end TLS/SSL encrypted channels to defend against man-in-the-middle network attacks.</li>
        </ul>
      </div>

      <div style="text-align: left; margin-bottom: 3rem;">
        <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem; margin-bottom: 1.5rem;">🍪 Website Usage & Analytical Cookies</h3>
        <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 1rem;">
          To keep our dashboard operating smoothly, optimize processing speeds during peak hours, and keep your session authenticated, we utilize basic web cookies.
        </p>
        <ul style="padding-left: 1.25rem; font-size: 0.875rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem;">
          <li><strong>Essential Cookies:</strong> Strictly necessary to remember your user state, active uploads, and subscription levels as you move through our tools.</li>
          <li><strong>Analytical Optimization:</strong> We use anonymized behavioral tools to monitor macro-performance metrics (like general processing success rates and load latency times). This data contains zero personally identifiable information (PII) and helps us balance server capacity globally.</li>
        </ul>
      </div>

      <div class="crm-card" style="padding: 1.75rem; border: 1px solid var(--border-color); border-radius: 0.75rem; background: var(--bg-card); text-align: left;">
        <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">💬 Contact Our Privacy Officer</h3>
        <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 1rem;">
          If you represent an enterprise team, a legal firm, or an organization with strict data protection addendums (DPAs), our team is here to help. For comprehensive compliance documentation or targeted privacy inquiries, reach out to us at:
        </p>
        <p style="font-size: 0.95rem; color: var(--text-primary); font-weight: 700; margin: 0;">
          📧 Email Desk: <a href="mailto:privacy@pdfbundles.com" style="color: var(--accent-secondary); text-decoration: none;">privacy@pdfbundles.com</a>
        </p>
      </div>
    `
  },
  terms: {
    title: "📄 Terms & Conditions",
    subtitle: "PDF Bundles Terms of Service",
    content: `
      <div style="margin-bottom: 2.5rem; text-align: left;">
        <p style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; margin-bottom: 0.5rem;">Last Updated: July 9, 2026</p>
        <p style="font-size: 1.1rem; color: var(--text-secondary); line-height: 1.6;">
          Welcome to PDF Bundles. Please read these Terms of Service ("Terms", "Agreement") carefully before using our website located at https://pdfbundles.com/ and any associated subdomains, web applications, or digital tools (collectively, the "Service") operated by PDF Bundles ("Company", "we", "us", "our").
        </p>
        <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.5; margin-top: 0.75rem;">
          By accessing or using our Service to upload, convert, merge, compress, or otherwise manipulate multi-file document sets ("Bundles"), you explicitly agree to be bound by these internationally standardized terms. If you do not agree to any portion of this agreement, you must immediately halt all use of our services.
        </p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 1.75rem; text-align: left;">
        <div>
          <h4 style="font-size: 1.1rem; font-weight: 700; color: var(--accent-primary); margin-bottom: 0.5rem;">1. Description of Service & Core Scope</h4>
          <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5;">
            PDF Bundles provides users with a web-based document automation workspace designed to handle bulk workflows. Our system allows users to execute batch functions including, but not limited to, combining multiple independent files into unified master documents, splitting extensive datasets, optimizing file payloads (compression), converting file formats, and executing bulk document security measures.
          </p>
          <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin-top: 0.5rem;">
            We grant you a non-exclusive, non-transferable, revocable license to access our platform strictly in accordance with these Terms. We reserve the right to modify, suspend, or discontinue any aspect of our tools or dashboard capacities at any time without prior liability.
          </p>
        </div>

        <div>
          <h4 style="font-size: 1.1rem; font-weight: 700; color: var(--accent-primary); margin-bottom: 0.5rem;">2. User Accounts, Responsibilities, and Identity</h4>
          <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 0.5rem;">
            <strong>2.1 Account Creation and Security:</strong> To unlock advanced multi-file parameters, increased file size thresholds, and shared team assets, you may be required to register a premium corporate or personal account. You agree to provide accurate, current, and complete details during registration. You bear sole responsibility for safeguarding your login credentials and for any action taken under your identity.
          </p>
          <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5;">
            <strong>2.2 Prohibited Content and Misuse:</strong> You maintain absolute ownership and liability for all documents, text, images, and sheets uploaded to our servers. You explicitly covenant that your batch files will not contain material that infringes upon third-party IP rights, contains malware or exploits, promotes fraud, or violates local, national, or international privacy laws.
          </p>
        </div>

        <div>
          <h4 style="font-size: 1.1rem; font-weight: 700; color: var(--accent-primary); margin-bottom: 0.5rem;">3. Data Processing, File Ownership, and The Two-Hour Rule</h4>
          <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 0.75rem;">
            <strong>3.1 Your Intellectual Property Protection:</strong> PDF Bundles lays no claim, title, or interest to the contents of the files you process. We do not extract, read, open, index, or parse text layers within your document sets, except where automated systems must calculate baseline operations (e.g., performing requested OCR layers or applying page numbers).
          </p>
          <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 1rem;">
            <strong>3.2 Automated Server Scrubbing Protocol:</strong> To preserve server efficiency and guarantee maximum user privacy, our platform operates on a strict ephemeral model:
          </p>
          
          <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 0.5rem; padding: 1.25rem; font-family: monospace; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 1rem; overflow-x: auto; text-align: center;">
            [ User Uploads Batch Files ]<br>
            │<br>
            ▼<br>
            [ Engine Compiles Bundle Output ]<br>
            │<br>
            ▼<br>
            [ 2-Hour Countdown Timer Triggers ] ──► [ Permanent, Unrecoverable Deletion ]
          </div>

          <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5;">
            Once your processing concludes, our architecture caches the completed bundle on secure, isolated scratch disks for exactly two (2) hours to facilitate successful downloads. Upon expiry of this window, our automated file scrubbers execute a permanent deletion sweep. Expired files are unrecoverable.
          </p>
        </div>

        <div>
          <h4 style="font-size: 1.1rem; font-weight: 700; color: var(--accent-primary); margin-bottom: 0.5rem;">4. Subscription Fees, Cancellations, and Refunds</h4>
          <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 0.5rem;">
            <strong>4.1 Subscription Billing Mechanics:</strong> Access to basic tools is free within certain file limits. Extended tiers require recurring monthly or annual payments. By selecting a Premium or Enterprise package, you authorize our third-party, PCI-DSS compliant billing gateways to process recurring transaction amounts.
          </p>
          <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 0.5rem;">
            <strong>4.2 Cancellation Policy:</strong> You are free to cancel your active subscription package at any time directly through your dashboard billing profile. Your account will maintain unrestricted premium parameters until the conclusion of your current paid billing period.
          </p>
          <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5;">
            <strong>4.3 Refund Exceptions:</strong> Given the digital nature of immediate server capacity allocation, fees paid to PDF Bundles are generally non-refundable. Exceptions are evaluated strictly on a case-by-case basis if our automated engine experiences a system-wide infrastructure failure.
          </p>
        </div>
      </div>

      <div class="crm-card" style="padding: 1.5rem; background: rgba(239, 68, 68, 0.02); border: 1.5px dashed rgba(239, 68, 68, 0.2); border-radius: 1rem; text-align: left; margin-top: 2rem; margin-bottom: 2rem;">
        <h4 style="font-size: 1.1rem; font-weight: 700; color: #ef4444; margin-bottom: 0.5rem;">⚠️ Limitation of Liability and Warranties</h4>
        <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 0.75rem;">
          <strong>International Legal Disclaimer:</strong> PDF Bundles is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express or implied. We do not guarantee that our services will operate completely uninterrupted, error-free, or that your compiled document sets will match arbitrary layout standards across all external document readers.
        </p>
        <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; margin: 0;">
          In no event shall PDF Bundles, its parent corporations, founders, directors, employees, or tech partners be held liable for any indirect, incidental, special, consequential, or punitive damages—including without limitation, loss of business profits, data corruption, operational downtime, or financial setbacks resulting from your use or inability to use our platform.
        </p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 1.5rem; text-align: left;">
        <div>
          <h4 style="font-size: 1.1rem; font-weight: 700; color: var(--accent-primary); margin-bottom: 0.5rem;">6. Global Compliance, Indemnification, and Governing Law</h4>
          <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 0.5rem;">
            <strong>6.1 User Indemnification:</strong> You agree to defend, indemnify, and hold harmless PDF Bundles and its licensees from and against any claims, damages, liabilities, losses, costs, or debt arising directly from your violation of these Terms or the unlawful nature of the document contents you upload.
          </p>
          <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5;">
            <strong>6.2 Governing Jurisdictions:</strong> These Terms shall be interpreted, governed, and construed in accordance with standard international electronic commerce frameworks and prevailing commercial laws.
          </p>
        </div>

        <div>
          <h4 style="font-size: 1.1rem; font-weight: 700; color: var(--accent-primary); margin-bottom: 0.5rem;">7. Revisions to This Agreement</h4>
          <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin: 0;">
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will make reasonable efforts to provide at least 30 days' notice prior to any new terms taking effect. Continued use of our tools after revisions go live constitutes binding acceptance of the updated terms.
          </p>
        </div>
      </div>
    `
  },
  about: {
    title: "👥 About Us",
    subtitle: "Our Mission & Global Vision",
    content: `
      <div style="margin-bottom: 2.5rem; text-align: left;">
        <p style="font-size: 1.1rem; color: var(--text-secondary); line-height: 1.6;">
          At PDF Bundles, we believe that true productivity doesn't come from handling documents faster—it comes from handling them collectively.
        </p>
        <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.5; margin-top: 0.75rem;">
          Every day, millions of professionals waste valuable hours manually opening, organizing, converting, and saving individual files one by one. We engineered PDF Bundles to eliminate this operational friction. Our platform reimagines document management by introducing a high-performance, batch-focused workspace where complex multi-file collections are transformed into streamlined, professional document sets instantly.
        </p>
      </div>

      <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem; margin-bottom: 1.5rem; text-align: left;">📊 The Core Values That Drive Us</h3>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.5rem; margin-bottom: 3rem; text-align: left;">
        <div class="crm-card" style="padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 0.75rem; background: var(--bg-card); display: flex; flex-direction: column; gap: 0.5rem;">
          <div style="font-size: 1.25rem; font-weight: 700; color: var(--accent-primary);">Batch Innovation</div>
          <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.4; margin: 0;">Built for multi-file automation at scale.</p>
        </div>
        <div class="crm-card" style="padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 0.75rem; background: var(--bg-card); display: flex; flex-direction: column; gap: 0.5rem;">
          <div style="font-size: 1.25rem; font-weight: 700; color: var(--accent-secondary);">Data Security First</div>
          <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.4; margin: 0;">Strict 2-hour server data-purging protocols.</p>
        </div>
        <div class="crm-card" style="padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 0.75rem; background: var(--bg-card); display: flex; flex-direction: column; gap: 0.5rem;">
          <div style="font-size: 1.25rem; font-weight: 700; color: #10b981;">Frictionless Design</div>
          <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.4; margin: 0;">Zero complex training; just drag, drop & bundle.</p>
        </div>
      </div>

      <div style="text-align: left; margin-bottom: 3rem;">
        <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem; margin-bottom: 1.5rem;">Engineered for the Modern Global Workflow</h3>
        
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          <div>
            <h4 style="font-size: 1.1rem; font-weight: 700; color: var(--accent-primary); margin-bottom: 0.25rem;">⚡ True Multi-File Batch Performance</h4>
            <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin: 0;">
              Unlike conventional platforms built around individual file modifications, our infrastructure is native to batch processing. Whether you are merging hundreds of invoices, extracting targeted reporting blocks, or converting vast presentation decks, our system utilizes distributed cloud processing to manage intense data payloads simultaneously without lagging your browser.
            </p>
          </div>

          <div>
            <h4 style="font-size: 1.1rem; font-weight: 700; color: var(--accent-primary); margin-bottom: 0.25rem;">🛡️ Absolute Privacy by Design</h4>
            <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin: 0;">
              We respect the confidentiality of your corporate records. PDF Bundles operates under a strict data-ephemerality framework. Your uploaded assets are completely isolated during processing and are permanently wiped from our server arrays exactly two hours after your task is completed. We never inspect, store, or sell your contents, and your documents are never used to train artificial intelligence models.
            </p>
          </div>

          <div>
            <h4 style="font-size: 1.1rem; font-weight: 700; color: var(--accent-primary); margin-bottom: 0.25rem;">🌐 Our Global Footprint</h4>
            <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin: 0;">
              From small creative agencies optimizing client portfolios to multi-national corporations processing thousands of daily shipping records, PDF Bundles is trusted by professionals worldwide. Our compliance frameworks match rigorous global data-handling principles, including GDPR standards, ensuring that your compliance teams can clear our application for everyday company workflows.
            </p>
          </div>
        </div>
      </div>

      <div class="crm-card" style="padding: 1.75rem; border: 1px solid var(--border-color); border-radius: 0.75rem; background: var(--bg-card); text-align: left;">
        <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">🤝 Connect With Our Team</h3>
        <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 1rem;">
          We are constantly expanding our tool suites, scaling our server pipelines, and rolling out new features to stay ahead of your document workflow needs. If you are interested in enterprise deployment, strategic partnerships, or custom workflow configurations, we invite you to start a conversation:
        </p>
        <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 0.5rem;">
          📧 General Inquiries: <a href="mailto:hello@pdfbundles.com" style="color: var(--accent-secondary); text-decoration: none;">hello@pdfbundles.com</a>
        </p>
        <p style="font-size: 0.9rem; color: var(--text-secondary); margin: 0;">
          💼 Enterprise & Partnerships: <a href="mailto:corporate@pdfbundles.com" style="color: var(--accent-secondary); text-decoration: none;">corporate@pdfbundles.com</a>
        </p>
      </div>
    `
  }
};

function navigateToInfoPage(pageKey) {
  currentTool = null;
  stopWebcamStream();
  clearWorkspace();

  document.getElementById('workspace-page').style.display = 'none';
  document.getElementById('dashboard-page').style.display = 'none';

  const accDash = document.getElementById('account-dashboard-page');
  if (accDash) accDash.style.display = 'none';

  const blogPage = document.getElementById('blog-page');
  if (blogPage) blogPage.style.display = 'none';

  const infoPage = document.getElementById('info-page');
  if (infoPage) infoPage.style.display = 'block';

  document.getElementById('btn-back-to-dashboard').style.display = 'flex';

  loadInfoPageContent(pageKey);
  updateHeaderTriggers();
}
window.navigateToInfoPage = navigateToInfoPage;

function loadInfoPageContent(pageKey) {
  const data = INFO_PAGES_DATA[pageKey] || INFO_PAGES_DATA['features'];
  
  const title = document.getElementById('info-page-title');
  const subtitle = document.getElementById('info-page-subtitle');
  const contentCard = document.getElementById('info-page-content-card');
  
  if (title) title.textContent = data.title;
  if (subtitle) subtitle.textContent = data.subtitle;
  if (contentCard) contentCard.innerHTML = data.content;
  
  // Highlight the active page in the navigator sidebar
  document.querySelectorAll('.info-nav-link').forEach(link => {
    if (link.getAttribute('data-page') === pageKey) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Scroll to top of card content
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.loadInfoPageContent = loadInfoPageContent;

