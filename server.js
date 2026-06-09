import 'dotenv/config';
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Stripe from 'stripe';
// import { GoogleGenerativeAI } from '@google/generative-ai'; // Removed in favor of xAI Grok API fetch integration
import { PDFParse } from 'pdf-parse';
import XLSX from 'xlsx';
import { rateLimit } from 'express-rate-limit';
import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt-lite';
import { decryptPDF } from '@pdfsmaller/pdf-decrypt';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const mammoth = require('mammoth');
import { User, BlogPost, syncDatabase } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

const JWT_SECRET = process.env.JWT_SECRET || 'aeropdf-enterprise-security-secret-passphrase';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_mockstripekey';
const stripe = new Stripe(STRIPE_SECRET_KEY);

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY;
const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
const DEEPAI_API_KEY = process.env.DEEPAI_API_KEY;

// Initialize database sync
syncDatabase();

// Ensure temporary uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Ensure blog-uploads directory exists
const blogUploadsDir = path.join(__dirname, 'blog-uploads');
if (!fs.existsSync(blogUploadsDir)) {
  fs.mkdirSync(blogUploadsDir, { recursive: true });
}

// Enable CORS
app.use(cors());

// Custom Request Logger middleware
app.use((req, res, next) => {
  if (req.path !== '/api/log' && !req.path.includes('log')) {
    console.log(`[Express] Request: ${req.method} ${req.path}`);
  }
  next();
});

// Configure Rate Limiters to secure endpoints
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 10,
  message: { error: 'Too many authentication attempts. Please try again in 1 minute.' },
  standardHeaders: 'draft-8',
  legacyHeaders: false
});

const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 150,
  message: { error: 'Hourly rate limit exceeded. Upgrade to Premium for higher thresholds.' },
  standardHeaders: 'draft-8',
  legacyHeaders: false
});

// JSON and URLencoded parsing (except Stripe webhook which requires raw buffer)
app.use((req, res, next) => {
  if (req.originalUrl === '/api/stripe/webhook') {
    next();
  } else {
    express.json({ limit: '50mb' })(req, res, next);
  }
});
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve blog uploads statically
app.use('/api/blog-uploads', express.static(blogUploadsDir));

// Multer configured to stream uploads to disk rather than keeping in RAM
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Multer storage engine for blog uploads, keeping original file extensions
const blogStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'blog-uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const blogUpload = multer({ 
  storage: blogStorage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit for blog uploads
});

// Helper: Convert HEX color to RGB object
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '#000000');
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 0, g: 0, b: 0 };
}

// Helper: Sanitize string to prevent pdf-lib WinAnsi encoding errors
function sanitizeWinAnsi(text) {
  return (text || '')
    .replace(/\t/g, '    ') // Replace tabs with spaces
    .replace(/[\u201c\u201d]/g, '"') // Curly double quotes
    .replace(/[\u2018\u2019]/g, "'") // Curly single quotes
    .replace(/\u2014/g, '-') // Em dash
    .replace(/[^\x00-\x7F]/g, ''); // Strip non-ASCII/Unicode to fit standard WinAnsi
}

/* ==========================================
   AUTHENTICATION & SECURITY MIDDLEWARE
   ========================================== */

// Auth Middleware: Verify JWT Token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Session token required. Please log in.' });
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Session expired or invalid token.' });
    req.user = decoded; // Contains { id, email }
    next();
  });
};

// Limit Middleware: Validate file size (10MB limit for free tier, including session cumulative size)
const checkUploadLimit = async (req, res, next) => {
  const clientCumulativeSize = parseInt(req.headers['x-cumulative-size'] || '0', 10);
  const maxFreeSize = 10 * 1024 * 1024; // 10MB limit

  let totalSize = 0;
  if (req.file) {
    totalSize = req.file.size;
  } else if (req.files) {
    totalSize = req.files.reduce((sum, f) => sum + f.size, 0);
  }

  if (clientCumulativeSize > maxFreeSize || totalSize + clientCumulativeSize > maxFreeSize) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // Clean temp upload files
      cleanTempFiles(req);
      return res.status(403).json({ error: 'File size exceeds 10MB limit. Please log in and upgrade to Premium.' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const dbUser = await User.findByPk(decoded.id);
      if (dbUser && dbUser.is_premium) {
        req.user = decoded;
        return next();
      }
    } catch (err) {
      // Fall through to error response
    }

    cleanTempFiles(req);
    return res.status(403).json({ error: 'File size exceeds 10MB limit. Please upgrade to Premium.' });
  }

  next();
};

// Helper: Clean uploaded files on error/abort
function cleanTempFiles(req) {
  if (req.file) {
    fs.unlink(req.file.path, () => {});
  }
  if (req.files) {
    req.files.forEach(f => fs.unlink(f.path, () => {}));
  }
}

/* ==========================================
   USER AUTHENTICATION API ROUTES
   ========================================== */

app.post('/api/auth/signup', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'An account with this email already exists.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, is_premium: user.is_premium, can_blog: user.can_blog, display_name: user.display_name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Signup processing failed.' });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Invalid email or password.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid email or password.' });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, is_premium: user.is_premium, can_blog: user.can_blog, display_name: user.display_name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login processing failed.' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User profile not found.' });
    res.json({ user: { id: user.id, email: user.email, is_premium: user.is_premium, can_blog: user.can_blog, display_name: user.display_name } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user state.' });
  }
});

/* ==========================================
   STRIPE E-COMMERCE BILLING GATEWAY
   ========================================== */

// Route: Subscription checkout session
app.post('/api/stripe/checkout', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const isMock = STRIPE_SECRET_KEY === 'sk_test_mockstripekey';
    if (isMock) {
      const mockUrl = `/api/stripe/mock-checkout?type=premium&userId=${user.id}&success_url=${encodeURIComponent(req.headers.origin || 'http://localhost:5173')}/?payment=success`;
      return res.json({ url: mockUrl });
    }

    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
      user.stripe_customer_id = customerId;
      await user.save();
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'AeroPDF Premium Subscription',
            description: 'Unlock uploads larger than 12MB'
          },
          unit_amount: 500, // $5.00
          recurring: { interval: 'month' }
        },
        quantity: 1
      }],
      mode: 'subscription',
      success_url: `${req.headers.origin || 'http://localhost:5173'}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'http://localhost:5173'}/?payment=cancel`,
      metadata: {
        userId: user.id,
        type: 'subscription'
      }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Stripe subscription checkout failed: ' + err.message, message: err.message });
  }
});

// Route: Blog writer fee checkout session
app.post('/api/stripe/blog-checkout', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const isMock = STRIPE_SECRET_KEY === 'sk_test_mockstripekey';
    if (isMock) {
      const mockUrl = `/api/stripe/mock-checkout?type=blog_pass&userId=${user.id}&success_url=${encodeURIComponent(req.headers.origin || 'http://localhost:5173')}/?payment=blog-success`;
      return res.json({ url: mockUrl });
    }

    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
      user.stripe_customer_id = customerId;
      await user.save();
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'AeroPDF Single Blog Post Publishing Pass',
            description: 'Allows you to publish a single article on the AeroPDF Blog page'
          },
          unit_amount: 1200 // $12.00
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: `${req.headers.origin || 'http://localhost:5173'}/?payment=blog-success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'http://localhost:5173'}/?payment=cancel`,
      metadata: {
        userId: user.id,
        type: 'blog_pass'
      }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Stripe blog checkout failed: ' + err.message, message: err.message });
  }
});

// Route: Mock checkout processor for local testing
app.get('/api/stripe/mock-checkout', async (req, res) => {
  const { type, userId, success_url } = req.query;
  try {
    const user = await User.findByPk(userId);
    if (user) {
      if (type === 'premium') {
        user.is_premium = true;
        await user.save();
        console.log(`[Mock Stripe] Upgraded user ${user.email} to Premium.`);
      } else if (type === 'blog_pass') {
        user.can_blog = true;
        await user.save();
        console.log(`[Mock Stripe] Granted blog writer permissions to ${user.email}.`);
      }
    }
    res.redirect(success_url || 'http://localhost:5173/?payment=success');
  } catch (err) {
    console.error(err);
    res.status(500).send('Mock payment processing failed.');
  }
});

// Route: Verify Stripe checkout session status (Fallback for local dev without webhooks)
app.post('/api/stripe/verify-payment', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'Session ID is required.' });

    const isMock = STRIPE_SECRET_KEY === 'sk_test_mockstripekey';
    if (isMock) {
      const user = await User.findByPk(req.user.id);
      return res.json({ 
        success: true, 
        user: { 
          id: user.id, 
          email: user.email, 
          is_premium: user.is_premium, 
          can_blog: user.can_blog, 
          display_name: user.display_name 
        } 
      });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session) return res.status(404).json({ error: 'Checkout session not found.' });

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (session.payment_status === 'paid') {
      const type = session.metadata.type;
      if (type === 'subscription') {
        user.is_premium = true;
      } else if (type === 'blog_pass') {
        user.can_blog = true;
      }
      await user.save();
      
      console.log(`[Stripe Verification] Verified payment and updated ${user.email} status (type: ${type}).`);
      return res.json({ 
        success: true, 
        user: { 
          id: user.id, 
          email: user.email, 
          is_premium: user.is_premium, 
          can_blog: user.can_blog, 
          display_name: user.display_name 
        } 
      });
    }

    res.json({ success: false, error: 'Payment session is not fully paid.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Stripe verification failed: ' + err.message });
  }
});

// Route: Webhook callbacks (requires raw body parsing)
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    if (endpointSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    console.error(`Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata.userId;
    const type = session.metadata.type;

    if (userId) {
      const user = await User.findByPk(userId);
      if (user) {
        if (type === 'subscription') {
          user.is_premium = true;
          console.log(`[Stripe] Upgraded user ${user.email} to Premium.`);
        } else if (type === 'blog_pass') {
          user.can_blog = true;
          console.log(`[Stripe] Granted blog writer permissions to ${user.email}.`);
        }
        await user.save();
      }
    }
  }

  res.json({ received: true });
});

/* ==========================================
   BLOGGING API ENDPOINTS
   ========================================== */

app.get('/api/blog', async (req, res) => {
  try {
    const posts = await BlogPost.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load blog posts.' });
  }
});

app.post('/api/blog', authenticateToken, async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content are required.' });

    const user = await User.findByPk(req.user.id);
    if (!user || !user.can_blog) {
      return res.status(403).json({ error: 'Permission denied. You must pay the $12 fee to publish articles.' });
    }

    const post = await BlogPost.create({
      title,
      content,
      author_id: user.id,
      author_email: user.email,
      author_name: user.display_name || user.email
    });

    // Consume the blog publishing token
    user.can_blog = false;
    await user.save();

    res.json({ post });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create blog post.' });
  }
});

// Route: Upload file or image for blog posts
app.post('/api/blog/upload', authenticateToken, blogUpload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded.' });

    // File URL path
    const fileUrl = `/api/blog-uploads/${file.filename}`;
    res.json({ url: fileUrl, name: file.originalname });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload blog file.' });
  }
});

// Route: Update user display name and update past posts
app.post('/api/user/display-name', authenticateToken, async (req, res) => {
  try {
    const { displayName } = req.body;
    if (displayName === undefined) {
      return res.status(400).json({ error: 'Display name is required.' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const updatedName = displayName.trim() || null;
    user.display_name = updatedName;
    await user.save();

    // Propagate display name to all past blog posts
    const nameForBlogs = updatedName || user.email;
    await BlogPost.update({ author_name: nameForBlogs }, { where: { author_id: user.id } });

    res.json({ 
      success: true, 
      displayName: updatedName, 
      user: { 
        id: user.id, 
        email: user.email, 
        is_premium: user.is_premium, 
        can_blog: user.can_blog, 
        display_name: user.display_name 
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update display name.' });
  }
});

/* ==========================================
   PDF AI INTELLIGENCE SYSTEM
   ========================================== */

app.post('/api/ai/summarize', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'PDF file is required.' });

    // Stream text parsing from file
    const dataBuffer = fs.readFileSync(file.path);
    const parser = new PDFParse({ data: new Uint8Array(dataBuffer) });
    const pdfData = await parser.getText();
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

app.post('/api/ai/translate', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
  try {
    const file = req.file;
    const { targetLanguage } = req.body;
    if (!file || !targetLanguage) {
      return res.status(400).json({ error: 'PDF file and target language are required.' });
    }

    const dataBuffer = fs.readFileSync(file.path);
    const parser = new PDFParse({ data: new Uint8Array(dataBuffer) });
    const pdfData = await parser.getText();
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

app.post('/api/image/remove-background', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
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
        const fileBlob = new Blob([fileBuffer], { type: file.mimetype });
        formData.append('image_file', fileBlob, file.originalname);
        formData.append('size', 'auto');

        const response = await fetch('https://api.remove.bg/v1.0/removebg', {
          method: 'POST',
          headers: {
            'X-Api-Key': REMOVE_BG_API_KEY
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

app.post('/api/image/upscale', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
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
        const fileBlob = new Blob([fileBuffer], { type: file.mimetype });
        formData.append('image', fileBlob, file.originalname);
        formData.append('prompt', 'upscale image, high quality, detailed, sharp focus');
        formData.append('output_format', 'png');

        const response = await fetch('https://api.stability.ai/v2beta/stable-image/upscale/conservative', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${STABILITY_API_KEY}`,
            'accept': 'image/*'
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
        const fileBlob = new Blob([fileBuffer], { type: file.mimetype });
        formData.append('image', fileBlob, file.originalname);

        const response = await fetch('https://api.deepai.org/api/super-resolution', {
          method: 'POST',
          headers: {
            'api-key': DEEPAI_API_KEY
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
app.post('/api/merge', upload.array('files'), checkUploadLimit, apiLimiter, async (req, res) => {
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
app.post('/api/split', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
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
app.post('/api/remove-pages', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
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
app.post('/api/organize-pdf', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
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
app.post('/api/compress', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
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
app.post('/api/repair', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
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
app.post('/api/ocr', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'PDF file is required.' });

    const buffer = fs.readFileSync(file.path);
    const pdf = await PDFDocument.load(buffer);
    fs.unlink(file.path, () => {});

    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const pages = pdf.getPages();
    
    pages.forEach((page, i) => {
      page.drawText(`AeroPDF OCR Text Layer (Page ${i+1})`, {
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
app.post('/api/img-to-pdf', upload.array('files'), checkUploadLimit, apiLimiter, async (req, res) => {
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
app.post('/api/office-to-pdf', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Document file is required.' });

    const buffer = fs.readFileSync(file.path);
    const isDocx = file.originalname.toLowerCase().endsWith('.docx');
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
          let cellText = val;
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

    // Fallback for non-docx/non-xlsx office files (pptx)
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
app.post('/api/html-to-pdf', apiLimiter, async (req, res) => {
  try {
    const { html, url, mode } = req.body;
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const fontTitle = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontBody = await pdfDoc.embedFont(StandardFonts.Helvetica);

    page.drawText('HTML to PDF Compiled Output', { x: 50, y: 760, size: 18, font: fontTitle, color: rgb(0.39, 0.4, 0.95) });

    if (mode === 'url') {
      page.drawText(`Source URL: ${url}`, { x: 50, y: 720, size: 11, font: fontBody, color: rgb(0.2, 0.6, 0.4) });
    } else {
      page.drawText(`HTML Source Code Compiled:`, { x: 50, y: 720, size: 11, font: fontTitle });
      const lines = (html || '').substring(0, 1000).split('\n');
      let yPos = 680;
      lines.slice(0, 20).forEach(line => {
        page.drawText(line.trim(), { x: 50, y: yPos, size: 9, font: fontBody, color: rgb(0.1, 0.1, 0.1) });
        yPos -= 20;
      });
    }

    const bytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(bytes));
  } catch (err) {
    res.status(500).json({ error: 'HTML compilation failed.' });
  }
});

// 11. PDF to Word / Excel / PPT
app.post('/api/pdf-to-office', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
  try {
    const file = req.file;
    const format = req.body.format || 'docx';
    if (!file) return res.status(400).json({ error: 'PDF file is required.' });

    const buffer = fs.readFileSync(file.path);
    const pdf = await PDFDocument.load(buffer);
    fs.unlink(file.path, () => {});

    const pageCount = pdf.getPageCount();
    const title = pdf.getTitle() || file.originalname;

    if (format === 'xlsx') {
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const pdfData = await parser.getText();
      const rawText = pdfData.text || '';

      const csvLines = [
        `"AeroPDF Table Extraction","${title.replace(/"/g, '""')}"`,
        `"Page Count","${pageCount}"`,
        `"Exported On","${new Date().toLocaleString().replace(/"/g, '""')}"`,
        `""`
      ];

      const lines = rawText.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        // Split by tabs or 2+ consecutive spaces
        const columns = trimmed.split(/\s{2,}|\t/);
        const csvRow = columns.map(col => `"${col.replace(/"/g, '""')}"`).join(',');
        csvLines.push(csvRow);
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="converted-data.csv"');
      return res.send(Buffer.from(csvLines.join('\n'), 'utf-8'));
    } else {
      const wordHtml = `<html><body><h1>Extracted Content: ${title}</h1><p>Pages: ${pageCount}</p></body></html>`;
      res.setHeader('Content-Type', 'application/msword');
      return res.send(Buffer.from(wordHtml));
    }
  } catch (err) {
    cleanTempFiles(req);
    res.status(500).json({ error: 'PDF conversion failed.' });
  }
});

// 12. Rotate PDF
app.post('/api/rotate', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
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
app.post('/api/page-numbers', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
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
app.post('/api/watermark', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
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
app.post('/api/crop', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
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
app.post('/api/edit-pdf', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
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
app.post('/api/pdf-forms', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'PDF form file is required.' });

    const buffer = fs.readFileSync(file.path);
    const pdf = await PDFDocument.load(buffer);
    fs.unlink(file.path, () => {});

    const form = pdf.getForm();
    const fields = form.getFields();
    if (fields.length > 0) {
      try {
        const firstField = fields[0];
        if (firstField.constructor.name === 'PDFTextField') {
          firstField.setText('AeroPDF Autocomplete');
        }
      } catch(e) {}
    }

    const bytes = await pdf.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(bytes));
  } catch (err) {
    cleanTempFiles(req);
    res.status(500).json({ error: 'Forms processor failed.' });
  }
});

// 18. Protect PDF
app.post('/api/protect', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
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
app.post('/api/unlock', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
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
app.post('/api/sign', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
  try {
    const file = req.file;
    const pageIndex = parseInt(req.body.pageIndex || '0', 10);
    const x = parseFloat(req.body.x || '100');
    const y = parseFloat(req.body.y || '100');
    const width = parseFloat(req.body.width || '150');
    const height = parseFloat(req.body.height || '75');
    const signatureBase64 = req.body.signature;

    if (!file || !signatureBase64) return res.status(400).json({ error: 'PDF file and signature are required.' });

    const buffer = fs.readFileSync(file.path);
    const pdf = await PDFDocument.load(buffer);
    fs.unlink(file.path, () => {});

    const cleanBase64 = signatureBase64.replace(/^data:image\/png;base64,/, "");
    const sigBuffer = Buffer.from(cleanBase64, 'base64');

    const pages = pdf.getPages();
    if (pageIndex >= 0 && pageIndex < pages.length) {
      const page = pages[pageIndex];
      const sigImage = await pdf.embedPng(sigBuffer);
      page.drawImage(sigImage, { x, y, width, height });
    }

    const bytes = await pdf.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(bytes));
  } catch (err) {
    cleanTempFiles(req);
    res.status(500).json({ error: 'Failed to overlay signature.' });
  }
});

// 21. Redact PDF
app.post('/api/redact', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
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
app.post('/api/compare', upload.array('files'), checkUploadLimit, apiLimiter, async (req, res) => {
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

/* ==========================================
   PRODUCTION SPA ASSETS ROUTING
   ========================================== */

app.use(express.static(path.join(__dirname, 'dist')));

app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
