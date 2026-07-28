import React from 'react';
import { ShieldCheck, Lock, Building, HeartHandshake } from 'lucide-react';

const Security = () => {
  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-24 px-6 font-sans">
      <div className="max-w-[1000px] mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6">
            <span className="text-rose-500">🚀</span> Official Reference
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-[#1E1B4B] mb-4 flex items-center justify-center gap-3">
            <ShieldCheck size={40} className="text-[#1E1B4B]" /> Security & Compliance
          </h1>
          <p className="text-lg text-slate-500 font-medium">Enterprise-Grade Security for Your Document Bundles</p>
          <div className="w-12 h-1 bg-indigo-600 mx-auto mt-6 rounded-full"></div>
        </div>

        {/* Intro */}
        <p className="text-slate-600 text-lg leading-relaxed mb-12 text-center max-w-4xl mx-auto">
          At PDF Bundles, the confidentiality, integrity, and availability of your business records are our absolute priorities. Whether your team compiles thousands of client records or automates internal operational folders, our cloud architecture is built to provide maximum protection at every stage of the document lifecycle.
        </p>

        {/* Architecture Section */}
        <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
          <Lock className="text-amber-500" size={28} /> Document Security Architecture
        </h2>
        
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 mb-12 space-y-6">
          
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <h3 className="font-bold text-slate-900 text-lg mb-2">1. Advanced In-Transit & At-Rest Encryption</h3>
            <p className="text-slate-600 text-[15px] mb-4">No matter which compilation or optimization tool you use, your files are protected by banking-grade security protocols.</p>
            <ul className="space-y-3 text-[14px] text-slate-600 list-disc pl-5">
              <li><strong className="text-slate-900">In Transit:</strong> All communications between your local browser and our processing nodes are strictly forced over Hypertext Transfer Protocol Secure (HTTPS). This traffic is fortified via Transport Layer Security (TLS/SSL) encryption, rendering intercepted packet data completely illegible.</li>
              <li><strong className="text-slate-900">At Rest:</strong> During the brief window your files sit on our processing servers, they are completely isolated inside single-user sandboxes, preventing cross-tenant data leaks.</li>
            </ul>
          </div>

          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <h3 className="font-bold text-slate-900 text-lg mb-2">2. Strict Two-Hour Purge Mandate</h3>
            <p className="text-slate-600 text-[15px] mb-4">We do not archive, index, or sell your business content. We maintain a zero-retention philosophy for standard workflows.</p>
            <ul className="space-y-3 text-[14px] text-slate-600 list-disc pl-5">
              <li><strong className="text-slate-900">Automated Erasure:</strong> Within exactly two hours of processing your document batch, our system executes a permanent server-side wipe of both source documents and the compiled bundle.</li>
              <li><strong className="text-slate-900">Instant Manual Deletion:</strong> Want it gone immediately? You don't have to wait for the automated script. Simply click the trash icon on your download dashboard to execute a real-time shredding command.</li>
            </ul>
          </div>

          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <h3 className="font-bold text-slate-900 text-lg mb-2">3. Long-Term Integrity (eIDAS & PDF/A)</h3>
            <p className="text-slate-600 text-[15px] mb-4">When building sensitive legal or corporate bundles:</p>
            <ul className="space-y-2 text-[14px] text-slate-600 list-disc pl-5">
              <li><strong className="text-slate-900">Long-Term Preservation:</strong> Convert document bundles to PDF/A standards to guarantee long-term archiving stability, keeping structural fonts and elements intact for decades without file degradation.</li>
            </ul>
          </div>

        </div>

        {/* Compliance Section */}
        <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
          <Building className="text-blue-500" size={28} /> Internal Operations & Compliance Standards
        </h2>

        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 mb-12">
          <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 border-b border-slate-200 text-[11px] font-black text-slate-500 tracking-wider uppercase">
              <div className="col-span-1">Security Category</div>
              <div className="col-span-1">Protocol Implemented</div>
              <div className="col-span-2">Business Advantage</div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 border-b border-slate-100 items-center">
              <div className="col-span-1 font-bold text-slate-900 text-[14px]">Data Privacy</div>
              <div className="col-span-1 text-slate-600 text-[13px]">Full GDPR Alignment</div>
              <div className="col-span-2 text-slate-600 text-[13px] leading-relaxed">Protects EU user data and respects fundamental user erasure/privacy rights globally.</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 border-b border-slate-100 items-center">
              <div className="col-span-1 font-bold text-slate-900 text-[14px]">Infrastructure Protection</div>
              <div className="col-span-1 text-slate-600 text-[13px]">DDoS Shielding & Global Content Delivery Networks (CDN)</div>
              <div className="col-span-2 text-slate-600 text-[13px] leading-relaxed">Guarantees high-speed multi-file uploads while maintaining resilient uptime against malicious attacks.</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 border-b border-slate-100 items-center">
              <div className="col-span-1 font-bold text-slate-900 text-[14px]">Access Controls</div>
              <div className="col-span-1 text-slate-600 text-[13px]">Principle of Least Privilege & Mandatory 2FA</div>
              <div className="col-span-2 text-slate-600 text-[13px] leading-relaxed">Restricts infrastructure system visibility exclusively to verified operational nodes.</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 items-center">
              <div className="col-span-1 font-bold text-slate-900 text-[14px]">Account Defense</div>
              <div className="col-span-1 text-slate-600 text-[13px]">90-Day Forced Password Rotation</div>
              <div className="col-span-2 text-slate-600 text-[13px] leading-relaxed">Limits the window of risk for credential stuffing or brute-force profile attacks.</div>
            </div>
          </div>
        </div>

        {/* Promise Box */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-[2rem] p-8 md:p-10 mb-12">
          <h3 className="text-xl font-bold text-emerald-900 mb-4 flex items-center gap-2">
            <span className="text-amber-500">🤝</span> Our Promise to Teams & Developers
          </h3>
          <p className="text-emerald-800 text-[15px] leading-relaxed">
            PDF Bundles explicitly guarantees that your processed text, image assets, and metadata are never accessed, reviewed, or used to train public or private Artificial Intelligence (AI) models. Your business data remains exclusively yours.
          </p>
        </div>

      </div>
    </div>
  );
};

export default Security;
