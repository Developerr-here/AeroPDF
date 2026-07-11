import officeparser from 'officeparser';
import fs from 'fs';

console.log('OfficeParser exports:', Object.keys(officeparser));
console.log('Default export keys:', Object.keys(officeparser.default || {}));

// Create a dummy PPTX (we don't have one, but we can see the function keys)
const keys = Object.keys(officeparser);
console.log('Success, keys printed.');
process.exit(0);
