import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

const ArticlesAndGuides = ({ tool }) => {
  const navigate = useNavigate();
  const [realArticles, setRealArticles] = useState([]);
  const toolName = tool?.name || "PDF Processing";
  const toolNameLower = toolName.toLowerCase();
  const toolId = tool?.id || 'general';

  useEffect(() => {
    const fetchToolArticles = async () => {
      try {
        const res = await fetch(`/api/articles?tool=${toolId}`);
        const data = await res.json();
        if (data.success && data.articles && data.articles.length > 0) {
          setRealArticles(data.articles);
        }
      } catch (e) {}
    };
    fetchToolArticles();
  }, [toolId]);

  if (realArticles.length === 0) return null;

  return (
    <div className="w-full mt-24">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-bold text-slate-900">Latest Articles & Guides</h3>
        <button onClick={() => navigate('/articles')} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
          View Articles Hub →
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {realArticles.slice(0, 3).map((article, i) => (
          <div 
            key={article.id || i} 
            onClick={() => navigate(article.slug ? `/articles/${article.slug}` : '/articles')} 
            className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all flex flex-col h-full cursor-pointer group overflow-hidden"
          >
            {/* Cover Image Banner */}
            <div className="w-full h-44 bg-slate-100 overflow-hidden relative">
              {article.cover_image ? (
                <img
                  src={article.cover_image}
                  alt={article.alt_text || article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                  <BookOpen size={36} className="opacity-40" />
                </div>
              )}
              <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-white/20">
                {article.category || article.tool_id || 'GUIDE'}
              </span>
            </div>

            <div className="p-6 flex flex-col flex-1">
              <h4 className="text-lg font-bold text-slate-900 mb-2.5 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2">
                {article.title}
              </h4>
              <p className="text-slate-500 text-[13px] leading-relaxed mb-6 flex-1 line-clamp-3">
                {article.post_description || article.desc || article.content?.replace(/<[^>]*>?/gm, '').substring(0, 120)}
              </p>
              
              <div className="flex items-center gap-3 mt-auto pt-4 border-t border-slate-50">
                <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">
                  {article.author_name ? article.author_name.charAt(0).toUpperCase() : 'P'}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">{article.author_name || article.author || 'PDF Bundles Team'}</p>
                  <p className="text-[11px] text-slate-400">{article.createdAt ? new Date(article.createdAt).toLocaleDateString() : article.date}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArticlesAndGuides;
