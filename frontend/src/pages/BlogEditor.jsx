import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Image as ImageIcon, Send, ArrowLeft, Loader2, FileText as FilePdf } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const BlogEditor = () => {
  const { currentUser, token, refreshUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef(null);
  const pdfInputRef = useRef(null);
  const quillRef = useRef(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/blog');
    } else if (!currentUser.can_blog && currentUser.role !== 'admin' && currentUser.subscription_plan !== 'custom') {
      addToast("You do not have a Publishing Pass. Please purchase one to write articles.", "error");
      navigate('/blog');
    }
  }, [currentUser, navigate]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxAttachSize = 20 * 1024 * 1024; // 20MB limit
    if (file.size > maxAttachSize) {
      addToast('Attachment exceeds the 20MB limit.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (pdfInputRef.current) pdfInputRef.current.value = '';
      return;
    }

    setUploading(true);
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
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection(true) || { index: quill.getLength() };
        
        if (e.target.accept.includes('pdf')) {
          const html = `<br/><a href="${data.url}" target="_blank" class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors my-4" contenteditable="false"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg> View Embedded PDF</a><br/>`;
          quill.clipboard.dangerouslyPasteHTML(range.index, html);
          quill.setSelection(range.index + 1);
          addToast('PDF linked successfully', 'success');
        } else {
          quill.insertEmbed(range.index, 'image', data.url);
          quill.setSelection(range.index + 1);
          addToast('Image uploaded successfully', 'success');
        }
      } else {
        addToast(data.error || 'Failed to upload file', 'error');
      }
    } catch (err) {
      addToast('Error uploading file', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  };

  const imageHandler = () => {
    fileInputRef.current?.click();
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'blockquote', 'code-block'],
        [{ 'align': [] }],
        ['image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    }
  }), []);

  const handlePublish = async () => {
    if (!title.trim() || !content.trim() || content === '<p><br></p>') {
      addToast("Title and content are required.", "error");
      return;
    }

    setPublishing(true);
    try {
      const res = await fetch('/api/blog', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ title, content })
      });
      
      const data = await res.json();
      if (res.ok) {
        addToast('Post published successfully!', 'success');
        refreshUser();
        navigate('/blog');
      } else {
        addToast(data.error || 'Failed to publish post', 'error');
      }
    } catch (err) {
      addToast('An error occurred while publishing.', 'error');
    } finally {
      setPublishing(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32">
      {/* Editor Header */}
      <div className="bg-white border-b border-slate-200 relative z-20 shadow-sm">
        <div className="max-w-[1000px] mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => navigate('/blog')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors">
            <ArrowLeft size={18} /> Cancel
          </button>
          
          <div className="flex items-center gap-4">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
            />
            <input 
              type="file" 
              accept="application/pdf" 
              className="hidden" 
              ref={pdfInputRef} 
              onChange={handleImageUpload} 
            />
            
            <button 
              onClick={() => pdfInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 font-bold hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 size={18} className="animate-spin" /> : <FilePdf size={18} />}
              <span className="hidden sm:inline">Link PDF</span>
            </button>
            
            <button 
              onClick={handlePublish}
              disabled={publishing}
              className="flex items-center gap-2 bg-[#4f46e5] text-white px-6 py-2.5 rounded-full font-bold hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-70"
            >
              {publishing ? <Loader2 size={18} className="animate-spin" /> : <Send size={16} />}
              Publish
            </button>
          </div>
        </div>
      </div>

      {/* Editor Canvas */}
      <div className="max-w-[800px] mx-auto px-6 mt-12">
        <input 
          type="text" 
          placeholder="Article Title..." 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-4xl md:text-5xl font-black text-slate-900 placeholder:text-slate-300 outline-none bg-transparent mb-8"
        />
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[600px] quill-wrapper">
          <ReactQuill 
            ref={quillRef}
            theme="snow"
            value={content}
            onChange={setContent}
            modules={modules}
            placeholder="Start typing your story here..."
            className="flex-1 h-full w-full outline-none text-lg text-slate-700 leading-relaxed prose prose-lg max-w-none"
          />
        </div>
      </div>
    </div>
  );
};

export default BlogEditor;

