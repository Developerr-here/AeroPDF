import fs from 'fs';

// Helper: Convert HEX color to RGB object
export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '#000000');
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 0, g: 0, b: 0 };
}

// Helper: Sanitize string to prevent pdf-lib WinAnsi encoding errors
export function sanitizeWinAnsi(text) {
  return (text || '')
    .replace(/\t/g, '    ') // Replace tabs with spaces
    .replace(/[\u201c\u201d]/g, '"') // Curly double quotes
    .replace(/[\u2018\u2019]/g, "'") // Curly single quotes
    .replace(/\u2014/g, '-') // Em dash
    .replace(/[^\x00-\x7F]/g, ''); // Strip non-ASCII/Unicode to fit standard WinAnsi
}

// Helper: Clean uploaded files on error/abort
export function cleanTempFiles(req) {
  if (req.file) {
    fs.unlink(req.file.path, () => {});
  }
  if (req.files) {
    req.files.forEach(f => fs.unlink(f.path, () => {}));
  }
}
