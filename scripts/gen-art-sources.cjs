// Parses IMAGE_SOURCES.md (the top table) into src/data/artSources.json,
// keyed by the art base name without extension (e.g. "art_38") so it survives
// the .png/.jpg mismatch between the sources doc and the actual files.
const fs = require('fs')
const path = require('path')

const md = fs.readFileSync(path.join(__dirname, '..', 'IMAGE_SOURCES.md'), 'utf8')
const out = {}

for (const line of md.split('\n')) {
  // table rows look like: | `art_02.jpg` | Title | Artist | Tradition | Licence | [Wikimedia Commons](url) |
  const m = line.match(/^\|\s*`(art_[0-9]+)\.[a-z]+`\s*\|(.+)\|\s*$/i)
  if (!m) continue
  const key = m[1]
  const cells = m[2].split('|').map((c) => c.trim())
  if (cells.length < 5) continue
  const [title, artist, tradition, licence, sourceCell] = cells
  const urlMatch = sourceCell.match(/\((https?:\/\/[^)]+)\)/)
  out[key] = {
    title,
    artist,
    tradition,
    licence,
    source: urlMatch ? urlMatch[1] : '',
  }
}

const dest = path.join(__dirname, '..', 'src', 'data', 'artSources.json')
fs.writeFileSync(dest, JSON.stringify(out, null, 2) + '\n')
console.log(`Wrote ${Object.keys(out).length} entries to ${dest}`)
