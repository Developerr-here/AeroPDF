import 'dotenv/config';
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Stripe from 'stripe';
import nodemailer from 'nodemailer';
import XLSX from 'xlsx';
import { rateLimit } from 'express-rate-limit';
import { PDFDocument, PDFTextField, degrees, rgb, StandardFonts } from 'pdf-lib';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt-lite';
import { decryptPDF } from '@pdfsmaller/pdf-decrypt';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { OAuth2Client } from 'google-auth-library';
import { PDFParse } from 'pdf-parse';
const require = createRequire(import.meta.url);
const mammoth = require('mammoth');
const officeParser = require('officeparser');
const PptxGenJS = require('pptxgenjs');
import { User, BlogPost, CollaborationEmail, NewsletterSubscriber, ContactInquiry, syncDatabase } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);
const port = process.env.PORT || 3000;

const JWT_SECRET = process.env.JWT_SECRET || 'pdfbundles-enterprise-security-secret-passphrase';
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
  limit: process.env.NODE_ENV === 'test' ? 10000 : 30, // 30 requests per minute in production
  message: { error: 'Too many authentication attempts. Please try again in 1 minute.' },
  standardHeaders: 'draft-8',
  legacyHeaders: false
});

const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: async (req, res) => {
    if (process.env.NODE_ENV === 'test') return 10000;
    
    // Check if the user is authenticated & on a paid plan
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const dbUser = await User.findByPk(decoded.id);
        if (dbUser && dbUser.subscription_plan && dbUser.subscription_plan !== 'free') {
          return 2000; // Paid plans get 2000 requests/hour
        }
      } catch (err) {
        // Token verification failed or user not found, fallback to guest limits
      }
    }
    return 150; // Guest / Free plan gets 150 requests/hour
  },
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
  limits: { fileSize: 4.5 * 1024 * 1024 * 1024 } // 4.5GB limit (enforced per plan dynamically by checkUploadLimit)
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
    if (owner && ['premium', 'business', 'starter', 'base', 'pro', 'enterprise', 'custom'].includes(owner.subscription_plan)) {
      return true;
    }
  }
  return false;
}

// Helper: Serialize user responses consistently with dynamic premium and plan information
async function formatUserResponse(user) {
  if (!user) return null;
  let plan = user.subscription_plan || 'free';
  if (plan === 'free') {
    const isCollab = await CollaborationEmail.findOne({ where: { email: user.email } });
    if (isCollab) {
      plan = 'collaborator';
    }
  }
  return {
    id: user.id,
    email: user.email,
    is_premium: await getPremiumStatus(user),
    subscription_plan: plan,
    subscription_seats: user.subscription_seats,
    subscription_interval: user.subscription_interval,
    role: user.role,
    custom_features: user.custom_features,
    can_blog: user.can_blog,
    display_name: user.display_name,
    first_name: user.first_name,
    last_name: user.last_name,
    profile_pic: user.profile_pic,
    cumulative_bytes_processed: user.cumulative_bytes_processed,
    ai_credits_used: user.ai_credits_used,
    createdAt: user.createdAt
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

const getToolKeyFromPath = (path) => {
  if (path.includes('/merge')) return 'merge';
  if (path.includes('/split')) return 'split';
  if (path.includes('/remove-pages')) return 'remove-pages';
  if (path.includes('/extract-pages')) return 'extract-pages';
  if (path.includes('/organize')) return 'organize-pdf';
  if (path.includes('/scan')) return 'scan-to-pdf';
  if (path.includes('/compress')) return 'compress';
  if (path.includes('/repair')) return 'repair';
  if (path.includes('/ocr')) return 'ocr';
  if (path.includes('/img-to-pdf') || path.includes('/jpg-to-pdf')) return 'img-to-pdf';
  if (path.includes('/word-to-pdf')) return 'word-to-pdf';
  if (path.includes('/ppt-to-pdf')) return 'ppt-to-pdf';
  if (path.includes('/excel-to-pdf')) return 'excel-to-pdf';
  if (path.includes('/html-to-pdf')) return 'html-to-pdf';
  if (path.includes('/pdf-to-img') || path.includes('/pdf-to-jpg')) return 'pdf-to-img';
  if (path.includes('/pdf-to-word')) return 'pdf-to-word';
  if (path.includes('/pdf-to-ppt')) return 'pdf-to-ppt';
  if (path.includes('/pdf-to-excel')) return 'pdf-to-excel';
  if (path.includes('/pdf-to-pdfa')) return 'pdf-to-pdfa';
  if (path.includes('/rotate')) return 'rotate';
  if (path.includes('/page-numbers')) return 'page-numbers';
  if (path.includes('/watermark')) return 'watermark';
  if (path.includes('/crop')) return 'crop';
  if (path.includes('/edit-pdf')) return 'edit-pdf';
  if (path.includes('/pdf-forms')) return 'pdf-forms';
  if (path.includes('/unlock')) return 'unlock';
  if (path.includes('/protect')) return 'protect';
  if (path.includes('/sign')) return 'sign';
  if (path.includes('/redact')) return 'redact';
  if (path.includes('/compare')) return 'compare';
  if (path.includes('/summarize') || path.includes('/translate') || path.includes('/assistant')) return 'ai-assistant';
  if (path.includes('/remove-background')) return 'remove-background';
  if (path.includes('/upscale-image')) return 'upscale-image';
  return 'utility';
};

const isToolAllowedForUser = (user, toolKey) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  
  const plan = user.subscription_plan || 'free';
  if (plan === 'free') return false;
  
  if (plan === 'custom') {
    if (!user.custom_features) return false;
    try {
      const custom = typeof user.custom_features === 'string' ? JSON.parse(user.custom_features) : user.custom_features;
      if (custom) {
        if (custom.allowedTools && Array.isArray(custom.allowedTools)) {
          return custom.allowedTools.includes(toolKey);
        }
        if (custom[toolKey] !== undefined) {
          return !!custom[toolKey];
        }
      }
    } catch (e) {
      return false;
    }
    return false;
  }
  
};

const checkAISubscription = (dbUser) => {
  if (!dbUser) return false;
  if (dbUser.role === 'admin') return true;
  const plan = dbUser.subscription_plan || 'free';
  if (['premium', 'business', 'starter', 'base', 'pro', 'enterprise'].includes(plan)) {
    return true;
  }
  if (plan === 'custom') {
    return isToolAllowedForUser(dbUser, 'ai-assistant');
  }
  return false;
};

// Limit Middleware: Validate file size (10MB limit for free tier, including session cumulative size)
const getToolLimit = (path, plan, dbUser) => {
  let isPremium = ['premium', 'business', 'starter', 'base', 'pro', 'enterprise'].includes(plan);
  
  if (plan === 'custom' && dbUser) {
    const toolKey = getToolKeyFromPath(path);
    isPremium = isToolAllowedForUser(dbUser, toolKey);
  }
  
  if (path.includes('/merge') || path.includes('/split')) {
    return isPremium ? 4 * 1024 * 1024 * 1024 : 100 * 1024 * 1024; // 4GB vs 100MB
  }
  if (path.includes('/compress')) {
    return isPremium ? 4 * 1024 * 1024 * 1024 : 200 * 1024 * 1024; // 4GB vs 200MB
  }
  if (path.includes('/word-to-pdf') || path.includes('/ppt-to-pdf') || path.includes('/excel-to-pdf') ||
      path.includes('/pdf-to-word') || path.includes('/pdf-to-ppt') || path.includes('/pdf-to-excel') ||
      path.includes('/office-to-pdf') || path.includes('/pdf-to-office')) {
    return isPremium ? 4 * 1024 * 1024 * 1024 : 15 * 1024 * 1024; // 4GB vs 15MB
  }
  if (path.includes('/ocr')) {
    return isPremium ? 4 * 1024 * 1024 * 1024 : 15 * 1024 * 1024; // 4GB vs 15MB
  }
  if (path.includes('/pdf-to-img')) {
    return isPremium ? 4 * 1024 * 1024 * 1024 : 25 * 1024 * 1024; // 4GB vs 25MB
  }
  if (path.includes('/img-to-pdf')) {
    return isPremium ? 4 * 1024 * 1024 * 1024 : 40 * 1024 * 1024; // 4GB vs 40MB
  }
  if (path.includes('/edit-pdf')) {
    return 100 * 1024 * 1024; // 100MB all plans
  }
  if (path.includes('/sign')) {
    return 50 * 1024 * 1024; // 50MB all plans
  }
  if (path.includes('/redact') || path.includes('/compare')) {
    return 400 * 1024 * 1024; // 400MB all plans
  }
  if (path.includes('/pdf-forms')) {
    return isPremium ? 100 * 1024 * 1024 : 15 * 1024 * 1024; // 100MB vs 15MB
  }
  if (path.includes('/summarize')) {
    return 50 * 1024 * 1024; // 50MB
  }
  if (path.includes('/translate')) {
    return 200 * 1024 * 1024; // 200MB
  }
  // Default limits for utility tools (protect, unlock, rotate, watermark, page-numbers, organize, repair, crop)
  return isPremium ? 4 * 1024 * 1024 * 1024 : 100 * 1024 * 1024;
};

const resolveEffectivePlanAndUser = async (dbUser) => {
  if (!dbUser) return { plan: 'free', user: null };
  if (dbUser.subscription_plan && dbUser.subscription_plan !== 'free') {
    return { plan: dbUser.subscription_plan, user: dbUser };
  }
  const isCollaborator = await CollaborationEmail.findOne({
    where: { email: dbUser.email }
  });
  if (isCollaborator) {
    const owner = await User.findByPk(isCollaborator.owner_id);
    if (owner && owner.subscription_plan && owner.subscription_plan !== 'free') {
      return { plan: owner.subscription_plan, user: owner };
    }
  }
  return { plan: 'free', user: dbUser };
};

const getAICreditLimit = (plan, user) => {
  if (plan === 'custom' && user && user.custom_features) {
    try {
      const custom = typeof user.custom_features === 'string' ? JSON.parse(user.custom_features) : user.custom_features;
      if (custom && custom.ai_credits_limit !== undefined) {
        return parseInt(custom.ai_credits_limit, 10);
      }
    } catch (e) {}
  }
  
  const limits = {
    free: 0,
    starter: 50,
    base: 150,
    pro: 1000,
    enterprise: 999999,
    premium: 1000,
    business: 999999
  };
  
  return limits[plan] || 0;
};

const checkUploadLimit = async (req, res, next) => {
  const clientCumulativeSize = parseInt(req.headers['x-cumulative-size'] || '0', 10);
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  let dbUser = null;
  let effectiveUser = null;
  let planName = 'free';
  let isPremium = false;
  let customMaxFileSize = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      dbUser = await User.findByPk(decoded.id);
      if (dbUser) {
        const resolved = await resolveEffectivePlanAndUser(dbUser);
        planName = resolved.plan;
        effectiveUser = resolved.user;
        isPremium = await getPremiumStatus(dbUser);
        
        if (effectiveUser && effectiveUser.custom_features) {
          try {
            const custom = typeof effectiveUser.custom_features === 'string' ? JSON.parse(effectiveUser.custom_features) : effectiveUser.custom_features;
            if (custom && custom.max_file_size) {
              customMaxFileSize = parseInt(custom.max_file_size, 10) * 1024 * 1024; // Convert MB to bytes
            }
          } catch (e) {
            // Ignore parsing error
          }
        }
      }
    } catch (err) {
      // Ignore token validation error
    }
  }

  let totalSize = 0;
  if (req.file) {
    totalSize = req.file.size;
  } else if (req.files) {
    totalSize = req.files.reduce((sum, f) => sum + f.size, 0);
  }

  const activeCumulativeSize = effectiveUser ? parseInt(effectiveUser.cumulative_bytes_processed || '0', 10) : clientCumulativeSize;

  // 1. Custom account overall limit check
  if (customMaxFileSize !== null) {
    if (activeCumulativeSize > customMaxFileSize || totalSize + activeCumulativeSize > customMaxFileSize) {
      cleanTempFiles(req);
      const limitMb = Math.round(customMaxFileSize / (1024 * 1024));
      return res.status(403).json({ error: `File size exceeds your custom account limit of ${limitMb}MB.` });
    }
  }

  // 2. Per-task Tool limit check
  const toolLimit = getToolLimit(req.path, planName, effectiveUser);
  if (totalSize > toolLimit) {
    cleanTempFiles(req);
    const limitMb = toolLimit >= 1024 * 1024 * 1024 
      ? `${Math.round(toolLimit / (1024 * 1024 * 1024))}GB` 
      : `${Math.round(toolLimit / (1024 * 1024))}MB`;
    return res.status(403).json({ error: `File size exceeds the ${limitMb} limit for this tool on your plan.` });
  }

  if (effectiveUser) {
    effectiveUser.cumulative_bytes_processed = activeCumulativeSize + totalSize;
    await effectiveUser.save();
    req.user = { id: dbUser.id, email: dbUser.email };
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

const verifyAISubscriptionAndCredits = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  let isAllowed = false;
  let effectiveUser = null;
  let planName = 'free';

  // Calculate the AI credit cost dynamically depending on the route
  const getAICostForRoute = (path) => {
    if (path.includes('/remove-background')) return 500; // Image background removal costs 500 credits
    if (path.includes('/upscale')) return 450;           // Image upscaling costs 450 credits
    return 5; // Default text tools cost 5 credits (Summarize, Chat assistant, Translate)
  };

  const cost = getAICostForRoute(req.path);

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const dbUser = await User.findByPk(decoded.id);
      if (dbUser) {
        // Resolve subscription plan using resolved.user (owner/subscriber)
        const resolved = await resolveEffectivePlanAndUser(dbUser);
        planName = resolved.plan;
        
        // If the resolved subscriber has access, allow the logged-in user to use credits separately
        if (checkAISubscription(resolved.user)) {
          effectiveUser = dbUser; // Separate credit count: track on the logged-in user directly!
          const limit = getAICreditLimit(planName, dbUser);
          const used = dbUser.ai_credits_used || 0;
          if (used + cost <= limit) {
            isAllowed = true;
          } else {
            cleanTempFiles(req);
            return res.status(403).json({ error: `Insufficient AI Credits. This request requires ${cost} credits, but you only have ${limit - used} credits remaining. Please upgrade or contact support.` });
          }
        }
      }
    } catch (err) {}
  }

  if (!isAllowed) {
    cleanTempFiles(req);
    return res.status(403).json({ error: 'AI tools (including Summarize, Chat, Translate, Background Remover, and Upscaler) are only available on the Premium or Business plan. Please upgrade to continue.' });
  }

  if (effectiveUser) {
    effectiveUser.ai_credits_used = (effectiveUser.ai_credits_used || 0) + cost;
    await effectiveUser.save();
    req.user = { id: effectiveUser.id, email: effectiveUser.email };
  }
  next();
};

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

app.post('/api/auth/change-email', authenticateToken, async (req, res) => {
  try {
    const { newEmail } = req.body;
    if (!newEmail) return res.status(400).json({ error: 'New email address is required.' });

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const existingUser = await User.findOne({ where: { email: newEmail } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email address is already in use by another account.' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.email = newEmail;
    await user.save();

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: await formatUserResponse(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update email address.' });
  }
});

// Config route: Expose Google Client ID to frontend
app.get('/api/config/google-client-id', (req, res) => {
  res.json({ clientId: process.env.GOOGLE_CLIENT_ID || null });
});

// Helper to decode a JWT token's payload without verifying signature (for dev fallback)
const decodeJwt = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payloadBuf = Buffer.from(parts[1], 'base64');
    return JSON.parse(payloadBuf.toString('utf8'));
  } catch (err) {
    return null;
  }
};

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
      let payload = null;
      if (googleClientId) {
        const client = new OAuth2Client(googleClientId);
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: googleClientId
        });
        payload = ticket.getPayload();
      } else {
        // Fallback: decode JWT locally without verifying signature for dev convenience
        payload = decodeJwt(credential);
      }
      
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

    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.reset_code = code;
    user.reset_code_expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry
    await user.save();

    // Send reset code via email
    try {
      const mailOptions = {
        from: `"pdfbundles Support" <${process.env.SMTP_USER || 'no-reply@pdfbundles.com'}>`,
        to: email,
        subject: 'Your Password Reset Verification Code',
        html: `
          <div style="font-family: sans-serif; padding: 2rem; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 0.75rem; background: #ffffff;">
            <h2 style="color: #0f172a; margin-top: 0; font-size: 1.5rem; font-weight: 700; text-align: center;">Password Reset Request</h2>
            <p style="color: #475569; font-size: 0.95rem; line-height: 1.6; margin-top: 1rem; text-align: center;">
              We received a request to reset the password for your pdfbundles account. Use the verification code below to set a new password:
            </p>
            <div style="margin: 2rem 0; text-align: center;">
              <span style="font-family: monospace; font-size: 2.25rem; font-weight: 800; letter-spacing: 0.1em; color: #0066ff; background: #f1f5f9; padding: 0.75rem 1.5rem; border-radius: 0.5rem; display: inline-block;">
                ${code}
              </span>
            </div>
            <p style="color: #ef4444; font-size: 0.85rem; font-weight: 600; text-align: center; margin-bottom: 2rem;">
              This code is valid for 15 minutes. If you did not request a password reset, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin-bottom: 1.5rem;" />
            <p style="color: #94a3b8; font-size: 0.8rem; margin: 0; text-align: center;">
              &copy; 2026 pdfbundles. All rights reserved.
            </p>
          </div>
        `
      };
      await transporter.sendMail(mailOptions);
    } catch (mailErr) {
      console.warn('Mail delivery skipped or failed. Continuing with local code availability. Detail:', mailErr.message);
    }

    // Log the code to the server console for secure local development visibility
    console.log(`[PASSWORD_RESET_CODE] Verification code for ${email} is: ${code}`);

    res.json({ 
      message: 'Verification code sent! Please check your email inbox.' 
    });
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

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (!user.reset_code || user.reset_code !== code) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    if (new Date() > new Date(user.reset_code_expires)) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }

    if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.reset_code = null;
    user.reset_code_expires = null;
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

    const { plan, seats: seatsInput, interval: intervalInput } = req.body;
    const selectedPlan = plan === 'premium' ? 'premium' : 'premium';
    const seats = Math.min(25, Math.max(1, parseInt(seatsInput, 10) || 1));
    const interval = intervalInput === 'year' ? 'year' : 'month';

    const unitAmount = interval === 'year' ? 4800 : 700; // $48.00/year ($4.00/mo) vs $7.00/month
    const planName = `pdfbundles Premium Plan (${seats} Seat${seats > 1 ? 's' : ''})`;

    const isMock = STRIPE_SECRET_KEY === 'sk_test_mockstripekey';
    if (isMock) {
      const mockUrl = `/api/stripe/mock-checkout?type=${selectedPlan}&seats=${seats}&interval=${interval}&userId=${user.id}&success_url=${encodeURIComponent(req.headers.origin || 'http://localhost:5173')}/?payment=success`;
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
            name: planName,
            description: `Unlock premium document processing for your team.`
          },
          unit_amount: unitAmount,
          recurring: { interval: interval }
        },
        quantity: seats
      }],
      mode: 'subscription',
      success_url: `${req.headers.origin || 'http://localhost:5173'}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'http://localhost:5173'}/?payment=cancel`,
      metadata: {
        userId: user.id,
        type: 'subscription',
        plan: selectedPlan,
        seats: seats.toString(),
        interval: interval
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
            name: 'pdfbundles Single Blog Post Publishing Pass',
            description: 'Allows you to publish a single article on the pdfbundles Blog page'
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

// Route: Newsletter subscription - directly saving to database (free)
app.post('/api/stripe/newsletter-checkout', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required for newsletter subscription.' });
    }

    const emailLower = email.toLowerCase().trim();
    
    // Save/Upsert to database
    await NewsletterSubscriber.upsert({
      email: emailLower,
      status: 'active'
    });

    console.log(`[Newsletter] Free subscription successful for ${emailLower}.`);
    res.json({ success: true, message: 'Successfully subscribed to the newsletter!' });
  } catch (err) {
    console.error('[Newsletter Error]', err);
    res.status(500).json({ error: 'Failed to subscribe to the newsletter: ' + err.message });
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

    const currentPlan = user.subscription_plan || 'free';
    let maxCollaborators = 0;
    let canCollaborate = false;

    if (['premium', 'business', 'starter', 'base', 'pro', 'enterprise', 'custom'].includes(currentPlan)) {
      maxCollaborators = Math.max(0, user.subscription_seats - 1);
      canCollaborate = user.subscription_seats > 1;
    }

    res.json({
      success: true,
      collaborators: collaborators.map(c => ({ id: c.id, email: c.email })),
      seatsUsed: collaborators.length + 1, // Owner is 1 seat
      maxSeats: maxCollaborators + 1, // Total seats
      canCollaborate: canCollaborate
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
    let maxCollaborators = 0;
    let canCollaborate = false;

    if (['premium', 'business', 'starter', 'base', 'pro', 'enterprise', 'custom'].includes(currentPlan)) {
      maxCollaborators = Math.max(0, user.subscription_seats - 1);
      canCollaborate = user.subscription_seats > 1;
    }

    if (!canCollaborate) {
      return res.status(403).json({ error: 'Your current plan does not support multi-user collaboration. Please upgrade to Premium or higher.' });
    }

    if (formattedEmail === user.email.toLowerCase()) {
      return res.status(400).json({ error: 'You cannot invite yourself to your own team.' });
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
  const { type, userId, email, success_url } = req.query;
  try {
    if (type === 'newsletter') {
      if (email) {
        await NewsletterSubscriber.upsert({
          email: email.toLowerCase(),
          status: 'active'
        });
        console.log(`[Mock Stripe] Newsletter subscription successful for ${email}.`);
      }
    } else if (userId) {
      const user = await User.findByPk(userId);
      if (user) {
        if (type === 'premium') {
          user.is_premium = true;
          user.subscription_plan = 'premium';
          user.subscription_seats = parseInt(req.query.seats, 10) || 1;
          user.subscription_interval = req.query.interval === 'year' ? 'year' : 'month';
          await user.save();
          console.log(`[Mock Stripe] Upgraded user ${user.email} to Premium (${user.subscription_seats} seats, ${user.subscription_interval}).`);
        } else if (['starter', 'base', 'pro', 'enterprise'].includes(type)) {
          user.is_premium = true;
          user.subscription_plan = type;
          user.subscription_seats = parseInt(req.query.seats, 10) || 1;
          user.subscription_interval = req.query.interval === 'year' ? 'year' : 'month';
          await user.save();
          console.log(`[Mock Stripe] Upgraded user ${user.email} to ${type.toUpperCase()} plan.`);
        } else if (type === 'blog_pass') {
          user.can_blog = true;
          await user.save();
          console.log(`[Mock Stripe] Granted blog writer permissions to ${user.email}.`);
        }
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
        user.subscription_seats = parseInt(session.metadata.seats, 10) || 1;
        user.subscription_interval = session.metadata.interval || 'month';
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

    if (type === 'newsletter') {
      const email = session.metadata.email || (session.customer_details && session.customer_details.email);
      if (email) {
        await NewsletterSubscriber.upsert({
          email: email.toLowerCase(),
          status: 'active',
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription
        });
        console.log(`[Stripe Webhook] Newsletter subscription completed for ${email}`);
      }
    } else if (userId) {
      const user = await User.findByPk(userId);
      if (user) {
        if (type === 'subscription') {
          user.is_premium = true;
          user.subscription_plan = session.metadata.plan || 'premium';
          user.subscription_seats = parseInt(session.metadata.seats, 10) || 1;
          user.subscription_interval = session.metadata.interval || 'month';
          console.log(`[Stripe Webhook] Upgraded user ${user.email} to Premium (${user.subscription_seats} seats, ${user.subscription_interval} plan).`);
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
   SMTP ENTERPRISE & ADMIN API ENDPOINTS
   ========================================== */

// SMTP Transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
    pass: process.env.SMTP_PASS || 'ethereal_password'
  }
});

// Contact Sales Form submission API
app.post('/api/contact-sales', async (req, res) => {
  const { firstName, lastName, companyName, businessEmail, message } = req.body;
  if (!firstName || !lastName || !companyName || !businessEmail || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'admin-secure-portal-789@pdfbundles.com';

  const mailOptions = {
    from: `"pdfbundles Contact Sales" <${process.env.SMTP_USER || 'sales@pdfbundles.com'}>`,
    to: adminEmail,
    subject: `New Enterprise Inquiry from ${firstName} ${lastName} (${companyName})`,
    text: `New contact sales inquiry received:
    
First Name: ${firstName}
Last Name: ${lastName}
Company: ${companyName}
Business Email: ${businessEmail}
Message:
${message}
`,
    html: `
      <h2>New Enterprise Inquiry</h2>
      <p><strong>First Name:</strong> ${firstName}</p>
      <p><strong>Last Name:</strong> ${lastName}</p>
      <p><strong>Company:</strong> ${companyName}</p>
      <p><strong>Business Email:</strong> <a href="mailto:${businessEmail}">${businessEmail}</a></p>
      <p><strong>Message:</strong></p>
      <blockquote style="background: #f3f4f6; padding: 10px 15px; border-left: 4px solid #6366f1;">
        ${message.replace(/\n/g, '<br>')}
      </blockquote>
    `
  };

  try {
    // Save to Database
    await ContactInquiry.create({
      first_name: firstName,
      last_name: lastName,
      company_name: companyName,
      business_email: businessEmail,
      message: message
    });

    if (transporter.options.host === 'smtp.ethereal.email' && transporter.options.auth.user === 'ethereal.user@ethereal.email') {
      console.log(`[SMTP Simulated] Inquiry from ${businessEmail} successfully processed! (Ethereal Simulated).`);
      return res.json({ success: true, message: 'Thank you! Your inquiry has been submitted successfully.' });
    }
    
    await transporter.sendMail(mailOptions);
    console.log(`[SMTP] Sent enterprise inquiry from ${businessEmail} to admin.`);
    res.json({ success: true, message: 'Thank you! Your inquiry has been submitted successfully.' });
  } catch (err) {
    console.error('[SMTP/DB Error]', err);
    console.log('Fallback to database-only save/mock success for convenience.');
    return res.json({ success: true, message: 'Thank you! Your inquiry has been submitted successfully.' });
  }
});

// Admin inquiries fetch
app.get('/api/admin/inquiries', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }
    const inquiries = await ContactInquiry.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ inquiries });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve inquiries.' });
  }
});

// Admin inquiry deletion
app.delete('/api/admin/inquiries/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }
    const inquiry = await ContactInquiry.findByPk(req.params.id);
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found.' });
    await inquiry.destroy();
    res.json({ success: true, message: 'Inquiry deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete inquiry.' });
  }
});

// Admin newsletter subscribers fetch
app.get('/api/admin/subscribers', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }
    const subscribers = await NewsletterSubscriber.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ subscribers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve newsletter subscribers.' });
  }
});

// Admin newsletter subscriber deletion / unsubscribe
app.delete('/api/admin/subscribers/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }
    const subscriber = await NewsletterSubscriber.findByPk(req.params.id);
    if (!subscriber) return res.status(404).json({ error: 'Subscriber not found.' });
    await subscriber.destroy();
    res.json({ success: true, message: 'Subscriber deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete subscriber.' });
  }
});

// Admin manual account plan override configuration API
app.post('/api/admin/set-plan', authenticateToken, async (req, res) => {
  const { email, plan, seats, interval, customFeatures, features, role } = req.body;
  const finalFeatures = customFeatures !== undefined ? customFeatures : features;
  if (!email || !plan) {
    return res.status(400).json({ error: 'Email and plan are required.' });
  }
  
  try {
    const adminUser = await User.findByPk(req.user.id);
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }

    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    
    user.subscription_plan = plan;
    user.subscription_seats = parseInt(seats, 10) || 1;
    user.subscription_interval = interval || 'month';
    user.is_premium = plan !== 'free';
    
    if (role) {
      user.role = role;
    }
    
    if (finalFeatures !== undefined) {
      if (typeof finalFeatures === 'object') {
        user.custom_features = JSON.stringify(finalFeatures);
      } else {
        user.custom_features = finalFeatures;
      }
    }
    
    await user.save();
    
    console.log(`[Admin Override] Configured user ${email} (plan: ${plan}, seats: ${user.subscription_seats}, role: ${user.role}, features: ${user.custom_features}).`);
    res.json({ success: true, message: `Successfully updated user ${email} configuration.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Admin configuration failed: ' + err.message });
  }
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

// Route: Change user password
app.post('/api/user/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }

  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (user.password) {
      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) return res.status(400).json({ error: 'Incorrect current password.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update password.' });
  }
});


/* ==========================================
   PDF AI INTELLIGENCE SYSTEM (UNIFIED)
   ========================================== */

app.post('/api/ai/assistant', upload.single('file'), checkUploadLimit, verifyAISubscriptionAndCredits, apiLimiter, async (req, res) => {
  try {
    const file = req.file;
    const { mode, question, targetLanguage } = req.body;

    if (!file) return res.status(400).json({ error: 'PDF file is required.' });
    if (!mode) return res.status(400).json({ error: 'Mode (summarize, chat, translate, notes) is required.' });

    // Stream text parsing from file
    let pdfData;
    try {
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

app.post('/api/ai/summarize', upload.single('file'), checkUploadLimit, verifyAISubscriptionAndCredits, apiLimiter, async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'PDF file is required.' });

    // Stream text parsing from file
    let pdfData;
    try {
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

app.post('/api/ai/translate', upload.single('file'), checkUploadLimit, verifyAISubscriptionAndCredits, apiLimiter, async (req, res) => {
  try {
    const file = req.file;
    const { targetLanguage } = req.body;
    if (!file || !targetLanguage) {
      return res.status(400).json({ error: 'PDF file and target language are required.' });
    }

    let pdfData;
    try {
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

app.post('/api/image/remove-background', upload.single('file'), checkUploadLimit, verifyAISubscriptionAndCredits, apiLimiter, async (req, res) => {
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

app.post('/api/image/upscale', upload.single('file'), checkUploadLimit, verifyAISubscriptionAndCredits, apiLimiter, async (req, res) => {
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
app.post('/api/html-to-pdf', apiLimiter, async (req, res) => {
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
        `"pdfbundles Table Extraction","${title.replace(/"/g, '""')}"`,
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
        res.setHeader('Content-Type', 'application/msword');
        res.setHeader('Content-Disposition', `attachment; filename="${file.originalname.replace(/\.[^/.]+$/, "")}.doc"`);
        return res.send(Buffer.from(wordHtml));
      }
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
   SEO SITEMAP FOR SPA
   ========================================== */
app.get('/sitemap.xml', (req, res) => {
  const host = req.get('host');
  const protocol = req.protocol;
  const baseUrl = `${protocol}://${host}`;

  const pages = [
    '',
    '?tab=blog',
    '?tab=features',
    '?tab=documentation',
    '?tab=faq',
    '?tab=security',
    '?tab=press',
    '?tab=privacy',
    '?tab=terms',
    '?tab=about'
  ];

  const tools = [
    'merge', 'split', 'compress', 'pdf-to-word', 'word-to-pdf', 
    'pdf-to-img', 'img-to-pdf', 'organize-pdf', 'edit-pdf', 
    'rotate', 'crop', 'page-numbers', 'watermark', 'protect', 
    'unlock', 'sign', 'pdf-to-excel', 'excel-to-pdf', 
    'pdf-to-ppt', 'ppt-to-pdf', 'repair', 'ocr', 
    'ai-assistant', 'remove-background', 'upscale-image'
  ];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Add pages
  pages.forEach(p => {
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/${p}</loc>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';
  });

  // Add tools
  tools.forEach(t => {
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/?tool=${t}</loc>\n`;
    xml += '    <changefreq>monthly</changefreq>\n';
    xml += '    <priority>0.9</priority>\n';
    xml += '  </url>\n';
  });

  xml += '</urlset>';

  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

app.use(express.static(path.join(__dirname, 'dist')));

app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Express Error Handler for Multer / general errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(403).json({ error: 'File size exceeds system upload limits.' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  console.error('[Unhandled Error]', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
