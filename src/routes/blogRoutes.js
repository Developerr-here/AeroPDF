import express from 'express';
import { BlogPost, User } from '../../db.js';
import { authenticateToken } from '../middlewares/auth.js';
import { blogUpload } from '../middlewares/upload.js';

const router = express.Router();

// Helper: Check if user has article editing/publishing rights
const isArticleWriter = (user) => {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'writer' || user.can_blog) return true;
  const configuredWriterEmail = (process.env.SEO_WRITER_EMAIL || 'ehsanulhaqpk094@gmail.com').toLowerCase();
  return user.email.toLowerCase() === configuredWriterEmail;
};

// Helper: Generate clean SEO slug from title
const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

// In-memory Translation Cache
const translationCache = new Map();

const translateSingleText = async (text, targetLang) => {
  if (!text || !text.trim() || !targetLang || targetLang === 'en') return text;
  const cacheKey = `${targetLang}:${text.trim()}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.trim())}&langpair=en|${targetLang}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data?.responseData?.translatedText && !data.responseData.translatedText.startsWith('MYMEMORY WARNING')) {
        const translated = data.responseData.translatedText;
        translationCache.set(cacheKey, translated);
        return translated;
      }
    }
  } catch (err) {
    // Fallback to original text on network failure
  }
  return text;
};

const translateHtmlContent = async (html, targetLang) => {
  if (!html || !targetLang || targetLang === 'en') return html;
  const cacheKey = `${targetLang}:html:${html.length}:${html.slice(0, 40)}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  try {
    const tagRegex = /<(p|h[1-6]|li|blockquote)([^>]*)>([\s\S]*?)<\/\1>/gi;
    const segments = [];
    let match;
    while ((match = tagRegex.exec(html)) !== null) {
      const innerText = match[3].replace(/<[^>]+>/g, '').trim();
      if (innerText && innerText.length > 2) {
        segments.push({ full: match[0], tag: match[1], attrs: match[2], inner: match[3], text: innerText });
      }
    }

    if (segments.length === 0) return html;

    const uniqueTexts = [...new Set(segments.map(s => s.text))];
    const textTranslations = new Map();

    const chunkSize = 5;
    for (let i = 0; i < uniqueTexts.length; i += chunkSize) {
      const chunk = uniqueTexts.slice(i, i + chunkSize);
      await Promise.all(chunk.map(async (txt) => {
        const translated = await translateSingleText(txt, targetLang);
        textTranslations.set(txt, translated);
      }));
    }

    let translatedHtml = html;
    for (const seg of segments) {
      const translated = textTranslations.get(seg.text);
      if (translated && translated !== seg.text) {
        const newSeg = `<${seg.tag}${seg.attrs}>${translated}</${seg.tag}>`;
        translatedHtml = translatedHtml.replace(seg.full, newSeg);
      }
    }

    translationCache.set(cacheKey, translatedHtml);
    return translatedHtml;
  } catch (err) {
    return html;
  }
};

// Route: Get articles list (supports ?tool=compress-pdf and ?lang=ko filtering)
router.get('/articles', async (req, res) => {
  try {
    const { tool, category, lang } = req.query;
    const targetTool = tool || category;
    
    let whereClause = { status: 'published' };
    if (targetTool && targetTool !== 'all' && targetTool !== 'general') {
      whereClause.tool_id = targetTool;
    }

    let posts = await BlogPost.findAll({ 
      where: whereClause,
      order: [['createdAt', 'DESC']] 
    });

    if (lang && lang !== 'en' && posts.length > 0) {
      const translatedPosts = await Promise.all(posts.map(async (p) => {
        const postObj = p.toJSON ? p.toJSON() : { ...p };
        const translatedTitle = await translateSingleText(postObj.title, lang);
        const translatedDesc = await translateSingleText(postObj.post_description, lang);
        return {
          ...postObj,
          original_title: postObj.title,
          original_description: postObj.post_description,
          title: translatedTitle,
          post_description: translatedDesc,
          translated_to: lang
        };
      }));
      return res.json({ success: true, articles: translatedPosts, posts: translatedPosts });
    }

    res.json({ success: true, articles: posts, posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load articles.' });
  }
});

// Route: Get single article by slug (supports ?lang=ko)
router.get('/articles/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { lang } = req.query;

    let article = await BlogPost.findOne({ where: { slug } });
    if (!article) {
      article = await BlogPost.findByPk(slug);
    }
    if (!article) {
      return res.status(404).json({ error: 'Article not found.' });
    }

    if (lang && lang !== 'en') {
      const postObj = article.toJSON ? article.toJSON() : { ...article };
      const translatedTitle = await translateSingleText(postObj.title, lang);
      const translatedDesc = await translateSingleText(postObj.post_description, lang);
      const translatedContent = await translateHtmlContent(postObj.content, lang);
      const translatedArticle = {
        ...postObj,
        original_title: postObj.title,
        original_description: postObj.post_description,
        original_content: postObj.content,
        title: translatedTitle,
        post_description: translatedDesc,
        content: translatedContent,
        translated_to: lang
      };
      return res.json({ success: true, article: translatedArticle, post: translatedArticle });
    }

    res.json({ success: true, article, post: article });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load article.' });
  }
});

// Route: Create new article
router.post('/articles', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!isArticleWriter(user)) {
      return res.status(403).json({ error: 'Access denied. SEO Writer privileges required.' });
    }

    const { 
      title, 
      slug: customSlug, 
      category, 
      tool_id, 
      author_name, 
      canonical_url, 
      keywords, 
      cover_image, 
      alt_text, 
      post_description, 
      content, 
      status 
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }

    const baseSlug = customSlug || generateSlug(title);
    let finalSlug = baseSlug;
    let counter = 1;
    while (await BlogPost.findOne({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const targetTool = tool_id || category || 'general';
    const canonical = canonical_url || `https://pdfbundles.com/articles/${finalSlug}`;

    const post = await BlogPost.create({
      slug: finalSlug,
      title,
      content,
      category: targetTool,
      tool_id: targetTool,
      canonical_url: canonical,
      keywords: keywords || '',
      cover_image: cover_image || '',
      alt_text: alt_text || title,
      post_description: post_description || '',
      status: status || 'published',
      author_id: user.id,
      author_email: user.email,
      author_name: author_name || user.display_name || 'PDF Bundles Team'
    });

    res.json({ success: true, article: post, post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create article: ' + err.message });
  }
});

// Route: Update existing article
router.put('/articles/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!isArticleWriter(user)) {
      return res.status(403).json({ error: 'Access denied. SEO Writer privileges required.' });
    }

    const post = await BlogPost.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Article not found.' });

    const { 
      title, 
      slug: customSlug, 
      category, 
      tool_id, 
      author_name, 
      canonical_url, 
      keywords, 
      cover_image, 
      alt_text, 
      post_description, 
      content, 
      status 
    } = req.body;

    if (title) post.title = title;
    if (content) post.content = content;
    if (customSlug && customSlug !== post.slug) post.slug = customSlug;
    if (category || tool_id) {
      post.category = category || tool_id;
      post.tool_id = tool_id || category;
    }
    if (author_name) post.author_name = author_name;
    if (canonical_url) post.canonical_url = canonical_url;
    if (keywords !== undefined) post.keywords = keywords;
    if (cover_image !== undefined) post.cover_image = cover_image;
    if (alt_text !== undefined) post.alt_text = alt_text;
    if (post_description !== undefined) post.post_description = post_description;
    if (status) post.status = status;

    await post.save();
    res.json({ success: true, article: post, post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update article: ' + err.message });
  }
});

// Route: Delete article
router.delete('/articles/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!isArticleWriter(user)) {
      return res.status(403).json({ error: 'Access denied. SEO Writer privileges required.' });
    }

    const post = await BlogPost.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Article not found.' });

    await post.destroy();
    res.json({ success: true, message: 'Article deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete article.' });
  }
});

// Legacy blog alias route
router.get('/blog', async (req, res) => {
  const posts = await BlogPost.findAll({ order: [['createdAt', 'DESC']] });
  res.json({ posts });
});

// Route: Upload file or image for blog posts
router.post('/blog/upload', authenticateToken, blogUpload.single('file'), async (req, res) => {
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

export default router;
