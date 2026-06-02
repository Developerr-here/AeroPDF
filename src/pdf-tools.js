import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker using Vite's URL import
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// Helper: Handle file download ArrayBuffer responses
async function handleBufferResponse(response, defaultErrorMsg) {
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || defaultErrorMsg);
  }
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

// Helper: Handle JSON responses
async function handleJSONResponse(response, defaultErrorMsg) {
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || defaultErrorMsg);
  }
  return await response.json();
}

/* ==========================================
   1. ORGANIZE PDF API METHODS
   ========================================== */

export async function mergePDFs(files) {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  const res = await fetch('/api/merge', { method: 'POST', body: formData });
  return handleBufferResponse(res, 'Failed to merge PDF files.');
}

export async function splitPDF(file, pageIndices) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('mode', 'selected');
  formData.append('pages', JSON.stringify(pageIndices));
  const res = await fetch('/api/split', { method: 'POST', body: formData });
  return handleBufferResponse(res, 'Failed to extract selected pages.');
}

export async function splitPDFIntoIndividual(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('mode', 'all-split');
  const res = await fetch('/api/split', { method: 'POST', body: formData });
  const data = await handleJSONResponse(res, 'Failed to split pages individually.');
  
  return data.pages.map(page => {
    const binaryString = atob(page.base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return { pageNum: page.pageNum, bytes };
  });
}

export async function removePages(file, removeIndices) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('pages', JSON.stringify(removeIndices));
  const res = await fetch('/api/remove-pages', { method: 'POST', body: formData });
  return handleBufferResponse(res, 'Failed to delete selected pages.');
}

export async function organizePDF(file, orderIndices) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('order', JSON.stringify(orderIndices));
  const res = await fetch('/api/organize-pdf', { method: 'POST', body: formData });
  return handleBufferResponse(res, 'Failed to apply new page order.');
}

/* ==========================================
   2. OPTIMIZE PDF API METHODS
   ========================================== */

export async function compressPDF(file, level) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('level', level); // 'low', 'medium', 'high'
  const res = await fetch('/api/compress', { method: 'POST', body: formData });
  return handleBufferResponse(res, 'Failed to compress PDF document.');
}

export async function repairPDF(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/repair', { method: 'POST', body: formData });
  return handleBufferResponse(res, 'Failed to repair PDF structure.');
}

export async function ocrPDF(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/ocr', { method: 'POST', body: formData });
  return handleBufferResponse(res, 'OCR rendering operation failed.');
}

/* ==========================================
   3. CONVERT TO PDF API METHODS
   ========================================== */

export async function imagesToPDF(imageFiles, pageSize = 'a4', orientation = 'portrait') {
  const formData = new FormData();
  imageFiles.forEach(file => formData.append('files', file));
  formData.append('pageSize', pageSize);
  formData.append('orientation', orientation);
  const res = await fetch('/api/img-to-pdf', { method: 'POST', body: formData });
  return handleBufferResponse(res, 'Failed to convert images to PDF.');
}

export async function officeToPDF(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/office-to-pdf', { method: 'POST', body: formData });
  return handleBufferResponse(res, 'Failed to compile Office file to PDF.');
}

export async function htmlToPDF(payload) {
  // payload can contain { mode: 'code', html: '...' } or { mode: 'url', url: '...' }
  const res = await fetch('/api/html-to-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleBufferResponse(res, 'Failed to compile HTML into PDF.');
}

/* ==========================================
   4. CONVERT FROM PDF API METHODS
   ========================================== */

export async function pdfToOffice(file, format) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('format', format); // docx, xlsx, pptx
  const res = await fetch('/api/pdf-to-office', { method: 'POST', body: formData });
  
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Extraction failed.');
  }
  return await res.blob(); // Return Blob to accommodate different content-types (csv, docx)
}

/* ==========================================
   5. EDIT PDF API METHODS
   ========================================== */

export async function rotatePDF(file, rotations) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('rotations', JSON.stringify(rotations));
  const res = await fetch('/api/rotate', { method: 'POST', body: formData });
  return handleBufferResponse(res, 'Failed to apply page rotations.');
}

export async function addPageNumbers(file, position, format) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('position', position);
  formData.append('format', format);
  const res = await fetch('/api/page-numbers', { method: 'POST', body: formData });
  return handleBufferResponse(res, 'Failed to stamp page numbers.');
}

export async function addWatermark(file, text, size, rotation, opacity) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('text', text);
  formData.append('size', size);
  formData.append('rotation', rotation);
  formData.append('opacity', opacity);
  const res = await fetch('/api/watermark', { method: 'POST', body: formData });
  return handleBufferResponse(res, 'Failed to stamp watermark.');
}

export async function cropPDF(file, margins) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('left', margins.left);
  formData.append('right', margins.right);
  formData.append('top', margins.top);
  formData.append('bottom', margins.bottom);
  const res = await fetch('/api/crop', { method: 'POST', body: formData });
  return handleBufferResponse(res, 'Failed to crop PDF document.');
}

export async function editPDF(file, elements) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('elements', JSON.stringify(elements));
  const res = await fetch('/api/edit-pdf', { method: 'POST', body: formData });
  return handleBufferResponse(res, 'Failed to write text edits.');
}

export async function fillPDFForms(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/pdf-forms', { method: 'POST', body: formData });
  return handleBufferResponse(res, 'Forms filling action failed.');
}

/* ==========================================
   6. PDF SECURITY API METHODS
   ========================================== */

export async function protectPDF(file, password) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('password', password);
  const res = await fetch('/api/protect', { method: 'POST', body: formData });
  return handleBufferResponse(res, 'Failed to encrypt PDF.');
}

export async function unlockPDF(file, password) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('password', password);
  const res = await fetch('/api/unlock', { method: 'POST', body: formData });
  return handleBufferResponse(res, 'Failed to decrypt PDF.');
}

export async function signPDF(file, signatureBase64, pageIndex, x, y, width, height) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('signature', signatureBase64);
  formData.append('pageIndex', pageIndex);
  formData.append('x', x);
  formData.append('y', y);
  formData.append('width', width);
  formData.append('height', height);
  
  const res = await fetch('/api/sign', { method: 'POST', body: formData });
  return handleBufferResponse(res, 'Failed to overlay signature.');
}

export async function redactPDF(file, areas) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('areas', JSON.stringify(areas));
  const res = await fetch('/api/redact', { method: 'POST', body: formData });
  return handleBufferResponse(res, 'Failed to apply redaction blackouts.');
}

export async function comparePDFs(fileA, fileB) {
  const formData = new FormData();
  formData.append('files', fileA);
  formData.append('files', fileB);
  const res = await fetch('/api/compare', { method: 'POST', body: formData });
  return handleJSONResponse(res, 'Failed to run metadata comparisons.');
}

/* ==========================================
   CLIENT SIDE OPERATIONS (SAVING SERVER COST)
   ========================================== */

export async function pdfToImages(file, onProgress) {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  const images = [];
  
  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    const renderContext = { canvasContext: context, viewport: viewport };
    await page.render(renderContext).promise;
    const dataUrl = canvas.toDataURL('image/png');
    images.push({ pageNum: i, dataUrl });
    
    if (onProgress) {
      onProgress(i, totalPages);
    }
  }
  return images;
}

export async function generatePagePreviews(pdfBuffer, onProgress) {
  const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  const previews = [];
  
  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 0.5 });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    const renderContext = { canvasContext: context, viewport: viewport };
    await page.render(renderContext).promise;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    previews.push({ pageNum: i, dataUrl });
    
    if (onProgress) {
      onProgress(i, totalPages);
    }
  }
  return previews;
}
