import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
            className="bg-white p-8 rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all flex flex-col h-full cursor-pointer group"
          >
            <span className={`text-[10px] font-bold uppercase tracking-wider mb-4 text-indigo-600`}>
              {article.category || article.type || 'GUIDE'}
            </span>
            <h4 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors leading-snug">
              {article.title}
            </h4>
            <p className="text-slate-500 text-[14px] leading-relaxed mb-8 flex-1 line-clamp-3">
              {article.post_description || article.desc || article.content?.replace(/<[^>]*>?/gm, '').substring(0, 120)}
            </p>
            
            <div className="flex items-center gap-3 mt-auto pt-6 border-t border-slate-50">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                {article.author_name ? article.author_name.charAt(0).toUpperCase() : 'DO'}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{article.author_name || article.author || 'PDF Bundles Team'}</p>
                <p className="text-[11px] text-slate-400">{article.createdAt ? new Date(article.createdAt).toLocaleDateString() : article.date}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArticlesAndGuides;
