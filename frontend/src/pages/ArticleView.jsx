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

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">

      {/* Main Container */}
      <div className="max-w-[900px] mx-auto px-6 pt-12">
        
        {/* Back Link */}
        <Link to="/articles" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors mb-8">
          <ArrowLeft size={14} /> Back to Articles & Guides
        </Link>

        {/* Article Header Card */}
        <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] mb-8">
          
          {/* Category Pill Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
            <Tag size={12} /> {article.category || article.tool_id || 'GUIDE'}
          </div>

          {/* H1 Title */}
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight mb-6">
            {article.title}
          </h1>

          {/* Post Description / Excerpt */}
          {article.post_description && (
            <p className="text-slate-600 text-base md:text-lg leading-relaxed font-medium mb-8">
              {article.post_description}
            </p>
          )}

          {/* Author & Date Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-100 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-bold text-slate-800">
                <User size={14} className="text-indigo-600" /> {article.author_name || 'PDF Bundles Team'}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar size={14} /> {getSafeDate(article.created_at)}
              </span>
            </div>

            {/* Share Link Button */}
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
              <span>{copied ? 'Link Copied!' : 'Share'}</span>
            </button>
          </div>

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
