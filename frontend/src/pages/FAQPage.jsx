import React from 'react';
import { Shield, Zap, Wrench } from 'lucide-react';

const FAQPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-24 px-6 font-sans">
      <div className="max-w-[1000px] mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6">
            <span className="text-rose-500">🚀</span> Official Reference
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-[#1E1B4B] mb-4 flex items-center justify-center gap-3">
            <span className="text-slate-900">?</span> FAQ
          </h1>
          <p className="text-lg text-slate-500 font-medium">Frequently Asked Questions</p>
          <div className="w-12 h-1 bg-indigo-600 mx-auto mt-6 rounded-full"></div>
        </div>

        {/* Intro */}
        <p className="text-slate-600 text-[15px] leading-relaxed mb-12 text-center max-w-3xl mx-auto">
          Have a question about managing your document batches? Explore our frequently asked questions below to see how PDF Bundles streamlines high-volume workflows safely and efficiently.
        </p>

        {/* Section 1 */}
        <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 pl-4 border-l-4 border-blue-500">
          <Shield className="text-blue-500" size={24} /> Security & Privacy
        </h2>
        
        <div className="space-y-4 mb-12">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 text-[16px] mb-3">Do you keep a copy of my processed document bundles?</h3>
            <p className="text-slate-600 text-[14px] leading-relaxed mb-3">
              Absolutely not. Your documents belong exclusively to you. While your files are processing on our high-speed architecture, they are deeply isolated and locked. We temporarily hold the compiled bundles for a maximum of two hours so you have plenty of time to download them. After that window closes, they are permanently and completely wiped from our storage servers forever.
            </p>
            <p className="text-slate-500 text-[13px] italic">
              Pro Tip: If you want them gone immediately, you can manually click the "Delete Instantly" icon on the download page to purge them right away. We never inspect, copy, or read your files.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 text-[16px] mb-3">Are our sensitive corporate files safe with your service?</h3>
            <p className="text-slate-600 text-[14px] leading-relaxed">
              Yes. Every single upload and download pipeline uses encrypted HTTPS/SSL protocols alongside rigid end-to-end encryption. These workflows are architected to satisfy strict corporate data privacy policies. We continuously align our data storage mechanics with global data compliance standards (including GDPR compliance) to ensure enterprise-level document protection.
            </p>
          </div>
        </div>

        {/* Section 2 */}
        <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 pl-4 border-l-4 border-amber-500">
          <Zap className="text-amber-500" size={24} /> Batch Processing & Workflows
        </h2>

        <div className="space-y-4 mb-12">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 text-[16px] mb-3">How many files can I compile into a single bundle?</h3>
            <p className="text-slate-600 text-[14px] leading-relaxed">
              Free accounts can effortlessly batch up to 20 files at a time. If your workflow demands heavier document compiling, upgrading to a PDF Bundles Premium account removes these restrictions, allowing you to merge hundreds of high-res files into large master bundles simultaneously.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 text-[16px] mb-3">Can I import documents and save bundles straight to the cloud?</h3>
            <p className="text-slate-600 text-[14px] leading-relaxed">
              Yes. You don't even need the source documents saved locally on the machine or mobile device you are working from. Our dashboard connects smoothly with Google Drive and Dropbox. You can fetch files directly from your shared team folders, compile them on our remote servers, and route the finished master bundle straight back to your cloud architecture. This is a massive data saver when working on phones or tablets.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 text-[16px] mb-3">Can I convert non-selectable, scanned documents into a searchable bundle?</h3>
            <p className="text-slate-600 text-[14px] leading-relaxed">
              Yes. Our backend engine runs an advanced OCR (Optical Character Recognition) process. When you build a bundle using flat images or scanned paper records, our system isolates the text layers, transforming raw image scans into fully searchable, interactive, and editable PDF document sets.
            </p>
          </div>
        </div>

        {/* Section 3 */}
        <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 pl-4 border-l-4 border-emerald-500">
          <Wrench className="text-emerald-500" size={24} /> Troubleshooting & Technical Issues
        </h2>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 text-[16px] mb-3">Why is my bundle processing taking a long time?</h3>
            <p className="text-slate-600 text-[14px] leading-relaxed mb-4">
              While our core engines are optimized for high-volume data streams, overall turnaround time comes down to three factors.
            </p>
            <ul className="space-y-2 text-[14px] text-slate-600 list-disc pl-5">
              <li><strong className="text-slate-900">Your internet connection:</strong> Uploading massive batches of uncompressed data depends heavily on your local upload speeds.</li>
              <li><strong className="text-slate-900">Total payload size:</strong> Compiling dozens of complex graphics-heavy pages requires slightly more crunching time.</li>
              <li><strong className="text-slate-900">Current server traffic volume:</strong> Premium users get designated VIP fast-track pipelines to completely bypass general high-traffic queues.</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 text-[16px] mb-3">What are the minimum system requirements to run PDF Bundles?</h3>
            <p className="text-slate-600 text-[14px] leading-relaxed">
              We keep things incredibly lean. To enjoy smooth, latency-free drag-and-drop mechanics, we recommend using the latest stable versions of Google Chrome, Mozilla Firefox, Apple Safari, or Microsoft Edge. Make sure JavaScript is fully enabled in your browser settings. If you ever hit an unexpected render glitch on a download screen, switching your browser window to Incognito / Private Mode usually resolves it instantly by bypassing cached layout files.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FAQPage;
