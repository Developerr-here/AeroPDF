import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Tag, Share2, Check, BookOpen } from 'lucide-react';

const ArticleView = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const getSafeDate = (dateString) => {
    try {
      const d = new Date(dateString ? dateString.replace(' ', 'T') : Date.now());
      return isNaN(d.getTime()) ? 'Recently' : d.toLocaleDateString();
    } catch(e) {
      return 'Recently';
    }
  };

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/articles/${slug}`);
        const data = await res.json();
        if (data.success && (data.article || data.post)) {
          setArticle(data.article || data.post);
        } else {
          setError(data.error || 'Article not found.');
        }
      } catch (err) {
        setError('Failed to load article.');
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [slug]);

  useEffect(() => {
    if (article) {
      document.title = `${article.title} | PDF Bundles`;
      
      // Update Meta Description
      const desc = article.post_description || article.title;
      let metaDesc = document.querySelector("meta[name='description']");
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', desc);

      // Update Canonical Link
      const canonical = article.canonical_url || `https://pdfbundles.com/articles/${article.slug}`;
      let link = document.querySelector("link[rel='canonical']");
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonical);
    }
  }, [article]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 font-semibold">Loading Article...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <BookOpen size={48} className="text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Article Not Found</h2>
        <p className="text-slate-500 text-sm mb-6 max-w-md">
          The guide or article you are looking for may have been moved or removed.
        </p>
        <Link to="/articles" className="px-6 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md">
          Back to Articles & Guides
        </Link>
      </div>
    );
  }

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.post_description || article.title,
    "image": article.cover_image 
      ? (article.cover_image.startsWith('http') ? article.cover_image : `https://pdfbundles.com${article.cover_image}`)
      : "https://pdfbundles.com/favicon.png",
    "author": {
      "@type": "Person",
      "name": article.author_name || "PDF Bundles Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "PDF Bundles",
      "logo": {
        "@type": "ImageObject",
        "url": "https://pdfbundles.com/favicon.png"
      }
    },
    "datePublished": article.createdAt || article.created_at || new Date().toISOString(),
    "dateModified": article.updatedAt || article.updated_at || article.createdAt || new Date().toISOString(),
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": article.canonical_url || `https://pdfbundles.com/articles/${article.slug}`
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      {/* Article Schema Markup */}
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} 
      />

      {/* Main Container */}
      <div className="max-w-[900px] mx-auto px-6 pt-12">
        
        {/* Back Link */}
        <Link to="/articles" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors mb-8">
          <ArrowLeft size={14} /> Back to Articles & Guides
        </Link>

        {/* Article Metadata Bar (Category, Author, Date, Share) */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-white px-8 py-5 rounded-3xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full font-bold uppercase tracking-wider">
              <Tag size={12} /> {article.category || article.tool_id || 'GUIDE'}
            </div>
            <span className="text-slate-200">|</span>
            <span className="flex items-center gap-1.5 font-bold text-slate-800">
              <User size={14} className="text-indigo-600" /> {article.author_name || 'PDF Bundles Team'}
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-500">
              <Calendar size={14} /> {getSafeDate(article.created_at)}
            </span>
          </div>

          {/* Share Link Button */}
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors text-xs"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
            <span>{copied ? 'Link Copied!' : 'Share'}</span>
          </button>
        </div>

        {/* Featured Cover Image */}
        {article.cover_image && (
          <div className="w-full h-[400px] bg-slate-200 rounded-3xl overflow-hidden mb-12 shadow-lg border border-slate-200">
            <img
              src={article.cover_image}
              alt={article.alt_text || article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Main Formatted Article Body */}
        <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div 
            className="prose prose-indigo max-w-none text-slate-800 text-base leading-relaxed space-y-6"
            dangerouslySetInnerHTML={{ __html: article.content || '' }}
          />
        </div>


      </div>

    </div>
  );
};

export default ArticleView;
