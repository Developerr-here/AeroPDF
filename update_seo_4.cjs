const fs = require('fs');

const seoUpdates = {
  '/html-to-pdf': { title: 'Convert HTML to PDF | Web Page to PDF Converter', desc: 'Convert HTML to PDF online for free with PDFBundles. Turn web pages into PDF documents and download them in seconds.' },
  '/excel-to-pdf': { title: 'Convert Excel to PDF | XLSX to PDF converter Free', desc: 'Convert Excel to PDF online for free with PDFBundles. Turn XLSX spreadsheets into PDF documents and download them in seconds.' },
  '/ppt-to-pdf': { title: 'Convert PPT to PDF | PowerPoint to PDF converter', desc: 'Convert PPT to PDF online for free with PDFBundles. Turn PowerPoint presentations into PDF documents and download them in seconds.' },
  '/word-to-pdf': { title: 'Convert Word to PDF Free | DOCX to PDF Converter', desc: 'Convert Word to PDF online for free with PDFBundles. Turn DOCX files into PDF documents and download them in seconds.' },
  '/jpg-to-pdf': { title: 'JPG to PDF Converter | Convert JPG Images to PDF', desc: 'Convert JPG to PDF online for free with PDFBundles. Combine JPG or PNG images into one PDF document and download it in seconds.' }
};

let seo = fs.readFileSync('c:/Projects/pdf/seo-config.js', 'utf8');

for (const [key, val] of Object.entries(seoUpdates)) {
  const regex = new RegExp(`'${key}': \\{.*?\\}`, 'g');
  seo = seo.replace(regex, `'${key}': { title: '${val.title}', desc: '${val.desc}' }`);
}
fs.writeFileSync('c:/Projects/pdf/seo-config.js', seo);
console.log('seo-config.js updated');

const addition = `
TOOL_EXTRA_CONTENT['html-to-pdf'] = {
  ...TOOL_EXTRA_CONTENT['html-to-pdf'],
  seoH1: 'Convert HTML to PDF Online for Free',
  seoH2_1: 'How This Web Page to PDF Converter Works',
  seoH2_1Desc: 'Paste in a URL or upload your HTML file, and the tool renders the page before converting it into a PDF. As a web page to PDF converter, it keeps layout, images, and text formatting intact, giving you a download link for the finished file within seconds.',
  seoH2_2: 'Why Save a Web Page as PDF',
  seoH2_2Desc: 'Web pages can change or disappear entirely, so saving one as a PDF keeps a permanent, shareable copy of what you saw at that moment. Using a web page to PDF converter is also useful for saving receipts, confirmation pages, or articles you want to read later without needing an internet connection.',
  seoFaqTitle: 'Frequently Ask Questions About HTML to PDF Converter',
  seoFaqs: [
    { q: 'How do I convert an HTML file or web page to PDF?', a: 'Paste in the URL of the page you want to save, or upload your HTML file directly, and the tool renders it before converting it into a PDF. A download link is ready within seconds, with no software installation needed.' },
    { q: 'Will the PDF look the same as the original web page?', a: 'Yes, the tool renders the page as it would appear in a browser before converting it, so layout, images, and text keep their original formatting in the finished PDF.' },
    { q: 'Can I save a web page as PDF before it changes or gets taken down?', a: 'Yes, converting a web page to PDF captures a permanent copy of the content at that moment, which is useful for archiving articles, saving receipts, or keeping a record of a page that might be updated or removed later.' },
    { q: 'Is it free to convert HTML to PDF online?', a: 'Yes, converting HTML files or web pages to PDF with PDFBundles is completely free, with no account, email sign up, or software download required.' }
  ],
  seoSchema: \`{
"@context": "https://schema.org",
"@graph": [
{
"@type": "WebPage",
"@id": "https://pdfbundles.com/html-to-pdf#webpage",
"url": "https://pdfbundles.com/html-to-pdf",
"name": "Convert HTML to PDF Online Free | PDFBundles",
"description": "Convert HTML to PDF online for free with PDFBundles. Turn web pages into PDF documents and download them in seconds.",
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
"@id": "https://pdfbundles.com/html-to-pdf#faq",
"mainEntity": [
{
"@type": "Question",
"name": "How do I convert an HTML file or web page to PDF?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Paste in the URL of the page you want to save, or upload your HTML file directly, and the tool renders it before converting it into a PDF. A download link is ready within seconds, with no software installation needed."
}
},
{
"@type": "Question",
"name": "Will the PDF look the same as the original web page?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes, the tool renders the page as it would appear in a browser before converting it, so layout, images, and text keep their original formatting in the finished PDF."
}
},
{
"@type": "Question",
"name": "Can I save a web page as PDF before it changes or gets taken down?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes, converting a web page to PDF captures a permanent copy of the content at that moment, which is useful for archiving articles, saving receipts, or keeping a record of a page that might be updated or removed later."
}
},
{
"@type": "Question",
"name": "Is it free to convert HTML to PDF online?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes, converting HTML files or web pages to PDF with PDFBundles is completely free, with no account, email sign up, or software download required."
}
}
]
}
]
}\`
};

TOOL_EXTRA_CONTENT['excel-to-pdf'] = {
  ...TOOL_EXTRA_CONTENT['excel-to-pdf'],
  seoH1: 'Convert Excel to PDF Online for Free',
  seoH2_1: 'How This XLSX to PDF Converter Works',
  seoH2_1Desc: 'Upload your spreadsheet, and the tool processes it automatically, keeping your columns, rows, and formatting intact. As an XLSX to PDF converter, it handles the conversion in seconds and gives you a download link for the finished file right away.',
  seoH2_2: 'Why Convert a Spreadsheet to PDF',
  seoH2_2Desc: 'A spreadsheet can display differently depending on the software or screen size it\\'s opened on, while a PDF keeps the layout fixed no matter where it\\'s viewed. Using an XLSX to PDF converter before sharing figures means the recipient sees your data exactly as intended, without being able to accidentally edit the formulas or values.',
  seoFaqTitle: 'Frequently Ask Questions About Online Excel to PDF Converter',
  seoFaqs: [
    { q: 'How do I convert an Excel spreadsheet to PDF?', a: 'Upload your XLSX file to the tool, and it converts it into a PDF automatically while keeping your columns, rows, and formatting intact. A download link is ready within seconds, with no software installation needed.' },
    { q: 'Will converting Excel to PDF cut off any of my columns?', a: 'The tool preserves your spreadsheet\\'s layout during conversion, keeping columns and rows readable rather than cutting them off. If your original sheet is very wide, it\\'s worth checking the print area in Excel beforehand so the PDF captures everything you need.' },
    { q: 'Can I convert a spreadsheet to PDF without Excel installed?', a: 'Yes, this tool works entirely in your browser, so you don\\'t need Excel or any other software installed on your device. Simply upload your XLSX file and download the converted PDF once processing is complete.' },
    { q: 'Is it free to convert Excel to PDF online?', a: 'Yes, converting Excel spreadsheets to PDF with PDFBundles is completely free, with no account, email sign up, or software download required.' }
  ],
  seoSchema: \`{
"@context": "https://schema.org",
"@graph": [
{
"@type": "WebPage",
"@id": "https://pdfbundles.com/excel-to-pdf#webpage",
"url": "https://pdfbundles.com/excel-to-pdf",
"name": "Convert Excel to PDF Online Free | PDFBundles",
"description": "Convert Excel to PDF online for free with PDFBundles. Turn XLSX spreadsheets into PDF documents and download them in seconds.",
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
"@id": "https://pdfbundles.com/excel-to-pdf#faq",
"mainEntity": [
{
"@type": "Question",
"name": "How do I convert an Excel spreadsheet to PDF?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Upload your XLSX file to the tool, and it converts it into a PDF automatically while keeping your columns, rows, and formatting intact. A download link is ready within seconds, with no software installation needed."
}
},
{
"@type": "Question",
"name": "Will converting Excel to PDF cut off any of my columns?",
"acceptedAnswer": {
"@type": "Answer",
"text": "The tool preserves your spreadsheet's layout during conversion, keeping columns and rows readable rather than cutting them off. If your original sheet is very wide, it's worth checking the print area in Excel beforehand so the PDF captures everything you need."
}
},
{
"@type": "Question",
"name": "Can I convert a spreadsheet to PDF without Excel installed?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes, this tool works entirely in your browser, so you don't need Excel or any other software installed on your device. Simply upload your XLSX file and download the converted PDF once processing is complete."
}
},
{
"@type": "Question",
"name": "Is it free to convert Excel to PDF online?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes, converting Excel spreadsheets to PDF with PDFBundles is completely free, with no account, email sign up, or software download required."
}
}
]
}
]
}\`
};

TOOL_EXTRA_CONTENT['ppt-to-pdf'] = {
  ...TOOL_EXTRA_CONTENT['ppt-to-pdf'],
  seoH1: 'Convert PPT to PDF Online for Free',
  seoH2_1: 'How This PowerPoint to PDF Converter Works',
  seoH2_1Desc: 'Upload your PPTX file, and the tool processes it automatically, keeping your slide layout, fonts, and images intact. As a PowerPoint to PDF converter, it handles the conversion in seconds and gives you a download link for the finished file right away.',
  seoH2_2: 'Why Convert a Presentation to PDF',
  seoH2_2Desc: 'Slides can shift or break when opened on a device without the right fonts or software installed, while a PDF looks identical no matter where it\\'s opened. Using a PowerPoint to PDF converter before sending a deck means the recipient sees your slides exactly as designed, without needing PowerPoint at all.',
  seoFaqTitle: 'Frequently Ask Questions About PPT to PDF Converter',
  seoFaqs: [
    { q: 'How do I convert a PowerPoint presentation to PDF?', a: 'Upload your PPTX file to the tool, and it converts it into a PDF automatically while keeping your slide layout, fonts, and images intact. A download link is ready within seconds, with no software installation needed.' },
    { q: 'Will converting PPT to PDF change my slide layout?', a: 'No, the tool preserves your original slide design, fonts, and formatting during conversion, so the PDF looks the same as the source presentation. This is one of the main reasons people convert to PDF before sharing a deck.' },
    { q: 'Can I convert a PowerPoint file to PDF without PowerPoint installed?', a: 'Yes, this tool works entirely in your browser, so you don\\'t need PowerPoint or any other software installed on your device. Simply upload your PPTX file and download the converted PDF once processing is complete.' },
    { q: 'Is it free to convert PPT to PDF online?', a: 'Yes, converting PowerPoint presentations to PDF with PDFBundles is completely free, with no account, email sign up, or software download required.' }
  ],
  seoSchema: \`{
"@context": "https://schema.org",
"@graph": [
{
"@type": "WebPage",
"@id": "https://pdfbundles.com/ppt-to-pdf#webpage",
"url": "https://pdfbundles.com/ppt-to-pdf",
"name": "Convert PPT to PDF Online Free | PDFBundles",
"description": "Convert PPT to PDF online for free with PDFBundles. Turn PowerPoint presentations into PDF documents and download them in seconds.",
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
"@id": "https://pdfbundles.com/ppt-to-pdf#faq",
"mainEntity": [
{
"@type": "Question",
"name": "How do I convert a PowerPoint presentation to PDF?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Upload your PPTX file to the tool, and it converts it into a PDF automatically while keeping your slide layout, fonts, and images intact. A download link is ready within seconds, with no software installation needed."
}
},
{
"@type": "Question",
"name": "Will converting PPT to PDF change my slide layout?",
"acceptedAnswer": {
"@type": "Answer",
"text": "No, the tool preserves your original slide design, fonts, and formatting during conversion, so the PDF looks the same as the source presentation. This is one of the main reasons people convert to PDF before sharing a deck."
}
},
{
"@type": "Question",
"name": "Can I convert a PowerPoint file to PDF without PowerPoint installed?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes, this tool works entirely in your browser, so you don't need PowerPoint or any other software installed on your device. Simply upload your PPTX file and download the converted PDF once processing is complete."
}
},
{
"@type": "Question",
"name": "Is it free to convert PPT to PDF online?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes, converting PowerPoint presentations to PDF with PDFBundles is completely free, with no account, email sign up, or software download required."
}
}
]
}
]
}\`
};

TOOL_EXTRA_CONTENT['word-to-pdf'] = {
  ...TOOL_EXTRA_CONTENT['word-to-pdf'],
  seoH1: 'Convert Word to PDF Online for Free',
  seoH2_1: 'How This DOCX to PDF Converter Works',
  seoH2_1Desc: 'Upload your Word file, and the tool processes it automatically, preserving your original formatting, fonts, and page layout. As a DOCX to PDF converter, it handles the conversion in seconds and gives you a download link for the finished file right away.',
  seoH2_2: 'Why Convert Word Documents to PDF',
  seoH2_2Desc: 'A PDF displays consistently no matter what device or software someone opens it with, while a Word file can shift its layout depending on the fonts installed or the version of Word being used. Using a DOCX to PDF converter before sending a document means the recipient sees exactly what you intended, without needing Word installed at all.',
  seoFaqTitle: 'Frequently Ask Questions About Free Word to PDF Converter',
  seoFaqs: [
    { q: 'How do I convert a Word document to PDF?', a: 'Upload your DOCX file to the tool, and it converts it into a PDF automatically while keeping your original formatting, fonts, and layout intact. A download link is ready within seconds, with no software installation needed.' },
    { q: 'Will converting Word to PDF change my formatting?', a: 'No, the tool preserves your original layout, fonts, and spacing during conversion, so the PDF looks the same as the source document. This is one of the main reasons people convert to PDF before sharing a file, since it locks the formatting in place.' },
    { q: 'Can I convert a Word document to PDF without Microsoft Word installed?', a: 'Yes, this tool works entirely in your browser, so you don\\'t need Word or any other software installed on your device. Simply upload your DOCX file and download the converted PDF once processing is complete.' },
    { q: 'Is it free to convert Word to PDF online?', a: 'Yes, converting Word documents to PDF with PDFBundles is completely free, with no account, email sign up, or software download required.' }
  ],
  seoSchema: \`{
"@context": "https://schema.org",
"@graph": [
{
"@type": "WebPage",
"@id": "https://pdfbundles.com/word-to-pdf#webpage",
"url": "https://pdfbundles.com/word-to-pdf",
"name": "Convert Word to PDF Online Free | PDFBundles",
"description": "Convert Word to PDF online for free with PDFBundles. Turn DOCX files into PDF documents and download them in seconds.",
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
"@id": "https://pdfbundles.com/word-to-pdf#faq",
"mainEntity": [
{
"@type": "Question",
"name": "How do I convert a Word document to PDF?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Upload your DOCX file to the tool, and it converts it into a PDF automatically while keeping your original formatting, fonts, and layout intact. A download link is ready within seconds, with no software installation needed."
}
},
{
"@type": "Question",
"name": "Will converting Word to PDF change my formatting?",
"acceptedAnswer": {
"@type": "Answer",
"text": "No, the tool preserves your original layout, fonts, and spacing during conversion, so the PDF looks the same as the source document. This is one of the main reasons people convert to PDF before sharing a file, since it locks the formatting in place."
}
},
{
"@type": "Question",
"name": "Can I convert a Word document to PDF without Microsoft Word installed?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes, this tool works entirely in your browser, so you don't need Word or any other software installed on your device. Simply upload your DOCX file and download the converted PDF once processing is complete."
}
},
{
"@type": "Question",
"name": "Is it free to convert Word to PDF online?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes, converting Word documents to PDF with PDFBundles is completely free, with no account, email sign up, or software download required."
}
}
]
}
]
}\`
};

TOOL_EXTRA_CONTENT['jpg-to-pdf'] = {
  ...TOOL_EXTRA_CONTENT['jpg-to-pdf'],
  seoH1: 'Convert JPG to PDF Online for Free',
  seoH2_1: 'How to Convert JPG Images to PDF',
  seoH2_1Desc: 'Upload your JPG or PNG files, reorder them if you\\'re combining more than one, then click convert. The tool will convert JPG images to PDF instantly, compiling every image into a single document with a download link ready right away.',
  seoH2_2: 'Why Convert Images to PDF Format',
  seoH2_2Desc: 'A PDF keeps its layout consistent across every device, unlike an image file which can display differently depending on screen size or app. When you convert JPG images to PDF, you get a document that\\'s easier to print, attach to an email, or combine with other files into one organised set.',
  seoFaqTitle: 'Frequently Ask Questions About Free JPG to PDF Converter',
  seoFaqs: [
    { q: 'How do I convert a JPG image to PDF?', a: 'Upload your JPG or PNG file to the tool, and it converts it into a PDF document automatically. If you\\'re combining several images, you can arrange them in the order you want before converting. A download link is ready within seconds, with no software installation needed.' },
    { q: 'Can I convert multiple JPG images into one PDF?', a: 'Yes. You can upload several images at once and combine them into a single multi page PDF, keeping them in whatever order you set beforehand. This is useful for compiling photos, scanned pages, or a portfolio into one document.' },
    { q: 'Does converting a JPG to PDF reduce image quality?', a: 'The tool preserves the original image quality during conversion, so your photos stay sharp and clear in the resulting PDF. The file format changes, but the visual quality of the image itself is not degraded.' },
    { q: 'Is it free to convert JPG to PDF online?', a: 'Yes, converting JPG or PNG images to PDF with PDFBundles is completely free, with no account, email sign up, or software download required.' }
  ],
  seoSchema: \`{
"@context": "https://schema.org",
"@graph": [
{
"@type": "WebPage",
"@id": "https://pdfbundles.com/jpg-to-pdf#webpage",
"url": "https://pdfbundles.com/jpg-to-pdf",
"name": "JPG to PDF Converter Free | PDFBundles",
"description": "Convert JPG to PDF online for free with PDFBundles. Combine JPG or PNG images into one PDF document and download it in seconds.",
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
"@id": "https://pdfbundles.com/jpg-to-pdf#faq",
"mainEntity": [
{
"@type": "Question",
"name": "How do I convert a JPG image to PDF?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Upload your JPG or PNG file to the tool, and it converts it into a PDF document automatically. If you're combining several images, you can arrange them in the order you want before converting. A download link is ready within seconds, with no software installation needed."
}
},
{
"@type": "Question",
"name": "Can I convert multiple JPG images into one PDF?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes. You can upload several images at once and combine them into a single multi page PDF, keeping them in whatever order you set beforehand. This is useful for compiling photos, scanned pages, or a portfolio into one document."
}
},
{
"@type": "Question",
"name": "Does converting a JPG to PDF reduce image quality?",
"acceptedAnswer": {
"@type": "Answer",
"text": "The tool preserves the original image quality during conversion, so your photos stay sharp and clear in the resulting PDF. The file format changes, but the visual quality of the image itself is not degraded."
}
},
{
"@type": "Question",
"name": "Is it free to convert JPG to PDF online?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes, converting JPG or PNG images to PDF with PDFBundles is completely free, with no account, email sign up, or software download required."
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
if (!fileContent.includes("seoH1: 'Convert HTML to PDF Online for Free'")) {
  fileContent = fileContent.replace(replacementPoint, addition + '\n\n' + replacementPoint);
  fs.writeFileSync('c:/Projects/pdf/frontend/src/data/toolExtraContent.js', fileContent);
  console.log('toolExtraContent.js updated');
} else {
  console.log('Already updated');
}
