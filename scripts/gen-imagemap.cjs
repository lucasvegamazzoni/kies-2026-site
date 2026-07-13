// Placeholder image map: cycles the art files across all question ids.
// Overwritten by the curated mapping once available.
const fs = require('fs');
const path = require('path');
if (fs.existsSync(path.join(__dirname, '../src/data/imageMap.json')) && !process.argv.includes('--force')) {
  console.error('imageMap.json already exists (curated). Re-run with --force to overwrite.');
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/questions.json'), 'utf8'));
const imgs = fs.readdirSync(path.join(__dirname, '../public/art')).filter((f) => f.endsWith('.jpg')).sort();
const map = {};
let i = 0;
for (const s of data.sessions) {
  for (const q of s.questions) {
    map[q.id] = imgs[i % imgs.length];
    i++;
  }
}
fs.writeFileSync(path.join(__dirname, '../src/data/imageMap.json'), JSON.stringify(map, null, 2));
console.log('mapped', i, 'questions to', imgs.length, 'images');
