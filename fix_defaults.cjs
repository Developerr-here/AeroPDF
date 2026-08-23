const fs = require('fs');

let fileContent = fs.readFileSync('c:/Projects/pdf/frontend/src/data/toolExtraContent.js', 'utf8');

// I need to change `if (TOOL_EXTRA_CONTENT[toolId]) { return TOOL_EXTRA_CONTENT[toolId]; }`
// To merge with defaults if fields are missing.

const original = `  if (TOOL_EXTRA_CONTENT[toolId]) {
    return TOOL_EXTRA_CONTENT[toolId];
  }`;

const replacement = `  let extra = TOOL_EXTRA_CONTENT[toolId];
  if (extra && extra.category && extra.icon) {
    return extra;
  }`;

fileContent = fileContent.replace(original, replacement);

fs.writeFileSync('c:/Projects/pdf/frontend/src/data/toolExtraContent.js', fileContent);
console.log('Fixed missing defaults in getExtraContentForTool');
