const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\e0b42020-8dc7-485e-ae28-9e815ad8f503\\scratch\\script_9.txt', 'utf8');

// Let's find all string pieces inside the stream enqueue
// Match string literals
const strRegex = /"([^"\\]*(?:\\.[^"\\]*)*)"/g;
let match;
const pieces = [];
while ((match = strRegex.exec(content)) !== null) {
  try {
    const s = JSON.parse(`"${match[1]}"`);
    if (s.length > 60 && !s.startsWith('http') && !s.includes('sha256') && !s.includes('chunk') && !s.includes('webpack') && !s.includes('nonce')) {
      pieces.push(s);
    }
  } catch (e) {}
}

console.log('Found string pieces:', pieces.length);
fs.writeFileSync('C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\e0b42020-8dc7-485e-ae28-9e815ad8f503\\scratch\\chatgpt_guidelines.md', pieces.join('\n\n---\n\n'));
console.log('Saved to scratch/chatgpt_guidelines.md');
