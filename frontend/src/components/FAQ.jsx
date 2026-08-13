import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const FAQ = ({ faqs: customFaqs, title }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const defaultFaqs = [
    { q: "Can you convert a single file into multiple PDFs?", a: "Yes. You can split a single PDF into multiple PDF files by choosing specific pages or page ranges. For example, a 50-page document can be divided into individual pages, chapters, or custom sections depending on your needs. Splitting a PDF is useful when you only need to share part of a document, organize reports into separate files, or reduce the size of large PDFs for easier sharing. Simply upload your file, select how you want to split it, and download each new PDF in seconds. Most online PDF splitters work directly in your browser, so no software installation is required." },
    { q: "How does converting your document into a PDF affect the file size?", a: "Converting a document to PDF may increase or decrease the file size depending on the document's content. Text-based files are usually compact, while documents containing high-resolution images, graphics, or embedded fonts may result in larger PDFs. Many modern PDF converters automatically optimize images and compress data during conversion to help reduce file size while preserving document quality. If your PDF is still too large, you can further reduce its size using a PDF compression tool before sharing, uploading, or emailing the file." },
    { q: "How do I convert text into PDF?", a: "To convert text into a PDF, paste or upload your text into a PDF converter and create the PDF with a single click. The converter formats your content into a portable document that maintains the same layout across computers, smartphones, and tablets. PDF is one of the most widely used document formats because it preserves formatting and is easy to print, share, and archive. It's commonly used for resumes, letters, contracts, invoices, reports, assignments, and other professional documents. Most online text-to-PDF converters work in your browser and don't require any software installation." },
    { q: "What is the best free software for splitting or merging PDF files?", a: "The best free tool for splitting or merging PDF files is one that works directly in your browser, since it saves you from downloading software and works the same way on any device. Look for a tool that lets you reorder pages before merging, select custom page ranges when splitting, and keeps your original formatting and image quality intact. Speed also matters, most browser-based tools process files in seconds regardless of document size. PDFBundles offers both merge and split tools for free with no account or email sign up required, making it a straightforward option for one off tasks or regular use." }
  ];

  const faqs = customFaqs && customFaqs.length > 0 ? customFaqs : defaultFaqs;
  const displayTitle = title || "Frequently Asked Questions";

  return (
    <div className="w-full max-w-[1000px] mx-auto mt-24 mb-12">
      <div className="text-center mb-8">
        <h3 className="text-3xl font-black text-slate-900 mb-2">{displayTitle}</h3>
        <p className="text-slate-500 font-medium">Here you can find clear and direct answers to common questions about PDF tools.</p>
      </div>
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
