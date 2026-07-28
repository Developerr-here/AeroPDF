import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PenTool, ArrowRight, User } from 'lucide-react';

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const { currentUser, token, openAuthModal, updateDisplayName } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.display_name || '');
    }
  }, [currentUser]);

  const handleNameUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateDisplayName(displayName);
      addToast('Display name updated successfully!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to update name', 'error');
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/blog');
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWriteClick = async () => {
    if (!currentUser) {
      openAuthModal('signup');
      return;
    }
    
    // Check if user has publishing permissions or is admin
    if (currentUser.can_blog || currentUser.role === 'admin' || currentUser.subscription_plan === 'custom') {
      navigate('/blog/new');
      return;
    }

    // Trigger stripe checkout for Blog Pass
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/stripe/blog-checkout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        addToast(data.error || 'Failed to initialize checkout.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('An error occurred.', 'error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const stripHtml = (html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32">
      {/* Header Section */}
      <div className="bg-[#4f46e5] pt-32 pb-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="max-w-[1200px] mx-auto relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-white max-w-[600px]">
            <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight leading-tight">
              Insights & News from the PDF Frontier
            </h1>
            <p className="text-indigo-100 text-lg md:text-xl font-medium leading-relaxed">
              Read the latest articles from the community, or publish your own insights with a one-time publishing pass.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl text-center shadow-2xl max-w-[350px] w-full">
            <h3 className="text-white font-bold text-xl mb-3">Join the Authors</h3>
            <p className="text-indigo-100 text-sm mb-6 leading-relaxed">Share your knowledge with our growing community of professionals.</p>
            {currentUser && (
              <form onSubmit={handleNameUpdate} className="mb-6 flex flex-col gap-2">
                <input 
                  type="text" 
                  placeholder="Your Display Name" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-white/20 border border-white/30 text-white placeholder:text-white/50 px-4 py-2 rounded-xl outline-none focus:bg-white/30 transition-colors text-sm"
                />
                <button type="submit" className="text-xs font-bold text-indigo-100 hover:text-white transition-colors self-end">
                  Update Name
                </button>
              </form>
            )}
            <button 
              onClick={handleWriteClick} 
              disabled={checkoutLoading}
              className="w-full bg-white text-indigo-600 font-bold py-3.5 rounded-full flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-lg disabled:opacity-70"
            >
              <PenTool size={18} />
              {checkoutLoading ? 'Processing...' : (currentUser?.can_blog || currentUser?.role === 'admin' || currentUser?.subscription_plan === 'custom' ? 'Write an Article' : 'Purchase Pass ($12)')}
            </button>
          </div>
        </div>
      </div>

      {/* Blog Grid */}
      <div className="max-w-[1200px] mx-auto px-6 mt-16">
        {loading ? (
          <div className="text-center py-20 text-slate-400 font-bold">Loading articles...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
              <PenTool size={32} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">No Articles Yet</h3>
            <p className="text-slate-500 font-medium max-w-sm mx-auto">Be the very first author to publish an article on the pdfbundles platform!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link to={`/blog/${post.id}`} key={post.id} className="group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
                <div className="p-8 flex-1 flex flex-col">
                  <div className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-4">
                    {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-4 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 mb-6 flex-1">
                    {stripHtml(post.content)}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <User size={14} strokeWidth={2.5} />
                      </div>
                      <span className="text-sm font-bold text-slate-700">{post.author_name || 'Author'}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      <ArrowRight size={16} strokeWidth={2.5} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;
