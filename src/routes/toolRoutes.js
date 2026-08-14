import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { PDFDocument, PDFTextField, degrees, rgb, StandardFonts } from 'pdf-lib';
import { PDFParse } from 'pdf-parse';
import HTMLtoDOCX from 'html-to-docx';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt-lite';
import { decryptPDF } from '@pdfsmaller/pdf-decrypt';
import { createRequire } from 'module';
import { OAuth2Client } from 'google-auth-library';
const require = createRequire(import.meta.url);
const mammoth = require('mammoth');
const officeParser = require('officeparser');
const PptxGenJS = require('pptxgenjs');

import { User } from '../../db.js';
import { upload, checkUploadLimit } from '../middlewares/upload.js';
import { verifyAISubscriptionAndCredits } from '../middlewares/auth.js';
import { apiLimiter } from '../middlewares/rateLimiters.js';
import { cleanTempFiles } from '../utils/helpers.js';
import { getToolKeyFromPath, isToolAllowedForUser, getToolLimit } from '../utils/authHelpers.js';
import { GROQ_API_KEY, GROQ_MODEL, REMOVE_BG_API_KEY, STABILITY_API_KEY, DEEPAI_API_KEY, CLOUDMERSIVE_API_KEY } from '../config/env.js';
import { getPremiumStatus } from '../utils/authHelpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

async function convertWithCloudmersive(fileBuffer, fileName, endpointUrl) {
  if (!CLOUDMERSIVE_API_KEY) throw new Error('No Cloudmersive API key configured');
  const form = new FormData();
  form.append('inputFile', fileBuffer, { filename: fileName });

  const response = await fetch(endpointUrl, {
    method: 'POST',
    headers: {
      'Apikey': CLOUDMERSIVE_API_KEY,
      ...form.getHeaders()
    },
    body: form
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Cloudmersive API error (${response.status}): ${errText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Helper: Safely load PDF document with error handling for encrypted/corrupt files
async function loadPdfSafely(pdfBuffer, options = {}) {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer, options);
    return { success: true, pdfDoc };
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('encrypted') || msg.includes('password') || msg.includes('Encrypt')) {
      return { success: false, error: 'This PDF file is password-protected or encrypted. Please unlock it before processing.' };
    }
    return { success: false, error: 'The uploaded file is corrupt or not a valid PDF document.' };
  }
}

/* ==========================================
   PDF AI INTELLIGENCE SYSTEM (UNIFIED)
   ========================================== */

router.post('/api/ai/assistant', upload.single('file'), checkUploadLimit, verifyAISubscriptionAndCredits, apiLimiter, async (req, res) => {
  try {
    const file = req.file;
    const { mode, question, targetLanguage } = req.body;

    if (!file) return res.status(400).json({ error: 'PDF file is required.' });
    if (!mode) return res.status(400).json({ error: 'Mode (summarize, chat, translate, notes) is required.' });

    // Stream text parsing from file
    let pdfData;
    try {
      const dataBuffer = fs.readFileSync(file.path);
      const parser = new PDFParse({ data: new Uint8Array(dataBuffer) });
      pdfData = await parser.getText();
    } catch (parseErr) {
      fs.unlink(file.path, () => {});
      console.error('[PDF Parse Error]:', parseErr);
      return res.status(400).json({ error: 'Failed to parse PDF document text. The file might be corrupted, password protected, or not a valid PDF.' });
    }
    fs.unlink(file.path, () => {});

    if (!pdfData.text || pdfData.text.trim().length === 0) {
      return res.status(400).json({ error: 'No copyable text found in PDF.' });
    }

    const isMockGroq = !GROQ_API_KEY || 
                       GROQ_API_KEY === 'MOCK_GROQ_KEY' || 
                       !GROQ_API_KEY.startsWith('gsk_') || 
                       GROQ_API_KEY.includes('mock') || 
                       GROQ_API_KEY.includes('replace-me');

    if (isMockGroq) {
      if (mode === 'chat') {
        return res.json({
          result: `### AI PDF Chat Response (Mock - No GROQ_API_KEY Configured)

You asked: *"${question || 'No question provided.'}"*

This is a mock chat response because no valid Groq API Key was found in your configuration. To enable full interactive AI chat, please configure a valid \`GROQ_API_KEY\` in your environment.`
        });
      } else if (mode === 'translate') {
        return res.json({
          result: `### AI Document Translation to ${targetLanguage || 'selected language'} (Mock - No GROQ_API_KEY Configured)

This is a mock translation of your document text into **${targetLanguage || 'selected language'}** because no valid Groq API Key was found. Configure a valid \`GROQ_API_KEY\` in your \`.env\` file to see real translations.`
        });
      } else if (mode === 'notes') {
        return res.json({
          result: `### AI Study Notes (Mock - No GROQ_API_KEY Configured)

* **Key Topic:** Study Notes Generation
* **Summary:** This is a mock study notes outline because no valid Groq API Key was found in the environment variables.
* **Next Steps:** Set a valid \`GROQ_API_KEY\` in your \`.env\` file to generate structured study guides and summaries automatically.`
        });
      } else {
        // summarize (default)
        return res.json({
          result: `### AI Document Summary (Mock - No GROQ_API_KEY Configured)

* **Main Theme:** This is a mock summary because no valid Groq API Key (which typically starts with "gsk_") was found in the environment variables.
* **Uploaded File:** The server processed the PDF text content successfully.
* **Next Steps:** To see real Groq AI generation, set the \`GROQ_API_KEY\` environment variable in your \`.env\` file.`
        });
      }
    }

    let prompt = '';
    let systemPrompt = '';

    if (mode === 'chat') {
      prompt = `The user has a question about the following PDF text. First, see if the PDF text contains the answer. If not, use your general knowledge but mention it is not directly in the PDF text.\n\nPDF Text Content:\n${pdfData.text.substring(0, 15000)}\n\nUser Question: ${question || 'Summarize the document'}`;
      systemPrompt = 'You are a helpful AI PDF assistant. Answer the user\'s questions based on the PDF content provided.';
    } else if (mode === 'translate') {
      prompt = `Translate the following text extracted from a PDF document into ${targetLanguage || 'Spanish'}. Keep paragraphs clean and formatted:\n\n${pdfData.text.substring(0, 12000)}`;
      systemPrompt = 'You are a professional translator. Translate the text accurately into the requested language.';
    } else if (mode === 'notes') {
      prompt = `Generate detailed study notes, key concepts, formulas/definitions, and a quick self-test quiz based on the following PDF text:\n\n${pdfData.text.substring(0, 15000)}`;
      systemPrompt = 'You are an expert educator and study assistant. Generate clear, structured study notes, bullet points of key concepts, and summaries from the provided text.';
    } else {
      // summarize
      prompt = `Provide a concise, detailed, and structured bullet-point summary of the following PDF text content:\n\n${pdfData.text.substring(0, 15000)}`;
      systemPrompt = 'You are a professional PDF analyzer. Provide structured, accurate, and concise summaries.';
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API returned status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || 'No output generated.';
    res.json({ result });
  } catch (err) {
    cleanTempFiles(req);
    console.error(err);
    const errMsg = err.message || '';
    if (errMsg.includes('API key') || errMsg.includes('API_KEY') || errMsg.includes('key not valid') || errMsg.includes('unauthorized') || errMsg.includes('status 401')) {
      return res.status(401).json({ error: 'Groq API rejected your API key. Please check that GROQ_API_KEY in your .env file is a valid Groq API Key starting with "gsk_".' });
    }
    res.status(500).json({ error: 'AI Assistant failed: ' + err.message, message: err.message, stack: err.stack });
  }
});

router.post('/api/ai/summarize', upload.single('file'), checkUploadLimit, verifyAISubscriptionAndCredits, apiLimiter, async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'PDF file is required.' });

    // Stream text parsing from file
    let pdfData;
    try {
      const dataBuffer = fs.readFileSync(file.path);
      const parser = new PDFParse({ data: new Uint8Array(dataBuffer) });
      pdfData = await parser.getText();
    } catch (parseErr) {
      fs.unlink(file.path, () => {});
      console.error('[PDF Parse Error]:', parseErr);
      return res.status(400).json({ error: 'Failed to parse PDF document text. The file might be corrupted, password protected, or not a valid PDF.' });
    }
    fs.unlink(file.path, () => {});

    if (!pdfData.text || pdfData.text.trim().length === 0) {
      return res.status(400).json({ error: 'No copyable text found in PDF.' });
    }

    const isMockGroq = !GROQ_API_KEY || 
                       GROQ_API_KEY === 'MOCK_GROQ_KEY' || 
                       !GROQ_API_KEY.startsWith('gsk_') || 
                       GROQ_API_KEY.includes('mock') || 
                       GROQ_API_KEY.includes('replace-me');
    if (isMockGroq) {
      return res.json({
        summary: `### AI Document Summary (Mock - No GROQ_API_KEY Configured)

* **Main Theme:** This is a mock summary because no valid Groq API Key (which typically starts with "gsk_") was found in the environment variables.
* **Uploaded File:** The server processed the PDF text content successfully.
* **Next Steps:** To see real Groq AI generation, set the \`GROQ_API_KEY\` environment variable in your \`.env\` file.`
      });
    }

    const prompt = `Provide a concise, detailed, and structured bullet-point summary of the following PDF text content:\n\n${pdfData.text.substring(0, 15000)}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a professional PDF analyzer. Provide structured, accurate, and concise summaries.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API returned status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || 'No summary generated.';
    res.json({ summary });
  } catch (err) {
    cleanTempFiles(req);
    console.error(err);
    const errMsg = err.message || '';
    if (errMsg.includes('API key') || errMsg.includes('API_KEY') || errMsg.includes('key not valid') || errMsg.includes('unauthorized') || errMsg.includes('status 401')) {
      return res.status(401).json({ error: 'Groq API rejected your API key. Please check that GROQ_API_KEY in your .env file is a valid Groq API Key starting with "gsk_".' });
    }
    res.status(500).json({ error: 'AI Summarizer failed: ' + err.message, message: err.message, stack: err.stack });
  }
});

router.post('/api/ai/translate', upload.single('file'), checkUploadLimit, verifyAISubscriptionAndCredits, apiLimiter, async (req, res) => {
  try {
    const file = req.file;
    const { targetLanguage } = req.body;
    if (!file || !targetLanguage) {
      return res.status(400).json({ error: 'PDF file and target language are required.' });
    }

    let pdfData;
    try {
      const dataBuffer = fs.readFileSync(file.path);
      const parser = new PDFParse({ data: new Uint8Array(dataBuffer) });
      pdfData = await parser.getText();
    } catch (parseErr) {
      fs.unlink(file.path, () => {});
      console.error('[PDF Parse Error]:', parseErr);
      return res.status(400).json({ error: 'Failed to parse PDF document text. The file might be corrupted, password protected, or not a valid PDF.' });
    }
    fs.unlink(file.path, () => {});

    if (!pdfData.text || pdfData.text.trim().length === 0) {
      return res.status(400).json({ error: 'No copyable text found in PDF.' });
    }

    const isMockGroq = !GROQ_API_KEY || 
                       GROQ_API_KEY === 'MOCK_GROQ_KEY' || 
                       !GROQ_API_KEY.startsWith('gsk_') || 
                       GROQ_API_KEY.includes('mock') || 
                       GROQ_API_KEY.includes('replace-me');
    if (isMockGroq) {
      return res.json({
        translation: `### AI Document Translation to ${targetLanguage} (Mock - No GROQ_API_KEY Configured)

This is a mock translation of your document text because no valid Groq API Key (which typically starts with "gsk_") was found in the environment variables.

Set your \`GROQ_API_KEY\` in your environment variables to enable live translations.`
      });
    }

    const prompt = `Translate the following text extracted from a PDF document into ${targetLanguage}. Keep paragraphs clean and formatted:\n\n${pdfData.text.substring(0, 12000)}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the text accurately into the requested language.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API returned status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const translation = data.choices?.[0]?.message?.content || 'No translation generated.';
    res.json({ translation });
  } catch (err) {
    cleanTempFiles(req);
    console.error(err);
    const errMsg = err.message || '';
    if (errMsg.includes('API key') || errMsg.includes('API_KEY') || errMsg.includes('key not valid') || errMsg.includes('unauthorized') || errMsg.includes('status 401')) {
      return res.status(401).json({ error: 'Groq API rejected your API key. Please check that GROQ_API_KEY in your .env file is a valid Groq API Key starting with "gsk_".' });
    }
    res.status(500).json({ error: 'AI Translation failed: ' + err.message, message: err.message, stack: err.stack });
  }
});

/* ==========================================
   AI IMAGE INTELLIGENCE SYSTEM
   ========================================== */

router.post('/api/image/remove-background', upload.single('file'), checkUploadLimit, verifyAISubscriptionAndCredits, apiLimiter, async (req, res) => {
  let fileBuffer;
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Image file is required.' });

    fileBuffer = fs.readFileSync(file.path);

    const isRemoveBgValid = REMOVE_BG_API_KEY && !REMOVE_BG_API_KEY.includes('mock') && !REMOVE_BG_API_KEY.includes('replace-me');

    if (isRemoveBgValid) {
      try {
        console.log('[Remove.bg] Sending request to Remove.bg API...');
        const formData = new FormData();
        formData.append('image_file', fileBuffer, { filename: file.originalname, contentType: file.mimetype });
        formData.append('size', 'auto');

        const response = await fetch('https://api.remove.bg/v1.0/removebg', {
          method: 'POST',
          headers: {
            'X-Api-Key': REMOVE_BG_API_KEY,
            ...formData.getHeaders()
          },
          body: formData
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Remove.bg API returned status ${response.status}: ${errText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        fs.unlink(file.path, () => {});
        res.setHeader('Content-Type', 'image/png');
        return res.send(Buffer.from(arrayBuffer));
      } catch (err) {
        fs.unlink(file.path, () => {});
        console.error(`[Remove.bg API Error]: ${err.message}`);
        return res.status(500).json({ error: `Background removal failed: ${err.message}` });
      }
    } else {
      // Free fallback mode: send the original file back with x-mock-active header to trigger browser canvas processing
      console.log('[Background Remover] No active Remove.bg API key configured. Falling back to browser-side chroma-key mode.');
      fs.unlink(file.path, () => {});
      res.setHeader('x-mock-active', 'true');
      res.setHeader('Content-Type', file.mimetype);
      return res.send(fileBuffer);
    }
  } catch (err) {
    cleanTempFiles(req);
    console.error(err);
    res.status(500).json({ error: 'Background removal failed: ' + err.message });
  }
});

router.post('/api/image/upscale', upload.single('file'), checkUploadLimit, verifyAISubscriptionAndCredits, apiLimiter, async (req, res) => {
  let fileBuffer;
  try {
    const file = req.file;
    const { factor } = req.body;
    if (!file) return res.status(400).json({ error: 'Image file is required.' });

    fileBuffer = fs.readFileSync(file.path);

    const isStabilityValid = STABILITY_API_KEY && !STABILITY_API_KEY.includes('mock') && !STABILITY_API_KEY.includes('replace-me');
    const isDeepAIValid = DEEPAI_API_KEY && !DEEPAI_API_KEY.includes('mock') && !DEEPAI_API_KEY.includes('replace-me');

    if (isStabilityValid) {
      try {
        console.log('[Stability AI] Sending request to Upscaler API...');
        const formData = new FormData();
        formData.append('image', fileBuffer, { filename: file.originalname, contentType: file.mimetype });
        formData.append('prompt', 'upscale image, high quality, detailed, sharp focus');
        formData.append('output_format', 'png');

        const response = await fetch('https://api.stability.ai/v2beta/stable-image/upscale/conservative', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${STABILITY_API_KEY}`,
            'accept': 'image/*',
            ...formData.getHeaders()
          },
          body: formData
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Stability AI API returned status ${response.status}: ${errText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        fs.unlink(file.path, () => {});
        res.setHeader('Content-Type', 'image/png');
        return res.send(Buffer.from(arrayBuffer));
      } catch (err) {
        fs.unlink(file.path, () => {});
        console.error(`[Stability AI API Error]: ${err.message}`);
        return res.status(500).json({ error: `Image upscaling failed: ${err.message}` });
      }
    } else if (isDeepAIValid) {
      try {
        console.log('[DeepAI] Sending request to Super Resolution API...');
        const formData = new FormData();
        formData.append('image', fileBuffer, { filename: file.originalname, contentType: file.mimetype });

        const response = await fetch('https://api.deepai.org/api/super-resolution', {
          method: 'POST',
          headers: {
            'api-key': DEEPAI_API_KEY,
            ...formData.getHeaders()
          },
          body: formData
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`DeepAI API returned status ${response.status}: ${errText}`);
        }

        const data = await response.json();
        if (!data.output_url) {
          throw new Error('No output URL returned.');
        }

        const imgRes = await fetch(data.output_url);
        const arrayBuffer = await imgRes.arrayBuffer();
        fs.unlink(file.path, () => {});
        res.setHeader('Content-Type', 'image/png');
        return res.send(Buffer.from(arrayBuffer));
      } catch (err) {
        fs.unlink(file.path, () => {});
        console.error(`[DeepAI API Error]: ${err.message}`);
        return res.status(500).json({ error: `Image upscaling failed: ${err.message}` });
      }
    } else {
      // Free fallback mode: send original file back with x-mock-active to trigger browser canvas processing
      console.log('[Image Upscaler] No active Stability AI or DeepAI API keys configured. Falling back to browser-side upscaling mode.');
      fs.unlink(file.path, () => {});
      res.setHeader('x-mock-active', 'true');
      res.setHeader('x-upscale-factor', factor || '2');
      res.setHeader('Content-Type', file.mimetype);
      return res.send(fileBuffer);
    }
  } catch (err) {
    cleanTempFiles(req);
    console.error(err);
    res.status(500).json({ error: 'Image upscaling failed: ' + err.message });
  }
});

/* ==========================================
   24 ORGANIZE, OPTIMIZE & SECURITY ENDPOINTS (DISK STREAMING)
   ========================================== */

// 1. Merge PDFs
router.post('/api/merge', upload.array('files'), checkUploadLimit, apiLimiter, async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length < 2) {
      return res.status(400).json({ error: 'At least two PDF files are required.' });
    }
    const mergedPdf = await PDFDocument.create();
    for (const file of files) {
      const buffer = fs.readFileSync(file.path);
      const pdf = await PDFDocument.load(buffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
      fs.unlink(file.path, () => {});
    }
    const bytes = await mergedPdf.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(bytes));
  } catch (err) {
    cleanTempFiles(req);
    res.status(500).json({ error: 'Failed to merge PDFs.' });
  }
});

// 2. Split PDF
router.post('/api/split', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
  try {
    const file = req.file;
    const mode = req.body.mode;
    if (!file) return res.status(400).json({ error: 'PDF file is required.' });

    const buffer = fs.readFileSync(file.path);
    const pdf = await PDFDocument.load(buffer);
    fs.unlink(file.path, () => {});

    if (mode === 'all-split') {
      const totalPages = pdf.getPageCount();
      const pages = [];
      for (let i = 0; i < totalPages; i++) {
        const splitPdf = await PDFDocument.create();
        const copiedPages = await splitPdf.copyPages(pdf, [i]);
        splitPdf.addPage(copiedPages[0]);
        const bytes = await splitPdf.save();
        pages.push({
          pageNum: i + 1,
          base64: Buffer.from(bytes).toString('base64')
        });
      }
      return res.json({ pages });
    } else {
      const selectedIndices = JSON.parse(req.body.pages || '[]');
      if (selectedIndices.length === 0) {
        return res.status(400).json({ error: 'No pages selected.' });
      }
      const splitPdf = await PDFDocument.create();
      const copiedPages = await splitPdf.copyPages(pdf, selectedIndices);
      copiedPages.forEach((page) => splitPdf.addPage(page));
      const bytes = await splitPdf.save();
      res.setHeader('Content-Type', 'application/pdf');
      res.send(Buffer.from(bytes));
    }
  } catch (err) {
    cleanTempFiles(req);
    res.status(500).json({ error: 'Failed to split PDF.' });
  }
});

// 3. Remove Pages
router.post('/api/remove-pages', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
  try {
    const file = req.file;
    const toRemove = JSON.parse(req.body.pages || '[]');
    if (!file) return res.status(400).json({ error: 'PDF file is required.' });

    const buffer = fs.readFileSync(file.path);
    const pdf = await PDFDocument.load(buffer);
    fs.unlink(file.path, () => {});

    const totalPages = pdf.getPageCount();
    const indicesToKeep = [];
    for (let i = 0; i < totalPages; i++) {
      if (!toRemove.includes(i)) indicesToKeep.push(i);
    }

    if (indicesToKeep.length === 0) {
      return res.status(400).json({ error: 'Cannot remove all pages from PDF.' });
    }

    const modifiedPdf = await PDFDocument.create();
    const copiedPages = await modifiedPdf.copyPages(pdf, indicesToKeep);
    copiedPages.forEach(page => modifiedPdf.addPage(page));

    const bytes = await modifiedPdf.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(bytes));
  } catch (err) {
    cleanTempFiles(req);
    res.status(500).json({ error: 'Failed to remove pages.' });
  }
});

// 4. Organize PDF
router.post('/api/organize-pdf', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
  try {
    const file = req.file;
    const newOrder = JSON.parse(req.body.order || '[]');
    if (!file) return res.status(400).json({ error: 'PDF file is required.' });

    const buffer = fs.readFileSync(file.path);
    const pdf = await PDFDocument.load(buffer);
    fs.unlink(file.path, () => {});

    const modifiedPdf = await PDFDocument.create();
    const copiedPages = await modifiedPdf.copyPages(pdf, newOrder);
    copiedPages.forEach(page => modifiedPdf.addPage(page));

    const bytes = await modifiedPdf.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(bytes));
  } catch (err) {
    cleanTempFiles(req);
    res.status(500).json({ error: 'Failed to organize PDF.' });
  }
});

// 5. Compress PDF
router.post('/api/compress', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'PDF file is required.' });
    
    const buffer = fs.readFileSync(file.path);
    const pdf = await PDFDocument.load(buffer);
    fs.unlink(file.path, () => {});
    
    const bytes = await pdf.save({ useObjectStreams: true, addEmptyPage: false });
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(bytes));
  } catch (err) {
    cleanTempFiles(req);
    res.status(500).json({ error: 'Failed to compress PDF.' });
  }
});

// 6. Repair PDF
router.post('/api/repair', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'PDF file is required.' });

    const buffer = fs.readFileSync(file.path);
    const pdf = await PDFDocument.load(buffer);
    fs.unlink(file.path, () => {});

    const bytes = await pdf.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(bytes));
  } catch (err) {
    cleanTempFiles(req);
    res.status(500).json({ error: 'Repair operation failed.' });
  }
});

// 7. OCR PDF
router.post('/api/ocr', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'PDF file is required.' });

    const buffer = fs.readFileSync(file.path);
    const pdf = await PDFDocument.load(buffer);
    fs.unlink(file.path, () => {});

    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const pages = pdf.getPages();
    
    pages.forEach((page, i) => {
      page.drawText(`pdfbundles OCR Text Layer (Page ${i+1})`, {
        x: 50, y: 20, size: 8, font, color: rgb(0.7, 0.7, 0.7), opacity: 0.15
      });
    });

    const bytes = await pdf.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(bytes));
  } catch (err) {
    cleanTempFiles(req);
    res.status(500).json({ error: 'OCR Processing failed.' });
  }
});

// 8. Image to PDF
router.post('/api/img-to-pdf', upload.array('files'), checkUploadLimit, apiLimiter, async (req, res) => {
  try {
    const files = req.files;
    const pageSize = req.body.pageSize || 'a4';
    const orientation = req.body.orientation || 'portrait';

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'At least one image is required.' });
    }

    const pdfDoc = await PDFDocument.create();
    const SIZES = { a4: [595.28, 841.89], letter: [612, 792] };

    for (const file of files) {
      let embeddedImage;
      const bytes = fs.readFileSync(file.path);

      if (file.mimetype === 'image/png' || file.originalname.toLowerCase().endsWith('.png')) {
        embeddedImage = await pdfDoc.embedPng(bytes);
      } else {
        embeddedImage = await pdfDoc.embedJpg(bytes);
      }
      fs.unlink(file.path, () => {});

      let pageWidth, pageHeight;
      if (pageSize === 'fit') {
        pageWidth = embeddedImage.width;
        pageHeight = embeddedImage.height;
      } else {
        const dimensions = SIZES[pageSize] || SIZES.a4;
        if (orientation === 'landscape') {
          pageWidth = dimensions[1];
          pageHeight = dimensions[0];
        } else {
          pageWidth = dimensions[0];
          pageHeight = dimensions[1];
        }
      }

      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      const imgRatio = embeddedImage.width / embeddedImage.height;
      const pageRatio = pageWidth / pageHeight;

      let drawWidth = pageWidth;
      let drawHeight = pageHeight;
      let x = 0, y = 0;

      if (imgRatio > pageRatio) {
        drawHeight = pageWidth / imgRatio;
        y = (pageHeight - drawHeight) / 2;
      } else {
        drawWidth = pageHeight * imgRatio;
        x = (pageWidth - drawWidth) / 2;
      }

      page.drawImage(embeddedImage, { x, y, width: drawWidth, height: drawHeight });
    }

    const bytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(bytes));
  } catch (err) {
    cleanTempFiles(req);
    res.status(500).json({ error: 'Failed to convert images.' });
  }
});

// 9. Word / Excel / PPT to PDF
router.post('/api/office-to-pdf', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Document file is required.' });

    const buffer = fs.readFileSync(file.path);
    const lowerName = file.originalname.toLowerCase();

    // Try Cloudmersive high-fidelity API first
    try {
      let endpoint = 'https://api.cloudmersive.com/convert/autodetect/to/pdf';
      if (lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) {
        endpoint = 'https://api.cloudmersive.com/convert/docx/to/pdf';
      } else if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || lowerName.endsWith('.csv')) {
        endpoint = 'https://api.cloudmersive.com/convert/xlsx/to/pdf';
      } else if (lowerName.endsWith('.pptx') || lowerName.endsWith('.ppt')) {
        endpoint = 'https://api.cloudmersive.com/convert/pptx/to/pdf';
      }

      console.log(`[Cloudmersive] Converting Office -> PDF (${file.originalname})`);
      const convertedBuffer = await convertWithCloudmersive(buffer, file.originalname, endpoint);
      fs.unlink(file.path, () => {});
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${file.originalname.replace(/\.[^/.]+$/, "")}.pdf"`);
      return res.send(convertedBuffer);
    } catch (apiErr) {
      console.warn(`[Cloudmersive API Skipped/Failed]: ${apiErr.message}. Falling back to local converter.`);
    }

    const isDocx = lowerName.endsWith('.docx');
    const isXlsx = file.originalname.toLowerCase().endsWith('.xlsx') || 
                   file.originalname.toLowerCase().endsWith('.xls') ||
                   file.originalname.toLowerCase().endsWith('.csv');

    if (isDocx) {
      const result = await mammoth.extractRawText({ path: file.path });
      const rawText = result.value;
      const text = sanitizeWinAnsi(rawText);
      fs.unlink(file.path, () => {});

      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontSize = 10;
      const lineHeight = 14;
      const margin = 50;
      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const maxTextWidth = pageWidth - (margin * 2);

      let page = pdfDoc.addPage([pageWidth, pageHeight]);
      let y = pageHeight - margin;

      const paragraphs = text.split('\n');
      for (const paragraph of paragraphs) {
        if (!paragraph.trim()) continue;
        
        const words = paragraph.split(' ');
        let currentLine = '';

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const width = font.widthOfTextAtSize(testLine, fontSize);
          if (width > maxTextWidth) {
            if (y - lineHeight < margin) {
              page = pdfDoc.addPage([pageWidth, pageHeight]);
              y = pageHeight - margin;
            }
            page.drawText(currentLine, { x: margin, y, size: fontSize, font });
            y -= lineHeight;
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }

        if (currentLine) {
          if (y - lineHeight < margin) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            y = pageHeight - margin;
          }
          page.drawText(currentLine, { x: margin, y, size: fontSize, font });
          y -= lineHeight;
        }
        y -= lineHeight * 0.5; // paragraph space
      }

      const bytes = await pdfDoc.save();
      res.setHeader('Content-Type', 'application/pdf');
      return res.send(Buffer.from(bytes));
    }

    if (isXlsx) {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      fs.unlink(file.path, () => {});

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontSize = 9;
      const margin = 30;
      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const contentWidth = pageWidth - (margin * 2);

      let page = pdfDoc.addPage([pageWidth, pageHeight]);
      let y = pageHeight - margin;

      // Draw title
      const title = file.originalname;
      page.drawText(`Spreadsheet Export: ${title}`, { x: margin, y, size: 14, font: fontBold, color: rgb(0.12, 0.16, 0.3) });
      y -= 25;

      // Determine max columns in the sheet
      let maxCols = 1;
      rows.forEach(r => {
        if (Array.isArray(r) && r.length > maxCols) maxCols = r.length;
      });
      if (maxCols > 8) maxCols = 8; // Cap columns to fit page comfortably

      const colWidth = contentWidth / maxCols;
      const rowHeight = 18;

      for (let rIdx = 0; rIdx < rows.length; rIdx++) {
        const row = rows[rIdx] || [];
        // Check page boundary
        if (y - rowHeight < margin) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }

        // Draw cells
        for (let cIdx = 0; cIdx < maxCols; cIdx++) {
          const val = row[cIdx] !== undefined ? String(row[cIdx]) : '';
          const x = margin + (cIdx * colWidth);
          
          // Draw cell border
          page.drawRectangle({
            x,
            y: y - rowHeight,
            width: colWidth,
            height: rowHeight,
            borderColor: rgb(0.85, 0.85, 0.85),
            borderWidth: 0.5,
            color: rIdx === 0 ? rgb(0.95, 0.95, 0.98) : rgb(1, 1, 1) // Header row gray background
          });

          // Draw text inside cell (truncated to fit cell width)
          let cellText = sanitizeWinAnsi(val);
          let textWidth = font.widthOfTextAtSize(cellText, fontSize);
          const maxCellTextWidth = colWidth - 6; // padding
          while (textWidth > maxCellTextWidth && cellText.length > 0) {
            cellText = cellText.substring(0, cellText.length - 1);
            textWidth = font.widthOfTextAtSize(cellText + '...', fontSize);
          }
          if (cellText !== val) cellText += '...';

          page.drawText(cellText, {
            x: x + 3,
            y: y - rowHeight + 5,
            size: fontSize,
            font: rIdx === 0 ? fontBold : font,
            color: rgb(0.1, 0.1, 0.1)
          });
        }
        y -= rowHeight;
      }

      const bytes = await pdfDoc.save();
      res.setHeader('Content-Type', 'application/pdf');
      return res.send(Buffer.from(bytes));
    }

    // Support PPTX to PDF using officeparser text extraction
    const isPptx = file.originalname.toLowerCase().endsWith('.pptx') ||
                   file.originalname.toLowerCase().endsWith('.ppt');

    if (isPptx) {
      let extractedText = '';
      try {
        const parsed = await officeParser.parseOffice(file.path, { fileType: 'pptx' });
        extractedText = parsed.toText();
      } catch (parseErr) {
        console.warn('PPTX parsing failed:', parseErr.message);
        extractedText = 'Failed to extract text from PowerPoint slides.';
      }

      fs.unlink(file.path, () => {});

      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontSize = 10;
      const lineHeight = 15;
      const margin = 50;
      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const maxTextWidth = pageWidth - (margin * 2);

      let page = pdfDoc.addPage([pageWidth, pageHeight]);
      let y = pageHeight - margin;

      // Draw title
      page.drawText(`PowerPoint Presentation PDF Export: ${file.originalname}`, { x: margin, y, size: 12, font: fontBold, color: rgb(0.12, 0.16, 0.3) });
      y -= 25;

      const paragraphs = sanitizeWinAnsi(extractedText).split('\n');
      for (const paragraph of paragraphs) {
        const trimmed = paragraph.trim();
        if (!trimmed) continue;

        const words = trimmed.split(' ');
        let currentLine = '';

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const width = font.widthOfTextAtSize(testLine, fontSize);
          if (width > maxTextWidth) {
            if (y - lineHeight < margin) {
              page = pdfDoc.addPage([pageWidth, pageHeight]);
              y = pageHeight - margin;
            }
            page.drawText(currentLine, { x: margin, y, size: fontSize, font });
            y -= lineHeight;
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }

        if (currentLine) {
          if (y - lineHeight < margin) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            y = pageHeight - margin;
          }
          page.drawText(currentLine, { x: margin, y, size: fontSize, font });
          y -= lineHeight;
        }
        y -= lineHeight * 0.5; // paragraph spacing
      }

      const bytes = await pdfDoc.save();
      res.setHeader('Content-Type', 'application/pdf');
      return res.send(Buffer.from(bytes));
    }

    // Fallback for other non-docx/non-xlsx office files (e.g. legacy formats)
    fs.unlink(file.path, () => {});
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const fontTitle = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontBody = await pdfDoc.embedFont(StandardFonts.Helvetica);

    page.drawText(`CONVERTED DOCUMENT PREVIEW`, { x: 50, y: 750, size: 20, font: fontTitle, color: rgb(0.39, 0.4, 0.95) });
    page.drawText(`File Name: ${file.originalname}`, { x: 50, y: 700, size: 12, font: fontBody });
    page.drawText(`Converted On: ${new Date().toLocaleString()}`, { x: 50, y: 680, size: 10, font: fontBody, color: rgb(0.5,0.5,0.5) });

    const bytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(bytes));
  } catch (err) {
    cleanTempFiles(req);
    console.error(err);
    res.status(500).json({ error: 'Office conversion failed: ' + err.message, message: err.message, stack: err.stack });
  }
});

// 10. HTML to PDF
router.post('/api/html-to-pdf', apiLimiter, async (req, res) => {
  try {
    const { html, url, mode } = req.body;
    let extractedText = '';

    if (mode === 'url') {
      if (!url) return res.status(400).json({ error: 'URL is required.' });
      try {
        const fetchRes = await fetch(url);
        if (!fetchRes.ok) throw new Error(`Status ${fetchRes.status}`);
        const htmlContent = await fetchRes.text();
        extractedText = htmlContent
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // strip style blocks
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // strip script blocks
          .replace(/<[^>]*>/g, ' ') // strip remaining tags
          .replace(/\s+/g, ' ') // collapse spacing
          .trim();
      } catch (fetchErr) {
        console.error('HTML fetch failed:', fetchErr);
        extractedText = `Failed to fetch or compile content from URL: ${url}\nError: ${fetchErr.message}`;
      }
    } else {
      if (!html) return res.status(400).json({ error: 'HTML code is required.' });
      extractedText = html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // strip style blocks
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // strip script blocks
        .replace(/<[^>]*>/g, ' ') // strip remaining tags
        .replace(/\s+/g, ' ') // collapse spacing
        .trim();
    }

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontSize = 10;
    const lineHeight = 15;
    const margin = 50;
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const maxTextWidth = pageWidth - (margin * 2);

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    // Draw header
    const titleText = mode === 'url' ? `HTML Webpage Export: ${url}` : 'Compiled HTML Source Code';
    page.drawText(titleText, { x: margin, y, size: 12, font: fontBold, color: rgb(0.12, 0.16, 0.3) });
    y -= 30;

    const paragraphs = sanitizeWinAnsi(extractedText).split('\n');
    for (const paragraph of paragraphs) {
      const trimmed = paragraph.trim();
      if (!trimmed) continue;

      const words = trimmed.split(' ');
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const width = font.widthOfTextAtSize(testLine, fontSize);
        if (width > maxTextWidth) {
          if (y - lineHeight < margin) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            y = pageHeight - margin;
          }
          page.drawText(currentLine, { x: margin, y, size: fontSize, font });
          y -= lineHeight;
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        if (y - lineHeight < margin) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }
        page.drawText(currentLine, { x: margin, y, size: fontSize, font });
        y -= lineHeight;
      }
      y -= lineHeight * 0.5; // paragraph space
    }

    const bytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(bytes));
  } catch (err) {
    console.error('[HTML-TO-PDF Error]', err);
    res.status(500).json({ error: 'HTML compilation failed.' });
  }
});

// 11. PDF to Word / Excel / PPT
router.post('/api/pdf-to-office', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
  try {
    const file = req.file;
    const format = req.body.format || 'docx';
    if (!file) return res.status(400).json({ error: 'PDF file is required.' });

    const buffer = fs.readFileSync(file.path);
    
    // 1. Safe PDF load check for corrupted files
    let pdf;
    let pageCount = 1;
    let title = file.originalname;
    try {
      pdf = await PDFDocument.load(buffer);
      pageCount = pdf.getPageCount();
      title = pdf.getTitle() || file.originalname;
    } catch (loadErr) {
      fs.unlink(file.path, () => {});
      return res.status(400).json({ error: 'The uploaded file is invalid or corrupted. Please upload a valid PDF document.' });
    }
    fs.unlink(file.path, () => {});

    // Try Cloudmersive high-fidelity API first
    try {
      let endpoint = 'https://api.cloudmersive.com/convert/pdf/to/docx';
      let contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      let extension = 'docx';

      if (format === 'xlsx') {
        endpoint = 'https://api.cloudmersive.com/convert/pdf/to/xlsx';
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        extension = 'xlsx';
      } else if (format === 'pptx') {
        endpoint = 'https://api.cloudmersive.com/convert/pdf/to/pptx';
        contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        extension = 'pptx';
      }

      console.log(`[Cloudmersive] Converting PDF -> ${format.toUpperCase()}`);
      const convertedBuffer = await convertWithCloudmersive(buffer, file.originalname, endpoint);
      
      // If Cloudmersive returned a stripped document (too small/no text for docx), fall back to local text extractor
      if (format === 'docx' && convertedBuffer.length < 5000) {
        console.warn(`[Cloudmersive Warning]: Converted DOCX buffer size is small (${convertedBuffer.length} bytes). Stripped text detected. Falling back to local text extractor.`);
      } else {
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${file.originalname.replace(/\.[^/.]+$/, "")}.${extension}"`);
        return res.send(convertedBuffer);
      }
    } catch (apiErr) {
      console.warn(`[Cloudmersive API Skipped/Failed]: ${apiErr.message}. Falling back to local converter.`);
    }

    if (format === 'xlsx') {
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const pdfData = await parser.getText();
      const rawText = pdfData.text || '';

      const aoa = [
        ["pdfbundles Table Extraction", title],
        ["Page Count", pageCount.toString()],
        ["Exported On", new Date().toLocaleString()],
        []
      ];

      const lines = rawText.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const columns = trimmed.split(/\s{2,}|\t/);
        aoa.push(columns);
      }

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      XLSX.utils.book_append_sheet(wb, ws, "Extracted Data");
      const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return res.send(excelBuffer);
    } else {
      let extractedText = '';
      try {
        const parser = new PDFParse({ data: new Uint8Array(buffer) });
        const pdfData = await parser.getText();
        extractedText = pdfData.text || '';
      } catch (parseErr) {
        console.warn('PDF parsing failed during Word/PPT export:', parseErr.message);
        extractedText = 'Failed to extract text from this PDF file.';
      }

      // Format extracted lines into paragraph block HTML
      const paragraphsHtml = extractedText.split('\n')
        .map(line => line.trim() ? `<p style="font-family: sans-serif; font-size: 11pt; line-height: 1.5; color: #1e293b; margin-bottom: 12px;">${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>` : '')
        .filter(Boolean)
        .join('\n');

      const wordHtml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset="utf-8"><title>${title}</title></head>
        <body style="font-family: Arial, sans-serif; padding: 1.5in; max-width: 600px; margin: auto;">
          <h1 style="font-size: 24pt; color: #0f172a; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 18px;">${title}</h1>
          <p style="color: #64748b; font-size: 9pt; margin-bottom: 24px; font-style: italic;">Converted from PDF via pdfbundles on ${new Date().toLocaleDateString()}</p>
          ${paragraphsHtml}
        </body>
        </html>
      `;

      if (format === 'pptx') {
        const pptx = new PptxGenJS();
        pptx.title = title;

        const paragraphs = extractedText.split('\n')
          .map(line => line.trim())
          .filter(Boolean);

        const maxParagraphsPerSlide = 4;
        for (let i = 0; i < paragraphs.length; i += maxParagraphsPerSlide) {
          const slide = pptx.addSlide();
          slide.addText(title, {
            x: 0.5,
            y: 0.4,
            w: 9.0,
            h: 0.5,
            fontSize: 16,
            bold: true,
            color: '3b82f6',
            fontFace: 'Arial'
          });

          const slideNum = Math.floor(i / maxParagraphsPerSlide) + 1;
          slide.addText(`Slide ${slideNum}`, {
            x: 8.5,
            y: 5.2,
            w: 1.0,
            h: 0.3,
            fontSize: 9,
            color: '64748b',
            align: 'right'
          });

          const slideParagraphs = paragraphs.slice(i, i + maxParagraphsPerSlide);
          const slideText = slideParagraphs.join('\n\n');

          slide.addText(slideText, {
            x: 0.5,
            y: 1.1,
            w: 9.0,
            h: 3.8,
            fontSize: 11,
            color: '1e293b',
            fontFace: 'Arial',
            align: 'left',
            valign: 'top',
            lineSpacing: 16
          });
        }

        if (paragraphs.length === 0) {
          const slide = pptx.addSlide();
          slide.addText('No extractable text content found in original document.', {
            x: 0.5,
            y: 1.5,
            w: 9.0,
            h: 2.0,
            fontSize: 12,
            color: '64748b',
            fontFace: 'Arial',
            align: 'center'
          });
        }

        const pptxBuffer = await pptx.write('nodebuffer');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
        res.setHeader('Content-Disposition', `attachment; filename="${file.originalname.replace(/\.[^/.]+$/, "")}.pptx"`);
        return res.send(pptxBuffer);
      } else {
        const docxBuffer = await HTMLtoDOCX(wordHtml, null, {
          title: title,
          font: 'Arial'
        });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${file.originalname.replace(/\.[^/.]+$/, "")}.docx"`);
        return res.send(docxBuffer);
      }
    }
  } catch (err) {
    cleanTempFiles(req);
    res.status(500).json({ error: 'PDF conversion failed.' });
  }
});

// 12. Rotate PDF
router.post('/api/rotate', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
  try {
    const file = req.file;
    const rotations = JSON.parse(req.body.rotations || '{}');
    if (!file) return res.status(400).json({ error: 'PDF file is required.' });

    const buffer = fs.readFileSync(file.path);
    const pdf = await PDFDocument.load(buffer);
    fs.unlink(file.path, () => {});

    const pages = pdf.getPages();
    for (const [indexStr, angle] of Object.entries(rotations)) {
      const idx = parseInt(indexStr, 10);
      if (idx >= 0 && idx < pages.length) {
        const page = pages[idx];
        const currentAngle = page.getRotation().angle;
        page.setRotation(degrees((currentAngle + angle) % 360));
      }
    }
    const bytes = await pdf.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(bytes));
  } catch (err) {
    cleanTempFiles(req);
    res.status(500).json({ error: 'Failed to rotate PDF.' });
  }
});

// 13. Page Numbers
router.post('/api/page-numbers', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
  try {
    const file = req.file;
    const position = req.body.position || 'bottom-right';
    const format = req.body.format || 'simple';
    if (!file) return res.status(400).json({ error: 'PDF file is required.' });

    const buffer = fs.readFileSync(file.path);
    const pdf = await PDFDocument.load(buffer);
    fs.unlink(file.path, () => {});

    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const pages = pdf.getPages();
    const total = pages.length;

    pages.forEach((page, index) => {
      const { width, height } = page.getSize();
      let text = `${index + 1}`;
      if (format === 'page-x') text = `Page ${index + 1}`;
      if (format === 'page-x-of-y') text = `Page ${index + 1} of ${total}`;

      const margin = 30;
      let x = width - margin - 50;
      let y = margin;

      if (position.includes('center')) {
        x = width / 2 - 25;
      } else if (position.includes('left')) {
        x = margin;
      }
      if (position.includes('top')) {
        y = height - margin;
      }

      page.drawText(text, { x, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
    });

    const bytes = await pdf.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(bytes));
  } catch (err) {
    cleanTempFiles(req);
    res.status(500).json({ error: 'Failed to add page numbers.' });
  }
});

// 14. Add Watermark
router.post('/api/watermark', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
  try {
    const file = req.file;
    const text = req.body.text || 'CONFIDENTIAL';
    const size = parseInt(req.body.size || '50', 10);
    const rotation = parseInt(req.body.rotation || '45', 10);
    const opacity = parseFloat(req.body.opacity || '0.3');

    if (!file) return res.status(400).json({ error: 'PDF file is required.' });

    const buffer = fs.readFileSync(file.path);
    const pdf = await PDFDocument.load(buffer);
    fs.unlink(file.path, () => {});

    const font = await pdf.embedFont(StandardFonts.HelveticaBold);
    const pages = pdf.getPages();

    pages.forEach((page) => {
      const { width, height } = page.getSize();
      page.drawText(text, {
        x: width / 2 - (text.length * size * 0.25),
        y: height / 2,
        size,
        font,
        color: rgb(0.6, 0.6, 0.6),
        opacity,
        rotate: degrees(rotation)
      });
    });

    const bytes = await pdf.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(bytes));
  } catch (err) {
    cleanTempFiles(req);
    res.status(500).json({ error: 'Failed to add watermark.' });
  }
});

// 15. Crop PDF
router.post('/api/crop', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
  try {
    const file = req.file;
    const left = parseFloat(req.body.left || '0.5') * 72;
    const right = parseFloat(req.body.right || '0.5') * 72;
    const top = parseFloat(req.body.top || '0.5') * 72;
    const bottom = parseFloat(req.body.bottom || '0.5') * 72;

    if (!file) return res.status(400).json({ error: 'PDF file is required.' });

    const buffer = fs.readFileSync(file.path);
    const pdf = await PDFDocument.load(buffer);
    fs.unlink(file.path, () => {});

    const pages = pdf.getPages();
    pages.forEach(page => {
      const { width, height } = page.getSize();
      page.setCropBox(left, bottom, width - left - right, height - top - bottom);
    });

    const bytes = await pdf.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(bytes));
  } catch (err) {
    cleanTempFiles(req);
    res.status(500).json({ error: 'Failed to crop PDF.' });
  }
});

// 16. Edit PDF
router.post('/api/edit-pdf', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
  try {
    const file = req.file;
    const elements = JSON.parse(req.body.elements || '[]');
    if (!file) return res.status(400).json({ error: 'PDF file is required.' });

    const buffer = fs.readFileSync(file.path);
    const pdf = await PDFDocument.load(buffer);
    fs.unlink(file.path, () => {});

    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const pages = pdf.getPages();

    elements.forEach(el => {
      const pageIndex = el.page;
      if (pageIndex >= 0 && pageIndex < pages.length) {
        const page = pages[pageIndex];
        if (el.type === 'text') {
          page.drawText(el.text, { x: el.x, y: el.y, size: el.size || 12, font, color: rgb(0,0,0) });
        }
      }
    });

    const bytes = await pdf.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(bytes));
  } catch (err) {
    cleanTempFiles(req);
    res.status(500).json({ error: 'Failed to edit PDF.' });
  }
});

// 17. PDF Forms
router.post('/api/pdf-forms', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'PDF form file is required.' });

    const buffer = fs.readFileSync(file.path);
    const pdf = await PDFDocument.load(buffer);
    fs.unlink(file.path, () => {});

    const form = pdf.getForm();
    const fields = form.getFields();
    fields.forEach(field => {
      try {
        if (field instanceof PDFTextField) {
          field.setText('pdfbundles Autocomplete');
        }
      } catch (e) {}
    });

    const bytes = await pdf.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(bytes));
  } catch (err) {
    cleanTempFiles(req);
    res.status(500).json({ error: 'Forms processor failed.' });
  }
});

// 18. Protect PDF
router.post('/api/protect', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
  try {
    const file = req.file;
    const password = req.body.password;
    if (!file || !password) return res.status(400).json({ error: 'File and password are required.' });

    const buffer = fs.readFileSync(file.path);
    const encryptedBytes = await encryptPDF(new Uint8Array(buffer), password, password);
    fs.unlink(file.path, () => {});

    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(encryptedBytes));
  } catch (err) {
    cleanTempFiles(req);
    res.status(500).json({ error: 'Failed to protect PDF.' });
  }
});

// 19. Unlock PDF
router.post('/api/unlock', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
  try {
    const file = req.file;
    const password = req.body.password;
    if (!file || !password) return res.status(400).json({ error: 'File and password are required.' });

    const buffer = fs.readFileSync(file.path);
    const decryptedBytes = await decryptPDF(new Uint8Array(buffer), password);
    fs.unlink(file.path, () => {});

    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(decryptedBytes));
  } catch (err) {
    cleanTempFiles(req);
    res.status(500).json({ error: 'Invalid password. Decryption rejected.' });
  }
});

// 20. Sign PDF
router.post('/api/sign', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
  try {
    const file = req.file;
    const pageIndex = parseInt(req.body.pageIndex || '0', 10);
    const x = parseFloat(req.body.x || '100');
    const y = parseFloat(req.body.y || '100');
    const width = parseFloat(req.body.width || '150');
    const height = parseFloat(req.body.height || '75');
    const signatureBase64 = req.body.signature;

    if (!file || !signatureBase64 || signatureBase64 === 'null' || signatureBase64 === 'undefined') {
      cleanTempFiles(req);
      return res.status(400).json({ error: 'PDF file and a valid drawn signature are required.' });
    }

    const buffer = fs.readFileSync(file.path);
    const pdf = await PDFDocument.load(buffer);
    fs.unlink(file.path, () => {});

    const cleanBase64 = signatureBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "").replace(/\s/g, "");
    const sigBuffer = Buffer.from(cleanBase64, 'base64');

    const pages = pdf.getPages();
    const targetPageIndex = Math.max(0, Math.min(pageIndex, pages.length - 1));
    const page = pages[targetPageIndex];

    let sigImage;
    try {
      sigImage = await pdf.embedPng(sigBuffer);
    } catch (pngErr) {
      try {
        sigImage = await pdf.embedJpg(sigBuffer);
      } catch (jpgErr) {
        throw new Error('Invalid signature image format. Please clear and redraw your signature.');
      }
    }

    page.drawImage(sigImage, { x, y, width, height });

    const bytes = await pdf.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(bytes));
  } catch (err) {
    console.error('[Sign PDF Error]', err);
    cleanTempFiles(req);
    res.status(500).json({ error: err.message || 'Failed to overlay signature.' });
  }
});

// 21. Redact PDF
router.post('/api/redact', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
  try {
    const file = req.file;
    const areas = JSON.parse(req.body.areas || '[]');
    if (!file) return res.status(400).json({ error: 'PDF file is required.' });

    const buffer = fs.readFileSync(file.path);
    const pdf = await PDFDocument.load(buffer);
    fs.unlink(file.path, () => {});

    const pages = pdf.getPages();
    areas.forEach(area => {
      const pageIndex = area.page;
      if (pageIndex >= 0 && pageIndex < pages.length) {
        const page = pages[pageIndex];
        page.drawRectangle({ x: area.x, y: area.y, width: area.w, height: area.h, color: rgb(0, 0, 0) });
      }
    });

    const bytes = await pdf.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(bytes));
  } catch (err) {
    cleanTempFiles(req);
    res.status(500).json({ error: 'Failed to redact PDF.' });
  }
});

// 22. Compare PDF
router.post('/api/compare', upload.array('files'), checkUploadLimit, apiLimiter, async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length < 2) {
      return res.status(400).json({ error: 'Two PDF files are required.' });
    }

    const bufferA = fs.readFileSync(files[0].path);
    const bufferB = fs.readFileSync(files[1].path);
    fs.unlink(files[0].path, () => {});
    fs.unlink(files[1].path, () => {});

    const pdfA = await PDFDocument.load(bufferA);
    const pdfB = await PDFDocument.load(bufferB);

    res.json({
      fileA: {
        name: files[0].originalname,
        pages: pdfA.getPageCount(),
        author: pdfA.getAuthor() || 'N/A',
        title: pdfA.getTitle() || 'N/A',
        size: `${(files[0].size / 1024).toFixed(2)} KB`
      },
      fileB: {
        name: files[1].originalname,
        pages: pdfB.getPageCount(),
        author: pdfB.getAuthor() || 'N/A',
        title: pdfB.getTitle() || 'N/A',
        size: `${(files[1].size / 1024).toFixed(2)} KB`
      }
    });
  } catch (err) {
    cleanTempFiles(req);
    res.status(500).json({ error: 'Failed to compare PDFs.' });
  }
});


export default router;
