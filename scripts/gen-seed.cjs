// Generates scripts/seed.sql from src/data/questions.json
const fs = require('fs');
const path = require('path');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/questions.json'), 'utf8'));
const esc = (s) => s.replace(/'/g, "''");
const rows = [];
for (const s of data.sessions) {
  for (const q of s.questions) {
    rows.push(`('${q.id}', ${s.no}, '${esc(s.title)}', '${esc(q.text)}', ${q.contrarian})`);
  }
}
const sql = `insert into public.questions (id, session_no, session_title, question, is_contrarian) values
${rows.join(',\n')}
on conflict (id) do update set
  session_no = excluded.session_no,
  session_title = excluded.session_title,
  question = excluded.question,
  is_contrarian = excluded.is_contrarian;
`;
fs.writeFileSync(path.join(__dirname, 'seed.sql'), sql);
console.log('seed rows:', rows.length);
