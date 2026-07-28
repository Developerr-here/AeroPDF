import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { TOOLS_DATA, COLOR_MAP } from '../data/tools';

const ToolsGrid = ({ showHeader = true, title = "All PDF Tools", subtitle = "Complete collection of 24 powerful tools" }) => {
  const [activeTab, setActiveTab] = useState('All Tools');
  const tabs = ['All Tools', 'Organize', 'Optimize', 'Convert', 'Edit & AI', 'Security'];

  // Map tabs to categories
  const getFilteredCategories = () => {
    if (activeTab === 'All Tools') return TOOLS_DATA;
    if (activeTab === 'Organize') return TOOLS_DATA.filter(c => c.category === 'Organize PDF');
    if (activeTab === 'Optimize') return TOOLS_DATA.filter(c => c.category === 'Optimize PDF');
    if (activeTab === 'Convert') return TOOLS_DATA.filter(c => c.category.includes('Convert'));
    if (activeTab === 'Edit & AI') return TOOLS_DATA.filter(c => c.category === 'Edit PDF' || c.category.includes('AI') || c.category === 'PDF Intelligence');
    if (activeTab === 'Security') return TOOLS_DATA.filter(c => c.category === 'Security');
    return TOOLS_DATA;
  };

  return (
    <div className="w-full">
      {showHeader && (
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-slate-900 mb-2">{title}</h2>
          <p className="text-slate-500 font-medium">{subtitle}</p>
        </div>
      )}
      
      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {tabs.map((tab, i) => (
          <button 
            key={i} 
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-full font-bold text-[15px] transition-all ${activeTab === tab ? 'bg-[#1E1B4B] text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Masonry-style Grid (CSS Columns) */}
      <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
        {getFilteredCategories().map((category, idx) => (
          <div key={idx} className="break-inside-avoid mb-6">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
              {category.icon} {category.category}
            </h3>
            <div className="space-y-4">
              {category.items.map((tool, tIdx) => (
                <Link to={tool.path} key={tIdx} className="flex items-start gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-indigo-100 hover:-translate-y-0.5 transition-all group block w-full">
                  <div className={`p-2.5 rounded-xl shrink-0 transition-transform group-hover:scale-110 ${COLOR_MAP[tool.color] || COLOR_MAP.slate}`}>
                    {tool.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-[15px]">{tool.name}</h4>
                    <p className="text-[13px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{tool.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToolsGrid;
