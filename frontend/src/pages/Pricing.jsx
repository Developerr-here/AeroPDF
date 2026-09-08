import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useTranslation } from '../i18n/LanguageContext';

const Pricing = () => {
  const { t, language } = useTranslation();
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
        <h1 className="text-4xl md:text-[44px] font-black text-[#B088F9] mb-4 tracking-tight">
          {t('pricing_page.title', 'Upgrade to pdfbundles')}
        </h1>
        <p className="text-slate-500 font-medium text-lg">
          {t('pricing_page.subtitle', "Unlock limits and tools that suit your team's workflow")}
        </p>
        
        {/* Billing Toggle */}
        <div className="flex justify-center items-center gap-4 mt-10">
          <span className={`font-bold ${!yearlyBilling ? 'text-slate-900' : 'text-slate-400'}`}>
            {t('pricing_section.monthly', 'Monthly Billing')}
          </span>
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

      {/* Pricing Cards */}
      <div className="max-w-[1600px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        
        {/* Basic */}
        <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <h3 className="text-2xl font-bold text-slate-600 mb-1">{t('pricing_section.basic_name', 'Basic')}</h3>
          <p className="text-slate-400 text-sm font-medium mb-8">{t('pricing_section.basic_user', '1 User')}</p>
          <div className="mb-4">
            <span className="text-5xl font-black text-slate-600">{t('pricing_section.basic_price', '$0')}</span>
            <span className="text-slate-400 font-medium"> {t('pricing_section.basic_period', '/ forever')}</span>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed mb-10 h-12">
            {t('pricing_section.basic_desc', 'Access to essential PDF converters and basic files limits.')}
          </p>
          <ul className="space-y-3 mb-10 flex-1 text-left w-full text-sm font-medium text-slate-600">
            <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400"/> {t('pricing_section.basic_f1', 'Essential PDF tools')}</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400"/> {t('pricing_section.basic_f2', 'Standard limits & sizing')}</li>
          </ul>
          <button className="w-full py-4 rounded-full font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors">
            {t('pricing_page.current_plan', 'Current Plan')}
          </button>
        </div>

        {/* Premium */}
        <div className="bg-white rounded-[2rem] p-10 shadow-xl border-[3px] border-[#4A3B69] flex flex-col items-center text-center relative transform md:-translate-y-4">
          <div className="absolute -top-4 bg-[#4A3B69] text-white text-xs font-bold px-6 py-1.5 rounded-full">
            {t('pricing_section.popular_badge', 'Popular')}
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-2"><span className="text-amber-400 text-xl">☆</span> {t('pricing_section.premium_name', 'Premium')}</h3>
          <p className="text-amber-500 text-sm font-bold mb-8">{t('pricing_section.premium_user', '1 - 25 Users')}</p>
          <div className="mb-4">
            <span className="text-5xl font-black text-slate-900">${premiumPrice}</span>
            <span className="text-slate-500 font-medium"> {t('pricing_section.premium_period', '/ month')} {t('pricing_page.for_seats', `(for ${seats} seat${seats > 1 ? 's' : ''})`).replace('{count}', seats).replace('{s}', seats > 1 ? 's' : '')}</span>
          </div>
          
          <div className="w-full mb-8">
            <p className="text-xs font-bold text-slate-600 mb-3">{t('pricing_page.select_seats', 'Select seats needed:')}</p>
            <div className="flex items-center justify-center">
              <button onClick={() => setSeats(Math.max(1, seats - 1))} className="w-10 h-10 border border-slate-200 rounded-l-lg flex items-center justify-center font-bold text-slate-600 hover:bg-slate-50">-</button>
              <div className="w-14 h-10 border-t border-b border-slate-200 flex items-center justify-center font-bold text-slate-900 bg-slate-50/50">{seats}</div>
              <button onClick={() => setSeats(seats + 1)} className="w-10 h-10 border border-slate-200 rounded-r-lg flex items-center justify-center font-bold text-slate-600 hover:bg-slate-50">+</button>
            </div>
          </div>

          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            {t('pricing_section.premium_desc', 'Full access to all PDF tools, OCR, and unlimited processing.')}
          </p>
          <ul className="space-y-3 mb-10 flex-1 text-left w-full text-sm font-bold text-slate-600">
            <li className="flex items-center gap-2"><Check size={16} className="text-emerald-500"/> {t('pricing_section.premium_f1', 'All tools and AI credits')}</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-emerald-500"/> {t('pricing_section.premium_f2', 'Multi-user collaboration')}</li>
          </ul>
          <button onClick={handleSubscribe} disabled={loading} className="w-full py-4 rounded-full font-bold text-white bg-[#A78BFA] hover:bg-[#8B5CF6] transition-colors shadow-md">
            {loading ? t('actions.processing', 'Processing...') : t('pricing_section.premium_btn', 'Choose Premium')}
          </button>
        </div>

        {/* Business */}
        <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <h3 className="text-2xl font-bold text-slate-600 mb-1">{t('pricing_section.business_name', 'Business')}</h3>
          <p className="text-slate-400 text-sm font-medium mb-8">{t('pricing_section.business_user', '25+ Users')}</p>
          <div className="mb-4">
            <span className="text-4xl font-black text-slate-600">{t('pricing_section.business_talk', "Let's talk")}</span>
            <span className="text-slate-400 font-medium block mt-1 text-sm">{t('pricing_section.business_custom', 'Customized contracts')}</span>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed mb-10 h-12">
            {t('pricing_section.business_desc', 'SSO configuration, custom SLAs, and dedicated manager support.')}
          </p>
          <ul className="space-y-3 mb-10 flex-1 text-left w-full text-sm font-medium text-slate-600">
            <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400"/> {t('pricing_section.business_f1', 'Custom scale contracts')}</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-emerald-400"/> {t('pricing_section.business_f4', 'SSO & Account Manager')}</li>
          </ul>
          <a href="/#contact-sales" className="w-full py-4 rounded-full font-bold text-slate-500 bg-slate-200 hover:bg-slate-300 transition-colors block text-center mt-auto">
            {t('pricing_section.business_btn', 'Contact Sales')}
          </a>
        </div>

      </div>

      {/* Compare Features Table */}
      <div className="max-w-[1600px] mx-auto px-6 mt-32">
        <h2 className="text-4xl font-black text-slate-900 text-center mb-16">
          {t('pricing_page.compare_title', 'Compare Plan Features')}
        </h2>
        
        {/* Table Header */}
        <div className="grid grid-cols-4 gap-4 pb-6 border-b-2 border-slate-100 px-6 font-bold text-slate-900 text-sm md:text-base">
          <div className="col-span-1">{t('pricing_page.th_feature', 'Feature')}</div>
          <div className="col-span-1 text-center">{t('pricing_section.basic_name', 'Basic')}</div>
          <div className="col-span-1 text-center text-amber-500">{t('pricing_section.premium_name', 'Premium')}</div>
          <div className="col-span-1 text-center">{t('pricing_section.business_name', 'Business')}</div>
        </div>

        {/* Accordions */}
        <div className="mt-4 space-y-4">
          
          {/* Filesize Accordion */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <button onClick={() => toggleAccordion('filesize')} className="w-full flex items-center justify-between p-6 font-bold text-slate-900 hover:bg-slate-50">
              {t('pricing_page.acc_filesize', 'Filesize per task')}
              {expandedSection === 'filesize' ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
            </button>
            {expandedSection === 'filesize' && (
              <div className="px-6 pb-6 text-sm">
                {[
                  { n: t('pricing_page.row_merge', 'Merge PDF'), b: '100 MB', p: '4 GB' },
                  { n: t('pricing_page.row_split', 'Split PDF'), b: '100 MB', p: '4 GB' },
                  { n: t('pricing_page.row_compress', 'Compress PDF'), b: '200 MB', p: '4 GB' },
                  { n: t('pricing_page.row_office_to_pdf', 'Office to PDF (Word, Excel, PPT to PDF)'), b: '15 MB', p: '4 GB' },
                  { n: t('pricing_page.row_pdf_to_office', 'PDF to Word, Excel, PowerPoint'), b: '15 MB', p: '4 GB' },
                  { n: t('pricing_page.row_ocr', 'OCR PDF'), b: '15 MB', p: '4 GB' },
                  { n: t('pricing_page.row_pdf_to_png', 'PDF to PNG'), b: '25 MB', p: '4 GB' },
                  { n: t('pricing_page.row_image_to_pdf', 'Image to PDF'), b: '40 MB', p: '4 GB' },
                  { n: t('pricing_page.row_utility', 'Utility Tools (Protect, Unlock, Rotate, Watermark, organize, repair, crop)'), b: '100 MB', p: '4 GB' },
                  { n: t('pricing_page.row_edit', 'Edit PDF'), b: '100 MB', p: '100 MB', pColor: 'text-slate-600' },
                  { n: t('pricing_page.row_sign', 'Sign PDF'), b: '50 MB', p: '50 MB', pColor: 'text-slate-600' },
                  { n: t('pricing_page.row_redact_compare', 'Redact PDF / Compare PDFs'), b: '400 MB', p: '400 MB', pColor: 'text-slate-600' },
                  { n: t('pricing_page.row_forms', 'PDF Forms'), b: '15 MB', p: '100 MB', pColor: 'text-slate-600' },
                  { n: t('pricing_page.row_ai_summarizer', 'AI Summarizer'), b: '—', p: '50 MB', pColor: 'text-slate-600' },
                  { n: t('pricing_page.row_translate', 'Translate PDF'), b: '—', p: '200 MB', pColor: 'text-slate-600' }
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
              {t('pricing_page.acc_batch', 'Batch Processing Limits')}
              {expandedSection === 'batch' ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
            </button>
            {expandedSection === 'batch' && (
              <div className="px-6 pb-6 text-sm">
                {[
                  { n: t('pricing_page.row_merge', 'Merge PDF'), b: `25 ${t('pricing_page.files', 'files')}`, p: `500 ${t('pricing_page.files', 'files')}` },
                  { n: t('pricing_page.row_split', 'Split PDF'), b: `1 ${t('pricing_page.file', 'file')}`, p: `1 ${t('pricing_page.file', 'file')}`, pColor: 'text-slate-600' },
                  { n: t('pricing_page.row_compress', 'Compress PDF'), b: `2 ${t('pricing_page.files', 'files')}`, p: `10 ${t('pricing_page.files', 'files')}` },
                  { n: t('pricing_page.row_office_to_pdf_short', 'Office to PDF (Word / Excel / PowerPoint)'), b: `1 ${t('pricing_page.file', 'file')}`, p: `10 ${t('pricing_page.files', 'files')}` },
                  { n: t('pricing_page.row_pdf_to_office_short', 'PDF to Office (Word / Excel / PowerPoint)'), b: `1 ${t('pricing_page.file', 'file')}`, p: `10 ${t('pricing_page.files', 'files')}` },
                  { n: t('pricing_page.row_ocr', 'OCR PDF'), b: `1 ${t('pricing_page.file', 'file')}`, p: `10 ${t('pricing_page.files', 'files')}` },
                  { n: t('pricing_page.row_pdf_to_png', 'PDF to PNG'), b: `2 ${t('pricing_page.files', 'files')}`, p: `10 ${t('pricing_page.files', 'files')}` },
                  { n: t('pricing_page.row_image_to_pdf', 'Image to PDF'), b: `20 ${t('pricing_page.files', 'files')}`, p: `80 ${t('pricing_page.files', 'files')}` },
                  { n: t('pricing_page.row_page_num_watermark', 'Utility Tools (Page Numbers / Watermark)'), b: `2 ${t('pricing_page.files', 'files')}`, p: `10 ${t('pricing_page.files', 'files')}` },
                  { n: t('pricing_page.row_rotate', 'Rotate PDF'), b: `20 ${t('pricing_page.files', 'files')}`, p: `80 ${t('pricing_page.files', 'files')}` },
                  { n: t('pricing_page.row_unlock_protect', 'Unlock / Protect PDF'), b: `2 ${t('pricing_page.files', 'files')}`, p: `80 ${t('pricing_page.files', 'files')}` },
                  { n: t('pricing_page.row_organize', 'Organize PDF Pages'), b: `5 ${t('pricing_page.files', 'files')}`, p: `20 ${t('pricing_page.files', 'files')}` },
                  { n: t('pricing_page.row_repair', 'Repair PDF'), b: `1 ${t('pricing_page.file', 'file')}`, p: `10 ${t('pricing_page.files', 'files')}` },
                  { n: t('pricing_page.row_edit_redact_crop', 'Edit PDF / Redact / Forms / Crop'), b: `1 ${t('pricing_page.file', 'file')}`, p: `1 ${t('pricing_page.file', 'file')}`, pColor: 'text-slate-600' },
                  { n: t('pricing_page.row_sign', 'Sign PDF'), b: `3 ${t('pricing_page.files', 'files')}`, p: `5 ${t('pricing_page.files', 'files')}` },
                  { n: t('pricing_page.row_compare', 'Compare PDF'), b: `2 ${t('pricing_page.files', 'files')}`, p: `2 ${t('pricing_page.files', 'files')}` },
                  { n: t('pricing_page.row_ai_summarizer_translate', 'AI Summarizer / Translate'), b: `1 ${t('pricing_page.file', 'file')}`, p: `1 ${t('pricing_page.file', 'file')}`, pColor: 'text-slate-600' }
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
              {t('pricing_page.acc_standard', 'Standard PDF Tools')}
              {expandedSection === 'standard' ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
            </button>
            {expandedSection === 'standard' && (
              <div className="px-6 pb-6 text-sm">
                {[
                  t('pricing_page.row_merge_split_compress', 'Merge, Split, & Compress PDF'),
                  t('pricing_page.row_pdf_to_word_word_to_pdf', 'PDF to Word / Word to PDF'),
                  t('pricing_page.row_pdf_to_excel_ppt', 'PDF to Excel / PowerPoint'),
                  t('pricing_page.row_edit_sign_watermark_protect', 'Edit, Sign, Watermark, & Protect PDF'),
                  t('pricing_page.row_ocr_std', 'OCR PDF (Standard text recognition)'),
                  t('pricing_page.row_redact_compare_std', 'Redact PDF / Compare PDFs'),
                  t('pricing_page.row_forms_std', 'PDF Forms (Standard forms filling)')
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
              {t('pricing_page.acc_ai', 'AI PDF Features')}
              {expandedSection === 'ai' ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
            </button>
            {expandedSection === 'ai' && (
              <div className="px-6 pb-6 text-sm">
                {[
                  { n: t('pricing_page.row_ai_summarizer_std', 'AI Summarizer (Standard AI)'), b: renderDash(), p: renderCheck(), biz: renderCheck() },
                  { n: t('pricing_page.row_translate_std', 'Translate PDF (Standard AI)'), b: renderDash(), p: renderCheck(), biz: renderCheck() },
                  { n: t('pricing_page.row_ai_credits', 'AI Monthly Credits'), b: renderDash(), p: <span className="font-bold text-[#A78BFA]">{t('pricing_page.ai_credits_1000', '1,000 credits')}</span>, biz: <span className="font-bold text-[#A78BFA]">{t('pricing_page.ai_custom_scale', 'Custom scale')}</span> }
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
              {t('pricing_page.acc_support', 'Business & Support')}
              {expandedSection === 'support' ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
            </button>
            {expandedSection === 'support' && (
              <div className="px-6 pb-6 text-sm">
                {[
                  { n: t('pricing_page.row_teams', 'Multi-user Teams'), b: renderDash(), p: renderCheck(), biz: renderCheck() },
                  { n: t('pricing_page.row_discount', 'Volume discount on seats'), b: renderDash(), p: renderCheck(), biz: renderCheck() },
                  { n: t('pricing_page.row_support_level', 'Customer support level'), b: <span className="text-slate-600">{t('pricing_page.basic_support', 'Basic support')}</span>, p: <span className="font-bold text-emerald-500">{t('pricing_page.preferential_support', 'Preferential')}</span>, biz: <span className="font-bold text-emerald-500">{t('pricing_page.dedicated_support', 'Dedicated support')}</span> }
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
