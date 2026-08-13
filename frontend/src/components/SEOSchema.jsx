import React from 'react';

export default function SEOSchema() {
  return (
    <>
      {/* SCHEMA 1: Organization + WebSite (combined graph) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: `
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://pdfbundles.com/#organization",
      "name": "PDF Bundles",
      "url": "https://pdfbundles.com",
      "logo": {
        "@type": "ImageObject",
        "@id": "https://pdfbundles.com/#logo",
        "url": "https://pdfbundles.com/logo-desktop.png",
        "contentUrl": "https://pdfbundles.com/logo-desktop.png",
        "caption": "PDF Bundles - Free Online PDF Converter Tools"
      },
      "image": "https://pdfbundles.com/logo-desktop.png",
      "email": "info@pdfbundles.com",
      "contactPoint": {
        "@type": "ContactPoint",
        "email": "info@pdfbundles.com",
        "contactType": "customer support",
        "availableLanguage": "English"
      },
      "sameAs": [
        "https://x.com/PDFBUNDLES",
        "https://www.tiktok.com/@pdfbundles1",
        "https://www.facebook.com/pdfbundles/",
        "https://www.linkedin.com/company/bigmapseo"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://pdfbundles.com/#website",
      "url": "https://pdfbundles.com",
      "name": "PDF Bundles",
      "description": "With our 24 free online PDF Converter tools. Now you can merge, split, delete, OCR, redact, compare, edit, crop, scan, organize, sign and more with PDF Bundles.",
      "publisher": {
        "@id": "https://pdfbundles.com/#organization"
      },
      "inLanguage": "en",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://pdfbundles.com/?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    }
  ]
}
      `}} />

      {/* SCHEMA 2: WebPage */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: `
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": "https://pdfbundles.com/#webpage",
  "url": "https://pdfbundles.com",
  "name": "24 Free Online PDF Converter Tools | 100% Free | No Signup",
  "description": "With our 24 free online PDF Converter tools. Now you can merge, split, delete, OCR, redact, compare, edit, crop, scan, organize, sign and more with PDF Bundles.",
  "isPartOf": {
    "@id": "https://pdfbundles.com/#website"
  },
  "about": {
    "@id": "https://pdfbundles.com/#organization"
  },
  "primaryImageOfPage": {
    "@type": "ImageObject",
    "url": "https://pdfbundles.com/logo-desktop.png"
  },
  "inLanguage": "en",
  "dateModified": "2025-08-05",
  "breadcrumb": {
    "@id": "https://pdfbundles.com/#breadcrumb"
  }
}
      `}} />

      {/* SCHEMA 3: BreadcrumbList */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: `
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "@id": "https://pdfbundles.com/#breadcrumb",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://pdfbundles.com"
    }
  ]
}
      `}} />

      {/* SCHEMA 4: SoftwareApplication */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: `
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "PDF Bundles - Free Online PDF Converter Tools",
  "url": "https://pdfbundles.com",
  "description": "A suite of 24 free online PDF tools to merge, split, compress, convert, edit, OCR, redact, compare, sign, crop, scan, and organize PDF files. 100% free, no signup required. Files are processed locally in your browser for maximum privacy.",
  "applicationCategory": "UtilitiesApplication",
  "applicationSubCategory": "PDF Converter",
  "operatingSystem": "Any (Web Browser)",
  "browserRequirements": "Requires a modern web browser with JavaScript enabled",
  "softwareVersion": "1.0",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "description": "100% free to use with no signup required"
  },
  "featureList": [
    "Merge PDF",
    "Split PDF",
    "Compress PDF",
    "OCR PDF",
    "Edit PDF",
    "Sign PDF",
    "Rotate PDF",
    "Crop PDF",
    "Redact PDF",
    "Compare PDF",
    "Protect PDF",
    "Unlock PDF",
    "Add Watermark",
    "Page Numbers",
    "Remove Pages",
    "Extract Pages",
    "Organize PDF",
    "Scan to PDF",
    "Repair PDF",
    "PDF Forms",
    "JPG to PDF",
    "Word to PDF",
    "PPT to PDF",
    "Excel to PDF",
    "HTML to PDF",
    "PDF to PNG",
    "PDF to Word",
    "PDF to PPT",
    "PDF to Excel",
    "AI PDF Assistant",
    "Background Remover",
    "Image Upscaler"
  ],
  "screenshot": "https://pdfbundles.com/logo-desktop.png",
  "creator": {
    "@id": "https://pdfbundles.com/#organization"
  },
  "aggregateRating": null
}
      `}} />

      {/* SCHEMA 5: ItemList */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: `
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Free Online PDF Converter Tools",
  "description": "Complete collection of 24+ free online PDF tools offered by PDF Bundles",
  "numberOfItems": 32,
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Merge PDF",
      "url": "https://pdfbundles.com/merge-pdf",
      "description": "Combine multiple PDF documents into a single file without losing quality"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Split PDF",
      "url": "https://pdfbundles.com/split-pdf",
      "description": "Divide a single PDF into multiple separate documents"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Compress PDF",
      "url": "https://pdfbundles.com/compress-pdf",
      "description": "Reduce PDF file size while maintaining quality"
    },
    {
      "@type": "ListItem",
      "position": 4,
      "name": "OCR PDF",
      "url": "https://pdfbundles.com/ocr-pdf",
      "description": "Extract text from scanned PDFs using on-device optical character recognition"
    },
    {
      "@type": "ListItem",
      "position": 5,
      "name": "Edit PDF",
      "url": "https://pdfbundles.com/edit-pdf",
      "description": "Edit text, images, and content in your PDF files online"
    },
    {
      "@type": "ListItem",
      "position": 6,
      "name": "Sign PDF",
      "url": "https://pdfbundles.com/sign-pdf",
      "description": "Create and place a digital signature on your PDF documents"
    },
    {
      "@type": "ListItem",
      "position": 7,
      "name": "Rotate PDF",
      "url": "https://pdfbundles.com/rotate-pdf",
      "description": "Change the orientation of PDF pages"
    },
    {
      "@type": "ListItem",
      "position": 8,
      "name": "Crop PDF",
      "url": "https://pdfbundles.com/crop-pdf",
      "description": "Adjust margins or visible area of PDF pages"
    },
    {
      "@type": "ListItem",
      "position": 9,
      "name": "Redact PDF",
      "url": "https://pdfbundles.com/redact-pdf",
      "description": "Permanently remove sensitive information from PDF documents"
    },
    {
      "@type": "ListItem",
      "position": 10,
      "name": "Compare PDF",
      "url": "https://pdfbundles.com/compare-pdf",
      "description": "Compare two PDF documents side by side to find differences"
    },
    {
      "@type": "ListItem",
      "position": 11,
      "name": "Protect PDF",
      "url": "https://pdfbundles.com/protect-pdf",
      "description": "Add password protection and encryption to your PDF files"
    },
    {
      "@type": "ListItem",
      "position": 12,
      "name": "Unlock PDF",
      "url": "https://pdfbundles.com/unlock-pdf",
      "description": "Remove password protection from PDF documents"
    },
    {
      "@type": "ListItem",
      "position": 13,
      "name": "Add Watermark",
      "url": "https://pdfbundles.com/add-watermark",
      "description": "Add custom text or image watermarks to your PDF pages"
    },
    {
      "@type": "ListItem",
      "position": 14,
      "name": "Page Numbers",
      "url": "https://pdfbundles.com/page-numbers",
      "description": "Automatically add page numbers to your PDF documents"
    },
    {
      "@type": "ListItem",
      "position": 15,
      "name": "Remove Pages",
      "url": "https://pdfbundles.com/remove-pages",
      "description": "Delete unwanted pages from PDF documents"
    },
    {
      "@type": "ListItem",
      "position": 16,
      "name": "Extract Pages",
      "url": "https://pdfbundles.com/extract-pages",
      "description": "Extract specific pages from a PDF document"
    },
    {
      "@type": "ListItem",
      "position": 17,
      "name": "Organize PDF",
      "url": "https://pdfbundles.com/organize-pdf",
      "description": "Rearrange, reorder, and organize pages within your PDF"
    },
    {
      "@type": "ListItem",
      "position": 18,
      "name": "Scan to PDF",
      "url": "https://pdfbundles.com/scan-to-pdf",
      "description": "Convert scanned documents and images into searchable PDF files"
    },
    {
      "@type": "ListItem",
      "position": 19,
      "name": "Repair PDF",
      "url": "https://pdfbundles.com/repair-pdf",
      "description": "Fix corrupted or damaged PDF files"
    },
    {
      "@type": "ListItem",
      "position": 20,
      "name": "PDF Forms",
      "url": "https://pdfbundles.com/pdf-forms",
      "description": "Fill in and submit PDF forms online"
    },
    {
      "@type": "ListItem",
      "position": 21,
      "name": "JPG to PDF",
      "url": "https://pdfbundles.com/jpg-to-pdf",
      "description": "Convert JPG and JPEG images to PDF format"
    },
    {
      "@type": "ListItem",
      "position": 22,
      "name": "Word to PDF",
      "url": "https://pdfbundles.com/word-to-pdf",
      "description": "Convert Microsoft Word documents to PDF format"
    },
    {
      "@type": "ListItem",
      "position": 23,
      "name": "PPT to PDF",
      "url": "https://pdfbundles.com/ppt-to-pdf",
      "description": "Convert PowerPoint presentations to PDF format"
    },
    {
      "@type": "ListItem",
      "position": 24,
      "name": "Excel to PDF",
      "url": "https://pdfbundles.com/excel-to-pdf",
      "description": "Convert Excel spreadsheets to PDF format"
    },
    {
      "@type": "ListItem",
      "position": 25,
      "name": "HTML to PDF",
      "url": "https://pdfbundles.com/html-to-pdf",
      "description": "Convert web pages and HTML content to PDF format"
    },
    {
      "@type": "ListItem",
      "position": 26,
      "name": "PDF to PNG",
      "url": "https://pdfbundles.com/pdf-to-png",
      "description": "Convert PDF pages to high-quality PNG images"
    },
    {
      "@type": "ListItem",
      "position": 27,
      "name": "PDF to Word",
      "url": "https://pdfbundles.com/pdf-to-word",
      "description": "Convert PDF documents to editable Microsoft Word files"
    },
    {
      "@type": "ListItem",
      "position": 28,
      "name": "PDF to PPT",
      "url": "https://pdfbundles.com/pdf-to-ppt",
      "description": "Convert PDF files to editable PowerPoint presentations"
    },
    {
      "@type": "ListItem",
      "position": 29,
      "name": "PDF to Excel",
      "url": "https://pdfbundles.com/pdf-to-excel",
      "description": "Convert PDF tables and data to editable Excel spreadsheets"
    },
    {
      "@type": "ListItem",
      "position": 30,
      "name": "AI PDF Assistant",
      "url": "https://pdfbundles.com/ai-pdf-assistant",
      "description": "AI-powered assistant to analyze, summarize, and interact with PDF content"
    },
    {
      "@type": "ListItem",
      "position": 31,
      "name": "Background Remover",
      "url": "https://pdfbundles.com/background-remover",
      "description": "Remove backgrounds from images instantly"
    },
    {
      "@type": "ListItem",
      "position": 32,
      "name": "Image Upscaler",
      "url": "https://pdfbundles.com/image-upscaler",
      "description": "Upscale and enhance image resolution using AI"
    }
  ]
}
      `}} />

      {/* SCHEMA 6: FAQPage */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: `
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is PDF Bundles really 100% free?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, PDF Bundles offers 24+ free online PDF tools that are completely free to use. No signup, no email, and no credit card is required. You can merge, split, compress, convert, edit, OCR, and more — all without any cost."
      }
    },
    {
      "@type": "Question",
      "name": "Is it safe to use PDF Bundles for sensitive documents?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Absolutely. PDF Bundles processes all files directly in your web browser using client-side JavaScript libraries such as pdf-lib, pdf.js, and Tesseract.js. Your files are never uploaded to any external server, ensuring complete privacy and security."
      }
    },
    {
      "@type": "Question",
      "name": "Do I need to create an account to use PDF Bundles?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. All PDF tools on pdfbundles.com work instantly without requiring any account creation, signup, or email address. Simply visit the tool page and start processing your PDFs."
      }
    },
    {
      "@type": "Question",
      "name": "What PDF tools are available on PDF Bundles?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "PDF Bundles offers 24+ free online PDF tools including: Merge PDF, Split PDF, Compress PDF, OCR PDF, Edit PDF, Sign PDF, Rotate PDF, Crop PDF, Redact PDF, Compare PDF, Protect PDF, Unlock PDF, Add Watermark, Page Numbers, Remove Pages, Extract Pages, Organize PDF, Scan to PDF, Repair PDF, PDF Forms, and format converters like JPG to PDF, Word to PDF, PPT to PDF, Excel to PDF, HTML to PDF, PDF to PNG, PDF to Word, PDF to PPT, and PDF to Excel."
      }
    },
    {
      "@type": "Question",
      "name": "Can I use PDF Bundles offline?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Since PDF Bundles processes files locally in your browser, the tools can continue to function even after your internet connection is lost — as long as the page has fully loaded beforehand."
      }
    },
    {
      "@type": "Question",
      "name": "Can you convert a single file into multiple PDFs?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. You can split a single PDF into multiple PDF files by choosing specific pages or page ranges. For example, a 50-page document can be divided into individual pages, chapters, or custom sections depending on your needs. Splitting a PDF is useful when you only need to share part of a document, organize reports into separate files, or reduce the size of large PDFs for easier sharing. Simply upload your file, select how you want to split it, and download each new PDF in seconds. Most online PDF splitters work directly in your browser, so no software installation is required."
      }
    },
    {
      "@type": "Question",
      "name": "How does converting your document into a PDF affect the file size?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Converting a document to PDF may increase or decrease the file size depending on the document's content. Text-based files are usually compact, while documents containing high-resolution images, graphics, or embedded fonts may result in larger PDFs. Many modern PDF converters automatically optimize images and compress data during conversion to help reduce file size while preserving document quality. If your PDF is still too large, you can further reduce its size using a PDF compression tool before sharing, uploading, or emailing the file."
      }
    },
    {
      "@type": "Question",
      "name": "How do I convert text into PDF?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "To convert text into a PDF, paste or upload your text into a PDF converter and create the PDF with a single click. The converter formats your content into a portable document that maintains the same layout across computers, smartphones, and tablets. PDF is one of the most widely used document formats because it preserves formatting and is easy to print, share, and archive. It's commonly used for resumes, letters, contracts, invoices, reports, assignments, and other professional documents. Most online text-to-PDF converters work in your browser and don't require any software installation."
      }
    },
    {
      "@type": "Question",
      "name": "What is the best free software for splitting or merging PDF files?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The best free tool for splitting or merging PDF files is one that works directly in your browser, since it saves you from downloading software and works the same way on any device. Look for a tool that lets you reorder pages before merging, select custom page ranges when splitting, and keeps your original formatting and image quality intact. Speed also matters, most browser-based tools process files in seconds regardless of document size. PDFBundles offers both merge and split tools for free with no account or email sign up required, making it a straightforward option for one off tasks or regular use."
      }
    }
  ]
}
      `}} />

      {/* SCHEMA 7: SiteNavigationElement */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: `
{
  "@context": "https://schema.org",
  "@type": "SiteNavigationElement",
  "name": "Main Navigation",
  "url": "https://pdfbundles.com",
  "hasPart": [
    {
      "@type": "SiteNavigationElement",
      "name": "Features",
      "url": "https://pdfbundles.com/features"
    },
    {
      "@type": "SiteNavigationElement",
      "name": "Pricing",
      "url": "https://pdfbundles.com/pricing"
    },
    {
      "@type": "SiteNavigationElement",
      "name": "Blog",
      "url": "https://pdfbundles.com/blog"
    },
    {
      "@type": "SiteNavigationElement",
      "name": "FAQ",
      "url": "https://pdfbundles.com/faq"
    },
    {
      "@type": "SiteNavigationElement",
      "name": "About",
      "url": "https://pdfbundles.com/about"
    },
    {
      "@type": "SiteNavigationElement",
      "name": "Documentation",
      "url": "https://pdfbundles.com/documentation"
    }
  ]
}
      `}} />
    </>
  );
}
