import React from 'react';
import { useNavigate } from 'react-router-dom';

const ArticlesAndGuides = ({ tool }) => {
  const navigate = useNavigate();
  const toolName = tool?.name || "PDF Processing";
  const toolNameLower = toolName.toLowerCase();

  const articles = [
    { 
      type: "GUIDE", 
      title: `How to Use ${toolName} to Speed Up Your Workflows`, 
      desc: `In this comprehensive guide, we examine how to use the online ${toolNameLower} utility to optimize and streamline your daily document workflows...`, 
      author: "Document Expert", 
      date: "August 1, 2026", 
      initials: "DO", 
      color: "text-indigo-600" 
    },
    { 
      type: "SECURITY", 
      title: `Top 5 Best Practices for Secure ${toolName}`, 
      desc: `Learn how to securely process and manage your files using ${toolNameLower}, keeping your data and information completely private and protected...`, 
      author: "Privacy Team", 
      date: "July 28, 2026", 
      initials: "PR", 
      color: "text-indigo-600" 
    },
    { 
      type: "ENTERPRISE", 
      title: `Streamlining Document Pipelines via ${toolName}`, 
      desc: `Discover how browser-first tools enable teams to perform ${toolNameLower} on-the-fly with cloud reliability, batch options, and high accuracy...`, 
      author: "Product Arch", 
      date: "July 25, 2026", 
      initials: "PA", 
      color: "text-indigo-600" 
    }
  ];

  return (
    <div className="w-full mt-24">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-bold text-slate-900">Latest Articles & Guides</h3>
        <button onClick={() => navigate('/blog')} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
          View Blog Hub →
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {articles.map((article, i) => (
          <div key={i} onClick={() => navigate('/blog')} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all flex flex-col h-full cursor-pointer group">
            <span className={`text-[10px] font-bold uppercase tracking-wider mb-4 ${article.color}`}>{article.type}</span>
            <h4 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors leading-snug">{article.title}</h4>
            <p className="text-slate-500 text-[14px] leading-relaxed mb-8 flex-1 line-clamp-3">{article.desc}</p>
            
            <div className="flex items-center gap-3 mt-auto pt-6 border-t border-slate-50">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                {article.initials}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{article.author}</p>
                <p className="text-[11px] text-slate-400">{article.date}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArticlesAndGuides;
