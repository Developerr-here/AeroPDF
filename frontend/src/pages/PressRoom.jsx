import React from 'react';
import { Newspaper, BookOpen, Megaphone } from 'lucide-react';

const PressRoom = () => {
  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-24 px-6 font-sans">
      <div className="max-w-[1000px] mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6">
            <span className="text-rose-500">🚀</span> Official Reference
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-[#1E1B4B] mb-4 flex items-center justify-center gap-3">
            <Newspaper size={40} className="text-[#1E1B4B]" /> Press Room
          </h1>
          <p className="text-lg text-slate-500 font-medium">Official Brand Assets & Press Materials</p>
          <div className="w-12 h-1 bg-indigo-600 mx-auto mt-6 rounded-full"></div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-slate-100 mb-12">
          {/* Intro */}
          <p className="text-slate-600 text-[15px] leading-relaxed mb-6">
            We are on a mission to end the friction of fragmented document management. PDF Bundles empowers global enterprises, small businesses, and digital agencies to scale their workflows through advanced batch processing, high-fidelity conversions, and multi-file automation.
          </p>
          <p className="text-slate-400 text-[15px] mb-12">
            Discover our brand journey, grab certified media resources, or connect directly with our communications team.
          </p>

          {/* Story Table */}
          <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
            <span className="text-2xl">📊</span> The PDF Bundles Story at a Glance
          </h2>
          <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 mb-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 border-b border-slate-200 text-[11px] font-black text-slate-500 tracking-wider uppercase">
              <div className="col-span-1">Company Metric</div>
              <div className="col-span-2">Our Core Philosophy</div>
              <div className="col-span-1">Impact Horizon</div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 border-b border-slate-100 items-start">
              <div className="col-span-1 font-bold text-slate-900 text-[14px]">The Core Problem</div>
              <div className="col-span-2 text-slate-600 text-[13px] leading-relaxed">Teams lose hours managing individual, fragmented business documents one by one.</div>
              <div className="col-span-1 font-bold text-blue-600 text-[13px]">Operational Bottlenecks</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 border-b border-slate-100 items-start">
              <div className="col-span-1 font-bold text-slate-900 text-[14px]">Our Solution</div>
              <div className="col-span-2 text-slate-600 text-[13px] leading-relaxed">A unified, fast dashboard built to compile, optimize, and manage multi-file document sets instantly.</div>
              <div className="col-span-1 font-bold text-blue-600 text-[13px]">Seamless Batch Workflows</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 items-start">
              <div className="col-span-1 font-bold text-slate-900 text-[14px]">Target Audience</div>
              <div className="col-span-2 text-slate-600 text-[13px] leading-relaxed">Legal firms, enterprise operations, creative agencies, and digital store owners.</div>
              <div className="col-span-1 font-bold text-blue-600 text-[13px]">Scalable B2B Document SaaS</div>
            </div>
          </div>

          {/* About PDF Bundles */}
          <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
            <span className="text-2xl">📰</span> Official Brand Assets & Press Materials
          </h2>
          <h3 className="font-bold text-slate-900 text-[16px] mb-3">About PDF Bundles</h3>
          <p className="text-slate-600 text-[14px] leading-relaxed mb-6">
            PDF Bundles is a web-based productivity application built to handle the complexities of high-volume document batch management. Launched to rescue teams from tedious, single-file processing, our software automates the aggregation, compression, conversion, and encryption of massive multi-file datasets. By moving away from rigid, isolated file utility setups, PDF Bundles delivers high-performance processing capabilities that integrate with modern cloud infrastructure like Google Drive and Dropbox.
          </p>
          
          <div className="bg-slate-50 border-l-4 border-indigo-500 p-6 rounded-r-2xl mb-12">
            <p className="text-slate-700 italic font-medium text-[15px] leading-relaxed">
              "The future of business efficiency isn't about handling documents faster—it's about handling them collectively. PDF Bundles changes the dynamic from tedious individual management to fluid, automated workspace aggregation."
            </p>
          </div>

          {/* Contact Block */}
          <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Megaphone className="text-blue-500" size={20} /> Media & Public Relations Contact
            </h3>
            <p className="text-slate-600 text-[14px] leading-relaxed mb-4">
              Are you a journalist, tech reviewer, or industry analyst covering the evolving landscape of digital workplace productivity and SaaS tools? We would love to collaborate.
            </p>
            <p className="text-slate-600 text-[14px] leading-relaxed mb-6">
              For interview requests, product deep-dives, exclusive insights, or custom review credentials, reach out straight to our media relations team:
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-[14px]">
                <span className="text-slate-400">✉️</span>
                <span className="font-bold text-slate-900">Press Inquiries:</span>
                <a href="mailto:press@pdfbundles.com" className="font-bold text-blue-600 hover:underline">press@pdfbundles.com</a>
              </li>
              <li className="flex items-center gap-2 text-[14px]">
                <span className="text-slate-400">⏱️</span>
                <span className="text-slate-500">Response Window: Our communications desk typically responds to verified media queries within 24 business hours.</span>
              </li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PressRoom;
