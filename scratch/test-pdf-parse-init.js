import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

console.log('Type of pdfParse:', typeof pdfParse);
console.log('Keys of pdfParse:', Object.keys(pdfParse || {}));
console.log('Is function:', typeof pdfParse === 'function');
if (pdfParse && pdfParse.default) {
  console.log('Default type:', typeof pdfParse.default);
}
process.exit(0);
