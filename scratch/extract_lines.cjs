const fs = require('fs');

const path = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\e0b42020-8dc7-485e-ae28-9e815ad8f503\\.system_generated\\steps\\172\\content.md';
const content = fs.readFileSync(path, 'utf8');

// Look for unescaped words or markdown in content.md
const lines = [];
// Find sequences with markdown formatting like #, **, -, etc.
const matches = content.match(/[A-Z][A-Za-z0-9\s,.:;\-–—()'"\/]{40,}/g);
if (matches) {
  matches.forEach((m) => {
    if (!m.includes('statsig') && !m.includes('secondary_exposures') && !m.includes('gateValue') && !m.includes('webpack')) {
      lines.push(m.trim());
    }
  });
}

console.log('Found filtered lines:', lines.length);
fs.writeFileSync('C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\e0b42020-8dc7-485e-ae28-9e815ad8f503\\scratch\\extracted_lines.txt', lines.slice(0, 100).join('\n\n'));
