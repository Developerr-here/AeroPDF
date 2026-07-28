import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar } from 'lucide-react';

const BlogArticle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const res = await fetch('/api/blog');
      if (res.ok) {
        const data = await res.json();
        const found = data.posts?.find(p => p.id === id);
        if (found) {
          setPost(found);
        } else {
          navigate('/blog');
        }
      }
    } catch (err) {
      console.error(err);
      navigate('/blog');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-32 pb-24 px-6 flex items-center justify-center">
        <div className="text-slate-400 font-bold text-lg animate-pulse">Loading article...</div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-100 pt-32 pb-16 px-6">
        <div className="max-w-[800px] mx-auto">
          <Link to="/blog" className="inline-flex items-center gap-2 text-indigo-600 font-bold text-sm mb-10 hover:text-indigo-700 transition-colors">
            <ArrowLeft size={16} /> Back to all articles
          </Link>
          
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-8 leading-tight tracking-tight">
            {post.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-slate-500 border-t border-slate-100 pt-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <User size={18} />
              </div>
              <div>
                <span className="block text-slate-900 font-bold">{post.author_name || 'Author'}</span>
                <span className="text-xs">Author</span>
              </div>
            </div>
            
            <div className="w-px h-8 bg-slate-200"></div>
            
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-slate-400" />
              <span>{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-[800px] mx-auto px-6 mt-16">
        <div 
          className="prose prose-lg prose-slate prose-headings:font-black prose-a:text-indigo-600 hover:prose-a:text-indigo-700 max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        
        <div className="mt-20 pt-10 border-t border-slate-200 text-center">
          <Link to="/blog" className="inline-flex items-center justify-center px-8 py-4 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-800 transition-colors shadow-lg">
            Read More Articles
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BlogArticle;
