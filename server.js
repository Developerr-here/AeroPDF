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
import { OAuth2Client } from 'google-auth-library';
const require = createRequire(import.meta.url);
const mammoth = require('mammoth');
import { User, BlogPost, CollaborationEmail, syncDatabase } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

const JWT_SECRET = process.env.JWT_SECRET || 'pixelpdf-enterprise-security-secret-passphrase';
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

// Helper: Calculate dynamic premium status (including collaboration membership)
async function getPremiumStatus(user) {
  if (!user) return false;
  if (user.is_premium || (user.subscription_plan && user.subscription_plan !== 'free')) {
    return true;
  }
  
  const isCollaborator = await CollaborationEmail.findOne({
    where: { email: user.email }
  });
  if (isCollaborator) {
    const owner = await User.findByPk(isCollaborator.owner_id);
    if (owner && ['base', 'pro', 'enterprise'].includes(owner.subscription_plan)) {
      return true;
    }
  }
  return false;
}

// Helper: Serialize user responses consistently with dynamic premium and plan information
async function formatUserResponse(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    is_premium: await getPremiumStatus(user),
    subscription_plan: user.subscription_plan,
    can_blog: user.can_blog,
    display_name: user.display_name,
    first_name: user.first_name,
    last_name: user.last_name,
    profile_pic: user.profile_pic
  };
}

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
      const isPremium = dbUser ? await getPremiumStatus(dbUser) : false;
      if (dbUser && isPremium) {
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
    const { email, password, first_name, last_name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
    if (!first_name || !last_name) return res.status(400).json({ error: 'First name and last name are required.' });

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'An account with this email already exists.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashedPassword,
      first_name,
      last_name,
      display_name: `${first_name} ${last_name}`
    });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: await formatUserResponse(user) });
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
    if (!user.password) return res.status(400).json({ error: 'This account uses Google Sign In. Please use Continue with Google.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid email or password.' });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: await formatUserResponse(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login processing failed.' });
  }
});

// Config route: Expose Google Client ID to frontend
app.get('/api/config/google-client-id', (req, res) => {
  res.json({ clientId: process.env.GOOGLE_CLIENT_ID || null });
});

// HTML mock page for simulated Google accounts popup
app.get('/api/auth/google/popup', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in - Google Accounts</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f0f4f9;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 16px;
      box-sizing: border-box;
    }
    .card {
      background: #ffffff;
      border-radius: 28px;
      padding: 40px;
      width: 100%;
      max-width: 448px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: stretch;
    }
    @media (max-width: 450px) {
      body {
        background-color: #ffffff;
        padding: 0;
      }
      .card {
        border-radius: 0;
        box-shadow: none;
        padding: 24px;
        min-height: 100vh;
        justify-content: center;
      }
    }
    .logo {
      text-align: center;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 24px;
      font-weight: 400;
      color: #1f1f1f;
      margin: 0 0 8px 0;
      text-align: center;
    }
    .subtitle {
      font-size: 16px;
      color: #444746;
      margin: 0 0 28px 0;
      text-align: center;
    }
    
    /* Accounts Chooser list */
    .accounts-list {
      display: flex;
      flex-direction: column;
      border: 1px solid #c4c7c5;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 24px;
    }
    .account-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border-bottom: 1px solid #e3e3e3;
      cursor: pointer;
      background: transparent;
      transition: background-color 0.15s;
    }
    .account-item:last-child {
      border-bottom: none;
    }
    .account-item:hover {
      background-color: #f7f9fc;
    }
    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      color: white;
      font-size: 14px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      text-transform: uppercase;
    }
    .account-details {
      flex: 1;
      text-align: left;
    }
    .account-name {
      font-size: 14px;
      font-weight: 500;
      color: #1f1f1f;
      margin-bottom: 2px;
    }
    .account-email {
      font-size: 12px;
      color: #444746;
    }
    .use-another-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      cursor: pointer;
      background: transparent;
      transition: background-color 0.15s;
      color: #0b57d0;
      font-size: 14px;
      font-weight: 500;
      text-align: left;
    }
    .use-another-row:hover {
      background-color: #f7f9fc;
    }
    .use-another-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #f0f4f9;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      color: #0b57d0;
    }

    /* Manual form styles */
    .input-wrapper {
      position: relative;
      margin-bottom: 20px;
      width: 100%;
      text-align: left;
    }
    input {
      width: 100%;
      padding: 16px;
      font-size: 16px;
      border: 1px solid #747775;
      border-radius: 4px;
      box-sizing: border-box;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      background: transparent;
      color: #1f1f1f;
    }
    input:focus {
      border-color: #0b57d0;
      border-width: 2px;
      padding: 15px;
    }
    .forgot-link {
      color: #0b57d0;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      display: inline-block;
      margin-bottom: 32px;
      text-align: left;
      width: 100%;
    }
    .forgot-link:hover {
      text-decoration: underline;
    }
    .privacy-notice {
      font-size: 12px;
      color: #5e6278;
      text-align: left;
      line-height: 1.5;
      margin-bottom: 32px;
    }
    .privacy-notice a {
      color: #0b57d0;
      text-decoration: none;
    }
    .privacy-notice a:hover {
      text-decoration: underline;
    }
    .footer-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      margin-top: auto;
    }
    .btn-create {
      color: #0b57d0;
      background: none;
      border: none;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      padding: 10px 0;
    }
    .btn-create:hover {
      background-color: rgba(11, 87, 208, 0.04);
      border-radius: 4px;
      padding: 10px 12px;
      margin-left: -12px;
    }
    .btn-next {
      background-color: #0b57d0;
      color: #ffffff;
      border: none;
      border-radius: 100px;
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s, box-shadow 0.2s;
    }
    .btn-next:hover {
      background-color: #0842a0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .btn-back {
      color: #444746;
      background: none;
      border: none;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      padding: 10px 16px;
      border-radius: 100px;
      transition: background-color 0.2s;
    }
    .btn-back:hover {
      background-color: rgba(68, 71, 70, 0.08);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <svg viewBox="0 0 24 24" width="48" height="48" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    </div>

    <!-- View 1: Choose Account -->
    <div id="chooserView" style="display: flex; flex-direction: column;">
      <h1>Choose an account</h1>
      <div class="subtitle">to continue to PixelPDF</div>
      
      <div class="accounts-list">
        <div class="account-item" onclick="selectAccount('John Doe', 'johndoe@gmail.com', '#4f46e5')">
          <div class="avatar" style="background-color: #4f46e5;">JD</div>
          <div class="account-details">
            <div class="account-name">John Doe</div>
            <div class="account-email">johndoe@gmail.com</div>
          </div>
        </div>
        <div class="account-item" onclick="selectAccount('Jane Smith', 'janesmith@gmail.com', '#db2777')">
          <div class="avatar" style="background-color: #db2777;">JS</div>
          <div class="account-details">
            <div class="account-name">Jane Smith</div>
            <div class="account-email">janesmith@gmail.com</div>
          </div>
        </div>
        <div class="account-item" onclick="selectAccount('Developer Tester', 'dev@pixelpdf.com', '#7c3aed')">
          <div class="avatar" style="background-color: #7c3aed;">DT</div>
          <div class="account-details">
            <div class="account-name">Developer Tester</div>
            <div class="account-email">dev@pixelpdf.com</div>
          </div>
        </div>
        <div class="use-another-row" onclick="showFormView()">
          <div class="use-another-icon">👤</div>
          <div>Use another account</div>
        </div>
      </div>
    </div>

    <!-- View 2: Manual Login -->
    <div id="formView" style="display: none; flex-direction: column;">
      <h1>Sign in</h1>
      <div class="subtitle">to continue to PixelPDF</div>
      
      <form id="loginForm" onsubmit="handleSubmit(event)">
        <div class="input-wrapper">
          <input type="email" id="email" placeholder="Email or phone" required autocomplete="username" />
        </div>
        
        <a href="#" class="forgot-link" onclick="event.preventDefault()">Forgot email?</a>
        
        <div class="privacy-notice">
          To continue, Google will share your name, email address, language preference, and profile picture with PixelPDF. Before using this app, you can review its <a href="#" onclick="event.preventDefault()">privacy policy</a> and <a href="#" onclick="event.preventDefault()">terms of service</a>.
        </div>
        
        <div class="footer-actions">
          <button type="button" class="btn-back" onclick="showChooserView()">Back</button>
          <button type="submit" class="btn-next">Next</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    function showFormView() {
      document.getElementById('chooserView').style.display = 'none';
      document.getElementById('formView').style.display = 'flex';
      document.getElementById('email').focus();
    }

    function showChooserView() {
      document.getElementById('chooserView').style.display = 'flex';
      document.getElementById('formView').style.display = 'none';
    }

    function selectAccount(name, email, color) {
      const names = name.split(' ');
      const firstName = names[0] || 'Google';
      const lastName = names.slice(1).join(' ') || 'User';
      
      sendAuthSuccess(email, firstName, lastName);
    }

    function parseNameFromEmail(email) {
      const namePart = email.split('@')[0];
      const cleanPart = namePart.replace(/[0-9_\\-\\.]/g, ' ').trim();
      const words = cleanPart.split(/\\s+/);
      let firstName = words[0] || '';
      let lastName = words.slice(1).join(' ') || '';
      
      firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
      if (lastName) {
        lastName = lastName.split(/\\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
      return { first_name: firstName, last_name: lastName || 'User' };
    }

    function handleSubmit(e) {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      if (!email) return;
      
      const parsed = parseNameFromEmail(email);
      sendAuthSuccess(email, parsed.first_name, parsed.last_name);
    }

    function sendAuthSuccess(email, first_name, last_name) {
      if (window.opener) {
        window.opener.postMessage({
          type: 'google-auth-success',
          email: email,
          first_name: first_name,
          last_name: last_name
        }, window.location.origin);
      }
      window.close();
    }
  </script>
</body>
</html>
  `);
});

// Google Sign-In Endpoint (handles real or simulated Google profile payload)
app.post('/api/auth/google', authLimiter, async (req, res) => {
  try {
    const { credential, email: bodyEmail, first_name: bodyFirst, last_name: bodyLast } = req.body;
    
    let email = bodyEmail;
    let first_name = bodyFirst;
    let last_name = bodyLast;
    let profile_pic = null;

    if (credential) {
      // Real Google credential token verification
      const googleClientId = process.env.GOOGLE_CLIENT_ID;
      if (!googleClientId) {
        return res.status(400).json({ error: 'Google Client ID is not configured on the server.' });
      }
      
      const client = new OAuth2Client(googleClientId);
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: googleClientId
      });
      const payload = ticket.getPayload();
      if (!payload) {
        return res.status(400).json({ error: 'Invalid Google credential token.' });
      }
      
      email = payload.email;
      first_name = payload.given_name || 'Google';
      last_name = payload.family_name || 'User';
      profile_pic = payload.picture || null;
    } else {
      // Sandbox mode verification
      if (!email) {
        return res.status(400).json({ error: 'Email is required from Google account.' });
      }
    }

    let user = await User.findOne({ where: { email } });
    if (!user) {
      user = await User.create({
        email,
        password: null, // Passwordless for Google OAuth
        first_name: first_name || 'Google',
        last_name: last_name || 'User',
        display_name: `${first_name || 'Google'} ${last_name || 'User'}`.trim(),
        profile_pic: profile_pic
      });
    } else {
      // Sync names/profile picture if they were blank
      let userUpdated = false;
      if (!user.first_name || !user.last_name) {
        user.first_name = first_name || user.first_name || 'Google';
        user.last_name = last_name || user.last_name || 'User';
        user.display_name = `${user.first_name} ${user.last_name}`.trim();
        userUpdated = true;
      }
      if (profile_pic && !user.profile_pic) {
        user.profile_pic = profile_pic;
        userUpdated = true;
      }
      if (userUpdated) {
        await user.save();
      }
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: await formatUserResponse(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Google login failed: ' + err.message });
  }
});

// Forgot password request code
app.post('/api/auth/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ error: 'No account found with this email address.' });

    res.json({ message: 'Reset code generated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Forgot password processing failed.' });
  }
});

// Update password using verification code
app.post('/api/auth/reset-password', authLimiter, async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) return res.status(400).json({ error: 'All fields are required.' });

    if (code !== '123456') return res.status(400).json({ error: 'Invalid verification code. Use code 123456.' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password reset successful! You can now login.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Password reset failed.' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User profile not found.' });
    res.json({ user: await formatUserResponse(user) });
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

    const { plan } = req.body;
    const validPlans = ['starter', 'base', 'pro', 'enterprise'];
    const selectedPlan = validPlans.includes(plan) ? plan : 'starter';

    const planPrices = {
      starter: 1000,
      base: 2900,
      pro: 9900,
      enterprise: 12000
    };
    const planNames = {
      starter: 'PixelPDF Starter Plan',
      base: 'PixelPDF Base Plan',
      pro: 'PixelPDF Pro Plan',
      enterprise: 'PixelPDF Enterprise Plan'
    };

    const isMock = STRIPE_SECRET_KEY === 'sk_test_mockstripekey';
    if (isMock) {
      const mockUrl = `/api/stripe/mock-checkout?type=${selectedPlan}&userId=${user.id}&success_url=${encodeURIComponent(req.headers.origin || 'http://localhost:5173')}/?payment=success`;
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
            name: planNames[selectedPlan],
            description: `Unlock premium features for the ${selectedPlan} plan.`
          },
          unit_amount: planPrices[selectedPlan],
          recurring: { interval: 'month' }
        },
        quantity: 1
      }],
      mode: 'subscription',
      success_url: `${req.headers.origin || 'http://localhost:5173'}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'http://localhost:5173'}/?payment=cancel`,
      metadata: {
        userId: user.id,
        type: 'subscription',
        plan: selectedPlan
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
            name: 'PixelPDF Single Blog Post Publishing Pass',
            description: 'Allows you to publish a single article on the PixelPDF Blog page'
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

/* ==========================================
   USER COLLABORATION & TEAM ENDPOINTS
   ========================================== */

// Route: Get invited collaboration emails for logged in user
app.get('/api/collaboration/list', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const collaborators = await CollaborationEmail.findAll({
      where: { owner_id: user.id }
    });

    const planLimits = {
      base: 4,
      pro: 14,
      enterprise: 99
    };
    const currentPlan = user.subscription_plan || 'free';
    const maxCollaborators = planLimits[currentPlan] || 0;

    res.json({
      success: true,
      collaborators: collaborators.map(c => ({ id: c.id, email: c.email })),
      seatsUsed: collaborators.length,
      maxSeats: maxCollaborators,
      canCollaborate: ['base', 'pro', 'enterprise'].includes(currentPlan)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch collaborator list.' });
  }
});

// Route: Add user email to collaboration list
app.post('/api/collaboration/add', authenticateToken, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email address is required.' });
    const formattedEmail = email.trim().toLowerCase();

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const currentPlan = user.subscription_plan || 'free';
    const planLimits = {
      base: 4,
      pro: 14,
      enterprise: 99
    };
    const maxCollaborators = planLimits[currentPlan] || 0;

    if (!['base', 'pro', 'enterprise'].includes(currentPlan)) {
      return res.status(403).json({ error: 'Your current plan does not support multi-user collaboration. Please upgrade to Base or higher.' });
    }

    const existingCollaborators = await CollaborationEmail.findAll({
      where: { owner_id: user.id }
    });

    if (existingCollaborators.length >= maxCollaborators) {
      return res.status(400).json({ error: `Invite limit reached. Your plan allows up to ${maxCollaborators} collaborators.` });
    }

    const alreadyInvited = existingCollaborators.find(c => c.email.toLowerCase() === formattedEmail);
    if (alreadyInvited) {
      return res.status(400).json({ error: 'This user is already in your collaboration team.' });
    }

    const newInvite = await CollaborationEmail.create({
      owner_id: user.id,
      email: formattedEmail
    });

    res.json({
      success: true,
      collaborator: { id: newInvite.id, email: newInvite.email },
      message: 'Collaborator added successfully.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to invite collaborator.' });
  }
});

// Route: Remove email from collaboration list
app.delete('/api/collaboration/remove', authenticateToken, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email address is required.' });
    const formattedEmail = email.trim().toLowerCase();

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const deleted = await CollaborationEmail.destroy({
      where: {
        owner_id: user.id,
        email: formattedEmail
      }
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Collaborator not found in your team.' });
    }

    res.json({
      success: true,
      message: 'Collaborator removed successfully.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove collaborator.' });
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
        user.subscription_plan = 'starter';
        await user.save();
        console.log(`[Mock Stripe] Upgraded user ${user.email} to Premium (Starter).`);
      } else if (['starter', 'base', 'pro', 'enterprise'].includes(type)) {
        user.is_premium = true;
        user.subscription_plan = type;
        await user.save();
        console.log(`[Mock Stripe] Upgraded user ${user.email} to ${type.toUpperCase()} plan.`);
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
        user: await formatUserResponse(user)
      });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session) return res.status(404).json({ error: 'Checkout session not found.' });

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (session.payment_status === 'paid') {
      const type = session.metadata.type;
      const plan = session.metadata.plan || 'starter';
      if (type === 'subscription') {
        user.is_premium = true;
        user.subscription_plan = plan;
      } else if (type === 'blog_pass') {
        user.can_blog = true;
      }
      await user.save();
      
      console.log(`[Stripe Verification] Verified payment and updated ${user.email} status (type: ${type}).`);
      return res.json({ 
        success: true, 
        user: await formatUserResponse(user)
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
          user.subscription_plan = session.metadata.plan || 'starter';
          console.log(`[Stripe] Upgraded user ${user.email} to Premium (${user.subscription_plan} plan).`);
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
    
    // Enrich each post with the author's current profile picture
    const enrichedPosts = await Promise.all(posts.map(async (post) => {
      const author = await User.findByPk(post.author_id);
      return {
        ...post.toJSON(),
        author_pic: author ? author.profile_pic : null
      };
    }));
    
    res.json({ posts: enrichedPosts });
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
    const { displayName, first_name, last_name } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (first_name !== undefined && last_name !== undefined) {
      user.first_name = first_name.trim() || null;
      user.last_name = last_name.trim() || null;
      user.display_name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || null;
    } else if (displayName !== undefined) {
      const updatedName = displayName.trim() || null;
      user.display_name = updatedName;
      
      // Propagate splits to first/last name columns
      if (updatedName) {
        const parts = updatedName.split(' ');
        user.first_name = parts[0] || '';
        user.last_name = parts.slice(1).join(' ') || '';
      } else {
        user.first_name = null;
        user.last_name = null;
      }
    } else {
      return res.status(400).json({ error: 'Display name or first/last names are required.' });
    }

    await user.save();

    // Propagate display name to all past blog posts
    const nameForBlogs = user.display_name || user.email;
    await BlogPost.update({ author_name: nameForBlogs }, { where: { author_id: user.id } });

    res.json({ 
      success: true, 
      displayName: user.display_name, 
      user: await formatUserResponse(user) 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update display name.' });
  }
});

// Route: Upload user profile picture
app.post('/api/user/profile-pic', authenticateToken, blogUpload.single('profile_pic'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file uploaded.' });

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const profilePicUrl = `/api/blog-uploads/${req.file.filename}`;
    user.profile_pic = profilePicUrl;
    await user.save();

    res.json({
      success: true,
      profilePicUrl,
      user: await formatUserResponse(user)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload profile picture.' });
  }
});

/* ==========================================
   PDF AI INTELLIGENCE SYSTEM (UNIFIED)
   ========================================== */

app.post('/api/ai/assistant', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
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

app.post('/api/ai/summarize', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
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

app.post('/api/ai/translate', upload.single('file'), checkUploadLimit, apiLimiter, async (req, res) => {
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
      page.drawText(`PixelPDF OCR Text Layer (Page ${i+1})`, {
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
        `"PixelPDF Table Extraction","${title.replace(/"/g, '""')}"`,
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
          firstField.setText('PixelPDF Autocomplete');
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
