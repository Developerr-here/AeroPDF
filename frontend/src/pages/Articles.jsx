import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Search, ArrowRight, Edit3, Trash2, Plus, Clock, Eye, AlertCircle, X } from 'lucide-react';
import ArticleEditorModal from '../components/ArticleEditorModal';
import { TOOLS_DATA } from '../data/tools';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Articles = () => {
  const navigate = useNavigate();
  const { currentUser, token } = useAuth();
  const { addToast } = useToast();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTool, setSelectedTool] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [articleToEdit, setArticleToEdit] = useState(null);
  const [articleToDelete, setArticleToDelete] = useState(null);

  // Check if current user is logged in to show writer controls
  const isWriter = !!currentUser;

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const query = selectedTool !== 'all' ? `?tool=${selectedTool}` : '';
      const res = await fetch(`/api/articles${query}`);
      const data = await res.json();
      if (data.success && data.articles) {
        setArticles(data.articles);
      }
    } catch (err) {
      console.error('Failed to fetch articles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [selectedTool]);

  const handleCreateNew = () => {
    setArticleToEdit(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (article, e) => {
    e.stopPropagation();
    setArticleToEdit(article);
    setIsEditorOpen(true);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    setArticleToDelete(id);
  };

  const confirmDelete = async () => {
    if (!articleToDelete) return;
    
    try {
      const res = await fetch(`/api/articles/${articleToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setArticles(articles.filter(a => a.id !== articleToDelete));
        addToast('Article deleted successfully.', 'success');
      } else {
        addToast('Failed to delete article.', 'error');
      }
    } catch (err) {
      addToast('Error deleting article.', 'error');
    } finally {
      setArticleToDelete(null);
    }
  };

  const filteredArticles = articles.filter(a => {
    const matchesSearch = !searchQuery || 
      a.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      a.post_description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      
      {/* Hero Section */}
      <div className="bg-slate-900 text-white py-16 px-6 border-b border-slate-800">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              <BookOpen size={14} /> Knowledge Hub
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">Articles & Guides</h1>
            <p className="text-slate-400 text-base mt-2 max-w-[600px]">
              Explore step-by-step guides, best practices, security standards, and workflows for all your document tools.
            </p>
          </div>

          {/* Writer Only Action Button */}
          {isWriter && (
            <button
              onClick={handleCreateNew}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center gap-2.5 shrink-0"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span>Write New Article</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1200px] mx-auto px-6 mt-8">
        
        {/* Search & Tool Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
            <button
              onClick={() => setSelectedTool('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${selectedTool === 'all' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              All Articles
            </button>
            <button
              onClick={() => setSelectedTool('compress-pdf')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${selectedTool === 'compress-pdf' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Compress PDF
            </button>
            <button
              onClick={() => setSelectedTool('sign-pdf')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${selectedTool === 'sign-pdf' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Sign PDF
            </button>
            <button
              onClick={() => setSelectedTool('merge-pdf')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${selectedTool === 'merge-pdf' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Merge PDF
            </button>
            <button
              onClick={() => setSelectedTool('pdf-to-word')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${selectedTool === 'pdf-to-word' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              PDF to Word
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guides..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

        </div>

        {/* Articles Grid */}
        {loading ? (
          <div className="text-center py-24 text-slate-400 font-semibold">Loading Articles & Guides...</div>
        ) : filteredArticles.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 max-w-[600px] mx-auto my-12 shadow-sm">
            <BookOpen className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="text-xl font-bold text-slate-800 mb-2">No Articles Available Yet</h3>
            <p className="text-slate-500 text-sm mb-6">
              Our SEO team is preparing comprehensive guides for this topic. Check back soon!
            </p>
            {isWriter && (
              <button
                onClick={handleCreateNew}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/20 transition-all inline-flex items-center gap-2"
              >
                <Plus size={16} /> Write First Article
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filteredArticles.map((article) => (
              <div
                key={article.id}
                onClick={() => navigate(`/articles/${article.slug}`)}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] transition-all flex flex-col h-full cursor-pointer group overflow-hidden"
              >
                {/* Cover Image */}
                <div className="w-full h-48 bg-slate-100 overflow-hidden relative">
                  {article.cover_image ? (
                    <img
                      src={article.cover_image}
                      alt={article.alt_text || article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                      <BookOpen size={40} className="opacity-40" />
                    </div>
                  )}

                  {/* Tool Tag Pill */}
                  <span className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-white/20">
                    {article.category || article.tool_id || 'GENERAL'}
                  </span>

                  {/* Writer Controls (Edit / Delete) */}
                  {isWriter && (
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      <button
                        onClick={(e) => handleEdit(article, e)}
                        className="p-2 bg-white/90 hover:bg-white text-slate-700 rounded-full shadow-lg backdrop-blur-md transition-colors"
                        title="Edit Article"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(article.id, e)}
                        className="p-2 bg-red-600/90 hover:bg-red-600 text-white rounded-full shadow-lg backdrop-blur-md transition-colors"
                        title="Delete Article"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2">
                    {article.title}
                  </h3>
                  
                  <p className="text-slate-500 text-xs leading-relaxed mb-6 flex-1 line-clamp-3">
                    {article.post_description || article.content?.replace(/<[^>]*>?/gm, '').substring(0, 140) + '...'}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto text-xs text-slate-400">
                    <span className="font-semibold text-slate-700">{article.author_name || 'PDF Bundles Team'}</span>
                    <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      {/* Editor Modal */}
      <ArticleEditorModal 
        isOpen={isEditorOpen} 
        onClose={() => setIsEditorOpen(false)} 
        onSave={(newArticle) => {
          setArticles(prev => {
            const exists = prev.find(a => a.id === newArticle.id);
            if (exists) {
              return prev.map(a => a.id === newArticle.id ? newArticle : a);
            }
            return [newArticle, ...prev];
          });
        }}
        articleToEdit={articleToEdit}
        token={token}
      />

      {/* Delete Confirmation Modal */}
      {articleToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 text-rose-600 font-bold">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                  <AlertCircle size={20} />
                </div>
                Delete Article?
              </div>
              <button onClick={() => setArticleToDelete(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              Are you sure you want to delete this article? This action cannot be undone and will remove it from the platform.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setArticleToDelete(null)}
                className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="px-5 py-2.5 bg-rose-500 text-white font-bold text-sm rounded-xl hover:bg-rose-600 shadow-md shadow-rose-500/20 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Articles;
