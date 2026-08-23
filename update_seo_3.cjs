const fs = require('fs');

const seoUpdates = {
  '/add-watermark': { title: 'Add Watermark to PDF | Stamp Text on PDF', desc: 'Add a watermark to PDF online for free with PDFBundles. Stamp text or a logo onto your PDF and download the file in seconds.' },
  '/page-numbers': { title: 'Add PAge Number to PDF | Insert PDF Page Numbering', desc: 'Add page numbers to PDF online for free with PDFBundles. Insert PDF page numbering in any position and download the file in seconds.' },
  '/rotate-pdf': { title: 'Free Rotate PDF Online | Fix PDF Page Orientation', desc: 'Rotate PDF online for free with PDFBundles. Fix sideways or upside down PDF pages and download the corrected file in seconds.' },
  '/pdf-to-excel': { title: 'Convert PDF to Excel Free | PDF Tables to Excel', desc: 'Convert PDF to Excel online for free with PDFBundles. Turn PDF tables into editable XLSX spreadsheets and download them in seconds.' },
  '/pdf-to-png': { title: 'Convert PDF to PNG | PDF pages to PNG images', desc: 'Convert PDF to PNG online for free with PDFBundles. Turn PDF pages into PNG images and download them in seconds.' }
};

let seo = fs.readFileSync('c:/Projects/pdf/seo-config.js', 'utf8');

for (const [key, val] of Object.entries(seoUpdates)) {
  const regex = new RegExp(`'${key}': \\{.*?\\}`, 'g');
  seo = seo.replace(regex, `'${key}': { title: '${val.title}', desc: '${val.desc}' }`);
}
fs.writeFileSync('c:/Projects/pdf/seo-config.js', seo);
console.log('seo-config.js updated');

const addition = `
TOOL_EXTRA_CONTENT['add-watermark'] = {
  category: 'Editor',
  icon: '💧',
  badges: ['WATERMARK', 'BRANDING'],
  input: 'PDF File',
  engine: 'Overlay Engine',
  output: 'Watermarked PDF',
  flow: ['Upload PDF', 'Add Watermark text or image', 'Download PDF'],
  about: 'Add a watermark to PDF online for free. Stamp text or a logo onto your PDF.',
  features: ['Add text or image watermark', 'Adjust opacity and position'],
  whoUses: ['Businesses', 'Creators'],
  steps: [
    { title: 'Upload PDF', desc: 'Select your file.' },
    { title: 'Watermark', desc: 'Configure the watermark.' },
    { title: 'Download', desc: 'Save your file.' }
  ],
  related: ['edit-pdf'],
  ...(TOOL_EXTRA_CONTENT['add-watermark'] || {}),
  seoH1: 'Add a Watermark to PDF Online for Free',
  seoH2_1: 'How to Stamp Text on PDF Documents',
  seoH2_1Desc: 'Upload your file, then type in the text or upload the logo you want to stamp text on PDF pages across the whole document. Adjust the position, size, and transparency until it looks right, then download your watermarked file straight away.',
  seoH2_2: 'Common Reasons to Watermark a Document',
  seoH2_2Desc: 'Businesses often stamp text on PDF drafts to mark them as confidential before sharing with a client, while others watermark files to protect original work from being copied without credit. Either way, a visible watermark makes a document\\'s status clear the moment someone opens it.',
  seoFaqTitle: 'Frequently Ask Questions About Add Watermark Tool',
  seoFaqs: [
    { q: 'How do I add a watermark to a PDF?', a: 'Upload your PDF to the tool, then enter your watermark text or upload a logo image. Adjust the position, size, and transparency to suit your document, and the watermark is applied across every page automatically, with a download link ready within seconds.' },
    { q: 'Can I use my own logo as a watermark instead of text?', a: 'Yes, you can upload an image file to use as your watermark instead of typing text, which is useful for branding a document consistently with your company logo.' },
    { q: 'Can I control how transparent the watermark looks?', a: 'Yes, you can adjust the opacity of your watermark so it\\'s subtle enough not to obscure the document\\'s content while still being clearly visible.' },
    { q: 'Is it free to add a watermark to a PDF online?', a: 'Yes, adding a watermark to a PDF with PDFBundles is completely free, with no account, email sign up, or software download required.' }
  ],
  seoSchema: \`{
"@context": "https://schema.org",
"@graph": [
{
"@type": "WebPage",
"@id": "https://pdfbundles.com/add-watermark#webpage",
"url": "https://pdfbundles.com/add-watermark",
"name": "Add Watermark to PDF Online Free | PDFBundles",
"description": "Add a watermark to PDF online for free with PDFBundles. Stamp text or a logo onto your PDF and download the file in seconds.",
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
"@id": "https://pdfbundles.com/add-watermark#faq",
"mainEntity": [
{
"@type": "Question",
"name": "How do I add a watermark to a PDF?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Upload your PDF to the tool, then enter your watermark text or upload a logo image. Adjust the position, size, and transparency to suit your document, and the watermark is applied across every page automatically, with a download link ready within seconds."
}
},
{
"@type": "Question",
"name": "Can I use my own logo as a watermark instead of text?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes, you can upload an image file to use as your watermark instead of typing text, which is useful for branding a document consistently with your company logo."
}
},
{
"@type": "Question",
"name": "Can I control how transparent the watermark looks?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes, you can adjust the opacity of your watermark so it's subtle enough not to obscure the document's content while still being clearly visible."
}
},
{
"@type": "Question",
"name": "Is it free to add a watermark to a PDF online?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes, adding a watermark to a PDF with PDFBundles is completely free, with no account, email sign up, or software download required."
}
}
]
}
]
}\`
};

TOOL_EXTRA_CONTENT['page-numbers'] = {
  category: 'Editor',
  icon: '#️⃣',
  badges: ['PAGINATION', 'NUMBERING'],
  input: 'PDF File',
  engine: 'Overlay Engine',
  output: 'Numbered PDF',
  flow: ['Upload PDF', 'Add page numbers', 'Download PDF'],
  about: 'Add page numbers to PDF online for free. Insert PDF page numbering in any position.',
  features: ['Add page numbers', 'Customize position'],
  whoUses: ['Students', 'Professionals'],
  steps: [
    { title: 'Upload PDF', desc: 'Select your file.' },
    { title: 'Page Numbers', desc: 'Configure numbering.' },
    { title: 'Download', desc: 'Save your file.' }
  ],
  related: ['add-watermark'],
  ...(TOOL_EXTRA_CONTENT['page-numbers'] || {}),
  seoH1: 'Add Page Numbers to PDF Online for Free',
  seoH2_1: 'How to Insert PDF Page Numbering',
  seoH2_1Desc: 'Upload your file, then choose the position and starting number for your pages to insert PDF page numbering exactly how you want it. Once you confirm your settings, the tool applies numbering across the whole document and gives you a download link right away.',
  seoH2_2: 'Where to Place Page Numbers in a Document',
  seoH2_2Desc: 'Most documents use the bottom centre or bottom right for page numbers, though reports and academic papers sometimes place them in the top corner instead. Being able to insert PDF page numbering in a custom position means your document follows whatever formatting standard you need to match.',
  seoFaqTitle: 'Frequently Ask Questions About Add Page Numbers to PDF',
  seoFaqs: [
    { q: 'How do I add page numbers to a PDF?', a: 'Upload your document to the tool, choose where you want the numbers positioned and what number to start from, then confirm your settings. The tool applies numbering across every page automatically, with a download link ready within seconds and no software installation needed.' },
    { q: 'Can I choose where the page numbers appear?', a: 'Yes, you can select the position for your page numbers, such as bottom centre, bottom right, or a top corner, depending on the formatting style your document needs to follow.' },
    { q: 'Can I start numbering from a page other than one?', a: 'Yes, you can set a custom starting number, which is useful if your document has a cover page or table of contents that shouldn\\'t be included in the count.' },
    { q: 'Is it free to add page numbers to a PDF online?', a: 'Yes, adding page numbers to a PDF with PDFBundles is completely free, with no account, email sign up, or software download required.' }
  ],
  seoSchema: \`{
"@context": "https://schema.org",
"@graph": [
{
"@type": "WebPage",
"@id": "https://pdfbundles.com/page-numbers#webpage",
"url": "https://pdfbundles.com/page-numbers",
"name": "Add Page Numbers to PDF Free | PDFBundles",
"description": "Add page numbers to PDF online for free with PDFBundles. Insert PDF page numbering in any position and download the file in seconds.",
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
"@id": "https://pdfbundles.com/page-numbers#faq",
"mainEntity": [
{
"@type": "Question",
"name": "How do I add page numbers to a PDF?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Upload your document to the tool, choose where you want the numbers positioned and what number to start from, then confirm your settings. The tool applies numbering across every page automatically, with a download link ready within seconds and no software installation needed."
}
},
{
"@type": "Question",
"name": "Can I choose where the page numbers appear?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes, you can select the position for your page numbers, such as bottom centre, bottom right, or a top corner, depending on the formatting style your document needs to follow."
}
},
{
"@type": "Question",
"name": "Can I start numbering from a page other than one?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes, you can set a custom starting number, which is useful if your document has a cover page or table of contents that shouldn't be included in the count."
}
},
{
"@type": "Question",
"name": "Is it free to add page numbers to a PDF online?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes, adding page numbers to a PDF with PDFBundles is completely free, with no account, email sign up, or software download required."
}
}
]
}
]
}\`
};

TOOL_EXTRA_CONTENT['rotate-pdf'] = {
  category: 'Editor',
  icon: '🔄',
  badges: ['ROTATE', 'ORIENTATION'],
  input: 'PDF File',
  engine: 'Page Engine',
  output: 'Rotated PDF',
  flow: ['Upload PDF', 'Rotate pages', 'Download PDF'],
  about: 'Rotate PDF online for free. Fix sideways or upside down PDF pages.',
  features: ['Rotate pages individually', 'Rotate all pages'],
  whoUses: ['Anyone'],
  steps: [
    { title: 'Upload PDF', desc: 'Select your file.' },
    { title: 'Rotate', desc: 'Rotate pages.' },
    { title: 'Download', desc: 'Save your file.' }
  ],
  related: ['crop-pdf'],
  ...(TOOL_EXTRA_CONTENT['rotate-pdf'] || {}),
  seoH1: 'Instantly Rotate PDF Pages Online for Free',
  seoH2_1: 'How to Fix PDF Page Orientation',
  seoH2_1Desc: 'Upload your document, then select any pages that are sideways or upside down to fix PDF page orientation individually or all at once. Choose the rotation angle you need, and the tool applies it instantly, ready for you to download the corrected file.',
  seoH2_2: 'Common Reasons Pages End Up Rotated',
  seoH2_2Desc: 'Scanned documents often come through with a few pages rotated the wrong way, especially when a scanner feeds pages in different directions. Being able to fix PDF page orientation without rescanning the whole document saves time and keeps the rest of the file exactly as it was.',
  seoFaqTitle: 'Frequently Ask Questions About Rotate PDF Tool',
  seoFaqs: [
    { q: 'How do I rotate pages in a PDF?', a: 'Upload your PDF to the tool, select the pages that need adjusting, and choose the rotation angle you want. The change applies instantly, and a download link for the corrected file is ready within seconds, with no software installation needed.' },
    { q: 'Can I rotate just one page instead of the whole document?', a: 'Yes, you can select individual pages to rotate while leaving the rest of the document untouched, which is useful when only a few pages in a scan came through sideways or upside down.' },
    { q: 'Will rotating a PDF affect its quality or content?', a: 'No, rotating a page only changes its orientation. The text, images, and formatting stay exactly as they were, since the tool simply adjusts how the page displays rather than altering its content.' },
    { q: 'Is it free to rotate a PDF online?', a: 'Yes, rotating a PDF with PDFBundles is completely free, with no account, email sign up, or software download required.' }
  ],
  seoSchema: \`{
"@context": "https://schema.org",
"@graph": [
{
"@type": "WebPage",
"@id": "https://pdfbundles.com/rotate-pdf#webpage",
"url": "https://pdfbundles.com/rotate-pdf",
"name": "Rotate PDF Online Free | PDFBundles",
"description": "Rotate PDF online for free with PDFBundles. Fix sideways or upside down PDF pages and download the corrected file in seconds.",
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
"@id": "https://pdfbundles.com/rotate-pdf#faq",
"mainEntity": [
{
"@type": "Question",
"name": "How do I rotate pages in a PDF?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Upload your PDF to the tool, select the pages that need adjusting, and choose the rotation angle you want. The change applies instantly, and a download link for the corrected file is ready within seconds, with no software installation needed."
}
},
{
"@type": "Question",
"name": "Can I rotate just one page instead of the whole document?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes, you can select individual pages to rotate while leaving the rest of the document untouched, which is useful when only a few pages in a scan came through sideways or upside down."
}
},
{
"@type": "Question",
"name": "Will rotating a PDF affect its quality or content?",
"acceptedAnswer": {
"@type": "Answer",
"text": "No, rotating a page only changes its orientation. The text, images, and formatting stay exactly as they were, since the tool simply adjusts how the page displays rather than altering its content."
}
},
{
"@type": "Question",
"name": "Is it free to rotate a PDF online?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes, rotating a PDF with PDFBundles is completely free, with no account, email sign up, or software download required."
}
}
]
}
]
}\`
};

TOOL_EXTRA_CONTENT['pdf-to-excel'] = {
  ...TOOL_EXTRA_CONTENT['pdf-to-excel'],
  seoH1: 'Convert PDF to Excel Online for Free',
  seoH2_1: 'How This Tool Converts PDF Tables to Excel',
  seoH2_1Desc: 'Upload your PDF, and the tool scans it for tables, converting PDF tables to Excel automatically while keeping rows and columns aligned correctly. Once processing finishes, download the spreadsheet and start working with the data right away.',
  seoH2_2: 'Why Extract Data Into a Spreadsheet',
  seoH2_2Desc: 'A PDF locks numbers and tables in a fixed layout, making it hard to sort, filter, or run calculations on the data. Converting PDF tables to Excel gives you back a working spreadsheet, so you can analyse figures, update values, or combine the data with other reports.',
  seoFaqTitle: 'Frequently Ask Questions About Pdf to Excel Tool',
  seoFaqs: [
    { q: 'How do I convert a PDF into an editable Excel file?', a: 'Upload your PDF to the tool, and it scans the document for tables, extracting the rows and columns into an XLSX file automatically. A download link is ready within seconds, with no software installation needed.' },
    { q: 'Will the table formatting stay accurate after converting PDF to Excel?', a: 'The tool aligns rows and columns as closely as possible to the original table structure, though very complex or merged cell layouts may need a quick review once opened in Excel.' },
    { q: 'Can I convert a scanned PDF\\'s tables into Excel?', a: 'Scanned PDFs are essentially images, so the table data within them may need to be run through an OCR tool first to make the text recognisable before extracting it into a spreadsheet.' },
    { q: 'Is it free to convert PDF to Excel online?', a: 'Yes, converting PDF files to Excel with PDFBundles is completely free, with no account, email sign up, or software download required.' }
  ],
  seoSchema: \`{
"@context": "https://schema.org",
"@graph": [
{
"@type": "WebPage",
"@id": "https://pdfbundles.com/pdf-to-excel#webpage",
"url": "https://pdfbundles.com/pdf-to-excel",
"name": "Convert PDF to Excel Online Free | PDFBundles",
"description": "Convert PDF to Excel online for free with PDFBundles. Turn PDF tables into editable XLSX spreadsheets and download them in seconds.",
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
"@id": "https://pdfbundles.com/pdf-to-excel#faq",
"mainEntity": [
{
"@type": "Question",
"name": "How do I convert a PDF into an editable Excel file?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Upload your PDF to the tool, and it scans the document for tables, extracting the rows and columns into an XLSX file automatically. A download link is ready within seconds, with no software installation needed."
}
},
{
"@type": "Question",
"name": "Will the table formatting stay accurate after converting PDF to Excel?",
"acceptedAnswer": {
"@type": "Answer",
"text": "The tool aligns rows and columns as closely as possible to the original table structure, though very complex or merged cell layouts may need a quick review once opened in Excel."
}
},
{
"@type": "Question",
"name": "Can I convert a scanned PDF's tables into Excel?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Scanned PDFs are essentially images, so the table data within them may need to be run through an OCR tool first to make the text recognisable before extracting it into a spreadsheet."
}
},
{
"@type": "Question",
"name": "Is it free to convert PDF to Excel online?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes, converting PDF files to Excel with PDFBundles is completely free, with no account, email sign up, or software download required."
}
}
]
}
]
}\`
};

TOOL_EXTRA_CONTENT['pdf-to-png'] = {
  ...TOOL_EXTRA_CONTENT['pdf-to-png'],
  seoH1: 'Convert PDF to PNG Online for Free',
  seoH2_1: 'How to Turn PDF Pages Into PNG Images',
  seoH2_1Desc: 'Upload your document, and the tool processes every page automatically to convert PDF pages to PNG images in one pass. Once conversion finishes, you can download each image individually or grab them all together, ready to use straight away.',
  seoH2_2: 'When PNG Images Work Better Than a PDF',
  seoH2_2Desc: 'Some platforms, like design software, presentation slides, or certain websites, need an image file rather than a PDF. Converting PDF pages to PNG images means you can drop a document page directly into these tools without needing to take a screenshot or open the file separately.',
  seoFaqTitle: 'Frequently Ask Questions About Free PDF to PNG Converter',
  seoFaqs: [
    { q: 'How do I convert a PDF into PNG images?', a: 'Upload your PDF to the tool, and it converts each page into a separate PNG image automatically. You can download the images individually or all together, with files ready within seconds and no software installation needed.' },
    { q: 'Will converting my PDF to PNG affect the image quality?', a: 'No, the tool renders each page at high resolution, so text and graphics stay sharp and clear once converted into PNG format.' },
    { q: 'Can I convert just one page of my PDF to an image?', a: 'Yes, once your file has been processed, you can choose to download a single page\\'s image rather than the full set, which is useful when you only need one specific page as an image.' },
    { q: 'Is it free to convert PDF to PNG online?', a: 'Yes, converting PDF pages to PNG with PDFBundles is completely free, with no account, email sign up, or software download required.' }
  ],
  seoSchema: \`{
"@context": "https://schema.org",
"@graph": [
{
"@type": "WebPage",
"@id": "https://pdfbundles.com/pdf-to-png#webpage",
"url": "https://pdfbundles.com/pdf-to-png",
"name": "Convert PDF to PNG Online Free | PDFBundles",
"description": "Convert PDF to PNG online for free with PDFBundles. Turn PDF pages into PNG images and download them in seconds.",
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
"@id": "https://pdfbundles.com/pdf-to-png#faq",
"mainEntity": [
{
"@type": "Question",
"name": "How do I convert a PDF into PNG images?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Upload your PDF to the tool, and it converts each page into a separate PNG image automatically. You can download the images individually or all together, with files ready within seconds and no software installation needed."
}
},
{
"@type": "Question",
"name": "Will converting my PDF to PNG affect the image quality?",
"acceptedAnswer": {
"@type": "Answer",
"text": "No, the tool renders each page at high resolution, so text and graphics stay sharp and clear once converted into PNG format."
}
},
{
"@type": "Question",
"name": "Can I convert just one page of my PDF to an image?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes, once your file has been processed, you can choose to download a single page's image rather than the full set, which is useful when you only need one specific page as an image."
}
},
{
"@type": "Question",
"name": "Is it free to convert PDF to PNG online?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes, converting PDF pages to PNG with PDFBundles is completely free, with no account, email sign up, or software download required."
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
if (!fileContent.includes("seoH1: 'Instantly Rotate PDF Pages Online for Free'")) {
  fileContent = fileContent.replace(replacementPoint, addition + '\n\n' + replacementPoint);
  fs.writeFileSync('c:/Projects/pdf/frontend/src/data/toolExtraContent.js', fileContent);
  console.log('toolExtraContent.js updated');
} else {
  console.log('Already updated');
}
