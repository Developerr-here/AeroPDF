const fs = require('fs');

let content = fs.readFileSync('c:/Projects/pdf/frontend/src/data/toolExtraContent.js', 'utf8');

const replacement = `TOOL_EXTRA_CONTENT['compare-pdf'] = {
  category: 'Utility',
  icon: '⚖️',
  badges: ['COMPARISON', 'HIGHLIGHT CHANGES', 'SIDE-BY-SIDE'],
  input: 'Two PDF Files',
  engine: 'Diff Engine',
  output: 'Visual Diff',
  flow: ['Upload Original PDF', 'Upload Modified PDF', 'View Differences'],
  about: 'Compare PDF files online for free. See side by side differences between two PDF documents.',
  features: ['Side-by-side comparison', 'Highlight text changes', 'Private client-side processing'],
  whoUses: ['Lawyers', 'Editors', 'Students'],
  steps: [
    { title: 'Upload Files', desc: 'Select both original and modified PDFs.' },
    { title: 'Compare', desc: 'Click compare to find differences.' },
    { title: 'Review', desc: 'Review highlighted changes.' }
  ],
  faqs: [],
  related: ['merge-pdf', 'split-pdf'],
  ...(TOOL_EXTRA_CONTENT['compare-pdf'] || {})
};

TOOL_EXTRA_CONTENT['redact-pdf'] = {
  category: 'Security',
  icon: '⬛',
  badges: ['REDACT', 'SECURE', 'BLACKOUT'],
  input: 'PDF Document',
  engine: 'Vector Redaction',
  output: 'Redacted PDF',
  flow: ['Upload PDF', 'Draw Redaction Boxes', 'Download Redacted PDF'],
  about: 'Redact PDF online for free with PDFBundles. Black out sensitive information permanently.',
  features: ['Permanent blackout', 'Secure client-side processing', 'Remove sensitive text and images'],
  whoUses: ['Lawyers', 'HR Professionals', 'Accountants'],
  steps: [
    { title: 'Upload PDF', desc: 'Select the file to redact.' },
    { title: 'Draw Boxes', desc: 'Draw boxes over sensitive content.' },
    { title: 'Download', desc: 'Save the securely redacted PDF.' }
  ],
  faqs: [],
  related: ['protect-pdf', 'unlock-pdf', 'sign-pdf'],
  ...(TOOL_EXTRA_CONTENT['redact-pdf'] || {})
};`;

// We previously appended to the end just before getExtraContentForTool.
// We can just append this fix right before export function getExtraContentForTool as well.
const splitStr = "export function getExtraContentForTool";
const parts = content.split(splitStr);
content = parts[0] + '\n' + replacement + '\n\n' + splitStr + parts[1];

fs.writeFileSync('c:/Projects/pdf/frontend/src/data/toolExtraContent.js', content);
console.log('Fixed missing UI properties for compare and redact.');
