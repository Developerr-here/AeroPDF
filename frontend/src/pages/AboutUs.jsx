import React from 'react';
import { Users, Zap, Shield, Globe, Handshake } from 'lucide-react';

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-24 px-6 font-sans">
      <div className="max-w-[1000px] mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6">
            <span className="text-rose-500">🚀</span> Official Reference
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-[#1E1B4B] mb-4 flex items-center justify-center gap-3">
            <Users size={40} className="text-[#1E1B4B]" /> About Us
          </h1>
          <p className="text-lg text-slate-500 font-medium">Our Mission & Global Vision</p>
          <div className="w-12 h-1 bg-indigo-600 mx-auto mt-6 rounded-full"></div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-slate-100">
          {/* Intro */}
          <p className="text-slate-700 text-[16px] leading-relaxed mb-4">
            At PDF Bundles, we believe that true productivity doesn't come from handling documents faster—it comes from handling them collectively.
          </p>
          <p className="text-slate-600 text-[14px] leading-relaxed mb-12">
            Every day, millions of professionals waste valuable hours manually opening, organizing, converting, and saving individual files one by one. We engineered PDF Bundles to eliminate this operational friction. Our platform reimagines document management by introducing a high-performance, batch-focused workspace where complex multi-file collections are transformed into streamlined, professional document sets instantly.
          </p>

          {/* Core Values */}
          <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
            <span className="text-2xl">📊</span> The Core Values That Drive Us
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center">
              <h3 className="font-bold text-slate-900 text-[16px] mb-2">Batch Innovation</h3>
              <p className="text-slate-600 text-[13px] leading-relaxed">Built for multi-file automation at scale.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center">
              <h3 className="font-bold text-blue-600 text-[16px] mb-2">Data Security First</h3>
              <p className="text-slate-600 text-[13px] leading-relaxed">Strict 2-hour server data-purging protocols.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center">
              <h3 className="font-bold text-emerald-600 text-[16px] mb-2">Frictionless Design</h3>
              <p className="text-slate-600 text-[13px] leading-relaxed">Zero complex training; just drag, drop & bundle.</p>
            </div>
          </div>

          {/* Engineered for modern workflow */}
          <h2 className="text-xl font-black text-slate-900 mb-8 border-b border-slate-100 pb-4">
            Engineered for the Modern Global Workflow
          </h2>

          <div className="space-y-8 mb-12">
            <div>
              <h3 className="font-bold text-slate-900 text-[16px] mb-2 flex items-center gap-2">
                <Zap className="text-amber-500" size={18} /> True Multi-File Batch Performance
              </h3>
              <p className="text-slate-600 text-[14px] leading-relaxed pl-6">
                Unlike conventional platforms built around individual file modifications, our infrastructure is native to batch processing. Whether you are merging hundreds of invoices, extracting targeted reporting blocks, or converting vast presentation decks, our system utilizes distributed cloud processing to manage intense data payloads simultaneously without lagging your browser.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-[16px] mb-2 flex items-center gap-2">
                <Shield className="text-blue-500" size={18} /> Absolute Privacy by Design
              </h3>
              <p className="text-slate-600 text-[14px] leading-relaxed pl-6">
                We respect the confidentiality of your corporate records. PDF Bundles operates under a strict data-ephemerality framework. Your uploaded assets are completely isolated during processing and are permanently wiped from our server arrays exactly two hours after your task is completed. We never inspect, store, or sell your contents, and your documents are never used to train artificial intelligence models.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-[16px] mb-2 flex items-center gap-2">
                <Globe className="text-indigo-400" size={18} /> Our Global Footprint
              </h3>
              <p className="text-slate-600 text-[14px] leading-relaxed pl-6">
                From small creative agencies optimizing client portfolios to multi-national corporations processing thousands of daily shipping records, PDF Bundles is trusted by professionals worldwide. Our compliance frameworks match rigorous global data-handling principles, including GDPR standards, ensuring that your compliance teams can clear our application for everyday company workflows.
              </p>
            </div>
          </div>

          {/* Contact Block */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="text-amber-500 text-xl">🤝</span> Connect With Our Team
            </h3>
            <p className="text-slate-600 text-[14px] leading-relaxed mb-6">
              We are constantly expanding our tool suites, scaling our server pipelines, and rolling out new features to stay ahead of your document workflow needs. If you are interested in enterprise deployment, strategic partnerships, or custom workflow configurations, we invite you to start a conversation:
            </p>
            <ul className="space-y-3 pl-2">
              <li className="flex items-center gap-2 text-[14px]">
                <span className="text-slate-400">🌐</span>
                <span className="text-slate-600">General Inquiries:</span>
                <a href="mailto:hello@pdfbundles.com" className="font-bold text-blue-600 hover:underline">hello@pdfbundles.com</a>
              </li>
              <li className="flex items-center gap-2 text-[14px]">
                <span className="text-slate-400">💼</span>
                <span className="text-slate-600">Enterprise & Partnerships:</span>
                <a href="mailto:corporate@pdfbundles.com" className="font-bold text-blue-600 hover:underline">corporate@pdfbundles.com</a>
              </li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AboutUs;
