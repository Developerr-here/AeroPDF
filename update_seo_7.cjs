const fs = require('fs');

const seoUpdates = {
  '/remove-pages': { title: "Remove pages From PDF Online | 100% Free | PDFBundles", desc: "Remove pages from PDF files online for free with PDFBundles. Delete unwanted PDF pages and download the cleaned file in seconds." },
  '/split-pdf': { title: "Split PDF Files Online Free Tool | PDFBundles", desc: "Split PDF files online for free with PDFBundles. Divide large documents into separate pages or sections in seconds, no signup needed." },
  '/merge-pdf': { title: "Merge PDF Files Online Free | PDFBundles", desc: "Merge PDF files online for free with PDFBundles. Combine multiple PDFs into one document quickly, no installation or sign up required." }
};

let seo = fs.readFileSync('c:/Projects/pdf/seo-config.js', 'utf8');

for (const [key, val] of Object.entries(seoUpdates)) {
  const regex = new RegExp(`'${key}': \\{.*?\\}`, 'g');
  seo = seo.replace(regex, `'${key}': { title: "${val.title}", desc: "${val.desc}" }`);
}
fs.writeFileSync('c:/Projects/pdf/seo-config.js', seo);
console.log('seo-config.js updated');

const addition = `
TOOL_EXTRA_CONTENT['remove-pages'] = {
  ...TOOL_EXTRA_CONTENT['remove-pages'],
  seoH1: 'Remove Pages From PDF Online for Free',
  about: 'Delete unwanted pages from any PDF without downloading software or creating an account. Whether you need to remove pages from PDF files to cut out a blank sheet, drop an outdated section, or clean up a scanned document, the tool lets you preview every page and select exactly which ones to delete. Once you confirm your selection, the remaining pages are compiled into a new file, ready to download in seconds. Everything runs directly in your browser, so your original document stays intact until you\\'re ready to save the edited version.',
  seoH2_1: 'How to Delete PDF Pages in a Few Steps',
  seoH2_1Desc: 'Upload your document, then preview each page as a thumbnail so you can select exactly which ones to delete PDF pages from without guessing page numbers. Once you\\'ve made your selections, click confirm and the tool rebuilds the file automatically, leaving only the pages you chose to keep.',
  seoH2_2: 'Why Remove Pages Instead of Starting Over',
  seoH2_2Desc: 'There\\'s no need to recreate an entire document just to remove pages from PDF files that no longer belong. You can delete PDF pages such as duplicate scans, blank sheets, or outdated sections while keeping everything else in the file exactly as it was, saving you the time of rebuilding the document from scratch.',
  seoFaqTitle: 'Frequently Ask Questions About Free Tool For Page Remove from PDF',
  seoFaqs: [
    { q: 'How do I remove pages from a PDF?', a: 'Upload your file to the tool, then preview each page as a thumbnail and select the ones you want to delete. Once you confirm your choices, the remaining pages are compiled into a new file automatically, ready to download within seconds. No software installation is needed since the entire process runs in your browser.' },
    { q: 'Can I delete multiple pages from a PDF at once?', a: 'Yes. You can select several pages at the same time, whether they\\'re scattered throughout the document or grouped together, and delete them all in a single action. This saves time compared with removing pages one by one, especially in longer documents.' },
    { q: 'Will removing pages affect the rest of my document?', a: 'No, deleting pages only removes the ones you select. The remaining pages keep their original formatting, image quality, and order, so the rest of your document stays exactly as it was before editing.' },
    { q: 'Is it free to remove pages from a PDF online?', a: 'Yes, removing pages from a PDF with PDFBundles is completely free, with no account, email sign up, or software installation required.' }
  ],
  seoSchema: \`{
"@context": "https://schema.org",
"@graph": [
{
"@type": "WebPage",
"@id": "https://pdfbundles.com/remove-pages#webpage",
"url": "https://pdfbundles.com/remove-pages",
"name": "Remove Pages From PDF Online Free | PDFBundles",
"description": "Remove pages from PDF files online for free with PDFBundles. Delete unwanted PDF pages and download the cleaned file in seconds.",
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
"email": "info@pdfbundles.com ",
"contactType": "customer support"
}
},
{
"@type": "FAQPage",
"@id": "https://pdfbundles.com/remove-pages#faq",
"mainEntity": [
{
"@type": "Question",
"name": "How do I remove pages from a PDF?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Upload your file to the tool, then preview each page as a thumbnail and select the ones you want to delete. Once you confirm your choices, the remaining pages are compiled into a new file automatically, ready to download within seconds. No software installation is needed since the entire process runs in your browser."
}
},
{
"@type": "Question",
"name": "Can I delete multiple pages from a PDF at once?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes. You can select several pages at the same time, whether they're scattered throughout the document or grouped together, and delete them all in a single action. This saves time compared with removing pages one by one, especially in longer documents."
}
},
{
"@type": "Question",
"name": "Will removing pages affect the rest of my document?",
"acceptedAnswer": {
"@type": "Answer",
"text": "No, deleting pages only removes the ones you select. The remaining pages keep their original formatting, image quality, and order, so the rest of your document stays exactly as it was before editing."
}
},
{
"@type": "Question",
"name": "Is it free to remove pages from a PDF online?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes, removing pages from a PDF with PDFBundles is completely free, with no account, email sign up, or software installation required."
}
}
]
}
]
}\`
};

TOOL_EXTRA_CONTENT['split-pdf'] = {
  ...TOOL_EXTRA_CONTENT['split-pdf'],
  seoH1: 'Split PDF Files Online in Seconds',
  about: 'Break a large PDF into smaller, more manageable files without installing anything. Whether you need to pull out a single page, separate a document into chapters, or divide a scanned file into individual sections, our tool handles it directly in your browser. Upload your file, choose the pages or ranges you want, and download each new PDF straight away. There\\'s no account needed and no limit on how many times you can use it, making it just as useful for a one off task as for regular document management.',
  seoH2_1: 'How to Divide PDF Pages Into Separate Files',
  seoH2_1Desc: 'Select the file you want to split, then choose whether to divide PDF pages individually or by custom page ranges. The tool processes your selection instantly and generates a separate download for each new file. Since everything runs in your browser, your document isn\\'t stored anywhere once you\\'ve downloaded your results.',
  seoH2_2: 'When Splitting a PDF Comes in Handy',
  seoH2_2Desc: 'Large contracts, scanned books, and multi report files are easier to manage once you divide PDF pages into smaller sections. You might only need to send one chapter of a report, or pull a signature page out of a longer contract. Splitting first means you\\'re only sharing exactly what\\'s needed, rather than the entire original document.',
  seoFaqTitle: 'Frequently Ask Questions About Free PDF Files Splitting Tool',
  seoFaqs: [
    { q: 'How do I split a PDF into multiple files?', a: 'Upload your PDF to the splitter, then choose whether you want to separate every page individually or select custom page ranges. Once you confirm your selection, the tool creates a new file for each section and gives you a download link straight away. The process takes seconds regardless of how many pages the original document has, and no software installation is required since everything runs in your browser.' },
    { q: 'Can I split a PDF by a specific page range?', a: 'Yes. Instead of splitting every page into its own file, you can choose a custom range, for example pages 4 to 9, and export just that section as a single PDF. This is useful when you only need to share one chapter, one invoice, or one section of a longer document rather than the whole file.' },
    { q: 'Does splitting a PDF reduce its quality?', a: 'No, splitting a PDF doesn\\'t affect the quality of the content inside it. Text stays sharp, images keep their original resolution, and formatting carries over exactly as it appeared in the source file. The split simply separates the pages into new files without re-compressing or altering anything within them.' },
    { q: 'Is it safe to split a PDF online?', a: 'Yes, as long as you use a tool that processes files securely and doesn\\'t store them after you\\'ve downloaded your results. Reputable browser-based splitters handle the file temporarily during conversion and remove it afterwards, so there\\'s no ongoing storage of your document on their servers.' }
  ],
  seoSchema: \`{
"@context": "https://schema.org",
"@graph": [
{
"@type": "WebPage",
"@id": "https://pdfbundles.com/split-pdf#webpage",
"url": "https://pdfbundles.com/split-pdf",
"name": "Split PDF Files Online Free | PDFBundles",
"description": "Split PDF files online for free with PDFBundles. Divide large documents into separate pages or sections in seconds, no signup needed.",
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
"@id": "https://pdfbundles.com/split-pdf#faq",
"mainEntity": [
{
"@type": "Question",
"name": "How do I split a PDF into multiple files?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Upload your PDF to the splitter, then choose whether you want to separate every page individually or select custom page ranges. Once you confirm your selection, the tool creates a new file for each section and gives you a download link straight away. The process takes seconds regardless of how many pages the original document has, and no software installation is required since everything runs in your browser."
}
},
{
"@type": "Question",
"name": "Can I split a PDF by a specific page range?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes. Instead of splitting every page into its own file, you can choose a custom range, for example pages 4 to 9, and export just that section as a single PDF. This is useful when you only need to share one chapter, one invoice, or one section of a longer document rather than the whole file."
}
},
{
"@type": "Question",
"name": "Does splitting a PDF reduce its quality?",
"acceptedAnswer": {
"@type": "Answer",
"text": "No, splitting a PDF doesn't affect the quality of the content inside it. Text stays sharp, images keep their original resolution, and formatting carries over exactly as it appeared in the source file. The split simply separates the pages into new files without re-compressing or altering anything within them."
}
},
{
"@type": "Question",
"name": "Is it safe to split a PDF online?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes, as long as you use a tool that processes files securely and doesn't store them after you've downloaded your results. Reputable browser-based splitters handle the file temporarily during conversion and remove it afterwards, so there's no ongoing storage of your document on their servers."
}
}
]
}
]
}\`
};

TOOL_EXTRA_CONTENT['merge-pdf'] = {
  ...TOOL_EXTRA_CONTENT['merge-pdf'],
  seoH1: 'Merge PDF Files Online for Free',
  about: 'Combine multiple PDF documents into a single file in seconds using our free online merge tool. There\\'s no software to install and no account needed, simply upload your files, arrange them in the order you want, and download your merged PDF straight away. The tool works directly in your browser, keeping the process quick and straightforward for both one off jobs and regular use.',
  seoH2_1: 'How to Combine PDF Documents in a Few Clicks',
  seoH2_1Desc: 'Using our merge tool is straightforward even if you\\'ve never worked with PDFs before. Upload the files you want to join, drag them into the order you need, then click merge to combine PDF documents into a single, ready to download file. The whole process happens in your browser, so nothing is installed on your device and your files aren\\'t left sitting on a server afterwards.',
  seoH2_2: 'Why Choose Our PDF Merger',
  seoH2_2Desc: 'Our tool was built to make it easy to merge PDF files online without losing quality or formatting along the way. Pages, images, and fonts stay exactly as they were in the original documents, so the merged file is ready to send or print straight away. It\\'s free to use, works on any device with a browser, and doesn\\'t require an account or email sign up.',
  seoFaqTitle: 'Frequently Ask Questions About Free PDF Merge Tool',
  seoFaqs: [
    { q: 'Can you convert a single file into multiple PDFs?', a: 'Yes. You can split a single PDF into multiple PDF files by choosing specific pages or page ranges. For example, a 50-page document can be divided into individual pages, chapters, or custom sections depending on your needs. Splitting a PDF is useful when you only need to share part of a document, organize reports into separate files, or reduce the size of large PDFs for easier sharing. Simply upload your file, select how you want to split it, and download each new PDF in seconds. Most online PDF splitters work directly in your browser, so no software installation is required.' },
    { q: 'How does converting your document into a PDF affect the file size?', a: 'Converting a document to PDF may increase or decrease the file size depending on the document\\'s content. Text-based files are usually compact, while documents containing high-resolution images, graphics, or embedded fonts may result in larger PDFs. Many modern PDF converters automatically optimize images and compress data during conversion to help reduce file size while preserving document quality. If your PDF is still too large, you can further reduce its size using a PDF compression tool before sharing, uploading, or emailing the file.' },
    { q: 'How do I convert text into PDF?', a: 'To convert text into a PDF, paste or upload your text into a PDF converter and create the PDF with a single click. The converter formats your content into a portable document that maintains the same layout across computers, smartphones, and tablets. PDF is one of the most widely used document formats because it preserves formatting and is easy to print, share, and archive. It\\'s commonly used for resumes, letters, contracts, invoices, reports, assignments, and other professional documents. Most online text-to-PDF converters work in your browser and don\\'t require any software installation.' },
    { q: 'What is the best free software for splitting or merging PDF files?', a: 'The best free tool for splitting or merging PDF files is one that works directly in your browser, since it saves you from downloading software and works the same way on any device. Look for a tool that lets you reorder pages before merging, select custom page ranges when splitting, and keeps your original formatting and image quality intact. Speed also matters, most browser-based tools process files in seconds regardless of document size. PDFBundles offers both merge and split tools for free with no account or email sign up required, making it a straightforward option for one off tasks or regular use.' }
  ],
  seoSchema: \`{
"@context": "https://schema.org",
"@graph": [
{
"@type": "WebPage",
"@id": "https://pdfbundles.com/merge-pdf#webpage",
"url": "https://pdfbundles.com/merge-pdf",
"name": "Merge PDF Files Online Free | PDFBundles",
"description": "Merge PDF files online for free with PDFBundles. Combine multiple PDFs into one document quickly, no installation or sign up required.",
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
"@id": "https://pdfbundles.com/merge-pdf#faq",
"mainEntity": [
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
]
}\`
};
`;

let fileContent = fs.readFileSync('c:/Projects/pdf/frontend/src/data/toolExtraContent.js', 'utf8');
const replacementPoint = "export function getExtraContentForTool";
fileContent = fileContent.replace(replacementPoint, addition + '\n\n' + replacementPoint);
fs.writeFileSync('c:/Projects/pdf/frontend/src/data/toolExtraContent.js', fileContent);
console.log('Done!');
