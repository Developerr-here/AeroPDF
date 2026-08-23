const fs = require('fs');

const seoUpdates = {
  '/image-upscaler': { title: 'Upscale Images Online For Free | Increase Image Resolution', desc: 'Upscale images online for free with PDFBundles. Increase photo resolution and download the enhanced image in seconds.' },
  '/background-remover': { title: 'Remove Background From Image Free | Transparent Image Tool', desc: 'Remove background from image online for free with PDFBundles. Get a transparent background in seconds, no design skills needed.' },
  '/ai-pdf-assistant': { title: 'AI PDF Assistant | Chat With PDF Using AI', desc: 'AI PDF assistant online for free with PDFBundles. Summarize, translate, and chat with your PDF documents in seconds.' },
  '/compare-pdf': { title: 'Compare PDF Online | Find Differences Between 2 PDFs', desc: 'Compare PDF online for free with PDFBundles. See side by side differences between two PDF documents in seconds.' },
  '/redact-pdf': { title: 'Redact PDF Online | Black Out Sensitive Information PDF', desc: 'Redact PDF online for free with PDFBundles. Black out sensitive information permanently and download the secured file in seconds.' }
};

let seo = fs.readFileSync('c:/Projects/pdf/seo-config.js', 'utf8');

for (const [key, val] of Object.entries(seoUpdates)) {
  const regex = new RegExp(`'${key}': \\{.*?\\}`, 'g');
  seo = seo.replace(regex, `'${key}': { title: '${val.title}', desc: '${val.desc}' }`);
}
fs.writeFileSync('c:/Projects/pdf/seo-config.js', seo);
console.log('seo-config.js updated');
