import 'dotenv/config';
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import express from 'express';
import compression from 'compression';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import seoConfig from './seo-config.js';
import { syncDatabase, BlogPost } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);
const port = process.env.PORT || 3000;

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

// Helper: Periodically clean orphaned temporary files from uploads/ directory (older than 15 mins)
// Cleanup removed temporarily due to disk IO saturation.

import authRoutes from './src/routes/authRoutes.js';
app.use('/api/auth', authRoutes);

import paymentRoutes from './src/routes/paymentRoutes.js';
app.use('/api/stripe', paymentRoutes);

import adminRoutes from './src/routes/adminRoutes.js';
app.use('/api', adminRoutes);

/* ==========================================
   BLOGGING API ENDPOINTS
   ========================================== */

import blogRoutes from './src/routes/blogRoutes.js';
import userRoutes from './src/routes/userRoutes.js';

app.use('/api', blogRoutes);
app.use('/api/user', userRoutes);


import toolRoutes from './src/routes/toolRoutes.js';
app.use('/', toolRoutes);

/* ==========================================
   DYNAMIC SEO SITEMAP
   ========================================== */
app.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = 'https://pdfbundles.com';
    const tools = Object.keys(seoConfig);
    const pages = ['', '/pricing', '/features', '/blog', '/dashboard'];
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add Core Pages
    pages.forEach(p => {
      xml += `  <url>\n    <loc>${baseUrl}${p}</loc>\n    <changefreq>daily</changefreq>\n    <priority>${p === '' ? '1.0' : '0.8'}</priority>\n  </url>\n`;
    });

    // Add Tools
    tools.forEach(t => {
      xml += `  <url>\n    <loc>${baseUrl}${t}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
    });

    // Add Dynamic Articles from Database
    const articles = await BlogPost.findAll({ where: { status: 'published' } });
    articles.forEach(article => {
      const date = new Date(article.createdAt).toISOString().split('T')[0];
      xml += `  <url>\n    <loc>${baseUrl}/blog/${article.slug}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    });

    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    console.error('Sitemap generation error:', err);
    res.status(500).send('Error generating sitemap');
  }
});

// Serve static files from the React frontend build
app.use(express.static(path.join(__dirname, 'frontend/dist')));

app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  
  const indexPath = path.join(__dirname, 'frontend/dist', 'index.html');
  
  fs.readFile(indexPath, 'utf8', (err, htmlData) => {
    if (err) {
      console.error('Error reading index.html:', err);
      return res.status(500).send('Error loading page');
    }
    
    let finalHtml = htmlData;
    const seo = seoConfig[req.path];
    
    if (seo) {
      finalHtml = finalHtml.replace(/<title>.*<\/title>/, `<title>${seo.title}</title>`);
      finalHtml = finalHtml.replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${seo.desc}"`);
      finalHtml = finalHtml.replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${seo.title}"`);
      finalHtml = finalHtml.replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${seo.desc}"`);
      finalHtml = finalHtml.replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="https://pdfbundles.com${req.path}"`);
    }
    
    res.send(finalHtml);
  });
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
