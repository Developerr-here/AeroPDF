import { PDFDocument, degrees } from 'pdf-lib';
import fs from 'fs';

async function testRotation() {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    console.log('Created dummy page.');
    
    const rotObj = page.getRotation();
    console.log('Rotation object:', rotObj);
    console.log('Angle:', rotObj.angle);
    
    // Test setRotation
    page.setRotation(degrees(90));
    console.log('Set rotation to 90 degrees.');
    
    const newRot = page.getRotation();
    console.log('New rotation:', newRot);
    
    const bytes = await pdfDoc.save();
    console.log('Saved successfully, byte length:', bytes.length);
    process.exit(0);
  } catch (err) {
    console.error('Rotation test failed:', err);
    process.exit(1);
  }
}

testRotation();
