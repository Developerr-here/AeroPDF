import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ALL_TOOLS } from '../data/tools';
import ToolsGrid from '../components/ToolsGrid';
import FAQ from '../components/FAQ';
import SEOSchema from '../components/SEOSchema';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTranslation } from '../i18n/LanguageContext';
import { 
  FileText, Shield, Lock, Globe, FileKey, CheckCircle2, ChevronDown, 
  UploadCloud, Settings, Download, GraduationCap, Briefcase, Star, Clock, X, Check, ArrowRight, BookOpen
} from 'lucide-react';

const Home = () => {
  const { t, language } = useTranslation();
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('students');
  const [yearlyBilling, setYearlyBilling] = useState(false);
  const [seats, setSeats] = useState(1);
  const unitPrice = yearlyBilling ? 4 : 7;
  const premiumPrice = unitPrice * seats;
  const topTools = ALL_TOOLS.slice(0, 5); 
  const { currentUser, openAuthModal, token } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  React.useEffect(() => {
    if (location.hash) {
      setTimeout(() => {
        const element = document.getElementById(location.hash.slice(1));
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [location]);

  const [recentArticles, setRecentArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(true);

  React.useEffect(() => {
    const fetchRecentArticles = async () => {
      try {
        const query = language && language !== 'en' ? `?lang=${language}` : '';
        const res = await fetch(`/api/articles${query}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.articles)) {
          setRecentArticles(data.articles.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to fetch articles for homepage:', err);
      } finally {
        setArticlesLoading(false);
      }
    };
    fetchRecentArticles();
  }, [language]);

  const [email, setEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState(null);

  // Sales Contact Form State
  const [salesFirstName, setSalesFirstName] = useState('');
  const [salesLastName, setSalesLastName] = useState('');
  const [salesCompany, setSalesCompany] = useState('');
  const [salesEmail, setSalesEmail] = useState('');
  const [salesMessage, setSalesMessage] = useState('');
  const [salesOptIn, setSalesOptIn] = useState(false);
  const [salesLoading, setSalesLoading] = useState(false);

  const handleContactSales = async (e) => {
    e.preventDefault();
    if (!salesFirstName || !salesLastName || !salesCompany || !salesEmail || !salesMessage) {
      addToast('Please fill out all required fields.', 'error');
      return;
    }
    setSalesLoading(true);
    try {
      const res = await fetch('/api/contact-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: salesFirstName,
          lastName: salesLastName,
          companyName: salesCompany,
          businessEmail: salesEmail,
          message: salesMessage
        })
      });
      const data = await res.json();
      if (res.ok) {
        addToast(data.message || 'Inquiry submitted successfully!', 'success');
        setSalesFirstName('');
        setSalesLastName('');
        setSalesCompany('');
        setSalesEmail('');
        setSalesMessage('');
        setSalesOptIn(false);
      } else {
        addToast(data.error || 'Failed to submit inquiry.', 'error');
      }
    } catch (err) {
      addToast('An unexpected error occurred.', 'error');
    } finally {
      setSalesLoading(false);
    }
  };

  const handleSubscribeNewsletter = async (e) => {
    e.preventDefault();
    if (!email) return;
    setNewsletterLoading(true);
    setNewsletterStatus(null);
    try {
      const res = await fetch('/api/stripe/newsletter-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Subscription failed');
      setNewsletterStatus('success');
      setEmail('');
    } catch (err) {
      setNewsletterStatus('error');
    } finally {
      setNewsletterLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!currentUser) {
      openAuthModal('signup');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ plan: 'premium', seats, yearly: yearlyBilling })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize checkout');
      window.location.href = data.url;
    } catch (err) {
      addToast(err.message, 'error');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 md:pb-12">
      <SEOSchema />
      
      {/* Hero Section */}
      <div className="max-w-[1600px] mx-auto px-6 pt-12 md:pt-20 pb-16 flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1 space-y-6 md:space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold text-xs tracking-wide">
            <span className="text-amber-500">✨</span> {t('hero.free_badge', '100% FREE • NO SIGN UP REQUIRED')}
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-[76px] font-black tracking-tight text-slate-900 leading-[1.05]">
            {t('hero.title_prefix', 'Free Online PDF')} <br className="hidden lg:block" />
            <span className="text-indigo-600">{t('hero.title_highlight', 'Converter Tools')}</span>
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-slate-500 font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed">
            {t('hero.subtitle', 'Now you can merge pdfs, compress your pdf files, edit pdf and do many things with our 28 free online converter tools.')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
            <div className="relative w-full sm:w-auto">
              <button 
                onClick={() => setShowUploadMenu(!showUploadMenu)}
                className="w-full sm:w-auto flex justify-center items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-full font-bold text-[16px] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                <span className="text-xl">↑</span> {t('hero.upload_btn', 'Upload PDF Document')} <ChevronDown size={18}/>
              </button>
              {showUploadMenu && (
                <div className="absolute top-full left-0 right-0 sm:right-auto mt-3 w-full sm:w-64 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4">
                  <div className="p-2 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">{t('hero.select_tool', 'Select a tool')}</div>
                  <div className="p-2 flex flex-col">
                    {topTools.map(tool => (
                      <Link key={tool.id} to={tool.path} className="flex items-center gap-3 p-3 hover:bg-indigo-50 rounded-xl transition-colors">
                        <div className={`p-1.5 rounded-lg ${tool.color === 'indigo' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                          {tool.icon}
                        </div>
                        <span className="font-bold text-slate-700 text-sm">{t('tools.' + tool.id + '.name', tool.name)}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <a href="#tools" className="w-full sm:w-auto flex justify-center items-center gap-3 bg-white border border-slate-200 hover:border-slate-300 text-slate-800 px-8 py-4 rounded-full font-bold text-[16px] shadow-sm hover:shadow-md transition-all">
              {t('hero.explore_btn', 'Explore All Tools')}
            </a>
          </div>
          <div className="flex items-center justify-center lg:justify-start gap-2 text-xs md:text-sm font-medium text-emerald-600 pt-4">
            <Shield size={16} /> {t('hero.security_note', 'Files are safe with enterprise encryption.')}
          </div>
        </div>
        
        {/* Hero Mockup */}
        <div className="flex-1 w-full relative pl-8 hidden lg:block">
          <div className="bg-white rounded-[32px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-slate-100 relative z-10 w-full max-w-xl mx-auto">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-3.5 h-3.5 rounded-full bg-red-400"></div>
              <div className="w-3.5 h-3.5 rounded-full bg-amber-400"></div>
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-400"></div>
              <span className="ml-auto text-xs font-bold text-slate-400 tracking-wide">pdfbundles Workspace</span>
            </div>
            <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/50 mb-5 flex items-center justify-between shadow-sm">
               <div className="flex items-center gap-4">
                 <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                   <FileText className="text-slate-400" size={24}/>
                 </div>
                 <div>
                   <p className="font-bold text-slate-800">business_proposal.pdf</p>
                   <p className="text-[13px] text-slate-400 mt-0.5 font-medium">4.8 MB • 12 Pages</p>
                 </div>
               </div>
               <span className="bg-purple-100 text-purple-600 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">Premium</span>
            </div>
            <div className="border border-slate-100 rounded-2xl p-5 bg-gradient-to-br from-slate-50 to-white mb-8 space-y-4 shadow-sm hover:shadow-md transition-all">
               <div className="flex justify-between items-center text-xs font-bold"><span className="text-emerald-500 flex items-center gap-2"><CheckCircle2 size={14}/> PARSED TEXT LAYERS</span><span className="text-slate-300">OK</span></div>
               <div className="flex justify-between items-center text-xs font-bold"><span className="text-emerald-500 flex items-center gap-2"><CheckCircle2 size={14}/> DETECTED 3 SIGNATURES</span><span className="text-slate-300">OK</span></div>
               <div className="flex justify-between items-center text-xs font-bold"><span className="text-indigo-600 flex items-center gap-2">✦ AI COMPRESSION OPTIMIZER</span><span className="text-slate-500">84%</span></div>
            </div>
            <button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-[15px] py-4 rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all">ENHANCE & EXPORT NOW</button>
          </div>
          
          <div className="absolute left-0 top-16 bg-red-500 text-white p-4 rounded-[1.25rem] shadow-2xl rotate-[-12deg] z-20 animate-pulse"><FileText size={28} strokeWidth={2.5}/></div>
          <div className="absolute right-4 top-2 bg-purple-500 text-white p-3 rounded-[1rem] shadow-2xl rotate-[15deg] z-0 hover:-translate-y-2 transition-transform cursor-pointer"><Lock size={20}/></div>
          <div className="absolute right-0 bottom-32 bg-indigo-500 text-white px-5 py-2.5 rounded-full font-bold text-[15px] shadow-2xl flex items-center gap-2 z-20 hover:scale-105 transition-transform cursor-pointer"><span className="text-xl">✦</span> AI Powered</div>
          <div className="absolute right-24 -bottom-6 bg-amber-400 text-white p-3 rounded-[1rem] shadow-2xl rotate-[-5deg] z-20"><div className="w-6 h-6 border-2 border-white rounded-md flex items-center justify-center"><div className="w-3 h-3 bg-white rounded-sm"></div></div></div>
          <div className="absolute left-12 bottom-12 bg-emerald-500 text-white p-3 rounded-[1rem] shadow-2xl rotate-[8deg] z-20 hover:rotate-12 transition-transform cursor-pointer"><Globe size={20}/></div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="max-w-[1600px] mx-auto px-6 py-12 grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all border border-slate-100 border-b-4 border-b-indigo-500 flex flex-col md:flex-row items-center text-center md:text-left gap-4 md:gap-5 cursor-default group">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-indigo-50 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors flex items-center justify-center shrink-0"><FileKey className="w-6 h-6 md:w-7 md:h-7"/></div>
          <div><h4 className="font-bold text-lg md:text-xl text-slate-900">{t('features_strip.private_title', 'Private')}</h4><p className="text-xs md:text-sm text-slate-500 mt-0.5">{t('features_strip.private_sub', 'Files Deleted Instantly')}</p></div>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all border border-slate-100 border-b-4 border-b-blue-500 flex flex-col md:flex-row items-center text-center md:text-left gap-4 md:gap-5 cursor-default group">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-blue-50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
            <div className="grid grid-cols-2 gap-1.5"><div className="w-2.5 h-2.5 md:w-3 md:h-3 border-2 border-current rounded-md"></div><div className="w-2.5 h-2.5 md:w-3 md:h-3 border-2 border-current rounded-md"></div><div className="w-2.5 h-2.5 md:w-3 md:h-3 border-2 border-current rounded-md"></div><div className="w-2.5 h-2.5 md:w-3 md:h-3 border-2 border-current rounded-md"></div></div>
          </div>
          <div><h4 className="font-bold text-lg md:text-xl text-slate-900">{t('features_strip.tools_title', '28+')}</h4><p className="text-xs md:text-sm text-slate-500 mt-0.5">{t('features_strip.tools_sub', 'Powerful PDF Tools')}</p></div>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all border border-slate-100 border-b-4 border-b-emerald-500 flex flex-col md:flex-row items-center text-center md:text-left gap-4 md:gap-5 cursor-default group">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-emerald-50 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors flex items-center justify-center shrink-0"><Shield className="w-6 h-6 md:w-7 md:h-7"/></div>
          <div><h4 className="font-bold text-lg md:text-xl text-slate-900">{t('features_strip.secure_title', 'Secure')}</h4><p className="text-xs md:text-sm text-slate-500 mt-0.5">{t('features_strip.secure_sub', 'End-to-End Encryption')}</p></div>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all border border-slate-100 border-b-4 border-b-rose-500 flex flex-col md:flex-row items-center text-center md:text-left gap-4 md:gap-5 cursor-default group">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-rose-50 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors flex items-center justify-center shrink-0"><Globe className="w-6 h-6 md:w-7 md:h-7"/></div>
          <div><h4 className="font-bold text-lg md:text-xl text-slate-900">{t('features_strip.online_title', 'Online')}</h4><p className="text-xs md:text-sm text-slate-500 mt-0.5">{t('features_strip.online_sub', 'Works on Any Device')}</p></div>
        </div>
      </div>

      {/* ALL TOOLS */}
      <div id="tools" className="max-w-[1600px] mx-auto px-6 py-12 md:py-16">
        <ToolsGrid 
          title={t('tools_section.title', 'Explore Our 28 Free Online PDF Tools')}
          subtitle={t('tools_section.subtitle', 'These free PDF tools make your day-to-day tasks easier by saving your time. We have categorized all PDF tools so you can find your PDF tool easily.')}
        />
      </div>

      {/* How It Works */}
      <div className="max-w-[1600px] mx-auto px-6 py-24 text-center">
        <span className="bg-indigo-100 text-indigo-600 font-bold text-sm px-4 py-1.5 rounded-full uppercase tracking-widest">{t('how_it_works.badge', 'Simple Process')}</span>
        <h2 className="text-5xl font-black text-slate-900 mt-8 mb-6 tracking-tight">{t('how_it_works.title', 'How PDF Tools Work')}</h2>
        <p className="text-slate-500 font-medium text-xl mb-20">{t('how_it_works.subtitle', 'Here are three simple steps to process your pdf files securely in your browser.')}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 hover:border-indigo-100 transition-all duration-300 relative overflow-hidden group">
            <span className="absolute top-6 right-8 text-7xl font-black text-slate-50 group-hover:text-indigo-50/50 transition-colors z-0">01</span>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl text-indigo-600 flex items-center justify-center mb-8"><UploadCloud size={28}/></div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{t('how_it_works.step1_title', 'Upload PDF Document')}</h3>
              <p className="text-slate-500 font-medium leading-relaxed">{t('how_it_works.step1_desc', 'Select or drag and drop your PDFs or images into our secure workspace area. Files are processed locally or deleted immediately after.')}</p>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 hover:border-blue-100 transition-all duration-300 relative overflow-hidden group">
            <span className="absolute top-6 right-8 text-7xl font-black text-slate-50 group-hover:text-blue-50/50 transition-colors z-0">02</span>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl text-blue-600 flex items-center justify-center mb-8"><Settings size={28}/></div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{t('how_it_works.step2_title', 'Configure Settings')}</h3>
              <p className="text-slate-500 font-medium leading-relaxed">{t('how_it_works.step2_desc', 'Configure page ranges, set compression levels, input passwords, write watermark text, or adjust AI extraction options in the settings panel.')}</p>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 hover:border-emerald-100 transition-all duration-300 relative overflow-hidden group">
            <span className="absolute top-6 right-8 text-7xl font-black text-slate-50 group-hover:text-emerald-50/50 transition-colors z-0">03</span>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl text-emerald-600 flex items-center justify-center mb-8"><Download size={28}/></div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{t('how_it_works.step3_title', 'Download Your PDF')}</h3>
              <p className="text-slate-500 font-medium leading-relaxed">{t('how_it_works.step3_desc', 'Our processing engine compiles your customized document instantly. Download the output pdf file with a single secure click.')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tailored For You (Tabs) */}
      <div className="max-w-[1600px] mx-auto px-6 py-24 text-center">
        <span className="bg-purple-100 text-purple-600 font-bold text-sm px-4 py-1.5 rounded-full uppercase tracking-widest">{t('tailored.badge', 'Tailored For You')}</span>
        <h2 className="text-5xl font-black text-slate-900 mt-8 mb-6 tracking-tight">{t('tailored.title', 'Engineered for Your Day-to-Day Speed')}</h2>
        <p className="text-slate-500 font-medium text-xl mb-16">{t('tailored.subtitle', 'See how our tools simplify tasks based on what you do')}</p>
        
        {/* Tab Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-10">
          <button onClick={() => setActiveTab('students')} className={`flex items-center gap-3 px-6 py-4 rounded-full font-bold text-sm transition-all shadow-sm ${activeTab === 'students' ? 'bg-[#1E1B4B] text-white shadow-lg scale-105' : 'bg-white text-slate-600 border border-slate-100 hover:border-indigo-200'}`}>
            <GraduationCap size={18} className={activeTab === 'students' ? 'text-amber-400' : 'text-slate-400'}/> {t('tailored.tab_students', 'Students & Teachers')}
          </button>
          <button onClick={() => setActiveTab('business')} className={`flex items-center gap-3 px-6 py-4 rounded-full font-bold text-sm transition-all shadow-sm ${activeTab === 'business' ? 'bg-[#1E1B4B] text-white shadow-lg scale-105' : 'bg-white text-slate-600 border border-slate-100 hover:border-indigo-200'}`}>
            <Briefcase size={18} className={activeTab === 'business' ? 'text-amber-700' : 'text-slate-400'}/> {t('tailored.tab_business', 'Business & Office')}
          </button>
          <button onClick={() => setActiveTab('security')} className={`flex items-center gap-3 px-6 py-4 rounded-full font-bold text-sm transition-all shadow-sm ${activeTab === 'security' ? 'bg-[#1E1B4B] text-white shadow-lg scale-105' : 'bg-white text-slate-600 border border-slate-100 hover:border-indigo-200'}`}>
            <Lock size={18} className={activeTab === 'security' ? 'text-amber-500' : 'text-slate-400'}/> {t('tailored.tab_security', 'Security Conscious')}
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-16 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center text-left gap-12 transition-all duration-500">
          <div className="flex-1 space-y-8 animate-in slide-in-from-left-4 fade-in duration-500" key={activeTab}>
            {activeTab === 'students' && (
              <>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{t('tailored.students_title', 'Turn Reading Hours into Minutes')}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{t('tailored.students_desc', 'Accelerate your learning curve with custom AI extraction tools built for academic environments.')}</p>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 text-xl shadow-sm border border-slate-100">🤖</div>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">{t('tailored.students_f1_title', 'AI Summaries:')}</h4>
                      <p className="text-sm font-medium text-slate-500">{t('tailored.students_f1_desc', 'Drop complex 50-page research papers and get structured takeaways in seconds.')}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 text-xl shadow-sm border border-slate-100">📉</div>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">{t('tailored.students_f2_title', 'Smart Compression:')}</h4>
                      <p className="text-sm font-medium text-slate-500">{t('tailored.students_f2_desc', 'Shrink study guides instantly so they easily clear university portal upload limits.')}</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'business' && (
              <>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{t('tailored.business_title', 'Fast Document Workflows, Zero Budget')}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{t('tailored.business_desc', 'Power through billing cycles, client signatures, and scanner OCR with simple, professional tools.')}</p>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 text-xl shadow-sm border border-slate-100">✍️</div>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">{t('tailored.business_f1_title', 'Instant Digital Signatures:')}</h4>
                      <p className="text-sm font-medium text-slate-500">{t('tailored.business_f1_desc', 'Securely sign client contracts and purchase orders directly in your browser tab.')}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 text-xl shadow-sm border border-slate-100">🔍</div>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">{t('tailored.business_f2_title', 'OCR Searchable Text:')}</h4>
                      <p className="text-sm font-medium text-slate-500">{t('tailored.business_f2_desc', 'Turn flat, uncopyable scanned paper invoices into fully searchable documents.')}</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'security' && (
              <>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{t('tailored.security_title', 'Complete Data Isolation by Design')}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{t('tailored.security_desc', 'Maintain compliance constraints and privacy standards without sending data to unknown networks.')}</p>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 text-xl shadow-sm border border-slate-100">🛡️</div>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">{t('tailored.security_f1_title', 'GDPR & HIPAA Friendly:')}</h4>
                      <p className="text-sm font-medium text-slate-500">{t('tailored.security_f1_desc', 'Excellent for legal files, financial statements, and personal ID records.')}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 text-xl shadow-sm border border-slate-100">🌐</div>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">{t('tailored.security_f2_title', 'Offline Compilation:')}</h4>
                      <p className="text-sm font-medium text-slate-500">{t('tailored.security_f2_desc', 'Once the page loads, the core compilation tools can run entirely without an active internet connection.')}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex-1 w-full flex justify-center animate-in zoom-in-95 fade-in duration-500" key={`img-${activeTab}`}>
            <div className={`w-full max-w-[400px] h-[250px] rounded-3xl flex items-center justify-center text-[80px] shadow-sm border border-dashed transition-all ${
              activeTab === 'students' ? 'bg-purple-50 border-purple-200 text-purple-400' :
              activeTab === 'business' ? 'bg-blue-50 border-blue-200 text-blue-400' :
              'bg-emerald-50 border-emerald-200 text-emerald-400'
            }`}>
              {activeTab === 'students' && <span className="hover:scale-110 hover:rotate-3 transition-transform cursor-default">📚</span>}
              {activeTab === 'business' && <span className="hover:scale-110 hover:-rotate-3 transition-transform cursor-default">💼</span>}
              {activeTab === 'security' && <span className="hover:scale-110 hover:rotate-3 transition-transform cursor-default">🔒</span>}
            </div>
          </div>
        </div>
      </div>

      {/* NEW: Loved by Professionals */}
      <div className="max-w-[1600px] mx-auto px-6 py-24 text-center">
        <span className="bg-indigo-100 text-indigo-600 font-bold text-sm px-4 py-1.5 rounded-full uppercase tracking-widest">{t('reviews.badge', 'Client Reviews')}</span>
        <h2 className="text-5xl font-black text-[#1E1B4B] mt-8 mb-6 tracking-tight">{t('reviews.title', 'Loved by Professionals')}</h2>
        <p className="text-slate-500 font-medium text-xl mb-20">{t('reviews.subtitle', 'See how thousands of users and businesses streamline their daily document workflows')}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex gap-1 mb-6 text-amber-400"><Star size={20} fill="currentColor"/><Star size={20} fill="currentColor"/><Star size={20} fill="currentColor"/><Star size={20} fill="currentColor"/><Star size={20} fill="currentColor"/></div>
            <p className="text-slate-600 font-medium italic mb-8">"{t('reviews.r1_quote', 'pdfbundles has completely replaced our expensive monthly Acrobat subscriptions. The speed of the PDF merge and watermark tools is incredible!')}"</p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center">SJ</div>
              <div><p className="font-bold text-slate-900">{t('reviews.r1_name', 'Sarah Jenkins')}</p><p className="text-xs text-slate-500">{t('reviews.r1_role', 'Operations Director')}</p></div>
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex gap-1 mb-6 text-amber-400"><Star size={20} fill="currentColor"/><Star size={20} fill="currentColor"/><Star size={20} fill="currentColor"/><Star size={20} fill="currentColor"/><Star size={20} fill="currentColor"/></div>
            <p className="text-slate-600 font-medium italic mb-8">"{t('reviews.r2_quote', 'I use the PDF to Excel converter daily for parsing corporate files. The table boundary recognition is by far the most accurate I have ever used.')}"</p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-sky-500 text-white font-bold flex items-center justify-center">MC</div>
              <div><p className="font-bold text-slate-900">{t('reviews.r2_name', 'Michael Chen')}</p><p className="text-xs text-slate-500">{t('reviews.r2_role', 'Full Stack Developer')}</p></div>
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex gap-1 mb-6 text-amber-400"><Star size={20} fill="currentColor"/><Star size={20} fill="currentColor"/><Star size={20} fill="currentColor"/><Star size={20} fill="currentColor"/><Star size={20} fill="currentColor"/></div>
            <p className="text-slate-600 font-medium italic mb-8">"{t('reviews.r3_quote', 'The AI Background Remover and Image Upscaler tools are a game changer. The fact that it\'s all in one unified dashboard saves me hours of work.')}"</p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center">ER</div>
              <div><p className="font-bold text-slate-900">{t('reviews.r3_name', 'Elena Rostova')}</p><p className="text-xs text-slate-500">{t('reviews.r3_role', 'Creative Lead')}</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* NEW: Data Security */}
      <div className="max-w-[1600px] mx-auto px-6 py-24 text-center">
        <span className="bg-indigo-100 text-indigo-600 font-bold text-sm px-4 py-1.5 rounded-full uppercase tracking-widest">{t('security_section.badge', '100% Privacy')}</span>
        <h2 className="text-5xl font-black text-[#1E1B4B] mt-8 mb-6 tracking-tight">{t('security_section.title', "Your Data Security Isn't Optional. It's Hardcoded.")}</h2>
        <p className="text-slate-500 font-medium text-xl mb-20">{t('security_section.subtitle', 'How we keep your sensitive documents completely isolated and secure')}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 border-b-4 border-b-blue-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center"><Shield size={24}/></div>
              <h3 className="font-bold text-slate-900 text-lg leading-tight">{t('security_section.card1_title', 'Military-Grade Transit Encryption (SSL/TLS)')}</h3>
            </div>
            <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-3">{t('security_section.proof_label', 'The Proof:')}</p>
            <p className="text-slate-500 text-sm leading-relaxed">{t('security_section.card1_desc', 'The second you drop a file onto our site, it is encrypted using an end-to-end HTTPS protocol. This ensures that no third party can intercept or view your data while it travels to our secure processing environment.')}</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 border-b-4 border-b-emerald-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center"><Clock size={24}/></div>
              <h3 className="font-bold text-slate-900 text-lg leading-tight">{t('security_section.card2_title', 'Automated 1-Hour Auto-Delete')}</h3>
            </div>
            <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-3">{t('security_section.proof_label', 'The Proof:')}</p>
            <p className="text-slate-500 text-sm leading-relaxed">{t('security_section.card2_desc', 'Our server uses an automated cron-job script. The moment your PDF finishes processing (whether you download it or not), a countdown timer starts. At exactly 60 minutes, the file is hard-deleted from our secure Railway storage volumes forever.')}</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 border-b-4 border-b-rose-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center"><X size={24}/></div>
              <h3 className="font-bold text-slate-900 text-lg leading-tight">{t('security_section.card3_title', 'Zero Data Monetization')}</h3>
            </div>
            <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-3">{t('security_section.proof_label', 'The Proof:')}</p>
            <p className="text-slate-500 text-sm leading-relaxed">{t('security_section.card3_desc', 'We do not sell data, track cookies for advertising profiles, or use your uploaded documents to train AI models. Our platform is funded purely through simple, non-intrusive on-site ads or premium developer APIs—never your personal data.')}</p>
          </div>
        </div>
      </div>

      {/* NEW: Ready to Get Started (Pricing component) */}
      <div className="max-w-[1600px] mx-auto px-6 py-24">
        <div className="text-center mb-20">
          <span className="bg-indigo-100 text-indigo-600 font-bold text-sm px-4 py-1.5 rounded-full uppercase tracking-widest">{t('pricing_section.badge', 'Simple Pricing')}</span>
          <h2 className="text-5xl font-black text-[#1E1B4B] mt-8 mb-6 tracking-tight">{t('pricing_section.title', 'Ready to Get Started? Choose Your Speed.')}</h2>
          <p className="text-slate-500 font-medium text-xl">{t('pricing_section.subtitle', 'Start free instantly, or unlock advanced AI tools and bulk processing')}</p>

          <div className="flex justify-center items-center gap-4 mt-10">
            <span className={`font-bold ${!yearlyBilling ? 'text-slate-900' : 'text-slate-400'}`}>{t('pricing_section.monthly', 'Monthly Billing')}</span>
            <button 
              onClick={() => setYearlyBilling(!yearlyBilling)}
              className="w-14 h-8 bg-slate-200 rounded-full relative transition-colors focus:outline-none"
              style={{ backgroundColor: yearlyBilling ? '#10B981' : '#E2E8F0' }}
            >
              <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${yearlyBilling ? 'left-7' : 'left-1'}`}></div>
            </button>
            <span className={`font-bold flex items-center gap-2 ${yearlyBilling ? 'text-slate-900' : 'text-slate-400'}`}>
              {t('pricing_section.yearly', 'Yearly Billing')} <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">{t('pricing_section.save_badge', '-42%')}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <h3 className="text-2xl font-bold text-slate-600 mb-1">{t('pricing_section.basic_name', 'Basic')}</h3>
            <p className="text-slate-400 text-sm font-medium mb-8">👤 {t('pricing_section.basic_user', '1 User')}</p>
            <div className="mb-4">
              <span className="text-5xl font-black text-slate-600">{t('pricing_section.basic_price', '$0')}</span>
              <span className="text-slate-400 font-medium">{t('pricing_section.basic_period', ' / permanently free')}</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed mb-10 h-12">{t('pricing_section.basic_desc', 'For quick, everyday PDF conversions and edits.')}</p>
            <ul className="space-y-3 mb-10 flex-1 text-left w-full text-sm font-medium text-slate-600">
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400"/> {t('pricing_section.basic_f1', 'Access to essential PDF tools')}</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400"/> {t('pricing_section.basic_f2', 'Limited document processing')}</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400"/> {t('pricing_section.basic_f3', 'Browser-local storage & options')}</li>
            </ul>
            <button className="w-full py-4 rounded-full font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200">{t('pricing_section.basic_btn', 'Start Free Now')}</button>
          </div>

          <div className="bg-white rounded-[2rem] p-10 shadow-xl border-[3px] border-[#1E1B4B] flex flex-col items-center text-center relative transform md:-translate-y-4">
            <div className="absolute -top-4 bg-[#1E1B4B] text-white text-xs font-bold px-6 py-1.5 rounded-full">{t('pricing_section.popular_badge', 'Popular')}</div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-2"><span className="text-amber-400 text-xl">☆</span> {t('pricing_section.premium_name', 'Premium')}</h3>
            <p className="text-amber-500 text-sm font-bold mb-8">👥 {t('pricing_section.premium_user', '1 - 25 Users')}</p>
            <div className="mb-4">
              <span className="text-6xl font-black text-slate-900">${premiumPrice}</span>
              <span className="text-slate-500 font-medium"> / month (for {seats} seat{seats > 1 ? 's' : ''})</span>
            </div>
            
            <div className="w-full mb-8">
              <p className="text-xs font-bold text-slate-600 mb-3">{t('pricing_section.how_many_users', 'How many users do you need?')}</p>
              <div className="flex items-center justify-center">
                <button onClick={() => setSeats(Math.max(1, seats - 1))} className="w-10 h-10 border border-slate-200 rounded-l-lg flex items-center justify-center font-bold text-slate-600 hover:bg-slate-50">-</button>
                <div className="w-14 h-10 border-t border-b border-slate-200 flex items-center justify-center font-bold text-slate-900 bg-slate-50/50">{seats}</div>
                <button onClick={() => setSeats(seats + 1)} className="w-10 h-10 border border-slate-200 rounded-r-lg flex items-center justify-center font-bold text-slate-600 hover:bg-slate-50">+</button>
              </div>
            </div>

            <p className="text-slate-500 text-sm leading-relaxed mb-8">{t('pricing_section.premium_desc', 'For power users, designers, and scaling teams.')}</p>
            <ul className="space-y-3 mb-10 flex-1 text-left w-full text-sm font-bold text-slate-600">
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-500"/> {t('pricing_section.premium_f1', 'Full access to all PDF tools')}</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-500"/> {t('pricing_section.premium_f2', 'Unlimited document processing')}</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-500"/> {t('pricing_section.premium_f3', 'Access across Web, Mobile, and Desktop')}</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-500"/> {t('pricing_section.premium_f4', 'Multi-user collaboration seats')}</li>
            </ul>
            <button onClick={handleSubscribe} disabled={loading} className="w-full py-4 rounded-full font-bold text-white bg-[#8B5CF6] hover:bg-[#7C3AED] transition-colors shadow-md">
              {loading ? t('actions.processing', 'Processing...') : t('pricing_section.premium_btn', 'Choose Premium')}
            </button>
          </div>

          <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <h3 className="text-2xl font-bold text-slate-600 mb-1">{t('pricing_section.business_name', 'Business')}</h3>
            <p className="text-slate-400 text-sm font-medium mb-8">🏢 {t('pricing_section.business_user', '25+ Users')}</p>
            <div className="mb-4">
              <span className="text-4xl font-black text-slate-600">{t('pricing_section.business_talk', "Let's talk")}</span>
              <span className="text-slate-400 font-medium block mt-1 text-sm">{t('pricing_section.business_custom', 'Customized solutions')}</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed mb-10 h-12">{t('pricing_section.business_desc', 'For large teams and enterprise organizations.')}</p>
            <ul className="space-y-3 mb-10 flex-1 text-left w-full text-sm font-medium text-slate-600">
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400"/> {t('pricing_section.business_f1', 'All Premium features included')}</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400"/> {t('pricing_section.business_f2', 'Custom contracts designed for scale')}</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400"/> {t('pricing_section.business_f3', 'Dedicated Account Manager')}</li>
              <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400"/> {t('pricing_section.business_f4', 'Single Sign On (SSO)')}</li>
            </ul>
            <a href="#contact-sales" className="w-full py-4 rounded-full font-bold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 transition-colors block text-center mt-auto">{t('pricing_section.business_btn', 'Contact Sales')}</a>
          </div>
        </div>
      </div>

      {/* Contact Sales Form */}
      <div id="contact-sales" className="max-w-[800px] mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <h2 className="text-5xl font-black text-[#1E1B4B] mb-6 tracking-tight">{t('contact_sales.title', 'Contact Our Sales Team')}</h2>
          <p className="text-slate-500 font-medium text-xl leading-relaxed max-w-3xl mx-auto">
            {t('contact_sales.subtitle', 'Have questions about our Enterprise plans, custom scale requirements, SSO integration, or SLAs? Fill out the form below and our team will get back to you within 24 hours.')}
          </p>
        </div>
        
        <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-xl border border-slate-100">
          <form onSubmit={handleContactSales} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 text-left">
                <label className="text-[13px] font-bold text-[#1E1B4B]">{t('contact_sales.first_name', 'First Name*')}</label>
                <input type="text" value={salesFirstName} onChange={e => setSalesFirstName(e.target.value)} required placeholder={t('contact_sales.first_name_ph', 'First Name')} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none text-[14px]" />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-[13px] font-bold text-[#1E1B4B]">{t('contact_sales.last_name', 'Last Name*')}</label>
                <input type="text" value={salesLastName} onChange={e => setSalesLastName(e.target.value)} required placeholder={t('contact_sales.last_name_ph', 'Last Name')} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none text-[14px]" />
              </div>
            </div>
            
            <div className="space-y-2 text-left">
              <label className="text-[13px] font-bold text-[#1E1B4B]">{t('contact_sales.company_name', 'Company Name*')}</label>
              <input type="text" value={salesCompany} onChange={e => setSalesCompany(e.target.value)} required placeholder={t('contact_sales.company_name_ph', 'Company Name')} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none text-[14px]" />
            </div>
            
            <div className="space-y-2 text-left">
              <label className="text-[13px] font-bold text-[#1E1B4B]">{t('contact_sales.business_email', 'Business Email*')}</label>
              <input type="email" value={salesEmail} onChange={e => setSalesEmail(e.target.value)} required placeholder={t('contact_sales.business_email_ph', 'Your Business Email')} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none text-[14px]" />
            </div>
            
            <div className="space-y-2 text-left">
              <label className="text-[13px] font-bold text-[#1E1B4B]">{t('contact_sales.message', 'Message*')}</label>
              <textarea value={salesMessage} onChange={e => setSalesMessage(e.target.value)} required placeholder={t('contact_sales.message_ph', 'What are you interested in?')} rows="4" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none text-[14px] resize-y"></textarea>
            </div>
            
            <label className="flex items-start gap-3 cursor-pointer group pt-2 text-left">
              <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                <input type="checkbox" checked={salesOptIn} onChange={e => setSalesOptIn(e.target.checked)} className="peer appearance-none w-4 h-4 border-2 border-slate-300 rounded-[4px] checked:bg-[#e11d48] checked:border-[#e11d48] transition-all cursor-pointer" />
                <Check size={12} className="text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={3} />
              </div>
              <span className="text-[12px] text-slate-500 font-medium leading-relaxed group-hover:text-slate-700 transition-colors">
                {t('contact_sales.opt_in', 'I agree to receive marketing communications from pdfbundles and acknowledge that I can opt out upon request')}
              </span>
            </label>
            
            <div className="text-left mt-8">
              <button type="submit" disabled={salesLoading} className="bg-[#e11d48] hover:bg-[#be123c] text-white px-10 py-4 rounded-xl font-bold transition-colors disabled:opacity-70 text-[16px] shadow-lg">
                {salesLoading ? t('contact_sales.submitting', 'Submitting...') : t('contact_sales.submit_btn', 'Submit Inquiry')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* NEW: What's in it for me? (Articles) */}
      <div className="max-w-[1600px] mx-auto px-6 py-24 text-center">
        <span className="bg-indigo-100 text-indigo-600 font-bold text-sm px-4 py-1.5 rounded-full uppercase tracking-widest">{t('community.badge', 'WIIFM / Community')}</span>
        <h2 className="text-5xl font-black text-[#1E1B4B] mt-8 mb-6 tracking-tight">{t('community.title', "What's in it for me?")}</h2>
        <p className="text-slate-500 font-medium text-xl mb-20">{t('community.subtitle', 'Read helpful articles, insights, and workflows shared by our community members')}</p>

        {recentArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mb-12">
            {recentArticles.map((article, i) => (
              <Link 
                key={article.id || i} 
                to={article.slug ? `/articles/${article.slug}` : '/articles'} 
                className="bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group overflow-hidden flex flex-col h-full"
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
                      <BookOpen size={36} className="opacity-40" />
                    </div>
                  )}
                  <span className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-white/20">
                    {article.category || article.tool_id || 'GUIDE'}
                  </span>
                </div>

                <div className="p-8 flex flex-col flex-1">
                  <h3 className="font-bold text-xl text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-1 line-clamp-3">
                    {article.post_description || article.desc || article.content?.replace(/<[^>]*>?/gm, '').substring(0, 140)}
                  </p>
                  
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-50 mt-auto">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-sm">
                      {article.author_name ? article.author_name.charAt(0).toUpperCase() : 'P'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{article.author_name || 'pdfbundles Editorial'}</p>
                      <p className="text-xs text-slate-400">
                        {article.createdAt ? new Date(article.createdAt).toLocaleDateString() : 'Recent'}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-12 text-slate-400 font-medium mb-12">
            <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
            <p>{t('community.no_articles', 'Explore our comprehensive library of PDF guides, workflows, and document tutorials.')}</p>
          </div>
        )}
        
        <Link to="/articles" className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 font-bold px-8 py-4 rounded-full shadow-sm hover:shadow-md hover:border-indigo-200 hover:text-indigo-600 transition-all">
          {t('community.view_all', 'View All Articles')} <ArrowRight size={18} />
        </Link>
      </div>

      {/* Popular Tools */}
      <div className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2"><span className="text-xl">🔥</span> {t('popular_section.title', 'Popular Free PDF Converter Tools')}</h2>
            <p className="text-slate-500 font-medium text-sm mt-1">{t('popular_section.desc', 'Access 28 free online PDF converter tools with PDF Bundles. Convert images and documents, merge or split PDFs, compress files, and manage your PDFs online without installing any software.')}</p>
          </div>
          <a href="#tools" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors border border-slate-200 hover:border-indigo-200 px-4 py-2 rounded-full">
            {t('hero.explore_btn', 'Explore All Tools')} &rarr;
          </a>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            {['merge-pdf', 'split-pdf', 'remove-pages', 'extract-pages', 'organize-pdf', 'scan-to-pdf', 'compress-pdf', 'repair-pdf']
              .map(id => ALL_TOOLS.find(t => t.id === id))
              .filter(Boolean)
              .map(tool => (
              <Link key={tool.id} to={tool.path} className="bg-white p-5 rounded-[1.25rem] shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 hover:shadow-md hover:border-indigo-100 transition-all flex items-center gap-4 group">
                <div className={`w-[48px] h-[48px] rounded-xl flex items-center justify-center shrink-0 ${tool.color === 'indigo' ? 'bg-indigo-50 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white' : tool.color === 'slate' ? 'bg-slate-50 text-slate-500 group-hover:bg-slate-800 group-hover:text-white' : tool.color === 'rose' ? 'bg-rose-50 text-rose-500 group-hover:bg-rose-500 group-hover:text-white' : tool.color === 'blue' ? 'bg-blue-50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white' : 'bg-slate-50 text-slate-500 group-hover:bg-slate-800 group-hover:text-white'} transition-colors`}>
                  {tool.icon}
                </div>
                <h3 className="font-bold text-slate-900 text-[15px]">{t('tools.' + tool.id + '.name', tool.name)}</h3>
              </Link>
            ))}
          </div>
          
          <div className="lg:w-[410px] bg-[#1d1b46] rounded-[2rem] p-8 text-center text-white shadow-2xl relative overflow-hidden flex flex-col">
            <span className="bg-blue-600 text-white font-bold text-[10px] px-3 py-1.5 rounded-full uppercase tracking-widest mx-auto mb-8 shadow-sm">{t('ai_companion.badge', 'AI PDF Assistant')}</span>
            <h3 className="text-[26px] font-black mb-3 tracking-tight">{t('ai_companion.title', 'Your Intelligent Companion')}</h3>
            <p className="text-indigo-200/80 text-[13px] font-medium leading-relaxed mb-8 px-2">{t('ai_companion.subtitle', 'Chat, summarize, translate & extract insights from any PDF instantly')}</p>
            
            <div className="w-[84px] h-[84px] mx-auto bg-[#2b2763] rounded-full flex items-center justify-center mb-8 border border-indigo-400/20 shadow-[0_0_40px_rgba(79,70,229,0.25)] animate-float">
              <span className="text-5xl">🤖</span>
            </div>
            
            <div className="space-y-4 text-left mb-8 flex-1 px-2">
              <div className="flex gap-4 items-start">
                <div className="text-[18px] leading-none mt-0.5">📄</div>
                <div><h4 className="font-bold text-[13px] text-white tracking-wide">{t('ai_companion.f1_title', 'Summarize PDF')}</h4><p className="text-[11px] text-indigo-300/60 mt-0.5 font-medium">{t('ai_companion.f1_desc', 'Get structured takeaways of long files')}</p></div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="text-[18px] leading-none mt-0.5">💬</div>
                <div><h4 className="font-bold text-[13px] text-white tracking-wide">{t('ai_companion.f2_title', 'Chat with PDF')}</h4><p className="text-[11px] text-indigo-300/60 mt-0.5 font-medium">{t('ai_companion.f2_desc', 'Ask questions and get answers (coming soon)')}</p></div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="text-[18px] leading-none mt-0.5">🌐</div>
                <div><h4 className="font-bold text-[13px] text-white tracking-wide">{t('ai_companion.f3_title', 'Translate PDF')}</h4><p className="text-[11px] text-indigo-300/60 mt-0.5 font-medium">{t('ai_companion.f3_desc', 'Translate text to 10+ languages')}</p></div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="text-[18px] leading-none mt-0.5">📓</div>
                <div><h4 className="font-bold text-[13px] text-white tracking-wide">{t('ai_companion.f4_title', 'Generate Notes')}</h4><p className="text-[11px] text-indigo-300/60 mt-0.5 font-medium">{t('ai_companion.f4_desc', 'Create study guides and summaries')}</p></div>
              </div>
            </div>
            
            <button className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-[18px] rounded-2xl shadow-[0_8px_25px_rgba(59,130,246,0.35)] transition-all flex items-center justify-center gap-2 mt-auto">
              <span className="text-[20px] leading-none mb-0.5">+</span> {t('ai_companion.btn', 'Try AI Tools Now')}
            </button>
          </div>
        </div>
      </div>

      {/* NEW: Newsletter Banner */}
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="bg-gradient-to-r from-indigo-500 to-sky-400 rounded-3xl p-8 md:p-12 shadow-xl flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 text-center md:text-left text-white">
            <span className="inline-block bg-white/20 px-4 py-1.5 rounded-full text-[11px] font-black tracking-widest uppercase mb-6">{t('newsletter.badge', 'Stay Updated')}</span>
            <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">{t('newsletter.title', 'Get PDF Hacks & Security Reports')}</h2>
            <p className="text-indigo-50 font-medium text-sm md:text-base leading-relaxed max-w-lg">
              {t('newsletter.subtitle', 'Subscribe to our newsletter for time-saving workflows, document security tips, and monthly tool updates.')}
            </p>
          </div>
          <div className="w-full md:w-auto">
            <form onSubmit={handleSubscribeNewsletter} className="flex flex-col sm:flex-row gap-3">
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('newsletter.placeholder', 'Enter your email address')} 
                className="w-full sm:w-72 px-6 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-indigo-100 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button 
                type="submit" 
                disabled={newsletterLoading}
                className="px-8 py-4 bg-white text-indigo-600 hover:text-indigo-700 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {newsletterLoading ? '...' : (newsletterStatus === 'success' ? t('newsletter.btn_subscribed', 'Subscribed ✓') : t('newsletter.btn_subscribe', 'Subscribe ▷'))}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* NEW: FAQ */}
      <div className="max-w-[1000px] mx-auto px-6 py-20 text-center">
        <span className="bg-indigo-100 text-indigo-600 font-bold text-xs px-3 py-1 rounded-full uppercase tracking-widest">{t('nav.faq', 'FAQ')}</span>
        <h2 className="text-4xl font-black text-[#1E1B4B] mt-6 mb-4 tracking-tight">{t('tool_page.faq_title', 'Frequently Asked Questions')}</h2>
        <p className="text-slate-500 font-medium text-lg mb-16">{t('faq.subtitle', 'Here you can find clear and direct answers to common questions about PDF tools.')}</p>
        <div className="text-left">
          <FAQ showHeader={false} />
        </div>
      </div>

    </div>
  )
}

export default Home;
