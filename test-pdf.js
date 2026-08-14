import { fileURLToPath } from 'url';
import fs from 'fs';
import { PDFDocument } from 'pdf-lib';
import { PDFParse } from 'pdf-parse';
import HTMLtoDOCX from 'html-to-docx';
import XLSX from 'xlsx';

async function testPdfToOffice() {
  try {
    const buffer = fs.readFileSync('test.pdf');
    const title = 'test.pdf';
    const format = 'docx';

    let extractedText = '';
    try {
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const pdfData = await parser.getText();
      extractedText = pdfData.text || '';
    } catch (parseErr) {
      console.warn('PDF parsing failed:', parseErr.message);
      extractedText = 'Failed to extract text from this PDF file.';
    }

    const paragraphsHtml = extractedText.split('\n')
      .map(line => line.trim() ? `<p>${line}</p>` : '')
      .filter(Boolean)
      .join('\n');

    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset="utf-8"><title>${title}</title></head>
      <body>${paragraphsHtml}</body>
      </html>
    `;

    console.log("Calling HTMLtoDOCX...");
    const docxBuffer = await HTMLtoDOCX(wordHtml, null, {
      title: title,
      font: 'Arial'
    });
    console.log("Successfully generated docx, size:", docxBuffer.length);
  } catch (err) {
    console.error("Error occurred:", err);
  }
}

testPdfToOffice();
