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
   301 REDIRECTS (Legacy Blog to Articles & Tools Prefix)
   ========================================== */
app.use((req, res, next) => {
  if (req.query?.q === '{search_term_string}' || (typeof req.url === 'string' && req.url.includes('{search_term_string}'))) {
    return res.redirect(301, '/');
  }
  next();
});

app.get('/blog', (req, res) => {
  res.redirect(301, '/articles');
});
app.get('/blog/:slug', (req, res) => {
  res.redirect(301, `/articles/${req.params.slug}`);
});
app.get(['/tools', '/tool'], (req, res) => {
  res.redirect(301, '/');
});
app.get(['/tools/:tool', '/tool/:tool'], (req, res) => {
  res.redirect(301, `/${req.params.tool}`);
});
app.get(['/:lang/tools/:tool', '/:lang/tool/:tool'], (req, res) => {
  res.redirect(301, `/${req.params.lang}/${req.params.tool}`);
});

const NON_EN_LANG_CODES = ['es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar', 'id', 'tr', 'vi', 'ru'];
const RTL_LANG_CODES = ['ar'];

const LANDING_PAGE_TITLES = {
  es: { title: "Herramientas PDF en línea gratuitas | PDFBundles", desc: "Comprime, convierte, edita y protege tus documentos PDF en línea de forma gratuita con PDFBundles." },
  fr: { title: "Outils PDF en ligne gratuits | PDFBundles", desc: "Compressez, convertissez, éditez et protégez vos documents PDF en ligne gratuitement avec PDFBundles." },
  de: { title: "Kostenlose Online-PDF-Tools | PDFBundles", desc: "Komprimieren, konvertieren, bearbeiten und schützen Sie Ihre PDF-Dokumente kostenlos online mit PDFBundles." },
  it: { title: "Strumenti PDF online gratuiti | PDFBundles", desc: "Comprimi, converti, modifica e proteggi i tuoi documenti PDF online gratuitamente con PDFBundles." },
  pt: { title: "Ferramentas de PDF online gratuitas | PDFBundles", desc: "Comprima, converta, edite e proteja seus documentos PDF online gratuitamente com PDFBundles." },
  zh: { title: "免费在线PDF转换工具 | PDFBundles", desc: "使用PDFBundles免费在线合并、拆分、压缩、转换和编辑PDF文件。" },
  ja: { title: "無料のオンラインPDFツール | PDFBundles", desc: "PDFBundlesを使用して、オンラインでPDFファイルを無料で結合、分割、圧縮、変換、編集できます。" },
  ko: { title: "무료 온라인 PDF 변환 도구 | PDFBundles", desc: "PDFBundles를 사용하여 온라인에서 무료로 PDF 문서를 병합, 분할, 압축, 변환 및 편집하세요." },
  ar: { title: "أدوات PDF مجانية عبر الإنترنت | PDFBundles", desc: "قم بدمج وتقسيم وضغط وتحويل وتعديل ملفات PDF عبر الإنترنت مجانًا باستخدام PDFBundles." },
  id: { title: "Alat PDF Online Gratis | PDFBundles", desc: "Gabungkan, pisahkan, kompres, konversi, dan edit dokumen PDF secara gratis online dengan PDFBundles." },
  tr: { title: "Ücretsiz Çevrimiçi PDF Araçları | PDFBundles", desc: "PDFBundles ile PDF belgelerini çevrimiçi ücretsiz birleştirin, bölün, sıkıştırın ve dönüştürün." },
  vi: { title: "Công cụ PDF trực tuyến miễn phí | PDFBundles", desc: "Hợp nhất, chia nhỏ, nén, chuyển đổi và chỉnh sửa tệp PDF trực tuyến miễn phí với PDFBundles." },
  ru: { title: "Бесплатные онлайн-инструменты для PDF | PDFBundles", desc: "Объединяйте, разделяйте, сжимайте, конвертируйте и редактируйте PDF-документы онлайн бесплатно с PDFBundles." }
};

/* ==========================================
   DYNAMIC SEO SITEMAP
   ========================================== */
app.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = 'https://pdfbundles.com';
    const tools = Object.keys(seoConfig);
    const corePages = ['/pricing', '/features', '/about', '/privacy', '/terms', '/faq', '/security', '/documentation', '/press', '/articles'];
    const today = new Date().toISOString().split('T')[0];
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

    // 1. English Homepage (with trailing slash matching canonical & SEO team links)
    xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

    // 2. English Core Pages
    corePages.forEach(p => {
      xml += `  <url>\n    <loc>${baseUrl}${p}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    });

    // 3. Localized Landing Pages (The 13 languages requested by SEO team)
    NON_EN_LANG_CODES.forEach(lang => {
      xml += `  <url>\n    <loc>${baseUrl}/${lang}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
    });

    // 4. Localized Core Pages (e.g. /es/pricing, /es/features, etc.)
    NON_EN_LANG_CODES.forEach(lang => {
      corePages.forEach(p => {
        xml += `  <url>\n    <loc>${baseUrl}/${lang}${p}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
      });
    });

    // 5. English Tools
    tools.forEach(t => {
      xml += `  <url>\n    <loc>${baseUrl}${t}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
    });

    // 6. Localized Tools for each language
    NON_EN_LANG_CODES.forEach(lang => {
      tools.forEach(t => {
        xml += `  <url>\n    <loc>${baseUrl}/${lang}${t}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      });
    });

    // 7. Dynamic Articles from Database (English & Localized)
    const articles = await BlogPost.findAll({ where: { status: 'published' } });
    articles.forEach(article => {
      const date = new Date(article.createdAt || article.created_at || Date.now()).toISOString().split('T')[0];
      xml += `  <url>\n    <loc>${baseUrl}/articles/${article.slug}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
      NON_EN_LANG_CODES.forEach(lang => {
        xml += `  <url>\n    <loc>${baseUrl}/${lang}/articles/${article.slug}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
      });
    });

    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    console.error('Sitemap generation error:', err);
    res.status(500).send('Error generating sitemap');
  }
});

// Serve static files from the React frontend build (disable index.html auto-serving so SSR handler injects hreflang)
app.use(express.static(path.join(__dirname, 'frontend/dist'), { index: false }));

app.get(/.*/, async (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  
  const indexPath = path.join(__dirname, 'frontend/dist', 'index.html');
  
  fs.readFile(indexPath, 'utf8', async (err, htmlData) => {
    if (err) {
      console.error('Error reading index.html:', err);
      return res.status(500).send('Error loading page');
    }
    
    let finalHtml = htmlData;
    const rawPath = req.path.replace(/\/$/, '') || '';
    const segments = rawPath.split('/').filter(Boolean);
    
    let currentLang = 'en';
    let cleanPath = rawPath; // e.g. /merge-pdf or /pricing or ''
    
    if (segments.length > 0 && NON_EN_LANG_CODES.includes(segments[0].toLowerCase())) {
      currentLang = segments[0].toLowerCase();
      const remainingSegments = segments.slice(1);
      cleanPath = remainingSegments.length > 0 ? '/' + remainingSegments.join('/') : '';
    }
    
    const isRtl = RTL_LANG_CODES.includes(currentLang);
    const fullCanonicalUrl = `https://pdfbundles.com${rawPath || '/'}`;

    // 1. Update <html lang="..." dir="...">
    finalHtml = finalHtml.replace(/<html\s+lang="[^"]*"/i, `<html lang="${currentLang}" dir="${isRtl ? 'rtl' : 'ltr'}"`);
    if (!finalHtml.includes(`dir="${isRtl ? 'rtl' : 'ltr'}"`)) {
      finalHtml = finalHtml.replace(/<html([^>]*)>/i, `<html$1 dir="${isRtl ? 'rtl' : 'ltr'}">`);
    }

    // 2. Default self-referencing canonical for all pages
    finalHtml = finalHtml.replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${fullCanonicalUrl}"`);

    // 3. Build reciprocal hreflang tags for all 14 languages + x-default
    const strippedBase = cleanPath; 
    let hreflangTags = `\n    <link rel="alternate" hreflang="x-default" href="https://pdfbundles.com${strippedBase || '/'}" />`;
    hreflangTags += `\n    <link rel="alternate" hreflang="en" href="https://pdfbundles.com${strippedBase || '/'}" />`;
    NON_EN_LANG_CODES.forEach(code => {
      hreflangTags += `\n    <link rel="alternate" hreflang="${code}" href="https://pdfbundles.com/${code}${strippedBase || '/'}" />`;
    });
    
    finalHtml = finalHtml.replace('</head>', `${hreflangTags}\n  </head>`);

    // 4. Localized Title and Description
    const seo = seoConfig[cleanPath];
    const landingMeta = LANDING_PAGE_TITLES[currentLang];
    
    if (seo) {
      let title = seo.title;
      let desc = seo.desc;
      finalHtml = finalHtml.replace(/<title>.*<\/title>/, `<title>${title}</title>`);
      finalHtml = finalHtml.replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${desc}"`);
      finalHtml = finalHtml.replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${title}"`);
      finalHtml = finalHtml.replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${desc}"`);
      finalHtml = finalHtml.replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${fullCanonicalUrl}"`);
    } else if (cleanPath === '' && landingMeta) {
      finalHtml = finalHtml.replace(/<title>.*<\/title>/, `<title>${landingMeta.title}</title>`);
      finalHtml = finalHtml.replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${landingMeta.desc}"`);
      finalHtml = finalHtml.replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${landingMeta.title}"`);
      finalHtml = finalHtml.replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${landingMeta.desc}"`);
      finalHtml = finalHtml.replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${fullCanonicalUrl}"`);
    } else if (cleanPath.startsWith('/articles/')) {
      const slug = cleanPath.replace('/articles/', '');
      try {
        const article = await BlogPost.findOne({ where: { slug, status: 'published' } });
        if (article) {
          const title = `${article.title} | PDF Bundles`;
          const desc = article.post_description || article.title;
          const canonical = fullCanonicalUrl;
          
          finalHtml = finalHtml.replace(/<title>.*<\/title>/, `<title>${title}</title>`);
          finalHtml = finalHtml.replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${desc}"`);
          finalHtml = finalHtml.replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${title}"`);
          finalHtml = finalHtml.replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${desc}"`);
          finalHtml = finalHtml.replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${canonical}"`);
        }
      } catch (dbErr) {
        console.error('Error fetching article for SEO metadata:', dbErr);
      }
    } else if (cleanPath === '/articles') {
      const title = 'Articles & Guides | PDF Bundles';
      const desc = 'Browse guides, tutorials, and tips for working with PDF documents, compression, editing, and digital document workflows.';
      finalHtml = finalHtml.replace(/<title>.*<\/title>/, `<title>${title}</title>`);
      finalHtml = finalHtml.replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${desc}"`);
      finalHtml = finalHtml.replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${title}"`);
      finalHtml = finalHtml.replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${desc}"`);
      finalHtml = finalHtml.replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${fullCanonicalUrl}"`);
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
