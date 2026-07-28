import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    { q: "Will my images look blurry?", a: "No, our algorithms are designed to maintain the highest quality while processing your files." },
    { q: "Can I compress scanned PDFs?", a: "Yes, our advanced OCR and compression engines handle scanned documents effortlessly." },
    { q: "Are my files secure?", a: "Absolutely. We use enterprise-grade end-to-end encryption and delete all files from our servers instantly after processing." },
    { q: "Is there a file size limit?", a: "Free users can process files up to 50MB. Premium users enjoy up to 2GB per file." }
  ];

  return (
    <div className="w-full max-w-[1000px] mx-auto mt-24 mb-12">
      <h3 className="text-2xl font-bold text-slate-900 mb-8">Frequently Asked Questions</h3>
      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <button 
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
            >
              <span className={`font-semibold text-[15px] ${openIndex === i ? 'text-indigo-600' : 'text-slate-700'}`}>
                {faq.q}
              </span>
              <span className="text-slate-400">
                {openIndex === i ? <Minus size={18} /> : <Plus size={18} />}
              </span>
            </button>
            {openIndex === i && (
              <div className="px-6 pb-5 text-slate-500 text-[15px] leading-relaxed">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;
