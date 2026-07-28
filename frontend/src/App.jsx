import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import GenericToolPage from './pages/GenericToolPage'
import Blog from './pages/Blog'
import BlogArticle from './pages/BlogArticle'
import BlogEditor from './pages/BlogEditor'
import Dashboard from './pages/Dashboard'
import Pricing from './pages/Pricing'
import Features from './pages/Features'
import Documentation from './pages/Documentation'
import FAQPage from './pages/FAQPage'
import Security from './pages/Security'
import PressRoom from './pages/PressRoom'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsConditions from './pages/TermsConditions'
import AboutUs from './pages/AboutUs'
import AuthModal from './components/AuthModal'
import { ALL_TOOLS, TOOLS_DATA, COLOR_MAP } from './data/tools'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { User, Mail, Settings, Users, Star, LogOut, Menu, X, ChevronRight, FileText, Bot } from 'lucide-react'

const Twitter = ({ size, className }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>;
const Github = ({ size, className }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>;
const Linkedin = ({ size, className }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>;

const Footer = () => (
  <footer className="bg-white border-t border-slate-100 pt-16 pb-8 px-6 mt-auto">
    <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
      
      <div className="lg:col-span-2">
        <Link to="/" className="inline-block mb-6">
          <img src="/logo-desktop.png" alt="PDF Bundles" className="h-8 w-auto" />
        </Link>
        <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-4">Professional Suite</p>
        <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-sm mb-8">
          A comprehensive professional suite of PDF and image processing utilities. Manage, edit, convert, and protect your documents directly in your browser.
        </p>
        <div className="flex items-center gap-4">
          <a href="#" className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-colors"><Twitter size={18}/></a>
          <a href="#" className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-colors"><Github size={18}/></a>
          <a href="#" className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-600 transition-colors"><Linkedin size={18}/></a>
          <a href="#" className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-500 transition-colors"><Mail size={18}/></a>
        </div>
      </div>

      <div>
        <h4 className="font-bold text-slate-900 tracking-wide mb-6">POPULAR TOOLS</h4>
        <ul className="space-y-4">
          <li><Link to="/merge-pdf" className="text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors">Merge PDF</Link></li>
          <li><Link to="/split-pdf" className="text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors">Split PDF</Link></li>
          <li><Link to="/compress-pdf" className="text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors">Compress PDF</Link></li>
          <li><Link to="/jpg-to-pdf" className="text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors">JPG to PDF</Link></li>
          <li><Link to="/pdf-to-png" className="text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors">PDF to PNG</Link></li>
        </ul>
      </div>

      <div>
        <h4 className="font-bold text-slate-900 tracking-wide mb-6">COMPANY & LEGAL</h4>
        <ul className="space-y-4">
          <li><Link to="/about" className="text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors">About Us</Link></li>
          <li><Link to="/press" className="text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors">Press</Link></li>
          <li><Link to="/security" className="text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors">Security</Link></li>
          <li><Link to="/privacy" className="text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors">Privacy Policy</Link></li>
          <li><Link to="/terms" className="text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors">Terms & Conditions</Link></li>
        </ul>
      </div>

      <div>
        <h4 className="font-bold text-slate-900 tracking-wide mb-6">RESOURCES & MORE</h4>
        <ul className="space-y-4">
          <li><Link to="/features" className="text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors">Features</Link></li>
          <li><Link to="/documentation" className="text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors">Tools/documentation</Link></li>
          <li><Link to="/faq" className="text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors">Frequently Asked Questions</Link></li>
          <li><Link to="/blog" className="text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors">Tech Blog</Link></li>
          <li><Link to="/pricing" className="text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors">Upgrade to Premium</Link></li>
        </ul>
      </div>

    </div>
    
    <div className="max-w-[1400px] mx-auto border-t border-slate-100 pt-8 text-center md:text-left">
      <p className="text-slate-400 text-sm font-medium">© 2026 pdfbundles. All rights reserved. Professional Document Workflow Suite.</p>
    </div>
  </footer>
);
const Layout = ({ children }) => {
  const { currentUser, logout, openAuthModal } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close drawers and scroll to top on route change
  useEffect(() => {
    setIsLeftDrawerOpen(false);
    setIsRightDrawerOpen(false);
    setActiveMegaMenu(null);
    setIsDropdownOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsDropdownOpen(false);
    setIsRightDrawerOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900 bg-slate-50">
      <header className="bg-white border-b border-slate-100 relative z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-16 md:h-[88px] flex items-center justify-between">
          
          {/* Mobile Left: Hamburger */}
          <button className="lg:hidden p-2 -ml-2 text-slate-700" onClick={() => setIsLeftDrawerOpen(true)}>
            <Menu size={24} />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src="/logo-desktop.png" alt="PDF Bundles" className="h-6 md:h-9 w-auto" />
          </Link>
          
          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8 ml-8 h-full">
            <div 
              className="h-full flex items-center relative"
              onMouseEnter={() => setActiveMegaMenu('tools')}
              onMouseLeave={() => setActiveMegaMenu(null)}
            >
              <Link to="/#tools" className="font-bold text-[15px] text-slate-700 hover:text-indigo-600 transition-colors flex items-center gap-1 cursor-default">All Tools <span className="text-[10px]">▼</span></Link>
              
              {/* Mega Menu Dropdown */}
              {activeMegaMenu === 'tools' && (
                <div className="absolute top-full left-0 w-[1000px] bg-white border border-slate-100 rounded-b-3xl shadow-[0_20px_40px_rgba(0,0,0,0.08)] p-8 grid grid-cols-5 gap-8 z-50 cursor-default animate-in fade-in slide-in-from-top-4">
                  {TOOLS_DATA.filter(c => !c.category.includes('AI')).slice(0, 5).map((category, idx) => (
                    <div key={idx}>
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                        {category.category}
                      </h4>
                      <ul className="space-y-1">
                        {category.items.map((tool, tIdx) => (
                          <li key={tIdx}>
                            <Link to={tool.path} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg group transition-colors">
                              <div className={`p-1.5 rounded-md ${COLOR_MAP[tool.color]} group-hover:scale-110 transition-transform`}>
                                {React.cloneElement(tool.icon, { size: 14 })}
                              </div>
                              <span className="text-[13px] font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{tool.name}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div 
              className="h-full flex items-center relative"
              onMouseEnter={() => setActiveMegaMenu('ai')}
              onMouseLeave={() => setActiveMegaMenu(null)}
            >
              <Link to="/ai-pdf-assistant" className="font-bold text-[15px] text-slate-700 hover:text-indigo-600 transition-colors flex items-center gap-2 cursor-default">AI Tools <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">NEW</span></Link>
              
              {/* AI Mega Menu Dropdown */}
              {activeMegaMenu === 'ai' && (
                <div className="absolute top-full left-0 w-[600px] bg-white border border-slate-100 rounded-b-3xl shadow-[0_20px_40px_rgba(0,0,0,0.08)] p-6 grid grid-cols-2 gap-4 z-50 cursor-default animate-in fade-in slide-in-from-top-4">
                  {TOOLS_DATA.filter(c => c.category.includes('AI') || c.category === 'PDF Intelligence').map(cat => cat.items).flat().map((tool, idx) => (
                    <Link to={tool.path} key={idx} className="flex items-start gap-4 p-4 hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 group transition-all">
                       <div className={`p-2.5 rounded-xl ${COLOR_MAP[tool.color]} group-hover:scale-110 transition-transform`}>
                         {React.cloneElement(tool.icon, { size: 20 })}
                       </div>
                       <div>
                         <h4 className="font-bold text-slate-900 text-[14px] group-hover:text-indigo-600 transition-colors">{tool.name}</h4>
                         <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">{tool.desc}</p>
                       </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link to="/pricing" className="font-bold text-[15px] text-slate-700 hover:text-indigo-600 transition-colors">Pricing</Link>
            <Link to="/blog" className="font-bold text-[15px] text-slate-700 hover:text-indigo-600 transition-colors">Blog</Link>
          </nav>

          {/* Desktop & Mobile Right */}
          <div className="flex items-center gap-4 ml-auto">
            {!currentUser ? (
              <>
                <div className="hidden lg:flex items-center gap-4">
                  <button onClick={() => openAuthModal('login')} className="px-7 py-3 text-slate-700 font-bold bg-white border border-slate-200 hover:bg-slate-50 rounded-full transition-all shadow-sm">
                    Login
                  </button>
                  <button onClick={() => openAuthModal('signup')} className="px-7 py-3 bg-[#1E1B4B] hover:bg-indigo-900 text-white font-bold rounded-full transition-all shadow-md hover:shadow-lg">
                    Sign Up
                  </button>
                </div>
                {/* Mobile Right: 9 dots before login */}
                <button className="lg:hidden p-2 -mr-2 text-slate-700" onClick={() => setIsRightDrawerOpen(true)}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="5" cy="5" r="1.5"/><circle cx="12" cy="5" r="1.5"/><circle cx="19" cy="5" r="1.5"/>
                    <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
                    <circle cx="5" cy="19" r="1.5"/><circle cx="12" cy="19" r="1.5"/><circle cx="19" cy="19" r="1.5"/>
                  </svg>
                </button>
              </>
            ) : (
              <div className="relative">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-3 md:gap-4 hover:opacity-80 transition-opacity focus:outline-none"
                >
                  <div className="w-9 h-9 md:w-10 md:h-10 bg-indigo-100 text-indigo-600 font-bold rounded-full flex items-center justify-center">
                    {currentUser.display_name ? currentUser.display_name.charAt(0).toUpperCase() : <User size={18}/>}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-bold text-slate-900">{currentUser.display_name || 'User'}</p>
                    <p className="text-xs font-medium text-slate-400">{currentUser.is_premium ? 'Premium' : 'Free'}</p>
                  </div>
                </button>
                
                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
                    <div className="absolute right-0 mt-3 w-[90vw] md:w-[800px] bg-white rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 p-6 z-50 flex flex-col md:flex-row gap-8 max-h-[85vh] overflow-y-auto">
                      {/* Column 1 */}
                      <div className="flex-1 hidden md:block">
                        <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-4">FEATURES & DOCS</p>
                        <div className="space-y-1">
                          <Link to="/features" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 text-[14px] font-medium text-slate-700 transition-colors rounded-lg"><span className="text-amber-500">✨</span> Features</Link>
                          <Link to="/documentation" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 text-[14px] font-medium text-slate-700 transition-colors rounded-lg"><span className="text-blue-500">📚</span> Documentation</Link>
                          <Link to="/faq" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 text-[14px] font-medium text-slate-700 transition-colors rounded-lg"><span className="text-rose-500">❓</span> FAQ</Link>
                          <Link to="/security" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 text-[14px] font-medium text-slate-700 transition-colors rounded-lg"><span className="text-emerald-500">🔒</span> Security</Link>
                        </div>
                      </div>

                      {/* Column 2 */}
                      <div className="flex-1 hidden md:block">
                        <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-4">COMPANY & LEGAL</p>
                        <div className="space-y-1">
                          <Link to="/press" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 text-[14px] font-medium text-slate-700 transition-colors rounded-lg"><span className="text-slate-400">📰</span> Press Room</Link>
                          <Link to="/privacy" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 text-[14px] font-medium text-slate-700 transition-colors rounded-lg"><span className="text-blue-500">🛡️</span> Privacy Policy</Link>
                          <Link to="/terms" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 text-[14px] font-medium text-slate-700 transition-colors rounded-lg"><span className="text-slate-300">📄</span> Terms & Conditions</Link>
                          <Link to="/about" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 text-[14px] font-medium text-slate-700 transition-colors rounded-lg"><span className="text-indigo-500">👥</span> About Us</Link>
                        </div>
                      </div>

                      {/* Column 3 - User */}
                      <div className="w-full md:w-[260px] md:pl-6 md:border-l border-slate-100 flex flex-col">
                        <div className="pb-3 border-b border-slate-100 flex items-center gap-3">
                          <div className="w-12 h-12 bg-slate-50 border border-slate-200 text-slate-400 rounded-full flex items-center justify-center shrink-0">
                            {currentUser.display_name ? currentUser.display_name.charAt(0).toUpperCase() : <User size={20}/>}
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-[15px] font-bold text-slate-900 truncate">{currentUser.display_name || 'System Administr...'}</p>
                            <p className="text-[11px] text-slate-400 font-medium truncate mb-1">{currentUser.email}</p>
                            {currentUser.is_premium && <span className="bg-purple-100 text-purple-600 text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">PREMIUM</span>}
                          </div>
                        </div>
                        
                        <div className="py-2 border-b border-slate-100">
                          <Link to="/dashboard" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 text-[13px] font-medium text-slate-600 transition-colors rounded-lg">
                            <Settings size={16} className="text-slate-400" /> Account settings
                          </Link>
                          <Link to="/dashboard?tab=teams" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 text-[13px] font-medium text-slate-600 transition-colors rounded-lg">
                            <Users size={16} className="text-slate-400" /> Team
                          </Link>
                          <Link to="/pricing" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 text-[13px] font-medium text-slate-600 transition-colors rounded-lg">
                            <Star size={16} className="text-slate-400" /> Upgrade to Premium
                          </Link>
                        </div>
                        
                        <div className="pt-2 mt-auto">
                          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-rose-50 text-[13px] font-medium text-rose-500 transition-colors text-left rounded-lg">
                            <LogOut size={16} /> Log out
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MOBILE LEFT DRAWER (TOOLS) */}
      {isLeftDrawerOpen && (
        <>
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[60] lg:hidden animate-in fade-in" onClick={() => setIsLeftDrawerOpen(false)}></div>
          <div className="fixed top-0 left-0 bottom-0 w-[85%] max-w-[320px] bg-white z-[70] shadow-2xl flex flex-col lg:hidden animate-in slide-in-from-left">
            <div className="p-4 flex items-center justify-between border-b border-slate-100">
              <Link to="/" className="flex items-center">
                <img src="/logo-desktop.png" alt="PDF Bundles" className="h-6 w-auto" />
              </Link>
              <button onClick={() => setIsLeftDrawerOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {TOOLS_DATA.map((category, idx) => (
                <div key={idx}>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">
                    {category.category}
                  </h4>
                  <ul className="space-y-1">
                    {category.items.map((tool, tIdx) => (
                      <li key={tIdx}>
                        <Link to={tool.path} onClick={() => setIsLeftDrawerOpen(false)} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors">
                          <div className={`p-1.5 rounded-lg ${COLOR_MAP[tool.color]}`}>
                            {React.cloneElement(tool.icon, { size: 16 })}
                          </div>
                          <span className="text-[14px] font-bold text-slate-700">{tool.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* MOBILE RIGHT DRAWER (AUTH & SETTINGS) */}
      {isRightDrawerOpen && (
        <>
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[60] lg:hidden animate-in fade-in" onClick={() => setIsRightDrawerOpen(false)}></div>
          <div className="fixed top-0 right-0 bottom-0 w-[85%] max-w-[320px] bg-white z-[70] shadow-2xl flex flex-col lg:hidden animate-in slide-in-from-right">
            <div className="p-4 flex justify-end">
              <button onClick={() => setIsRightDrawerOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {!currentUser ? (
                <div className="px-6 pb-6 text-center border-b border-slate-100">
                  <div className="w-16 h-16 mx-auto bg-slate-50 border border-slate-200 text-slate-400 rounded-full flex items-center justify-center mb-4">
                    <User size={32} />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-6">Welcome, Guest!</h3>
                  <div className="space-y-3">
                    <button onClick={() => { setIsRightDrawerOpen(false); openAuthModal('login'); }} className="w-full py-3.5 border-2 border-rose-500 text-rose-500 font-bold rounded-xl hover:bg-rose-50 transition-colors">
                      Login
                    </button>
                    <button onClick={() => { setIsRightDrawerOpen(false); openAuthModal('signup'); }} className="w-full py-3.5 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-colors shadow-md shadow-rose-500/20">
                      Sign up
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-6 pb-6 flex items-center gap-4 border-b border-slate-100">
                  <div className="w-16 h-16 bg-slate-50 border border-slate-200 text-slate-400 rounded-full flex items-center justify-center shrink-0">
                    {currentUser.display_name ? currentUser.display_name.charAt(0).toUpperCase() : <User size={32}/>}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-[17px] leading-tight">{currentUser.display_name || 'System Administr...'}</h3>
                    <p className="text-[13px] text-slate-400 font-medium truncate w-32">{currentUser.email}</p>
                    <div className="mt-1">
                      <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-1 rounded font-bold tracking-wider">PLAN: {currentUser.is_premium ? 'PREMIUM' : 'FREE'}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 space-y-1 mt-2">
                {currentUser ? (
                  <>
                    <Link to="/dashboard" onClick={() => setIsRightDrawerOpen(false)} className="flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 text-[15px] font-bold text-slate-700 rounded-xl transition-colors">
                      <Settings size={20} className="text-slate-400" /> Account settings
                    </Link>
                    <Link to="/dashboard?tab=teams" onClick={() => setIsRightDrawerOpen(false)} className="flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 text-[15px] font-bold text-slate-700 rounded-xl transition-colors">
                      <Users size={20} className="text-slate-400" /> Team
                    </Link>
                    <Link to="/pricing" onClick={() => setIsRightDrawerOpen(false)} className="flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 text-[15px] font-bold text-slate-700 rounded-xl transition-colors">
                      <Star size={20} className="text-slate-400" /> Upgrade to Premium
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/pricing" onClick={() => setIsRightDrawerOpen(false)} className="flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 text-[15px] font-bold text-slate-700 rounded-xl transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg> 
                      Pricing
                    </Link>
                    <Link to="/blog" onClick={() => setIsRightDrawerOpen(false)} className="flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 text-[15px] font-bold text-slate-700 rounded-xl transition-colors">
                      <FileText size={20} className="text-slate-400" /> 
                      Tech Blog
                    </Link>
                    <Link to="/features" onClick={() => setIsRightDrawerOpen(false)} className="flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 text-[15px] font-bold text-slate-700 rounded-xl transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                      Platform Features
                    </Link>
                    <Link to="/documentation" onClick={() => setIsRightDrawerOpen(false)} className="flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 text-[15px] font-bold text-slate-700 rounded-xl transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                      Tools/documentation
                    </Link>
                    <Link to="/faq" onClick={() => setIsRightDrawerOpen(false)} className="flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 text-[15px] font-bold text-slate-700 rounded-xl transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                      FAQ
                    </Link>
                    <Link to="/security" onClick={() => setIsRightDrawerOpen(false)} className="flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 text-[15px] font-bold text-slate-700 rounded-xl transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                      Security & Trust
                    </Link>
                    <Link to="/press" onClick={() => setIsRightDrawerOpen(false)} className="flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 text-[15px] font-bold text-slate-700 rounded-xl transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>
                      Press Kit
                    </Link>
                  </>
                )}
                
                {currentUser && (
                  <button onClick={handleLogout} className="w-full mt-4 flex items-center gap-4 px-4 py-3.5 hover:bg-rose-50 text-[15px] font-bold text-rose-500 rounded-xl transition-colors text-left">
                    <LogOut size={20} /> Log out
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
      
      <main className="flex-1 w-full relative">{children}</main>
      
      <Footer />
      
      {/* Global Modals */}
      <AuthModal />
    </div>
  )
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/new" element={<BlogEditor />} />
              <Route path="/blog/:id" element={<BlogArticle />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/dashboard" element={<Dashboard />} />
              
              <Route path="/features" element={<Features />} />
              <Route path="/documentation" element={<Documentation />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/security" element={<Security />} />
              <Route path="/press" element={<PressRoom />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsConditions />} />
              <Route path="/about" element={<AboutUs />} />

              {ALL_TOOLS.map(tool => (
                <Route key={tool.id} path={tool.path} element={<GenericToolPage tool={tool} />} />
              ))}
            </Routes>
          </Layout>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  )
}

export default App
