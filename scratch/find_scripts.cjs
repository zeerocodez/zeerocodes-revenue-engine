const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\e0b42020-8dc7-485e-ae28-9e815ad8f503\\.system_generated\\steps\\172\\content.md', 'utf8');

// Find all script tags
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let m;
let count = 0;
while ((m = scriptRegex.exec(content)) !== null) {
  const text = m[1];
  count++;
  if (text.length > 50) {
    fs.writeFileSync(`C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\e0b42020-8dc7-485e-ae28-9e815ad8f503\\scratch\\script_${count}.txt`, text);
    console.log(`Script ${count} length:`, text.length, text.slice(0, 100));
  }
}
