// Validates imageMap.json: full coverage, files exist, image used <=2 times, no repeats within a session
const fs = require('fs');
const path = require('path');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/questions.json'), 'utf8'));
const map = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/imageMap.json'), 'utf8'));
const artDir = path.join(__dirname, '../public/art');
const files = new Set(fs.readdirSync(artDir).filter((f) => f.endsWith('.jpg')));

let errors = 0;
const useCount = {};
for (const s of data.sessions) {
  const seen = new Set();
  for (const q of s.questions) {
    const img = map[q.id];
    if (!img) { console.log('MISSING mapping:', q.id); errors++; continue; }
    if (!files.has(img)) { console.log('NO SUCH FILE:', q.id, img); errors++; }
    if (seen.has(img)) { console.log('DUP WITHIN SESSION', s.id + ':', img); errors++; }
    seen.add(img);
    useCount[img] = (useCount[img] || 0) + 1;
  }
}
for (const [img, n] of Object.entries(useCount)) {
  if (n > 2) { console.log('USED >2 TIMES:', img, n); errors++; }
}
const unused = [...files].filter((f) => !useCount[f]);
if (unused.length) console.log('unused images:', unused.join(', '));
console.log('total mappings:', Object.keys(map).length, '| distinct images used:', Object.keys(useCount).length, '| errors:', errors);
process.exit(errors ? 1 : 0);
