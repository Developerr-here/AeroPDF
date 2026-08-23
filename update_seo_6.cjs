const fs = require('fs');

const seoUpdates = {
  '/ocr-pdf': { title: "OCR PDF Online Free | Make Scanned PDFs Searchable", desc: "OCR PDF online for free with PDFBundles. Make scanned PDFs searchable and copy text directly from the document in seconds." },
  '/repair-pdf': { title: "Repair Corrupt PDF Files Free | PDFBundles", desc: "Repair corrupt PDF files online for free with PDFBundles. Fix broken PDFs that won't open and download the working file in seconds." },
  '/compress-pdf': { title: "Compress PDF Online Free | PDFBundles", desc: "Compress PDF online for free with PDFBundles. Reduce PDF file size while keeping quality intact, no signup or software needed." },
  '/scan-to-pdf': { title: "Convert Scanned Images to PDF Free | PDFBundles", desc: "Convert scanned images to PDF online for free with PDFBundles. Turn photos into a single PDF document and download it in seconds." },
  '/organize-pdf': { title: "Organize PDF Pages Online Free | PDFBundles", desc: "Organize PDF pages online for free with PDFBundles. Reorder PDF pages, rotate them, and download the updated file in seconds." }
};

let seo = fs.readFileSync('c:/Projects/pdf/seo-config.js', 'utf8');

for (const [key, val] of Object.entries(seoUpdates)) {
  const regex = new RegExp(`'${key}': \\{.*?\\}`, 'g');
  seo = seo.replace(regex, `'${key}': { title: "${val.title}", desc: "${val.desc}" }`);
}
fs.writeFileSync('c:/Projects/pdf/seo-config.js', seo);
console.log('seo-config.js updated');

const addition = `
TOOL_EXTRA_CONTENT['ocr-pdf'] = {
  ...TOOL_EXTRA_CONTENT['ocr-pdf'],
  seoH1: 'OCR PDF Online for Free',
  seoH2_1: 'How to Make a Scanned PDF Searchable',
  seoH2_1Desc: 'Upload your scanned file, and the tool runs text recognition across every page to make a scanned PDF searchable in one pass. Once processing finishes, download the new file, and you\\'ll be able to search, highlight, and copy text as you would in any regular document.',
  seoH2_2: 'Why OCR Matters for Scanned Documents',
  seoH2_2Desc: 'A scanned page is really just an image, so without OCR you can\\'t search it, copy from it, or select individual words. Running the file through this tool to make a scanned PDF searchable turns it into something you can actually work with, whether that\\'s pulling a quote from a contract or searching a long report for a specific term.',
  seoFaqTitle: 'Frequently Ask Questions About Free OCR PDF Online',
  seoFaqs: [
    { q: 'How do I OCR a PDF online?', a: 'Upload your scanned file to the tool, and it runs text recognition across every page automatically. Once processing is complete, you\\'ll get a new file that\\'s searchable and selectable, with a download link ready within seconds and no software installation needed.' },
    { q: 'What is OCR and why do I need it for a scanned PDF?', a: 'OCR stands for optical character recognition, and it converts the text within a scanned image into actual selectable text. Without it, a scanned PDF is just a picture of text that can\\'t be searched, copied, or edited, which makes OCR essential for working with old paperwork or photographed documents.' },
    { q: 'Can I copy text from my PDF after running OCR?', a: 'Yes, once OCR processing is complete, you can select and copy any text from the document just as you would with a normal PDF, since the recognised text is embedded into the file alongside the original page image.' },
    { q: 'Is it free to OCR a PDF online?', a: 'Yes, running OCR on a PDF with PDFBundles is completely free, with no account, email sign up, or software download required.' }
  ],
  seoSchema: \`{
"@context": "https://schema.org",
"@graph": [
{
"@type": "WebPage",
"@id": "https://pdfbundles.com/ocr-pdf#webpage",
"url": "https://pdfbundles.com/ocr-pdf",
"name": "OCR PDF Online Free | PDFBundles",
"description": "OCR PDF online for free with PDFBundles. Make scanned PDFs searchable and copy text directly from the document in seconds.",
"isPartOf": {
"@id": "https://pdfbundles.com/#website"
}
},
{
"@type": "Organization",
"@id": "https://pdfbundles.com/#organization",
"name": "PDFBundles",
"url": "https://pdfbundles.com/",
"logo": {
"@type": "ImageObject",
"url": "https://pdfbundles.com/logo-desktop.png"
},
"contactPoint": {
"@type": "ContactPoint",
"email": "info@pdfbundles.com",
"contactType": "customer support"
}
},
{
"@type": "FAQPage",
"@id": "https://pdfbundles.com/ocr-pdf#faq",
"mainEntity": [
{
"@type": "Question",
"name": "How do I OCR a PDF online?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Upload your scanned file to the tool, and it runs text recognition across every page automatically. Once processing is complete, you'll get a new file that's searchable and selectable, with a download link ready within seconds and no software installation needed."
}
},
{
"@type": "Question",
"name": "What is OCR and why do I need it for a scanned PDF?",
"acceptedAnswer": {
"@type": "Answer",
"text": "OCR stands for optical character recognition, and it converts the text within a scanned image into actual selectable text. Without it, a scanned PDF is just a picture of text that can't be searched, copied, or edited, which makes OCR essential for working with old paperwork or photographed documents."
}
},
{
"@type": "Question",
"name": "Can I copy text from my PDF after running OCR?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes, once OCR processing is complete, you can select and copy any text from the document just as you would with a normal PDF, since the recognised text is embedded into the file alongside the original page image."
}
},
{
"@type": "Question",
"name": "Is it free to OCR a PDF online?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes, running OCR on a PDF with PDFBundles is completely free, with no account, email sign up, or software download required."
}
}
]
}
]
}\`
};

TOOL_EXTRA_CONTENT['repair-pdf'] = {
  ...TOOL_EXTRA_CONTENT['repair-pdf'],
  seoH1: 'Repair Corrupt PDF Files Online for Free',
  seoH2_1: 'How to Fix a Broken PDF File',
  seoH2_1Desc: 'Upload the document that won\\'t open or shows an error, and the tool scans its structure to fix a broken PDF file automatically. Once the repair finishes, download the corrected version and open it as normal.',
  seoH2_2: 'Common Signs a PDF Needs Repairing',
  seoH2_2Desc: 'If a file won\\'t load, shows blank or garbled pages, or triggers an error message in your PDF reader, it likely needs repairing. These issues often happen after an incomplete download, a failed file transfer, or software crashing mid save, and this tool exists specifically to fix a broken PDF file in those situations.',
  seoFaqTitle: 'Frequently Ask Questions About Repair Corrupt PDF Files Free',
  seoFaqs: [
    { q: 'How do I repair a corrupt PDF file?', a: 'Upload the damaged file to the tool, and it scans the document\\'s structure to identify and fix the issue automatically. Once the repair is complete, you\\'ll get a download link for the working file, usually within seconds, with no software installation needed.' },
    { q: 'Why won\\'t my PDF open?', a: 'A PDF often won\\'t open because of a corrupted file structure, which can happen after an interrupted download, a failed transfer, or a crash while the file was being saved. Repairing the file rebuilds its structure so it can be opened normally again.' },
    { q: 'Can every corrupt PDF be repaired?', a: 'Most structural issues, such as broken headers or incomplete file data, can be fixed successfully. However, files with severe or extensive damage may not be fully recoverable, in which case only part of the original content might be restored.' },
    { q: 'Is it free to repair a PDF online?', a: 'Yes, repairing a PDF with PDFBundles is completely free, with no account, email sign up, or software download required.' }
  ],
  seoSchema: \`{
"@context": "https://schema.org",
"@graph": [
{
"@type": "WebPage",
"@id": "https://pdfbundles.com/repair-pdf#webpage",
"url": "https://pdfbundles.com/repair-pdf",
"name": "Repair Corrupt PDF Files Free | PDFBundles",
"description": "Repair corrupt PDF files online for free with PDFBundles. Fix broken PDFs that won't open and download the working file in seconds.",
"isPartOf": {
"@id": "https://pdfbundles.com/#website"
}
},
{
"@type": "Organization",
"@id": "https://pdfbundles.com/#organization",
"name": "PDFBundles",
"url": "https://pdfbundles.com/",
"logo": {
"@type": "ImageObject",
"url": "https://pdfbundles.com/logo-desktop.png"
},
"contactPoint": {
"@type": "ContactPoint",
"email": "info@pdfbundles.com",
"contactType": "customer support"
}
},
{
"@type": "FAQPage",
"@id": "https://pdfbundles.com/repair-pdf#faq",
"mainEntity": [
{
"@type": "Question",
"name": "How do I repair a corrupt PDF file?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Upload the damaged file to the tool, and it scans the document's structure to identify and fix the issue automatically. Once the repair is complete, you'll get a download link for the working file, usually within seconds, with no software installation needed."
}
},
{
"@type": "Question",
"name": "Why won't my PDF open?",
"acceptedAnswer": {
"@type": "Answer",
"text": "A PDF often won't open because of a corrupted file structure, which can happen after an interrupted download, a failed transfer, or a crash while the file was being saved. Repairing the file rebuilds its structure so it can be opened normally again."
}
},
{
"@type": "Question",
"name": "Can every corrupt PDF be repaired?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Most structural issues, such as broken headers or incomplete file data, can be fixed successfully. However, files with severe or extensive damage may not be fully recoverable, in which case only part of the original content might be restored."
}
},
{
"@type": "Question",
"name": "Is it free to repair a PDF online?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes, repairing a PDF with PDFBundles is completely free, with no account, email sign up, or software download required."
}
}
]
}
]
}\`
};

TOOL_EXTRA_CONTENT['compress-pdf'] = {
  ...TOOL_EXTRA_CONTENT['compress-pdf'],
  seoH1: 'Compress PDF Online Without Losing Quality',
  seoH2_1: 'How to Reduce PDF File Size in Seconds',
  seoH2_1Desc: 'Upload your document and choose a compression level, then let the tool reduce PDF file size automatically while keeping the layout and text exactly as they were. Once processing finishes, download your smaller file straight away.',
  seoH2_2: 'When You\\'ll Want a Smaller PDF',
  seoH2_2Desc: 'Email providers often cap attachment sizes, and many upload forms reject files above a certain limit. Being able to reduce PDF file size quickly means you can meet those limits without manually deleting pages or lowering image quality yourself.',
  seoFaqTitle: 'Frequently Ask Questions About Free Online PDF Compressor',
  seoFaqs: [
    { q: 'How do I compress a PDF file online?', a: 'Upload your PDF to the tool, select your preferred compression level, and the file size is reduced automatically. Once processing is complete, you\\'ll get a download link for the smaller file, usually within seconds, with no software installation required.' },
    { q: 'Will compressing a PDF reduce its quality?', a: 'Compression can slightly reduce image quality depending on the level you choose, but text and layout stay sharp at every setting. Lower compression levels keep quality closer to the original, while higher levels prioritise a smaller file size.' },
    { q: 'How much can I reduce a PDF\\'s file size?', a: 'The amount of reduction depends on the original file, PDFs with a lot of high-resolution images typically compress more than text-only documents. Many files can be reduced significantly without a noticeable drop in visual quality.' },
    { q: 'Is it free to compress a PDF online?', a: 'Yes, compressing a PDF with PDFBundles is completely free, with no account, email sign up, or software download required.' }
  ],
  seoSchema: \`{
"@context": "https://schema.org",
"@graph": [
{
"@type": "WebPage",
"@id": "https://pdfbundles.com/compress-pdf#webpage",
"url": "https://pdfbundles.com/compress-pdf",
"name": "Compress PDF Online Free | PDFBundles",
"description": "Compress PDF online for free with PDFBundles. Reduce PDF file size while keeping quality intact, no signup or software needed.",
"isPartOf": {
"@id": "https://pdfbundles.com/#website"
}
},
{
"@type": "Organization",
"@id": "https://pdfbundles.com/#organization",
"name": "PDFBundles",
"url": "https://pdfbundles.com/",
"logo": {
"@type": "ImageObject",
"url": "https://pdfbundles.com/logo-desktop.png"
},
"contactPoint": {
"@type": "ContactPoint",
"email": "info@pdfbundles.com",
"contactType": "customer support"
}
},
{
"@type": "FAQPage",
"@id": "https://pdfbundles.com/compress-pdf#faq",
"mainEntity": [
{
"@type": "Question",
"name": "How do I compress a PDF file online?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Upload your PDF to the tool, select your preferred compression level, and the file size is reduced automatically. Once processing is complete, you'll get a download link for the smaller file, usually within seconds, with no software installation required."
}
},
{
"@type": "Question",
"name": "Will compressing a PDF reduce its quality?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Compression can slightly reduce image quality depending on the level you choose, but text and layout stay sharp at every setting. Lower compression levels keep quality closer to the original, while higher levels prioritise a smaller file size."
}
},
{
"@type": "Question",
"name": "How much can I reduce a PDF's file size?",
"acceptedAnswer": {
"@type": "Answer",
"text": "The amount of reduction depends on the original file, PDFs with a lot of high-resolution images typically compress more than text-only documents. Many files can be reduced significantly without a noticeable drop in visual quality."
}
},
{
"@type": "Question",
"name": "Is it free to compress a PDF online?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes, compressing a PDF with PDFBundles is completely free, with no account, email sign up, or software download required."
}
}
]
}
]
}\`
};

TOOL_EXTRA_CONTENT['scan-to-pdf'] = {
  ...TOOL_EXTRA_CONTENT['scan-to-pdf'],
  seoH1: 'Convert Scanned Images to PDF Online for Free',
  seoH2_1: 'How to Use This Photos to PDF Converter',
  seoH2_1Desc: 'Upload the photos you want to include, reorder them if needed, then click convert. This photos to PDF converter compiles every image into one document, keeping each page in the order you set, and gives you a download link within seconds.',
  seoH2_2: 'What You Can Use It For',
  seoH2_2Desc: 'This tool works well for compiling receipts before submitting an expense report, saving handwritten notes as a searchable record, or combining ID photos into one file for an application. Since it\\'s a browser-based photos to PDF converter, you can use it from a phone or computer without installing anything extra.',
  seoFaqTitle: 'Frequently Ask Questions About Free Scanned Images to PDF',
  seoFaqs: [
    { q: 'How do I convert scanned images into a PDF?', a: 'Upload your scanned images or photos to the tool, arrange them in the order you want them to appear, then click convert. The tool compiles every image into a single PDF document and gives you a download link within seconds, with no software installation needed.' },
    { q: 'Can I combine multiple photos into one PDF?', a: 'Yes. You can upload several images at once and the tool combines them into a single multi page PDF, keeping them in whatever order you set before converting. This is useful for compiling receipts, notes, or scanned document pages into one file.' },
    { q: 'Will converting images to PDF reduce the photo quality?', a: 'The tool preserves image quality during conversion, so text and details in your scans stay clear and readable. If file size matters more than resolution, you can compress the finished PDF afterwards using a separate compression tool.' },
    { q: 'Is this scan to PDF tool free to use?', a: 'Yes, converting scanned images or photos to PDF with PDFBundles is completely free, with no account, email sign up, or software download required.' }
  ],
  seoSchema: \`{
"@context": "https://schema.org",
"@graph": [
{
"@type": "WebPage",
"@id": "https://pdfbundles.com/scan-to-pdf#webpage",
"url": "https://pdfbundles.com/scan-to-pdf",
"name": "Convert Scanned Images to PDF Free | PDFBundles",
"description": "Convert scanned images to PDF online for free with PDFBundles. Turn photos into a single PDF document and download it in seconds.",
"isPartOf": {
"@id": "https://pdfbundles.com/#website"
}
},
{
"@type": "Organization",
"@id": "https://pdfbundles.com/#organization",
"name": "PDFBundles",
"url": "https://pdfbundles.com/",
"logo": {
"@type": "ImageObject",
"url": "https://pdfbundles.com/logo-desktop.png"
},
"contactPoint": {
"@type": "ContactPoint",
"email": "info@pdfbundles.com",
"contactType": "customer support"
}
},
{
"@type": "FAQPage",
"@id": "https://pdfbundles.com/scan-to-pdf#faq",
"mainEntity": [
{
"@type": "Question",
"name": "How do I convert scanned images into a PDF?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Upload your scanned images or photos to the tool, arrange them in the order you want them to appear, then click convert. The tool compiles every image into a single PDF document and gives you a download link within seconds, with no software installation needed."
}
},
{
"@type": "Question",
"name": "Can I combine multiple photos into one PDF?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes. You can upload several images at once and the tool combines them into a single multi page PDF, keeping them in whatever order you set before converting. This is useful for compiling receipts, notes, or scanned document pages into one file."
}
},
{
"@type": "Question",
"name": "Will converting images to PDF reduce the photo quality?",
"acceptedAnswer": {
"@type": "Answer",
"text": "The tool preserves image quality during conversion, so text and details in your scans stay clear and readable. If file size matters more than resolution, you can compress the finished PDF afterwards using a separate compression tool."
}
},
{
"@type": "Question",
"name": "Is this scan to PDF tool free to use?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes, converting scanned images or photos to PDF with PDFBundles is completely free, with no account, email sign up, or software download required."
}
}
]
}
]
}\`
};

TOOL_EXTRA_CONTENT['organize-pdf'] = {
  ...TOOL_EXTRA_CONTENT['organize-pdf'],
  seoH1: 'Organize PDF Pages Online in Seconds',
  seoH2_1: 'How to Reorder PDF Pages in a Few Clicks',
  seoH2_1Desc: 'Upload your file, then drag each page thumbnail into the position you want to reorder PDF pages without needing to know page numbers in advance. Once you\\'re happy with the new order, save your changes and download the reorganized file straight away.',
  seoH2_2: 'Other Ways to Tidy Up Your Document',
  seoH2_2Desc: 'Beyond letting you reorder PDF pages, the tool also allows you to rotate pages that were scanned sideways or upside down, and remove any that don\\'t belong. This makes it easy to turn a messy or out of order scan into a clean, properly arranged document in one pass.',
  seoFaqTitle: 'Frequently Ask Questions About Free PDF Pages Organizer Tool',
  seoFaqs: [
    { q: 'How do I organize the pages in a PDF?', a: 'Upload your file, then drag and drop the page thumbnails into the order you want. Once you\\'ve arranged everything the way you need it, save your changes and the tool generates a new file with the updated page order, ready to download in seconds.' },
    { q: 'Can I rotate pages while organizing a PDF?', a: 'Yes. Alongside reordering, you can rotate individual pages that were scanned sideways or upside down, so the final document reads correctly from start to finish without needing a separate tool.' },
    { q: 'Will organizing my PDF affect the file quality?', a: 'No, reordering or rotating pages doesn\\'t change the quality of the content itself. Text stays sharp and images keep their original resolution, since the tool only rearranges the existing pages rather than reprocessing them.' },
    { q: 'Is it free to reorder or organize a PDF online?', a: 'Yes, organizing a PDF with PDFBundles is completely free, with no account, email sign up, or software installation required.' }
  ],
  seoSchema: \`{
"@context": "https://schema.org",
"@graph": [
{
"@type": "WebPage",
"@id": "https://pdfbundles.com/organize-pdf#webpage",
"url": "https://pdfbundles.com/organize-pdf",
"name": "Organize PDF Pages Online Free | PDFBundles",
"description": "Organize PDF pages online for free with PDFBundles. Reorder PDF pages, rotate them, and download the updated file in seconds.",
"isPartOf": {
"@id": "https://pdfbundles.com/#website"
}
},
{
"@type": "Organization",
"@id": "https://pdfbundles.com/#organization",
"name": "PDFBundles",
"url": "https://pdfbundles.com/",
"logo": {
"@type": "ImageObject",
"url": "https://pdfbundles.com/logo-desktop.png"
},
"contactPoint": {
"@type": "ContactPoint",
"email": "info@pdfbundles.com",
"contactType": "customer support"
}
},
{
"@type": "FAQPage",
"@id": "https://pdfbundles.com/organize-pdf#faq",
"mainEntity": [
{
"@type": "Question",
"name": "How do I organize the pages in a PDF?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Upload your file, then drag and drop the page thumbnails into the order you want. Once you've arranged everything the way you need it, save your changes and the tool generates a new file with the updated page order, ready to download in seconds."
}
},
{
"@type": "Question",
"name": "Can I rotate pages while organizing a PDF?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes. Alongside reordering, you can rotate individual pages that were scanned sideways or upside down, so the final document reads correctly from start to finish without needing a separate tool."
}
},
{
"@type": "Question",
"name": "Will organizing my PDF affect the file quality?",
"acceptedAnswer": {
"@type": "Answer",
"text": "No, reordering or rotating pages doesn't change the quality of the content itself. Text stays sharp and images keep their original resolution, since the tool only rearranges the existing pages rather than reprocessing them."
}
},
{
"@type": "Question",
"name": "Is it free to reorder or organize a PDF online?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes, organizing a PDF with PDFBundles is completely free, with no account, email sign up, or software installation required."
}
}
]
}
]
}\`
};
`;

let fileContent = fs.readFileSync('c:/Projects/pdf/frontend/src/data/toolExtraContent.js', 'utf8');
const replacementPoint = "export function getExtraContentForTool";
fileContent = fileContent.replace(replacementPoint, addition + '\n\n' + replacementPoint);
fs.writeFileSync('c:/Projects/pdf/frontend/src/data/toolExtraContent.js', fileContent);
console.log('Done!');
