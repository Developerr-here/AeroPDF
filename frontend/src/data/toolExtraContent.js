export const TOOL_EXTRA_CONTENT = {
  'merge-pdf': {
    category: 'Organizer',
    icon: '🥞',
    badges: ['FAST WORKFLOW', 'PRIVATE PROCESSING', 'SERVER-OPTIMIZED'],
    input: 'PDF files',
    engine: 'Server-optimized',
    output: 'Merged PDF',
    flow: ['Upload two or more PDFs', 'Arrange file order / rotate pages', 'Download combined result'],
    about: 'Merge PDF lets you combine multiple PDF documents, reports, invoices, or invoices into a single, organized file. Perfect for collating documents for submissions or sharing.',
    features: [
      'Combine unlimited PDF documents into one',
      'Drag and drop rows to reorder documents',
      'Rotate individual pages before compiling',
      'Encrypted transit with zero data monetization'
    ],
    whoUses: [
      'Students combining assignment sheets',
      'HR managers compiling candidate resumes',
      'Businesses organizing monthly financial statements'
    ],
    steps: [
      { title: 'Upload Files', desc: 'Select or drag and drop multiple PDF documents into the upload zone.' },
      { title: 'Reorder & Rotate', desc: 'Drag rows to rearrange page order. Rotate pages if needed.' },
      { title: 'Merge & Save', desc: 'Click "Process Files" to merge and download your single combined PDF.' }
    ],
    faqs: [
      { q: 'Is there a limit to how many files I can merge?', a: 'Free accounts can merge up to 5 files at a time. Premium accounts have no limits.' },
      { q: 'Will the formatting of my original PDFs change?', a: 'No, all layout, fonts, margins, and contents are preserved exactly as they are.' },
      { q: 'Is merging secure?', a: 'Yes, your files are processed securely and deleted automatically within 1 hour.' }
    ],
    related: ['split-pdf', 'organize-pdf', 'rotate-pdf']
  },
  'split-pdf': {
    category: 'Organizer',
    icon: '✂️',
    badges: ['EXACT PAGE EXTRACTION', 'HIGH SPEED', 'SANDBOXED'],
    input: 'Single PDF',
    engine: 'Client-side Splitter',
    output: 'Split PDFs / Zip',
    flow: ['Upload your PDF', 'Select page ranges or individual pages', 'Download split documents'],
    about: 'Split PDF allows you to extract specific pages or page ranges from a document, or save every page as a standalone PDF file. Excellent for separating chapters, sections, or slides.',
    features: [
      'Extract custom page ranges (e.g. 1-5, 8, 12)',
      'Split every page into its own individual PDF',
      'Interactive visual thumbnail selection grid',
      'Fast client-side rendering with no quality loss'
    ],
    whoUses: [
      'Teachers separating lesson plans',
      'Real estate agents isolating signature pages',
      'Contractors extracting invoice receipts'
    ],
    steps: [
      { title: 'Upload PDF', desc: 'Select a PDF document to split from your computer.' },
      { title: 'Choose Pages', desc: 'Select individual page thumbnails or choose to split every page.' },
      { title: 'Download Split', desc: 'Finalize processing and download your isolated PDF pages instantly.' }
    ],
    faqs: [
      { q: 'Can I split password-protected PDFs?', a: 'Yes, but you will need to input the password first to unlock the pages before splitting.' },
      { q: 'What is "Split every page"?', a: 'This mode saves each page of your PDF as a separate single-page document packaged inside a ZIP file.' }
    ],
    related: ['merge-pdf', 'organize-pdf', 'extract-pages']
  },
  'compress-pdf': {
    category: 'Optimization',
    icon: '📉',
    badges: ['SMART COMPRESSION', 'MAX REDUCTION', 'QUALITY PRESERVED'],
    input: 'PDF files',
    engine: 'Preset Compressor',
    output: 'Compressed PDF',
    flow: ['Upload your PDF', 'Choose compression quality level', 'Download shrunken PDF'],
    about: 'Compress PDF optimizes and shrinks the file size of your documents while maintaining readable text and image quality. Ideal for reducing attachment sizes for email submissions.',
    features: [
      'Three compression levels: Balanced, Extreme, Low',
      'Significant file size reduction up to 90%',
      'Maintains sharp text and acceptable image resolution',
      'Private sandboxed environment processing'
    ],
    whoUses: [
      'Job applicants matching job portal limits (often < 2MB)',
      'Government submissions with rigid size caps',
      'Archivists saving disk space on large documents'
    ],
    steps: [
      { title: 'Upload Document', desc: 'Select or drag your PDF file into the upload dropzone.' },
      { title: 'Select Level', desc: 'Choose Balanced (recommended), Extreme (lowest size), or Low.' },
      { title: 'Optimize & Save', desc: 'Process the document and download the shrunken PDF file.' }
    ],
    faqs: [
      { q: 'Will my images look blurry?', a: 'Balanced mode maintains excellent visibility. Extreme mode may degrade high-res images to maximize storage saving.' },
      { q: 'Can I compress scanned PDFs?', a: 'Yes, our compressor works exceptionally well on heavy scanned documents.' }
    ],
    related: ['merge-pdf', 'ocr-pdf', 'protect-pdf']
  },
  'ocr-pdf': {
    category: 'Text Recognition',
    icon: '🔍',
    badges: ['SEARCHABLE PDF', 'ACCURATE TEXT', 'MULTI-LANGUAGE'],
    input: 'Scanned PDF',
    engine: 'Tesseract OCR Engine',
    output: 'Searchable PDF',
    flow: ['Upload scanned PDF document', 'Wait for text recognition to complete', 'Download searchable PDF'],
    about: 'OCR PDF processes scanned documents and images to recognize written text, embedding an invisible searchable text layer. This lets you search, copy, and select text in the PDF.',
    features: [
      'Extract searchable text from image-only PDFs',
      'Preserve original page formatting and layouts',
      'Allows copy-pasting of text from scanned books/records',
      'Runs securely on server with automated cleanup'
    ],
    whoUses: [
      'Lawyers processing scanned court filings',
      'Researchers search-enabling digital archive books',
      'Data entry specialists copy-pasting scanned receipts'
    ],
    steps: [
      { title: 'Upload Scanned File', desc: 'Select your scanned, non-searchable PDF file.' },
      { title: 'Apply OCR', desc: 'Process the document to run character recognition.' },
      { title: 'Save & Copy', desc: 'Download your searchable PDF and select text directly.' }
    ],
    faqs: [
      { q: 'What is OCR?', a: 'OCR stands for Optical Character Recognition. It translates image pixels of characters into editable machine text.' },
      { q: 'Will OCR make my file size larger?', a: 'Only slightly, as it only adds a text layer underneath the existing images.' }
    ],
    related: ['compress-pdf', 'pdf-to-word', 'edit-pdf']
  },
  'jpg-to-pdf': {
    category: 'Converter',
    icon: '🖼️',
    badges: ['IMAGE CONVERTER', 'GRID SORT', 'CUSTOM MARGINS'],
    input: 'JPG / PNG / GIF',
    engine: 'Layout Engine',
    output: 'PDF Document',
    flow: ['Upload one or more images', 'Set page layout and dimensions', 'Download compiled PDF'],
    about: 'JPG to PDF compiles your photos, screenshots, or drawings into a neat, single PDF document. You can sort images, configure page sizing (A4/Letter), and set margins.',
    features: [
      'Convert JPG, JPEG, PNG, and GIF to PDF',
      'Rearrange images visually in a grid',
      'Customize page size (A4, Letter, Fit)',
      'Adjust orientation (Portrait, Landscape)'
    ],
    whoUses: [
      'Students scanning hand-written notes via photos',
      'Developers creating PDF mockups from screenshots',
      'Receipt-collectors organizing monthly expenditures'
    ],
    steps: [
      { title: 'Upload Images', desc: 'Select one or multiple photos to convert.' },
      { title: 'Configure Pages', desc: 'Choose page size and orientation on the right sidebar.' },
      { title: 'Compile & Save', desc: 'Build and download your unified PDF document.' }
    ],
    faqs: [
      { q: 'Does it compress the images?', a: 'No, it embeds images in their full original resolution unless compressed subsequently.' }
    ],
    related: ['pdf-to-png', 'merge-pdf', 'edit-pdf']
  },
  'edit-pdf': {
    category: 'Editor',
    icon: '✍️',
    badges: ['TEXT STAMP', 'ANNOTATIONS', 'FREE-FORM'],
    input: 'PDF files',
    engine: 'Vector Overlay Engine',
    output: 'Annotated PDF',
    flow: ['Upload your PDF document', 'Type text and click to stamp it on pages', 'Download updated PDF'],
    about: 'Edit PDF lets you stamp text overlays, insert dates, or annotate pages visually. Perfect for adding notes, comments, or headers onto pre-existing documents.',
    features: [
      'Stamp text overlays anywhere on document pages',
      'Configure font sizes dynamically',
      'Remove stamps with a simple click',
      'Fast client-side vector placement'
    ],
    whoUses: [
      'Editors giving feedback on PDF drafts',
      'Accountants writing check numbers on receipts',
      'Managers stamping "APPROVED" signatures'
    ],
    steps: [
      { title: 'Upload PDF', desc: 'Select the PDF document you want to write on.' },
      { title: 'Stamp Text', desc: 'Type your overlay text, select size, and click on page to place.' },
      { title: 'Save File', desc: 'Click process to bake stamps into the PDF and download.' }
    ],
    faqs: [
      { q: 'Can I edit the existing text in the PDF?', a: 'Currently, this tool overlays new text and annotations. To replace original text, use an OCR to Word converter first.' }
    ],
    related: ['add-watermark', 'sign-pdf', 'redact-pdf']
  },
  'ai-pdf-assistant': {
    category: 'AI Tool',
    icon: '🔮',
    badges: ['AI SUMMARIZER', 'AI CHATBOT', 'STUDY GUIDES'],
    input: 'PDF files',
    engine: 'Grok / Groq Serverless AI',
    output: 'AI Insights Text',
    flow: ['Upload a text-based PDF', 'Select AI Mode (Chat, Summarize, Notes)', 'Read and copy generated answers'],
    about: 'AI PDF Assistant harnesses state-of-the-art Large Language Models to chat with, summarize, translate, or generate study notes from your PDF documents. Save hours of reading.',
    features: [
      'Detailed, structured executive summaries',
      'Interactive chat to ask specific document questions',
      'Instant translation to 10+ languages',
      'Automatic generation of revision notes and study quizzes'
    ],
    whoUses: [
      'Students analyzing long research papers and textbooks',
      'Professionals reviewing complex corporate reports',
      'Researchers translation-checking international papers'
    ],
    steps: [
      { title: 'Upload Document', desc: 'Select a text-rich PDF document.' },
      { title: 'Select AI Feature', desc: 'Choose summarize, chat, translate, or study notes.' },
      { title: 'Get Insights', desc: 'Submit and read the generated response on screen.' }
    ],
    faqs: [
      { q: 'What is the file size limit for AI tools?', a: 'Free accounts can upload PDFs up to 10MB. Text content is extracted securely.' },
      { q: 'Is my data secure with the AI?', a: 'Yes, we do not store your documents permanently or use them to train AI models.' }
    ],
    related: ['ocr-pdf', 'pdf-to-word', 'compress-pdf']
  },
  'background-remover': {
    category: 'AI Image',
    icon: '🎨',
    badges: ['BACKGROUND REMOVER', 'PNG EXPORT', 'AUTOMATIC SUBJECT ISOLATION'],
    input: 'JPG / PNG Image',
    engine: 'Serverless Segmentation API',
    output: 'Transparent PNG',
    flow: ['Upload your subject image', 'Wait for AI to process background removal', 'Download transparent PNG'],
    about: 'Background Remover automatically isolates the primary subject (person, product, animal) in your photo and removes the background, returning a transparent PNG file.',
    features: [
      'Fully automatic background isolation',
      'Clean edge detection around hair and clothing',
      'Export directly to high-quality transparent PNG',
      'No manual drawing or masking required'
    ],
    whoUses: [
      'E-commerce merchants isolating product photos',
      'Graphic designers preparing subject cutouts',
      'Social media creators making profile avatars'
    ],
    steps: [
      { title: 'Upload Image', desc: 'Select a clear JPEG/PNG image to cut out.' },
      { title: 'AI Isolates', desc: 'Wait a few seconds while our AI calculates the subject mask.' },
      { title: 'Download PNG', desc: 'Download your clean cutout image with transparent backing.' }
    ],
    faqs: [
      { q: 'Does this work on complex backgrounds?', a: 'Yes, our serverless segmentation models handle diverse backgrounds extremely well.' }
    ],
    related: ['image-upscaler', 'jpg-to-pdf', 'pdf-to-png']
  },
  'image-upscaler': {
    category: 'AI Image',
    icon: '🔎',
    badges: ['RESOLUTION BOOSTER', 'QUALITY ENHANCER', 'DETAILED RESCALING'],
    input: 'Image files',
    engine: 'Super-Resolution AI',
    output: 'Upscaled Image',
    flow: ['Upload low-res image', 'Select upscale factor (2x or 4x)', 'Download enhanced image'],
    about: 'Image Upscaler uses advanced AI Super-Resolution models to enlarge and boost the details of low-resolution images, generating crisp, sharp details without simple pixelation.',
    features: [
      'Upscale images by 2x or 4x resolution',
      'Synthesize crisp details rather than blurring pixels',
      'Perfect for enlarging vintage photos or small graphics',
      'Supports standard PNG and JPEG formats'
    ],
    whoUses: [
      'Print-on-demand creators upscaling design assets',
      'Family historians restoring old digital images',
      'Designers upscaling small logos and icons'
    ],
    steps: [
      { title: 'Upload Graphic', desc: 'Select the low-resolution photo to enhance.' },
      { title: 'Select Factor', desc: 'Choose 2x (double size) or 4x (ultra HD) on the sidebar.' },
      { title: 'Upscale & Download', desc: 'Process the image and download the enhanced file.' }
    ],
    faqs: [
      { q: 'Will it look fake?', a: 'Our models are trained on real details, offering highly natural enhancements.' }
    ],
    related: ['background-remover', 'jpg-to-pdf', 'pdf-to-png']
  }
};

export function getExtraContentForTool(toolId, toolName = 'Document Tool', toolDesc = 'Manage your documents easily.') {
  if (TOOL_EXTRA_CONTENT[toolId]) {
    return TOOL_EXTRA_CONTENT[toolId];
  }

  let category = 'Utility';
  let icon = '🛠️';
  if (toolId.includes('pdf-to-') || toolId.includes('-to-pdf')) {
    category = 'Converter';
    icon = '🔄';
  } else if (toolId === 'sign-pdf' || toolId === 'protect-pdf' || toolId === 'unlock-pdf' || toolId === 'redact-pdf') {
    category = 'Security';
    icon = '🔒';
  } else if (toolId === 'rotate-pdf' || toolId === 'crop-pdf' || toolId === 'page-numbers') {
    category = 'Editor';
    icon = '📏';
  }

  return {
    category: category,
    icon: icon,
    badges: ['SECURE PROCESSING', 'HIGH SPEED', 'ZERO TRUST'],
    input: 'Document files',
    engine: 'Local Compiler',
    output: 'Processed PDF',
    flow: ['Upload your file', 'Apply tool modifications', 'Download output document'],
    about: `${toolName} provides a fast, secure online utility to ${toolDesc.toLowerCase()}`,
    features: [
      `Easily ${toolDesc.toLowerCase()}`,
      'Private client-side processing with strict encryption',
      'No registration or signup required to download',
      'Maintains original document styling and fonts'
    ],
    whoUses: [
      'Business professionals managing digital invoices',
      'Students editing academic submissions',
      'Remote teams organizing sharing workflows'
    ],
    steps: [
      { title: 'Upload File', desc: 'Select a file to process from your computer.' },
      { title: 'Process Options', desc: 'Configure processing choices in the settings sidebar.' },
      { title: 'Download Result', desc: 'Bake options into the file and download the output.' }
    ],
    faqs: [
      { q: 'Is my data secure?', a: 'Yes, your files are processed securely and deleted automatically within 1 hour.' },
      { q: 'Do I need an account to use this?', a: 'No, using this utility is completely free and account-free.' }
    ],
    related: ['merge-pdf', 'split-pdf', 'compress-pdf']
  };
}
