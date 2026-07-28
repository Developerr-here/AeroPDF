import React from 'react';
import { Shield, Lock, Globe, Cookie } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-24 px-6 font-sans">
      <div className="max-w-[1000px] mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6">
            <span className="text-rose-500">🚀</span> Official Reference
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-[#1E1B4B] mb-4 flex items-center justify-center gap-3">
            <Shield size={40} className="text-[#1E1B4B]" /> Privacy Policy
          </h1>
          <p className="text-lg text-slate-500 font-medium">Your Privacy is Our Foundation</p>
          <div className="w-12 h-1 bg-indigo-600 mx-auto mt-6 rounded-full"></div>
        </div>

        {/* Intro */}
        <p className="text-slate-600 text-[15px] leading-relaxed mb-12 text-center max-w-4xl mx-auto">
          At PDF Bundles, we believe that data privacy isn't just a legal obligation—it is a core feature of our business model. When you upload multi-file document sets to organize, compress, or convert, your files remain completely yours. We never read, monetize, or share your documents beyond the baseline processing window.
        </p>

        {/* Table */}
        <h2 className="text-xl font-black text-slate-900 mb-6">The PDF Bundles Privacy Guarantee</h2>
        <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm mb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 border-b border-slate-200 text-[11px] font-black text-slate-500 tracking-wider uppercase bg-slate-50">
            <div className="col-span-1">Data Type</div>
            <div className="col-span-2">How We Handle It</div>
            <div className="col-span-1">Retention Period</div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 border-b border-slate-100 items-center">
            <div className="col-span-1 font-bold text-slate-900 text-[14px]">Your Uploaded Files</div>
            <div className="col-span-2 text-slate-600 text-[13px] leading-relaxed">Strictly isolated in encrypted, single-user sandbox environments.</div>
            <div className="col-span-1 font-bold text-rose-500 text-[13px]">2 Hours (Then permanently purged)</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 border-b border-slate-100 items-center">
            <div className="col-span-1 font-bold text-slate-900 text-[14px]">Account Information</div>
            <div className="col-span-2 text-slate-600 text-[13px] leading-relaxed">Standard credentials encrypted and stored securely within our database.</div>
            <div className="col-span-1 font-bold text-blue-600 text-[13px]">Active Account Lifecycle</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 border-b border-slate-100 items-center">
            <div className="col-span-1 font-bold text-slate-900 text-[14px]">Payment Data</div>
            <div className="col-span-2 text-slate-600 text-[13px] leading-relaxed">Processed through secure PCI-DSS compliant payment gateways.</div>
            <div className="col-span-1 font-bold text-blue-600 text-[13px]">Never stored on our servers</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 items-center">
            <div className="col-span-1 font-bold text-slate-900 text-[14px]">Anonymized Analytics</div>
            <div className="col-span-2 text-slate-600 text-[13px] leading-relaxed">Aggregate platform traffic data used to optimize server loads.</div>
            <div className="col-span-1 font-bold text-blue-600 text-[13px]">Rolling Analytics Cycles</div>
          </div>
        </div>

        {/* Processing Section */}
        <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 pl-4 border-l-4 border-amber-500">
          <Lock className="text-amber-500" size={24} /> Document Processing & Ephemeral Data Control
        </h2>
        
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 mb-12">
          <h3 className="font-bold text-slate-900 text-[16px] mb-3">Complete Automated File Purging</h3>
          <p className="text-slate-600 text-[14px] leading-relaxed mb-4">
            When you upload folders of contracts, financial charts, or image files to create a unified asset bundle, those documents are held inside a highly locked server container.
          </p>
          <ul className="space-y-3 text-[14px] text-slate-600 list-disc pl-5 mb-8">
            <li><strong className="text-slate-900">The Two-Hour Rule:</strong> The absolute second your document bundle is generated, an automated clock begins ticking. After exactly two hours, every piece of source components is permanently deleted—and the compiled master document is unrecoverably purged from our storage arrays.</li>
            <li><strong className="text-slate-900">On-Demand Immediate Deletion:</strong> If you don't want to wait two hours, simply click the "Delete Instantly" trash icon on your download dashboard. This forces our system to bypass the timer and securely wipe the project data instantly.</li>
          </ul>

          <h3 className="font-bold text-slate-900 text-[16px] mb-3">Zero Document Mining & Content Snooping</h3>
          <p className="text-slate-600 text-[14px] leading-relaxed">
            We maintain a strict stance against automated data farming. PDF Bundles does not scan, read, copy, or index the underlying text, metadata, or images contained within your documents. Furthermore, we explicitly guarantee that none of your uploaded information or document datasets are ever used to train public or private Artificial Intelligence (AI) models.
          </p>
        </div>

        {/* GDPR Section */}
        <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 pl-4 border-l-4 border-blue-500">
          <span className="font-black text-slate-400">EU</span> Global Data Compliance & GDPR Alignment
        </h2>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 mb-12">
          <p className="text-slate-600 text-[14px] leading-relaxed mb-4">
            We recognize that our users operate within strict legal boundaries. PDF Bundles actively designs its data collection and storage pipelines to reflect leading global standards:
          </p>
          <ul className="space-y-3 text-[14px] text-slate-600 list-disc pl-5">
            <li><strong className="text-slate-900">General Data Protection Regulation (GDPR):</strong> We protect the fundamental right to data privacy for individuals within the European Economic Area (EEA), upholding the rights of data access, rectification, and the right to be forgotten.</li>
            <li><strong className="text-slate-900">Data Transfers:</strong> All traffic/information or processing routes throughout encrypted SSL channels, locking independent man-in-the-middle network attacks.</li>
          </ul>
        </div>

        {/* Cookies Section */}
        <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 pl-4 border-l-4 border-orange-400">
          <span className="text-orange-400 text-2xl">🍪</span> Website Usage & Analytical Cookies
        </h2>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 mb-12">
          <p className="text-slate-600 text-[14px] leading-relaxed mb-4">
            To keep our dashboard operating smoothly, optimize processing speeds during peak hours, and keep your session authenticated, we utilize basic web cookies.
          </p>
          <ul className="space-y-3 text-[14px] text-slate-600 list-disc pl-5">
            <li><strong className="text-slate-900">Essential Cookies:</strong> Strictly necessary to remember your user account/cart details, and sub-option levels as you move through our tools.</li>
            <li><strong className="text-slate-900">Analytical Optimization:</strong> We use anonymized behavioral tools to monitor macro-performance metrics (like general processing success rates and load latency times). This allows us to scale server capacity globally.</li>
          </ul>

          <div className="mt-8 bg-slate-50 border border-slate-100 rounded-xl p-6">
            <h3 className="font-bold text-slate-900 text-[15px] mb-3 flex items-center gap-2">
              <span className="text-slate-400">💭</span> Contact Our Privacy Officer
            </h3>
            <p className="text-slate-600 text-[14px] leading-relaxed mb-4">
              If you represent an enterprise team, a legal firm, or an organization with strict data protection addendums (DPAs), our team is here to help. For comprehensive compliance documentation or targeted privacy inquiries, reach out to us at:
            </p>
            <p className="text-[14px]">
              <span className="text-slate-400">📧</span> <strong className="text-slate-900">Email Desk:</strong> <a href="mailto:privacy@pdfbundles.com" className="font-bold text-blue-600 hover:underline">privacy@pdfbundles.com</a>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PrivacyPolicy;
