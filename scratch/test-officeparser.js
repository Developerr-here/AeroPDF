import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const op = require('officeparser');
const fs = require('fs');
const https = require('https');

const url = 'https://raw.githubusercontent.com/calibre-ebook/calibre/master/resources/odf-samples/test.pptx';

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: Status ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  const dest = 'scratch/sample.pptx';
  try {
    console.log('Downloading sample PPTX file...');
    await downloadFile(url, dest);
    console.log('Download complete. Parsing PPTX file...');
    const result = await op.parseOffice(dest, { fileType: 'pptx' });
    console.log('Success! Extracted text:');
    console.log(result.toText().substring(0, 500));
  } catch (err) {
    console.error('Error during download/parse:', err);
  } finally {
    try { fs.unlinkSync(dest); } catch(e) {}
  }
}
main();
