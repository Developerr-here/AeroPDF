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

/* ==========================================
   PDF AI INTELLIGENCE API METHODS
   ========================================== */

export async function aiSummarizePDF(file, token) {
  const formData = new FormData();
  formData.append('file', file);
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch('/api/ai/summarize', {
    method: 'POST',
    headers: headers,
    body: formData
  });
  return handleJSONResponse(res, 'AI Summarizer failed.');
}

export async function aiTranslatePDF(file, targetLanguage, token) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('targetLanguage', targetLanguage);
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch('/api/ai/translate', {
    method: 'POST',
    headers: headers,
    body: formData
  });
  return handleJSONResponse(res, 'AI Translation failed.');
}

/* ==========================================
   AI IMAGE API METHODS & FALLBACKS
   ========================================== */

export async function aiRemoveBackground(file, token) {
  const formData = new FormData();
  formData.append('file', file);
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch('/api/image/remove-background', {
    method: 'POST',
    headers: headers,
    body: formData
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Background removal failed.');
  }

  const isMock = res.headers.get('x-mock-active') === 'true';
  const arrayBuffer = await res.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  if (isMock) {
    return await processClientMockBackgroundRemoval(bytes, file.type);
  }
  return bytes;
}

export async function aiUpscaleImage(file, factor, token) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('factor', factor);
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch('/api/image/upscale', {
    method: 'POST',
    headers: headers,
    body: formData
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Image upscaling failed.');
  }

  const isMock = res.headers.get('x-mock-active') === 'true';
  const upscaleFactor = res.headers.get('x-upscale-factor') || factor || '2';
  const arrayBuffer = await res.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  if (isMock) {
    return await processClientMockUpscale(bytes, upscaleFactor, file.type);
  }
  return bytes;
}

async function processClientMockBackgroundRemoval(bytes, mimeType) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([bytes], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      
      // Chroma-keying: Make white and near-white pixels transparent
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // If pixel is near-white (R > 215, G > 215, B > 215)
        if (r > 215 && g > 215 && b > 215) {
          data[i + 3] = 0; // Set alpha to 0 (fully transparent)
        }
      }
      
      ctx.putImageData(imgData, 0, 0);
      canvas.toBlob((resultBlob) => {
        if (!resultBlob) return reject(new Error('Failed to create transparent image blob.'));
        resultBlob.arrayBuffer().then(ab => {
          resolve(new Uint8Array(ab));
        });
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for transparent background processing.'));
    };
    img.src = url;
  });
}

async function processClientMockUpscale(bytes, factor, mimeType) {
  return new Promise((resolve, reject) => {
    const scale = parseInt(factor || '2');
    const blob = new Blob([bytes], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      
      // Draw image scaled up (bilinear smoothing is on by default)
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Apply a simple sharpening kernel to improve resolution appearance
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      const w = canvas.width;
      const h = canvas.height;
      
      // 3x3 convolution sharpen filter
      const weights = [
         0, -0.5,  0,
        -0.5,  3, -0.5,
         0, -0.5,  0
      ];
      const side = Math.round(Math.sqrt(weights.length));
      const halfSide = Math.floor(side / 2);
      
      const output = ctx.createImageData(w, h);
      const dst = output.data;
      
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const sy = y;
          const sx = x;
          const dstOff = (y * w + x) * 4;
          
          let r = 0, g = 0, b = 0, a = 0;
          for (let cy = 0; cy < side; cy++) {
            for (let cx = 0; cx < side; cx++) {
              const scy = Math.min(h - 1, Math.max(0, sy + cy - halfSide));
              const scx = Math.min(w - 1, Math.max(0, sx + cx - halfSide));
              const srcOff = (scy * w + scx) * 4;
              const wt = weights[cy * side + cx];
              r += data[srcOff] * wt;
              g += data[srcOff + 1] * wt;
              b += data[srcOff + 2] * wt;
              a += data[srcOff + 3] * wt;
            }
          }
          
          dst[dstOff] = Math.min(255, Math.max(0, r));
          dst[dstOff + 1] = Math.min(255, Math.max(0, g));
          dst[dstOff + 2] = Math.min(255, Math.max(0, b));
          dst[dstOff + 3] = data[dstOff + 3]; // keep original alpha
        }
      }
      
      ctx.putImageData(output, 0, 0);
      
      canvas.toBlob((resultBlob) => {
        if (!resultBlob) return reject(new Error('Failed to create upscaled image blob.'));
        resultBlob.arrayBuffer().then(ab => {
          resolve(new Uint8Array(ab));
        });
      }, mimeType);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for upscaling.'));
    };
    img.src = url;
  });
}
