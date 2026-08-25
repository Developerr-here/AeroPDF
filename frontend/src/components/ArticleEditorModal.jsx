import React, { useState, useEffect, useRef } from 'react';
import { X, Link, Image as ImageIcon, AlertCircle, UploadCloud, Loader2 } from 'lucide-react';
import { ALL_TOOLS } from '../data/tools';

const ArticleEditorModal = ({ isOpen, onClose, onSave, articleToEdit, token }) => {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('general');
  const [authorName, setAuthorName] = useState('PDF Bundles Team');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [keywords, setKeywords] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [altText, setAltText] = useState('');
  const [postDescription, setPostDescription] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('published');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const fileInputRef = useRef(null);

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxAttachSize = 10 * 1024 * 1024; // 10MB limit
    if (file.size > maxAttachSize) {
      setError('Cover image exceeds the 10MB limit.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploadingCover(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/blog/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      
      if (res.ok && data.url) {
        setCoverImage(data.url);
      } else {
        setError(data.error || 'Failed to upload cover image.');
      }
    } catch (err) {
      setError('Error uploading cover image.');
    } finally {
      setIsUploadingCover(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (articleToEdit) {
      setTitle(articleToEdit.title || '');
      setSlug(articleToEdit.slug || '');
      setCategory(articleToEdit.category || articleToEdit.tool_id || 'general');
      setAuthorName(articleToEdit.author_name || 'PDF Bundles Team');
      setCanonicalUrl(articleToEdit.canonical_url || '');
      setKeywords(articleToEdit.keywords || '');
      setCoverImage(articleToEdit.cover_image || '');
      setAltText(articleToEdit.alt_text || '');
      setPostDescription(articleToEdit.post_description || '');
      setContent(articleToEdit.content || '');
      setStatus(articleToEdit.status || 'published');
    } else {
      setTitle('');
      setSlug('');
      setCategory('general');
      setAuthorName('PDF Bundles Team');
      setCanonicalUrl('');
      setKeywords('');
      setCoverImage('');
      setAltText('');
      setPostDescription('');
      setContent('');
      setStatus('published');
    }
    setError('');
  }, [articleToEdit, isOpen]);

  // Auto-generate slug when title changes
  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    if (!articleToEdit) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
      setSlug(generated);
      if (!canonicalUrl || canonicalUrl.includes('/articles/')) {
        setCanonicalUrl(`https://pdfbundles.com/articles/${generated}`);
      }
    }
  };

  const handleSlugChange = (e) => {
    const val = e.target.value;
    setSlug(val);
    setCanonicalUrl(`https://pdfbundles.com/articles/${val}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Title and Article Content are required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const payload = {
      title,
      slug: slug.trim(),
      category,
      tool_id: category,
      author_name: authorName,
      canonical_url: canonicalUrl || `https://pdfbundles.com/articles/${slug}`,
      keywords,
      cover_image: coverImage,
      alt_text: altText || title,
      post_description: postDescription,
      content,
      status
    };

    try {
      const url = articleToEdit ? `/api/articles/${articleToEdit.id}` : '/api/articles';
      const method = articleToEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save article.');
      }

      onSave(data.article || data.post);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-[1100px] w-full my-8 border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {articleToEdit ? 'Edit Article & Guide' : 'Create New Article & Guide'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">SEO Optimized Content CMS</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto flex-1 space-y-8">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 2 Column Layout (Matching Screenshot) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* LEFT COLUMN */}
            <div className="space-y-6">
              
              {/* URL Slug */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  URL slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={handleSlugChange}
                  placeholder="e.g. how-to-compress-pdf-online"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
                <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                  <Link size={12} className="text-indigo-600 shrink-0" />
                  <span>Post link will be: <strong className="text-slate-700">https://pdfbundles.com/articles/{slug || 'your-slug'}</strong></span>
                </p>
              </div>

              {/* Category / Target Tool Dropdown */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Category / Target Tool <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                >
                  <option value="general">General Guide (All Tools)</option>
                  {ALL_TOOLS.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Author */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Author <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="PDF Bundles Team"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              {/* Canonical link */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Canonical link
                </label>
                <input
                  type="text"
                  value={canonicalUrl}
                  onChange={(e) => setCanonicalUrl(e.target.value)}
                  placeholder={`https://pdfbundles.com/articles/${slug || 'slug'}`}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  If this post appears on multiple websites, add the original URL here to help search engines know which one to prioritize.
                </p>
              </div>

              {/* Add keywords */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Add keywords / tags
                </label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="compress pdf, pdf optimizer, shrink pdf size"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
                <p className="text-[11px] text-slate-400 mt-1">Separate keywords with commas.</p>
              </div>

            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6">
              
              {/* Title / Meta Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Title (Meta Title) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="e.g. How to Compress PDF Files Online in Seconds"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              {/* Cover image */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Cover Image
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="https://... or upload file"
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleCoverUpload} 
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingCover}
                    className="shrink-0 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold hover:bg-indigo-100 transition-colors flex items-center gap-2 border border-indigo-100 disabled:opacity-50"
                  >
                    {isUploadingCover ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                    Upload
                  </button>
                </div>
                
                {/* Cover Image Preview Box */}
                <div className="w-full h-36 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden relative">
                  {coverImage ? (
                    <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : (
                    <div className="text-center p-4">
                      <ImageIcon className="mx-auto text-slate-400 mb-1" size={24} />
                      <p className="text-xs text-slate-400 font-semibold">Cover Image Preview</p>
                      <p className="text-[11px] text-slate-400">Recommended size: 600 × 400 px</p>
                    </div>
                  )}
                </div>
              </div>


              {/* Alt text (for cover image) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Alt text (for cover image)
                </label>
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="e.g. Compress PDF Online Interface Preview"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              {/* Post description / Meta description */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Post Description (Meta Description) <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-xs font-bold ${postDescription.length > 250 ? 'text-red-500' : 'text-slate-400'}`}>
                    {postDescription.length} / 250
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={250}
                  value={postDescription}
                  onChange={(e) => setPostDescription(e.target.value)}
                  placeholder="Give a short description for viewers to get a glimpse of the post. Works best between 100 - 250 characters."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

            </div>

          </div>

          {/* MAIN ARTICLE BODY EDITOR (FULL WIDTH) */}
          <div className="pt-6 border-t border-slate-100">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Main Article Content (HTML / Formatted Text) <span className="text-red-500">*</span>
            </label>
            
            {/* Formatting Toolbar */}
            <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-100 rounded-t-xl border border-slate-200 border-b-0 text-slate-700 text-xs font-semibold">
              <button type="button" onClick={() => setContent(prev => prev + '\n<h2>Section Heading</h2>\n')} className="px-2.5 py-1 bg-white rounded border border-slate-200 hover:bg-slate-50">H2 Heading</button>
              <button type="button" onClick={() => setContent(prev => prev + '\n<h3>Sub Heading</h3>\n')} className="px-2.5 py-1 bg-white rounded border border-slate-200 hover:bg-slate-50">H3 Subheading</button>
              <button type="button" onClick={() => setContent(prev => prev + '<strong>Bold Text</strong>')} className="px-2.5 py-1 bg-white rounded border border-slate-200 hover:bg-slate-50 font-bold">B</button>
              <button type="button" onClick={() => setContent(prev => prev + '<em>Italic Text</em>')} className="px-2.5 py-1 bg-white rounded border border-slate-200 hover:bg-slate-50 italic">I</button>
              <button type="button" onClick={() => setContent(prev => prev + '\n<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>\n')} className="px-2.5 py-1 bg-white rounded border border-slate-200 hover:bg-slate-50">• List</button>
              <button type="button" onClick={() => setContent(prev => prev + '<a href="https://pdfbundles.com/compress-pdf" class="text-indigo-600 font-bold underline">Link Text</a>')} className="px-2.5 py-1 bg-white rounded border border-slate-200 hover:bg-slate-50">🔗 Link</button>
            </div>

            <textarea
              rows={12}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your comprehensive SEO article body content here..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-b-xl text-sm font-sans text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-mono"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? 'Saving...' : articleToEdit ? 'Update Article' : 'Publish Article'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default ArticleEditorModal;
