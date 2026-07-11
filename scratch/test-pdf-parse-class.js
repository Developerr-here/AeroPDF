import { PDFDocument, StandardFonts } from 'pdf-lib';
import { PDFParse } from 'pdf-parse';

async function run() {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    page.drawText('This is a test PDF with text elements for PDFParse class.', { x: 50, y: 700, size: 16, font });
    
    const bytes = await pdfDoc.save();
    const buffer = Buffer.from(bytes);
    
    console.log('PDF generated, running PDFParse class...');
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const pdfData = await parser.getText();
    
    console.log('Parsed text successfully:', JSON.stringify(pdfData.text));
    process.exit(0);
  } catch (err) {
    console.error('PDFParse class test failed:', err);
    process.exit(1);
  }
}

run();
