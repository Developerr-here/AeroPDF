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

// Route: Get articles list (supports ?tool=compress-pdf filtering)
router.get('/articles', async (req, res) => {
  try {
    const { tool, category } = req.query;
    const targetTool = tool || category;
    
    let whereClause = { status: 'published' };
    if (targetTool && targetTool !== 'all' && targetTool !== 'general') {
      whereClause.tool_id = targetTool;
    }

    let posts = await BlogPost.findAll({ 
      where: whereClause,
      order: [['createdAt', 'DESC']] 
    });

    res.json({ success: true, articles: posts, posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load articles.' });
  }
});

// Route: Get single article by slug
router.get('/articles/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    let article = await BlogPost.findOne({ where: { slug } });
    if (!article) {
      article = await BlogPost.findByPk(slug);
    }
    if (!article) {
      return res.status(404).json({ error: 'Article not found.' });
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
