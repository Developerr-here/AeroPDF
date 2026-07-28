import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Pricing = () => {
  const { currentUser, openAuthModal, token } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // Pricing State
  const [yearlyBilling, setYearlyBilling] = useState(false);
  const [seats, setSeats] = useState(1);
  const unitPrice = yearlyBilling ? 4 : 7;
  const premiumPrice = unitPrice * seats;

  // Accordion State
  const [expandedSection, setExpandedSection] = useState('filesize');

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
        body: JSON.stringify({ plan: 'premium', seats, interval: yearlyBilling ? 'year' : 'month' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize checkout');
      window.location.href = data.url;
    } catch (err) {
      addToast(err.message, 'error');
      setLoading(false);
    }
  };

  const toggleAccordion = (section) => {
    if (expandedSection === section) setExpandedSection(null);
    else setExpandedSection(section);
  };

  const renderCheck = () => <Check size={18} className="text-emerald-500 mx-auto" />;
  const renderDash = () => <span className="text-slate-400 font-bold">—</span>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32">
      {/* Header */}
      <div className="text-center pt-24 pb-12 px-6">
        <h1 className="text-4xl md:text-[44px] font-black text-[#B088F9] mb-4 tracking-tight">Upgrade to pdfbundles</h1>
        <p className="text-slate-500 font-medium text-lg">Unlock limits and tools that suit your team's workflow</p>
        
        {/* Billing Toggle */}
        <div className="flex justify-center items-center gap-4 mt-10">
          <span className={`font-bold ${!yearlyBilling ? 'text-slate-900' : 'text-slate-400'}`}>Monthly Billing</span>
          <button 
            onClick={() => setYearlyBilling(!yearlyBilling)}
            className="w-14 h-8 bg-slate-200 rounded-full relative transition-colors focus:outline-none"
            style={{ backgroundColor: yearlyBilling ? '#10B981' : '#E2E8F0' }}
          >
            <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${yearlyBilling ? 'left-7' : 'left-1'}`}></div>
          </button>
          <span className={`font-bold flex items-center gap-2 ${yearlyBilling ? 'text-slate-900' : 'text-slate-400'}`}>
            Yearly Billing <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">-42%</span>
          </span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-[1600px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        
        {/* Basic */}
        <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <h3 className="text-2xl font-bold text-slate-600 mb-1">Basic</h3>
          <p className="text-slate-400 text-sm font-medium mb-8">1 User</p>
          <div className="mb-4">
            <span className="text-5xl font-black text-slate-600">$0</span>
            <span className="text-slate-400 font-medium"> / forever</span>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed mb-10 h-12">Access to essential PDF converters and basic files limits.</p>
          <ul className="space-y-3 mb-10 flex-1 text-left w-full text-sm font-medium text-slate-600">
            <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400"/> Essential PDF tools</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400"/> Standard limits & sizing</li>
          </ul>
          <button className="w-full py-4 rounded-full font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors">
            Current Plan
          </button>
        </div>

        {/* Premium */}
        <div className="bg-white rounded-[2rem] p-10 shadow-xl border-[3px] border-[#4A3B69] flex flex-col items-center text-center relative transform md:-translate-y-4">
          <div className="absolute -top-4 bg-[#4A3B69] text-white text-xs font-bold px-6 py-1.5 rounded-full">Popular</div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-2"><span className="text-amber-400 text-xl">☆</span> Premium</h3>
          <p className="text-amber-500 text-sm font-bold mb-8">1 - 25 Users</p>
          <div className="mb-4">
            <span className="text-5xl font-black text-slate-900">${premiumPrice}</span>
            <span className="text-slate-500 font-medium"> / month (for {seats} seat{seats > 1 ? 's' : ''})</span>
          </div>
          
          <div className="w-full mb-8">
            <p className="text-xs font-bold text-slate-600 mb-3">Select seats needed:</p>
            <div className="flex items-center justify-center">
              <button onClick={() => setSeats(Math.max(1, seats - 1))} className="w-10 h-10 border border-slate-200 rounded-l-lg flex items-center justify-center font-bold text-slate-600 hover:bg-slate-50">-</button>
              <div className="w-14 h-10 border-t border-b border-slate-200 flex items-center justify-center font-bold text-slate-900 bg-slate-50/50">{seats}</div>
              <button onClick={() => setSeats(seats + 1)} className="w-10 h-10 border border-slate-200 rounded-r-lg flex items-center justify-center font-bold text-slate-600 hover:bg-slate-50">+</button>
            </div>
          </div>

          <p className="text-slate-500 text-sm leading-relaxed mb-8">Full access to all PDF tools, OCR, and unlimited processing.</p>
          <ul className="space-y-3 mb-10 flex-1 text-left w-full text-sm font-bold text-slate-600">
            <li className="flex items-center gap-2"><Check size={16} className="text-emerald-500"/> All tools and AI credits</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-emerald-500"/> Multi-user collaboration</li>
          </ul>
          <button onClick={handleSubscribe} disabled={loading} className="w-full py-4 rounded-full font-bold text-white bg-[#A78BFA] hover:bg-[#8B5CF6] transition-colors shadow-md">
            {loading ? 'Processing...' : 'Choose Premium'}
          </button>
        </div>

        {/* Business */}
        <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <h3 className="text-2xl font-bold text-slate-600 mb-1">Business</h3>
          <p className="text-slate-400 text-sm font-medium mb-8">25+ Users</p>
          <div className="mb-4">
            <span className="text-4xl font-black text-slate-600">Let's talk</span>
            <span className="text-slate-400 font-medium block mt-1 text-sm">Customized contracts</span>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed mb-10 h-12">SSO configuration, custom SLAs, and dedicated manager support.</p>
          <ul className="space-y-3 mb-10 flex-1 text-left w-full text-sm font-medium text-slate-600">
            <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400"/> Custom scale contracts</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400"/> SSO & Account Manager</li>
          </ul>
          <a href="/#contact-sales" className="w-full py-4 rounded-full font-bold text-slate-500 bg-slate-200 hover:bg-slate-300 transition-colors block text-center mt-auto">
            Contact Sales
          </a>
        </div>

      </div>

      {/* Compare Features Table */}
      <div className="max-w-[1600px] mx-auto px-6 mt-32">
        <h2 className="text-4xl font-black text-slate-900 text-center mb-16">Compare Plan Features</h2>
        
        {/* Table Header */}
        <div className="grid grid-cols-4 gap-4 pb-6 border-b-2 border-slate-100 px-6 font-bold text-slate-900 text-sm md:text-base">
          <div className="col-span-1">Feature</div>
          <div className="col-span-1 text-center">Basic</div>
          <div className="col-span-1 text-center text-amber-500">Premium</div>
          <div className="col-span-1 text-center">Business</div>
        </div>

        {/* Accordions */}
        <div className="mt-4 space-y-4">
          
          {/* Filesize Accordion */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <button onClick={() => toggleAccordion('filesize')} className="w-full flex items-center justify-between p-6 font-bold text-slate-900 hover:bg-slate-50">
              Filesize per task
              {expandedSection === 'filesize' ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
            </button>
            {expandedSection === 'filesize' && (
              <div className="px-6 pb-6 text-sm">
                {[
                  { n: 'Merge PDF', b: '100 MB', p: '4 GB' },
                  { n: 'Split PDF', b: '100 MB', p: '4 GB' },
                  { n: 'Compress PDF', b: '200 MB', p: '4 GB' },
                  { n: 'Office to PDF (Word, Excel, PPT to PDF)', b: '15 MB', p: '4 GB' },
                  { n: 'PDF to Word, Excel, PowerPoint', b: '15 MB', p: '4 GB' },
                  { n: 'OCR PDF', b: '15 MB', p: '4 GB' },
                  { n: 'PDF to PNG', b: '25 MB', p: '4 GB' },
                  { n: 'Image to PDF', b: '40 MB', p: '4 GB' },
                  { n: 'Utility Tools (Protect, Unlock, Rotate, Watermark, organize, repair, crop)', b: '100 MB', p: '4 GB' },
                  { n: 'Edit PDF', b: '100 MB', p: '100 MB', pColor: 'text-slate-600' },
                  { n: 'Sign PDF', b: '50 MB', p: '50 MB', pColor: 'text-slate-600' },
                  { n: 'Redact PDF / Compare PDFs', b: '400 MB', p: '400 MB', pColor: 'text-slate-600' },
                  { n: 'PDF Forms', b: '15 MB', p: '100 MB', pColor: 'text-slate-600' },
                  { n: 'AI Summarizer', b: '—', p: '50 MB', pColor: 'text-slate-600' },
                  { n: 'Translate PDF', b: '—', p: '200 MB', pColor: 'text-slate-600' }
                ].map((row, i) => (
                  <div key={i} className="grid grid-cols-4 gap-4 py-4 border-t border-slate-50 items-center">
                    <div className="col-span-1 text-slate-600">{row.n}</div>
                    <div className="col-span-1 text-center text-slate-600">{row.b}</div>
                    <div className={`col-span-1 text-center font-bold ${row.pColor || 'text-emerald-500'}`}>{row.p}</div>
                    <div className={`col-span-1 text-center font-bold ${row.pColor || 'text-emerald-500'}`}>{row.p}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Batch Limits Accordion */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <button onClick={() => toggleAccordion('batch')} className="w-full flex items-center justify-between p-6 font-bold text-slate-900 hover:bg-slate-50">
              Batch Processing Limits
              {expandedSection === 'batch' ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
            </button>
            {expandedSection === 'batch' && (
              <div className="px-6 pb-6 text-sm">
                {[
                  { n: 'Merge PDF', b: '25 files', p: '500 files' },
                  { n: 'Split PDF', b: '1 file', p: '1 file', pColor: 'text-slate-600' },
                  { n: 'Compress PDF', b: '2 files', p: '10 files' },
                  { n: 'Office to PDF (Word / Excel / PowerPoint)', b: '1 file', p: '10 files' },
                  { n: 'PDF to Office (Word / Excel / PowerPoint)', b: '1 file', p: '10 files' },
                  { n: 'OCR PDF', b: '1 file', p: '10 files' },
                  { n: 'PDF to PNG', b: '2 files', p: '10 files' },
                  { n: 'Image to PDF', b: '20 files', p: '80 files' },
                  { n: 'Utility Tools (Page Numbers / Watermark)', b: '2 files', p: '10 files' },
                  { n: 'Rotate PDF', b: '20 files', p: '80 files' },
                  { n: 'Unlock / Protect PDF', b: '2 files', p: '80 files' },
                  { n: 'Organize PDF Pages', b: '5 files', p: '20 files' },
                  { n: 'Repair PDF', b: '1 file', p: '10 files' },
                  { n: 'Edit PDF / Redact / Forms / Crop', b: '1 file', p: '1 file', pColor: 'text-slate-600' },
                  { n: 'Sign PDF', b: '3 files', p: '5 files' },
                  { n: 'Compare PDF', b: '2 files', p: '2 files' },
                  { n: 'AI Summarizer / Translate', b: '1 file', p: '1 file', pColor: 'text-slate-600' }
                ].map((row, i) => (
                  <div key={i} className="grid grid-cols-4 gap-4 py-4 border-t border-slate-50 items-center">
                    <div className="col-span-1 text-slate-600">{row.n}</div>
                    <div className="col-span-1 text-center text-slate-600">{row.b}</div>
                    <div className={`col-span-1 text-center font-bold ${row.pColor || 'text-emerald-500'}`}>{row.p}</div>
                    <div className={`col-span-1 text-center font-bold ${row.pColor || 'text-emerald-500'}`}>{row.p}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Standard PDF Tools Accordion */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <button onClick={() => toggleAccordion('standard')} className="w-full flex items-center justify-between p-6 font-bold text-slate-900 hover:bg-slate-50">
              Standard PDF Tools
              {expandedSection === 'standard' ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
            </button>
            {expandedSection === 'standard' && (
              <div className="px-6 pb-6 text-sm">
                {[
                  'Merge, Split, & Compress PDF',
                  'PDF to Word / Word to PDF',
                  'PDF to Excel / PowerPoint',
                  'Edit, Sign, Watermark, & Protect PDF',
                  'OCR PDF (Standard text recognition)',
                  'Redact PDF / Compare PDFs',
                  'PDF Forms (Standard forms filling)'
                ].map((feature, i) => (
                  <div key={i} className="grid grid-cols-4 gap-4 py-4 border-t border-slate-50 items-center">
                    <div className="col-span-1 text-slate-600">{feature}</div>
                    <div className="col-span-1 text-center">{renderCheck()}</div>
                    <div className="col-span-1 text-center">{renderCheck()}</div>
                    <div className="col-span-1 text-center">{renderCheck()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI PDF Features Accordion */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <button onClick={() => toggleAccordion('ai')} className="w-full flex items-center justify-between p-6 font-bold text-slate-900 hover:bg-slate-50">
              AI PDF Features
              {expandedSection === 'ai' ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
            </button>
            {expandedSection === 'ai' && (
              <div className="px-6 pb-6 text-sm">
                {[
                  { n: 'AI Summarizer (Standard AI)', b: renderDash(), p: renderCheck(), biz: renderCheck() },
                  { n: 'Translate PDF (Standard AI)', b: renderDash(), p: renderCheck(), biz: renderCheck() },
                  { n: 'AI Monthly Credits', b: renderDash(), p: <span className="font-bold text-[#A78BFA]">1,000 credits</span>, biz: <span className="font-bold text-[#A78BFA]">Custom scale</span> }
                ].map((row, i) => (
                  <div key={i} className="grid grid-cols-4 gap-4 py-4 border-t border-slate-50 items-center">
                    <div className="col-span-1 text-slate-600">{row.n}</div>
                    <div className="col-span-1 text-center">{row.b}</div>
                    <div className="col-span-1 text-center">{row.p}</div>
                    <div className="col-span-1 text-center">{row.biz}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Business & Support Accordion */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <button onClick={() => toggleAccordion('support')} className="w-full flex items-center justify-between p-6 font-bold text-slate-900 hover:bg-slate-50">
              Business & Support
              {expandedSection === 'support' ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
            </button>
            {expandedSection === 'support' && (
              <div className="px-6 pb-6 text-sm">
                {[
                  { n: 'Multi-user Teams', b: renderDash(), p: renderCheck(), biz: renderCheck() },
                  { n: 'Volume discount on seats', b: renderDash(), p: renderCheck(), biz: renderCheck() },
                  { n: 'Customer support level', b: <span className="text-slate-600">Basic support</span>, p: <span className="font-bold text-emerald-500">Preferential</span>, biz: <span className="font-bold text-emerald-500">Dedicated support</span> }
                ].map((row, i) => (
                  <div key={i} className="grid grid-cols-4 gap-4 py-4 border-t border-slate-50 items-center">
                    <div className="col-span-1 text-slate-600">{row.n}</div>
                    <div className="col-span-1 text-center">{row.b}</div>
                    <div className="col-span-1 text-center">{row.p}</div>
                    <div className="col-span-1 text-center">{row.biz}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Pricing;
