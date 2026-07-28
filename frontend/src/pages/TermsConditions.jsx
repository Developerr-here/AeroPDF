import React from 'react';
import { FileText, AlertTriangle } from 'lucide-react';

const TermsConditions = () => {
  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-24 px-6 font-sans">
      <div className="max-w-[900px] mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6">
            <span className="text-rose-500">🚀</span> Official Reference
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-[#1E1B4B] mb-4 flex items-center justify-center gap-3">
            <FileText size={40} className="text-[#1E1B4B]" /> Terms & Conditions
          </h1>
          <p className="text-lg text-slate-500 font-medium">PDF Bundles Terms of Service</p>
          <div className="w-12 h-1 bg-indigo-600 mx-auto mt-6 rounded-full"></div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-sm border border-slate-100">
          <p className="text-slate-400 text-[12px] font-bold tracking-wider uppercase mb-6">LAST UPDATED: JULY 9, 2026</p>
          
          <p className="text-slate-600 text-[14px] leading-relaxed mb-4">
            Welcome to PDF Bundles. Please read these Terms of Service ("Terms", "Agreement") carefully before using our website located at https://pdfbundles.com/ and any associated subdomains, web applications, or digital tools (collectively, the "Service") operated by PDF Bundles ("Company", "we", "us", "our").
          </p>
          <p className="text-slate-600 text-[14px] leading-relaxed mb-10">
            By accessing or using our Service to upload, convert, merge, compress, or otherwise manipulate multi-file document sets ("Bundles"), you explicitly agree to be bound by these internationally standardized terms. If you do not agree to any portion of this agreement, you must immediately halt all use of our services.
          </p>

          <div className="space-y-8">
            {/* Section 1 */}
            <div>
              <h2 className="text-[17px] font-bold text-slate-900 mb-3">1. Description of Service & Core Scope</h2>
              <p className="text-slate-600 text-[14px] leading-relaxed mb-3">
                PDF Bundles is a document utility web-based deployment optimized for handling multi-file workflows. Our systemic tools are utilized to benefit clients including, but not limited to, combining multiple independent files into a unified master document, splitting volumes datasets, optimizing file payloads for transmittal, converting file formats, and executing bulk document security measures.
              </p>
              <p className="text-slate-600 text-[14px] leading-relaxed">
                We grant you a non-exclusive, non-transferable, revocable license to access our platform strictly in accordance with these terms. We reserve the right to modify, suspend, or discontinue any aspect of our tools or dashboard capacities at any time without prior liability.
              </p>
            </div>

            {/* Section 2 */}
            <div>
              <h2 className="text-[17px] font-bold text-slate-900 mb-3">2. User Accounts, Responsibilities, and Identity</h2>
              <p className="text-slate-600 text-[14px] leading-relaxed mb-3">
                <strong className="text-slate-900">2.1 Account Creation and Security:</strong> To unlock advanced multi-file parameters, increased file size thresholds, and shared team assets, you may be required to register a premium corporate or personal account. You agree to provide accurate, current, and complete data in during registration. You bear sole responsibility for safeguarding your login credentials and for any action taken under your identity.
              </p>
              <p className="text-slate-600 text-[14px] leading-relaxed">
                <strong className="text-slate-900">2.2 Prohibited Content and Misuse:</strong> You assume full sole responsibility for all documents, text, images, and sheets uploaded to our servers. You explicitly command that your action to not upload documents that infringes upon third-party IP rights, contains malware or exploits, promotes fraud, or violates local, national, or international privacy laws.
              </p>
            </div>

            {/* Section 3 */}
            <div>
              <h2 className="text-[17px] font-bold text-slate-900 mb-3">3. Data Processing, File Ownership, and The Two-Hour Rule</h2>
              <p className="text-slate-600 text-[14px] leading-relaxed mb-3">
                <strong className="text-slate-900">3.1 Your Intellectual Property Protection:</strong> PDF Bundles lays no claim, title, or interest to the contents of the files you process. We do not extract, read, open, index, or parse text layers within your document sets, except where automated systems must calculate baseline operations (e.g., performing requested OCR layers or applying page numbers).
              </p>
              <p className="text-slate-600 text-[14px] leading-relaxed mb-6">
                <strong className="text-slate-900">3.2 Automated Server Scrubbing Protocol:</strong> To preserve absolute privacy and guarantee requirement security, our platform operates on a strict ephemeral model:
              </p>

              {/* Flowchart visual */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-8 mb-6 font-mono text-[12px] md:text-[13px] text-slate-600 flex flex-col items-center justify-center">
                <div className="px-4 py-2 border border-slate-300 rounded-md bg-white shadow-sm">[ User Uploads Source Files ]</div>
                <div className="h-6 w-[1px] bg-slate-300 my-1 relative"><div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 border-r border-b border-slate-300 rotate-45"></div></div>
                
                <div className="px-4 py-2 border border-slate-300 rounded-md bg-white shadow-sm">[ Project Generated in Bundle Output ]</div>
                <div className="h-6 w-[1px] bg-slate-300 my-1 relative"><div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 border-r border-b border-slate-300 rotate-45"></div></div>
                
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full justify-center">
                  <div className="px-4 py-2 border border-slate-300 rounded-md bg-white shadow-sm whitespace-nowrap">[ 2-Hour Countdown Timer Triggers ]</div>
                  <div className="hidden sm:block w-8 h-[1px] bg-slate-300 relative"><div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 border-t border-r border-slate-300 rotate-45"></div></div>
                  <div className="sm:hidden h-6 w-[1px] bg-slate-300 my-1 relative"><div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 border-r border-b border-slate-300 rotate-45"></div></div>
                  <div className="px-4 py-2 border border-slate-300 rounded-md bg-white shadow-sm whitespace-nowrap">[ Permanent, Unrecoverable Deletion ]</div>
                </div>
              </div>

              <p className="text-slate-600 text-[14px] leading-relaxed">
                Once your processing concludes, our architecture caches the completed bundle on secure, isolated scratch disks for exactly two (2) hours to facilitate a valid download. Upon expiry of this window, our automated file scrubbers execute a permanent deletion sweep. Expired files are unrecoverable.
              </p>
            </div>

            {/* Section 4 */}
            <div>
              <h2 className="text-[17px] font-bold text-slate-900 mb-3">4. Subscription Fees, Cancellations, and Refunds</h2>
              <p className="text-slate-600 text-[14px] leading-relaxed mb-3">
                <strong className="text-slate-900">4.1 Subscription Billing Mechanics:</strong> Access to basic tools is free within certain file limits. Extended tiers require recurring monthly or annual payments. By selecting a Premium or Enterprise package, you authorize our third-party, PCI-DSS compliant billing gateways to process recurring transaction amounts.
              </p>
              <p className="text-slate-600 text-[14px] leading-relaxed mb-3">
                <strong className="text-slate-900">4.2 Cancellation Policy:</strong> You are free to cancel your software/subscription plan at any time directly through your dashboard billing profile. Your access will remain un-restricted upon expiration date until the conclusion of your current paid billing round.
              </p>
              <p className="text-slate-600 text-[14px] leading-relaxed">
                <strong className="text-slate-900">4.3 Refund Exceptions:</strong> Given the digital nature of immediate server capacity allocation, fees paid to PDF Bundles are generally non-refundable. Exceptions are evaluated strictly on a case-by-case basis if our automated engine experiences a systemic web infrastructure failure.
              </p>
            </div>

            {/* Section 5 - Warning Box */}
            <div className="bg-orange-50/50 border border-orange-200/60 rounded-2xl p-8 border-dashed">
              <h2 className="text-[17px] font-bold text-orange-600 mb-4 flex items-center gap-2">
                <AlertTriangle size={20} /> Limitation of Liability and Warranties
              </h2>
              <p className="text-slate-700 text-[13px] leading-relaxed mb-4">
                <strong className="text-slate-900">International Legal Disclaimer:</strong> PDF Bundles is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express or implied. We do not guarantee that our services will operate completely uninterrupted, error-free, or that your source document sets will match arbitrary layout standards across all external document readers.
              </p>
              <p className="text-slate-700 text-[13px] leading-relaxed">
                In no event shall PDF Bundles, its parent corporations, founders, directors, employees, or tech partners be held liable for any indirect, incidental, special, consequential, or punitive damages - including without limitation loss of business profit, data corruption, operational downtime, or financial setbacks resulting from your access inability to use our platform.
              </p>
            </div>

            {/* Section 6 */}
            <div>
              <h2 className="text-[17px] font-bold text-slate-900 mb-3">6. Global Compliance, Indemnification, and Governing Law</h2>
              <p className="text-slate-600 text-[14px] leading-relaxed mb-3">
                <strong className="text-slate-900">6.1 User Indemnification:</strong> You agree to defend, indemnify, and hold harmless PDF Bundles and its licensees from and against any claims, damages, liability, losses, costs, and debt arising directly from your violation of these Terms or the unlawful nature of the document materials you upload.
              </p>
              <p className="text-slate-600 text-[14px] leading-relaxed">
                <strong className="text-slate-900">6.2 Governing Jurisdiction:</strong> These terms shall be interpreted, governed, and construed in accordance with standard international electronic commerce frameworks and prevailing commercial laws.
              </p>
            </div>

            {/* Section 7 */}
            <div>
              <h2 className="text-[17px] font-bold text-slate-900 mb-3">7. Revisions to This Agreement</h2>
              <p className="text-slate-600 text-[14px] leading-relaxed">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. For material modifications, we will make reasonable efforts to provide at least 30 days notice prior to any new terms taking effect. Continued use of our tools after revisions go live constitutes binding acceptance of the updated terms.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;
