const fs = require('fs');

const path = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\e0b42020-8dc7-485e-ae28-9e815ad8f503\\.system_generated\\steps\\172\\content.md';
const content = fs.readFileSync(path, 'utf8');

// Find all matches for "text" in JSON
const regex = /"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
let match;
const extracted = [];
while ((match = regex.exec(content)) !== null) {
  try {
    const text = JSON.parse(`"${match[1]}"`);
    if (text.length > 20 && !text.includes('statsig') && !text.includes('webpack')) {
      extracted.push(text);
    }
  } catch (e) {}
}

console.log(`Extracted ${extracted.length} text items.`);
fs.writeFileSync('C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\e0b42020-8dc7-485e-ae28-9e815ad8f503\\scratch\\guidelines_text.txt', extracted.join('\n\n=========================================\n\n'));
console.log('Saved to scratch/guidelines_text.txt');
