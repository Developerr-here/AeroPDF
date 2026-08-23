const fs = require('fs');

const seoUpdates = {
  '/sign-pdf': { title: 'Sign PDF Online | Add Electronic Signature to PDF', desc: 'Sign PDF online for free with PDFBundles. Add an electronic signature to your document and download the signed file in seconds.' },
  '/unlock-pdf': { title: 'Unlock PDF Online | Remove PDF Password Protection', desc: 'Unlock PDF online for free with PDFBundles. Remove PDF password protection and download the unlocked file in seconds.' },
  '/protect-pdf': { title: 'Protect PDF With Password | Encrypt PDF Files', desc: 'Protect PDF with a password online for free with PDFBundles. Encrypt PDF files and download the secured document in seconds.' },
  '/edit-pdf': { title: 'Edit PDF Online | Add text to PDF Free', desc: 'Edit PDF online for free with PDFBundles. Add text and annotations to your PDF and download the updated file in seconds.' },
  '/crop-pdf': { title: 'Crop PDF Online | Trim PDF Page Margins', desc: 'Crop PDF online for free with PDFBundles. Trim PDF page margins visually and download the resized file in seconds.' }
};

let seo = fs.readFileSync('c:/Projects/pdf/seo-config.js', 'utf8');

for (const [key, val] of Object.entries(seoUpdates)) {
  const regex = new RegExp(`'${key}': \\{.*?\\}`, 'g');
  seo = seo.replace(regex, `'${key}': { title: '${val.title}', desc: '${val.desc}' }`);
}
fs.writeFileSync('c:/Projects/pdf/seo-config.js', seo);
console.log('seo-config.js updated');

const addition = `
TOOL_EXTRA_CONTENT['sign-pdf'] = {
  ...(TOOL_EXTRA_CONTENT['sign-pdf'] || {}),
  seoH1: 'Sign PDF Documents Online for Free',
  seoH2_1: 'How to Add an Electronic Signature to PDF',
  seoH2_1Desc: 'Upload your document, then draw, type, or upload an image of your signature to add electronic signature to PDF pages exactly where needed. Once placed, download the signed file, ready to send back straight away.',
  seoH2_2: 'When an E-Signature Works Instead of a Wet Signature',
  seoH2_2Desc: 'Many contracts, agreements, and forms accept an electronic signature in place of a handwritten one, which means you can add electronic signature to PDF documents and skip printing, signing, and scanning entirely. This saves time when a signed document needs to be returned the same day.',
  seoFaqTitle: 'Frequently Ask Questions About Electronic PDF Sign Tool',
  seoFaqs: [
    { q: 'How do I sign a PDF online?', a: 'Upload your document to the tool, then draw, type, or upload your signature and place it on the page where needed. Once you\\'re satisfied with the placement, download the signed file within seconds, with no software installation required.' },
    { q: 'Is an electronic signature legally valid?', a: 'Electronic signatures are legally recognised for most everyday documents in many countries, though requirements can vary depending on the type of agreement and jurisdiction involved. For highly sensitive or regulated documents, it\\'s worth checking whether an electronic signature meets the specific requirements that apply.' },
    { q: 'Can I type my signature instead of drawing it?', a: 'Yes, alongside drawing your signature by hand, you can type your name and have it displayed in a handwriting style font, or upload an image of your existing signature if you\\'d prefer.' },
    { q: 'Is it free to sign a PDF online?', a: 'Yes, signing a PDF with PDFBundles is completely free, with no account, email sign up, or software download required.' }
  ],
  seoSchema: \`{
"@context": "https://schema.org",
"@graph": [
{
"@type": "WebPage",
"@id": "https://pdfbundles.com/sign-pdf#webpage",
"url": "https://pdfbundles.com/sign-pdf",
"name": "Sign PDF Online | Add Electronic Signature to PDF",
"description": "Sign PDF online for free with PDFBundles. Add an electronic signature to your document and download the signed file in seconds.",
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
"@id": "https://pdfbundles.com/sign-pdf#faq",
"mainEntity": [
{
"@type": "Question",
"name": "How do I sign a PDF online?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Upload your document to the tool, then draw, type, or upload your signature and place it on the page where needed. Once you're satisfied with the placement, download the signed file within seconds, with no software installation required."
}
},
{
"@type": "Question",
"name": "Is an electronic signature legally valid?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Electronic signatures are legally recognised for most everyday documents in many countries, though requirements can vary depending on the type of agreement and jurisdiction involved. For highly sensitive or regulated documents, it's worth checking whether an electronic signature meets the specific requirements that apply."
}
},
{
"@type": "Question",
"name": "Can I type my signature instead of drawing it?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes, alongside drawing your signature by hand, you can type your name and have it displayed in a handwriting style font, or upload an image of your existing signature if you'd prefer."
}
},
{
"@type": "Question",
"name": "Is it free to sign a PDF online?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes, signing a PDF with PDFBundles is completely free, with no account, email sign up, or software download required."
}
}
]
}
]
}\`
};

TOOL_EXTRA_CONTENT['unlock-pdf'] = {
  ...(TOOL_EXTRA_CONTENT['unlock-pdf'] || {}),
  seoH1: 'Unlock PDF Files Online for Free',
  seoH2_1: 'How to Remove PDF Password Protection',
  seoH2_1Desc: 'Upload your protected file, and the tool works to remove PDF password protection so you can access, edit, or print the document again without restriction. Once processing finishes, download the unlocked version straight away.',
  seoH2_2: 'When You\\'ll Need to Unlock a PDF',
  seoH2_2Desc: 'People often need to remove PDF password protection from a file they created themselves after forgetting which password was used, or from a document they\\'ve been given explicit permission to edit. Unlocking it restores full access without changing anything else in the file.',
  seoFaqTitle: 'Frequently Ask Questions About PDF Password Unlock Tool',
  seoFaqs: [
    { q: 'How do I unlock a password protected PDF?', a: 'Upload your file to the tool, and it works to remove the password protecting it. Once processing is complete, you\\'ll get a download link for the unlocked file within seconds, with no software installation needed.' },
    { q: 'Can I unlock a PDF if I don\\'t know the original password?', a: 'This depends on the type of protection involved. Files locked with owner restrictions on printing or editing can generally be unlocked without the original password, but a PDF that requires a password just to open it typically needs that password to be removed.' },
    { q: 'Is it legal to unlock someone else\\'s PDF?', a: 'You should only unlock a PDF that you own or have explicit permission to access and modify. Removing protection from a document without authorisation may violate the file owner\\'s rights.' },
    { q: 'Is it free to unlock a PDF online?', a: 'Yes, unlocking a PDF with PDFBundles is completely free, with no account, email sign up, or software download required.' }
  ],
  seoSchema: \`{
"@context": "https://schema.org",
"@graph": [
{
"@type": "WebPage",
"@id": "https://pdfbundles.com/unlock-pdf#webpage",
"url": "https://pdfbundles.com/unlock-pdf",
"name": "Unlock PDF Online | Remove PDF Password Protection",
"description": "Unlock PDF online for free with PDFBundles. Remove PDF password protection and download the unlocked file in seconds.",
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
"@id": "https://pdfbundles.com/unlock-pdf#faq",
"mainEntity": [
{
"@type": "Question",
"name": "How do I unlock a password protected PDF?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Upload your file to the tool, and it works to remove the password protecting it. Once processing is complete, you'll get a download link for the unlocked file within seconds, with no software installation needed."
}
},
{
"@type": "Question",
"name": "Can I unlock a PDF if I don't know the original password?",
"acceptedAnswer": {
"@type": "Answer",
"text": "This depends on the type of protection involved. Files locked with owner restrictions on printing or editing can generally be unlocked without the original password, but a PDF that requires a password just to open it typically needs that password to be removed."
}
},
{
"@type": "Question",
"name": "Is it legal to unlock someone else's PDF?",
"acceptedAnswer": {
"@type": "Answer",
"text": "You should only unlock a PDF that you own or have explicit permission to access and modify. Removing protection from a document without authorisation may violate the file owner's rights."
}
},
{
"@type": "Question",
"name": "Is it free to unlock a PDF online?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes, unlocking a PDF with PDFBundles is completely free, with no account, email sign up, or software download required."
}
}
]
}
]
}\`
};

TOOL_EXTRA_CONTENT['protect-pdf'] = {
  ...(TOOL_EXTRA_CONTENT['protect-pdf'] || {}),
  seoH1: 'Protect PDF With Password Online for Free',
  seoH2_1: 'How to Encrypt PDF Files With a Password',
  seoH2_1Desc: 'Upload your document, then set the password you want to use to encrypt PDF files before sharing them. Once you confirm your password, the tool locks the document, and a download link for the protected file is ready right away.',
  seoH2_2: 'When Password Protection Matters Most',
  seoH2_2Desc: 'Financial statements, contracts, and personal records often need an extra layer of security when shared by email, since messages can end up forwarded or accessed by the wrong person. Choosing to encrypt PDF files before sending them means only someone with the password can actually open the document.',
  seoFaqTitle: 'Frequently Ask Questions About Encrypt PDF Files Tool',
  seoFaqs: [
    { q: 'How do I add a password to a PDF?', a: 'Upload your document to the tool, set the password you want to use, then confirm to lock the file behind that password. A download link for the protected file is ready within seconds, with no software installation needed.' },
    { q: 'Will I need the password every time I want to open the file?', a: 'Yes, once a PDF is password protected, anyone opening it, including you, will need to enter the correct password each time, so it\\'s worth saving it somewhere secure.' },
    { q: 'What happens if I forget the password I set?', a: 'If the password is lost, the document generally can\\'t be opened again, since the encryption is designed to prevent access without it. It\\'s worth storing the password in a password manager or somewhere safe before sharing the file.' },
    { q: 'Is it free to protect a PDF with a password online?', a: 'Yes, adding password protection to a PDF with PDFBundles is completely free, with no account, email sign up, or software download required.' }
  ],
  seoSchema: \`{
"@context": "https://schema.org",
"@graph": [
{
"@type": "WebPage",
"@id": "https://pdfbundles.com/protect-pdf#webpage",
"url": "https://pdfbundles.com/protect-pdf",
"name": "Protect PDF With Password | Encrypt PDF Files",
"description": "Protect PDF with a password online for free with PDFBundles. Encrypt PDF files and download the secured document in seconds.",
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
"@id": "https://pdfbundles.com/protect-pdf#faq",
"mainEntity": [
{
"@type": "Question",
"name": "How do I add a password to a PDF?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Upload your document to the tool, set the password you want to use, then confirm to lock the file behind that password. A download link for the protected file is ready within seconds, with no software installation needed."
}
},
{
"@type": "Question",
"name": "Will I need the password every time I want to open the file?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes, once a PDF is password protected, anyone opening it, including you, will need to enter the correct password each time, so it's worth saving it somewhere secure."
}
},
{
"@type": "Question",
"name": "What happens if I forget the password I set?",
"acceptedAnswer": {
"@type": "Answer",
"text": "If the password is lost, the document generally can't be opened again, since the encryption is designed to prevent access without it. It's worth storing the password in a password manager or somewhere safe before sharing the file."
}
},
{
"@type": "Question",
"name": "Is it free to protect a PDF with a password online?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes, adding password protection to a PDF with PDFBundles is completely free, with no account, email sign up, or software download required."
}
}
]
}
]
}\`
};

TOOL_EXTRA_CONTENT['edit-pdf'] = {
  ...TOOL_EXTRA_CONTENT['edit-pdf'],
  seoH1: 'Edit PDF Files Online for Free',
  seoH2_1: 'How to Add Text to a PDF',
  seoH2_1Desc: 'Upload your file, then click anywhere on the page to add text to PDF documents directly, without needing to convert them first. Type your content, adjust the font size or position if needed, then save your changes and download the updated file.',
  seoH2_2: 'What You Can Edit Besides Text',
  seoH2_2Desc: 'Beyond letting you add text to PDF pages, the tool also supports shapes, lines, and notes, so you can highlight a section, draw attention to an error, or leave a comment for someone else reviewing the document. These small edits often save you from having to explain changes separately over email.',
  seoFaqTitle: 'Frequently Ask Questions About Edit PDF Tool',
  seoFaqs: [
    { q: 'How do I edit a PDF online?', a: 'Upload your PDF to the tool, then click anywhere on the page to add text, shapes, or notes. Your changes appear instantly, and once you\\'re finished, save and download the updated file within seconds, with no software installation needed.' },
    { q: 'Can I add text to a PDF without converting it first?', a: 'Yes, the tool lets you type directly onto the existing PDF layout, so there\\'s no need to convert it to Word or another format before making changes.' },
    { q: 'What kinds of annotations can I add besides text?', a: 'Alongside text, you can add shapes, lines, and notes to highlight sections, mark up errors, or leave comments for someone reviewing the document, all within the same editor.' },
    { q: 'Is it free to edit a PDF online?', a: 'Yes, editing a PDF with PDFBundles is completely free, with no account, email sign up, or software download required.' }
  ],
  seoSchema: \`{
"@context": "https://schema.org",
"@graph": [
{
"@type": "WebPage",
"@id": "https://pdfbundles.com/edit-pdf#webpage",
"url": "https://pdfbundles.com/edit-pdf",
"name": "Edit PDF Online | Add text to PDF Free",
"description": "Edit PDF online for free with PDFBundles. Add text and annotations to your PDF and download the updated file in seconds.",
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
"@id": "https://pdfbundles.com/edit-pdf#faq",
"mainEntity": [
{
"@type": "Question",
"name": "How do I edit a PDF online?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Upload your PDF to the tool, then click anywhere on the page to add text, shapes, or notes. Your changes appear instantly, and once you're finished, save and download the updated file within seconds, with no software installation needed."
}
},
{
"@type": "Question",
"name": "Can I add text to a PDF without converting it first?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes, the tool lets you type directly onto the existing PDF layout, so there's no need to convert it to Word or another format before making changes."
}
},
{
"@type": "Question",
"name": "What kinds of annotations can I add besides text?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Alongside text, you can add shapes, lines, and notes to highlight sections, mark up errors, or leave comments for someone reviewing the document, all within the same editor."
}
},
{
"@type": "Question",
"name": "Is it free to edit a PDF online?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes, editing a PDF with PDFBundles is completely free, with no account, email sign up, or software download required."
}
}
]
}
]
}\`
};

TOOL_EXTRA_CONTENT['crop-pdf'] = {
  ...TOOL_EXTRA_CONTENT['crop-pdf'],
  seoH1: 'Crop PDF Pages Online for Free',
  seoH2_1: 'How to Trim PDF Page Margins',
  seoH2_1Desc: 'Upload your file, then drag the crop box over the area you want to keep to trim PDF page margins visually rather than guessing at measurements. Apply the crop to a single page or every page at once, then download your resized file right away.',
  seoH2_2: 'When Cropping a PDF Comes in Handy',
  seoH2_2Desc: 'Scanned documents often come through with wide, uneven borders, and printed pages sometimes include a footer or header that isn\\'t needed in the final version. Being able to trim PDF page margins visually makes it easy to clean these up without affecting the actual content underneath.',
  seoFaqTitle: 'Frequently Ask Questions About Crop Pdf Tool',
  seoFaqs: [
    { q: 'How do I crop pages in a PDF?', a: 'Upload your PDF to the tool, then drag the crop box over the area of the page you want to keep. Apply the crop to a single page or the whole document, and a download link for the resized file is ready within seconds, with no software installation needed.' },
    { q: 'Can I crop just one page instead of the entire document?', a: 'Yes, you can apply a crop to a single page while leaving the rest of the document at its original size, which is useful when only one page has an issue like an oversized margin.' },
    { q: 'Will cropping a PDF affect the text or image quality inside it?', a: 'No, cropping only changes the visible area of the page. Anything within the crop box stays exactly as it was, since the tool trims the page dimensions rather than altering the content itself.' },
    { q: 'Is it free to crop a PDF online?', a: 'Yes, cropping a PDF with PDFBundles is completely free, with no account, email sign up, or software download required.' }
  ],
  seoSchema: \`{
"@context": "https://schema.org",
"@graph": [
{
"@type": "WebPage",
"@id": "https://pdfbundles.com/crop-pdf#webpage",
"url": "https://pdfbundles.com/crop-pdf",
"name": "Crop PDF Online Free | PDFBundles",
"description": "Crop PDF online for free with PDFBundles. Trim PDF page margins visually and download the resized file in seconds.",
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
"@id": "https://pdfbundles.com/crop-pdf#faq",
"mainEntity": [
{
"@type": "Question",
"name": "How do I crop pages in a PDF?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Upload your PDF to the tool, then drag the crop box over the area of the page you want to keep. Apply the crop to a single page or the whole document, and a download link for the resized file is ready within seconds, with no software installation needed."
}
},
{
"@type": "Question",
"name": "Can I crop just one page instead of the entire document?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes, you can apply a crop to a single page while leaving the rest of the document at its original size, which is useful when only one page has an issue like an oversized margin."
}
},
{
"@type": "Question",
"name": "Will cropping a PDF affect the text or image quality inside it?",
"acceptedAnswer": {
"@type": "Answer",
"text": "No, cropping only changes the visible area of the page. Anything within the crop box stays exactly as it was, since the tool trims the page dimensions rather than altering the content itself."
}
},
{
"@type": "Question",
"name": "Is it free to crop a PDF online?",
"acceptedAnswer": {
"@type": "Answer",
"text": "Yes, cropping a PDF with PDFBundles is completely free, with no account, email sign up, or software download required."
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
if (!fileContent.includes("seoH1: 'Sign PDF Documents Online for Free'")) {
  fileContent = fileContent.replace(replacementPoint, addition + '\n\n' + replacementPoint);
  fs.writeFileSync('c:/Projects/pdf/frontend/src/data/toolExtraContent.js', fileContent);
  console.log('toolExtraContent.js updated');
} else {
  console.log('Already updated');
}
