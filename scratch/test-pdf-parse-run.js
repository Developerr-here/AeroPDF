import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { createRequire } from 'module';
import path from 'path';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

async function run() {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    page.drawText('This is a test PDF with text elements.', { x: 50, y: 700, size: 20, font });
    
    const bytes = await pdfDoc.save();
    const buffer = Buffer.from(bytes);
    
    console.log('PDF generated, byte length:', buffer.length);
    console.log('Running pdfParse...');
    
    const data = await pdfParse(buffer);
    console.log('Parsed text successfully:', JSON.stringify(data.text));
    process.exit(0);
  } catch (err) {
    console.error('Test failed with error:', err);
    process.exit(1);
  }
}

run();
