import React from 'react';
import { Sparkles, Zap, Shield, Cloud, Layout, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Features = () => {
  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-24 px-6 font-sans">
      <div className="max-w-[1000px] mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6">
            <span className="text-rose-500">🚀</span> Official Reference
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-[#1E1B4B] mb-4 flex items-center justify-center gap-3">
            <Sparkles size={40} className="text-[#1E1B4B]" /> Platform Features
          </h1>
          <p className="text-lg text-slate-500 font-medium">Work Smarter with High-Performance PDF Bundles</p>
          <div className="w-12 h-1 bg-indigo-600 mx-auto mt-6 rounded-full"></div>
        </div>

        {/* Intro */}
        <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-slate-100 mb-12">
          <p className="text-slate-600 text-lg leading-relaxed mb-6">
            Managing documents shouldn't feel like a chore. Whether you are packaging monthly client reports, compiling legal discoveries, or organizing e-commerce invoices, PDF Bundles gives you a highly intuitive, lightning-fast suite of tools to process multiple files simultaneously.
          </p>
          <p className="text-indigo-600 font-bold text-lg">
            No complex training required—just drag, drop, and bundle.
          </p>

          {/* Capabilities Table */}
          <h2 className="text-2xl font-black text-slate-900 mt-12 mb-6">Core Product Capabilities</h2>
          <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 border-b border-slate-200 text-xs font-black text-slate-500 tracking-wider uppercase">
              <div className="col-span-1">Feature Group</div>
              <div className="col-span-2">What you can do</div>
              <div className="col-span-1">SEO Focus</div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 border-b border-slate-100 items-start">
              <div className="col-span-1 font-bold text-slate-900 text-[15px]">Smart Bundling & Organization</div>
              <div className="col-span-2 text-slate-600 text-[14px] leading-relaxed">Merge hundreds of files into unified master documents, extract targeted pages, or split large bundles back into individual assets.</div>
              <div className="col-span-1 text-slate-400 italic text-[13px]">Merge PDF bundles, Split document sets</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 border-b border-slate-100 items-start">
              <div className="col-span-1 font-bold text-slate-900 text-[15px]">High-Fidelity Conversion</div>
              <div className="col-span-2 text-slate-600 text-[14px] leading-relaxed">Move seamlessly between PDF and formats like Word, Excel, PowerPoint, and high-res JPG without losing structural formatting.</div>
              <div className="col-span-1 text-slate-400 italic text-[13px]">Batch PDF converter, Office to PDF</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 border-b border-slate-100 items-start">
              <div className="col-span-1 font-bold text-slate-900 text-[15px]">Enterprise-Grade Optimization</div>
              <div className="col-span-2 text-slate-600 text-[14px] leading-relaxed">Shrink heavy document bundles to email-friendly sizes while maintaining crystal-clear text sharpness.</div>
              <div className="col-span-1 text-slate-400 italic text-[13px]">Compress PDF bundle, Optimize documents</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 items-start">
              <div className="col-span-1 font-bold text-slate-900 text-[15px]">Bundle Intelligence & Security</div>
              <div className="col-span-2 text-slate-600 text-[14px] leading-relaxed">Instantly lock entire sets with AES encryption, apply digital signatures, or generate automated AI summaries of massive document pools.</div>
              <div className="col-span-1 text-slate-400 italic text-[13px]">Secure PDF bundles, AI PDF summary</div>
            </div>
          </div>
        </div>

        {/* Why Choose */}
        <h2 className="text-2xl font-black text-slate-900 mb-6">Why Modern Teams Choose PDF Bundles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mb-6"><Zap size={20} /></div>
            <h3 className="font-bold text-slate-900 text-lg mb-3">True Batch Processing Power</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Stop handling documents one by one. Our infrastructure is built specifically to process complex, multi-file batches at maximum speed. Upload entire folders, apply your edits, and download your ready-to-go bundle in seconds.</p>
          </div>
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center mb-6"><Shield size={20} /></div>
            <h3 className="font-bold text-slate-900 text-lg mb-3">Ironclad Privacy & Data Security</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Your document security is non-negotiable. To ensure your private records remain entirely yours, PDF Bundles utilizes localized browser processing and strict server-side cleanup protocols—automatically deleting all processed archives from our systems within two hours.</p>
          </div>
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-6"><Cloud size={20} /></div>
            <h3 className="font-bold text-slate-900 text-lg mb-3">Seamless Cloud Integrations</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Keep your workflow continuous without burning local storage or mobile data. Import your document batches directly from Google Drive or Dropbox, build your bundles on our cloud servers, and save them straight back to your shared team drives.</p>
          </div>
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 md:col-span-1">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center mb-6"><Layout size={20} /></div>
            <h3 className="font-bold text-slate-900 text-lg mb-3">Total Control Over Layouts</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Organizing document sets can get messy. Our interactive dashboard lets you instantly reorder files alphabetically, inject missing pages on the fly, remove unwanted sheets, or rotate skewed scans before you compile the final master bundle.</p>
          </div>
        </div>

        {/* Premium CTA */}
        <div className="bg-[#f8f6fc] p-8 md:p-12 rounded-[2rem] border border-indigo-100 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-black text-[#1E1B4B] mb-4">Scale Your Operations with PDF Bundles Premium</h2>
            <p className="text-slate-600 mb-8 leading-relaxed">When individual document limits stand in the way of your business growth, our Premium tiers are designed to lift the barriers.</p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <CheckCircle size={18} className="text-indigo-500 mt-1 shrink-0" />
                <p className="text-[15px] text-slate-700"><span className="font-bold text-slate-900">Expanded File Thresholds:</span> Upload heavier gigabyte-scale datasets and increase the number of files you can process in a single batch.</p>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle size={18} className="text-indigo-500 mt-1 shrink-0" />
                <p className="text-[15px] text-slate-700"><span className="font-bold text-slate-900">Centralized Team Management:</span> Create a shared corporate workspace. Standardize default branding actions, like automatically stamping every page in a bundle with your company logo or a custom page-numbering architecture.</p>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle size={18} className="text-indigo-500 mt-1 shrink-0" />
                <p className="text-[15px] text-slate-700"><span className="font-bold text-slate-900">Zero Distractions:</span> Enjoy an ad-free workspace and prioritized server pipelines to bypass high-traffic queue times.</p>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Features;
