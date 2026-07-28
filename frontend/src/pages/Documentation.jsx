import React from 'react';
import { BookOpen, Layers, SplitSquareHorizontal, Scissors, Minimize2, PenTool, Cloud, Monitor } from 'lucide-react';

const Documentation = () => {
  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-24 px-6 font-sans">
      <div className="max-w-[1000px] mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6">
            <span className="text-rose-500">🚀</span> Official Reference
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-[#1E1B4B] mb-4 flex items-center justify-center gap-3">
            <BookOpen size={40} className="text-[#1E1B4B]" /> Platform Documentation
          </h1>
          <p className="text-lg text-slate-500 font-medium">Welcome to the PDF Bundles User Guide</p>
          <div className="w-12 h-1 bg-indigo-600 mx-auto mt-6 rounded-full"></div>
        </div>

        {/* Intro */}
        <p className="text-slate-600 text-lg leading-relaxed mb-12">
          Our platform is designed to make multi-file document management completely effortless. While we have built our dashboard to be completely intuitive, this comprehensive documentation guide will show you exactly how to optimize, convert, and organize your document bundles at scale.
        </p>

        {/* Section 1 */}
        <h2 className="text-2xl font-black text-slate-900 mb-6">1. Organizing & Creating Bundles</h2>
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 mb-12 space-y-6">
          
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <h3 className="font-bold text-slate-900 text-lg mb-2 flex items-center gap-2">
              <span className="text-blue-500"><Layers size={20} /></span> Creating a Master Bundle (Merge PDF)
            </h3>
            <p className="text-slate-600 text-[15px] mb-4">To combine two or more files into a single, cohesive document bundle, select your target documents from your local machine.</p>
            <ul className="space-y-2 text-[14px] text-slate-600 list-disc pl-5">
              <li><strong className="text-slate-900">Custom Arrangements:</strong> Drag and drop the thumbnails to establish the exact reading order you want before compiling.</li>
              <li><strong className="text-slate-900">General Fillers:</strong> You can mix document types! Just select a combination of image files and PDFs, and our engine will smoothly integrate them into your final master document bundle.</li>
            </ul>
          </div>

          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <h3 className="font-bold text-slate-900 text-lg mb-2 flex items-center gap-2">
              <span className="text-rose-500"><SplitSquareHorizontal size={20} /></span> Extracting & Splitting Bundles
            </h3>
            <p className="text-slate-600 text-[15px] mb-4">If you have a massive master document that needs to be broken down, use our extraction engine.</p>
            <ul className="space-y-2 text-[14px] text-slate-600 list-disc pl-5">
              <li><strong className="text-slate-900">Split by Range:</strong> Define explicit page blocks (e.g., Pages 1-10, 15-20) to output separate, focused sub-bundles.</li>
              <li><strong className="text-slate-900">Total Extraction:</strong> Pull every individual page out as an independent document file. Great if you hand off smaller, single-page assets or only the selected pages into a brand new document asset.</li>
            </ul>
          </div>

          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <h3 className="font-bold text-slate-900 text-lg mb-2 flex items-center gap-2">
              <span className="text-red-500"><Scissors size={20} /></span> Bulk Page Removal & Sorting
            </h3>
            <p className="text-slate-600 text-[15px] mb-4">When uploading a vast set of documents, accidental duplicates or blank trailing pages can clutter the project.</p>
            <ul className="space-y-2 text-[14px] text-slate-600 list-disc pl-5">
              <li><strong className="text-slate-900">Visual Color Coding:</strong> When you upload multiple files into the workspace, the thumbnails from each distinct source file are outlined in matching color boundaries so you can see where one document ends and another begins.</li>
              <li><strong className="text-slate-900">One-Click Purging:</strong> Simply click on any page thumbnail to mark it for deletion. A trash icon overlay will appear, and those pages will be permanently snipped when your bundle is generated.</li>
            </ul>
          </div>

        </div>

        {/* Section 2 */}
        <h2 className="text-2xl font-black text-slate-900 mb-6">2. Optimizing & Editing Asset Sets</h2>
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 mb-12 space-y-6">
          
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <h3 className="font-bold text-slate-900 text-lg mb-2 flex items-center gap-2">
              <span className="text-indigo-500"><Minimize2 size={20} /></span> High-Performance Bundle Compression
            </h3>
            <p className="text-slate-600 text-[15px] mb-6">Heavy multi-file documents can easily fail email attachment size thresholds. Use our compression engine to scale down file sizes without sacrificing text clarity.</p>
            
            <div className="bg-white rounded-xl overflow-hidden border border-slate-200">
              <div className="grid grid-cols-4 gap-4 p-4 border-b border-slate-200 text-[11px] font-black text-slate-500 tracking-wider uppercase bg-slate-50">
                <div>Compression Level</div>
                <div>Target Use Case</div>
                <div>File Size Outcome</div>
                <div>Quality Retention</div>
              </div>
              <div className="grid grid-cols-4 gap-4 p-4 border-b border-slate-100 text-[13px] text-slate-700">
                <div className="font-bold text-slate-900">Extreme Compression</div>
                <div>Quick internal reviews, archiving</div>
                <div>Maximum reduction</div>
                <div>Low Image resolution</div>
              </div>
              <div className="grid grid-cols-4 gap-4 p-4 border-b border-slate-100 text-[13px] text-slate-700">
                <div className="font-bold text-slate-900">Recommended Optimization</div>
                <div>Client delivery, Portal uploads</div>
                <div>Balanced reduction</div>
                <div className="font-bold">High clarity (Default)</div>
              </div>
              <div className="grid grid-cols-4 gap-4 p-4 text-[13px] text-slate-700">
                <div className="font-bold text-slate-900">Low Compression</div>
                <div>High-res printing, design portfolios</div>
                <div>Minimal reduction</div>
                <div>Original pixel perfection</div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <h3 className="font-bold text-slate-900 text-lg mb-2 flex items-center gap-2">
              <span className="text-amber-500"><PenTool size={20} /></span> Watermarking & Corporate Layout Stamping
            </h3>
            <p className="text-slate-600 text-[15px] mb-4">Protect your intellectual property across entire asset sets simultaneously.</p>
            <ul className="space-y-2 text-[14px] text-slate-600 list-disc pl-5">
              <li><strong className="text-slate-900">Unified Placement:</strong> Upload a company logo or text watermark one time. Our engine stamps the watermark into the exact designated coordinates across every single sheet within the compiled bundle.</li>
              <li><strong className="text-slate-900">Mass Page-Numbering:</strong> Automatically number combined components under a continuous sequence. You can specify the typography style, size, shading, opacity, and positioning margins from the main dashboard toolbar.</li>
            </ul>
          </div>

        </div>

        {/* Section 3 */}
        <h2 className="text-2xl font-black text-slate-900 mb-6">3. Advanced Integrations & Requirements</h2>
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-blue-500 mb-4"><Cloud size={24} /></div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">Dynamic Cloud Pipelines</h3>
              <p className="text-slate-600 text-[14px] leading-relaxed mb-4">You don't need to manually download individual files to your drive, mix, process, and upload again.</p>
              <p className="text-slate-600 text-[14px] leading-relaxed">Direct Cloud Links: Import from Google Drive or Dropbox. Processing occurs entirely on our high-speed remote servers to save local bandwidth.</p>
            </div>
            
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-slate-700 mb-4"><Monitor size={24} /></div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">System & Browser Requirements</h3>
              <p className="text-slate-600 text-[14px] leading-relaxed mb-4">To maintain rapid rendering and flawless dashboard drag-and-drop actions, we strictly update our environments.</p>
              <p className="text-slate-600 text-[14px] leading-relaxed">Supported Browsers: Google Chrome, Mozilla Firefox, Apple Safari, or Microsoft Edge (latest versions) with JavaScript enabled.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Documentation;
