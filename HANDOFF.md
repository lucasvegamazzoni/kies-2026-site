# KIES 2026 — "The Big Questions" · Developer Handoff

An interactive one-page site for the **Kaizenvest & INSEAD Education Symposium 2026**.
Ten symposium sessions and their 59 discussion questions are shown as a constellation of
artworks; visitors click any artwork to read its question and cast an anonymous upvote.
Live reference build: **https://lucasvegamazzoni.github.io/kies-2026-site/**

This is a working, production-deployed prototype. Everything needed to run, restyle, or
re-host it is in this repository — no hidden services beyond the Supabase project noted below.

## Tech stack

- **React 19 + TypeScript**, built with **Vite 8**. No CSS framework — all styling is one
  plain stylesheet (`src/index.css`) using CSS custom properties.
- **d3-force** lays out the constellation once, then freezes it (the drift is pure CSS).
- **Supabase** (hosted Postgres) stores vote counts. The site runs fine without it —
  votes simply become local-only.

## Run & build

```bash
npm install
npm run dev          # local dev server → http://localhost:5173
npm run build        # type-checks, then outputs a static site to dist/
npm run preview      # serves the built dist/ locally
```

`npm run build` produces a fully static `dist/` folder (HTML + JS + CSS + images) that can be
hosted on any static host or CDN. Nothing server-side is required except Supabase for voting.

## Project structure

| Path | What it is |
|------|-----------|
| `src/App.tsx` | Top-level layout, scroll→map hero animation, desktop/mobile switch |
| `src/components/Constellation.tsx` | The desktop map: d3-force layout, zoom/pan, hover |
| `src/components/MobileList.tsx` | The phone view: scrollable list of session cards |
| `src/components/QuestionModal.tsx` | The panel shown when a question is opened |
| `src/index.css` | **All** styling and design tokens (single file) |
| `src/data/questions.json` | The 59 questions in 10 sessions — the content source of truth |
| `src/data/imageMap.json` | Which artwork each question wears |
| `src/data/artSources.json` | Per-image credit line (title/artist/licence/source) |
| `src/data/sessions.ts` | Session accent colours, hub positions, data helpers |
| `public/art/` | The 40 artwork image files |
| `IMAGE_SOURCES.md` | Human-readable image credits & licences (see "Licensing") |

To change wording, edit `questions.json`; to re-pair art, edit `imageMap.json`. Both are plain
data files — no code change needed. (`scripts/` holds small generators/validators for that data.)

## Design tokens

- **Fonts** (Google Fonts, loaded in `index.html`): **Fraunces** (serif, headings & questions)
  and **Inter** (sans, UI text).
- **Palette** (defined at the top of `src/index.css`): background ivory `#f7f4ec`,
  ink `#141311`, muted `#6f6a5f`. Each of the 10 sessions has its own accent colour —
  see `SESSION_COLORS` in `src/data/sessions.ts`.

## Responsive behaviour

- **Desktop (> 760px):** the full interactive constellation — scroll to reveal the map,
  click an artwork to open its panel, zoom with +/− and drag to pan when zoomed.
- **Phone (≤ 760px):** the constellation is replaced by a scrollable list of session
  sections; each question is a card with an art thumbnail and inline upvote. Tapping the
  artwork opens the same panel. The breakpoint lives in `src/hooks/useIsMobile.ts`.

## Backend (voting)

Voting uses a Supabase project (`kies-2026-big-questions`). The site reads two build-time env
vars (put them in `.env.local`, or in your host's environment settings):

```
VITE_SUPABASE_URL=…        # the Supabase project URL
VITE_SUPABASE_KEY=…        # the publishable (browser-safe) key
```

All vote writes go through database RPCs (`cast_vote` / `retract_vote` / `get_vote_counts`),
so device IDs stay private and the raw votes table isn't exposed. One vote per question per
device (a random ID kept in `localStorage`). Moderators read live rankings from the
`question_rankings` view in the Supabase dashboard. See `README.md` for the full backend notes.

## Deployment

Currently auto-deployed to GitHub Pages on every push (`.github/workflows/deploy.yml`), served
under the `/kies-2026-site/` path. **When you move it to the real domain at the site root,** set
`base: '/'` in `vite.config.ts` (it's currently `/kies-2026-site/` for the Pages subpath) and
rebuild. If you drop GitHub Pages, that workflow file can be deleted.

## Licensing (important)

Every artwork is openly licensed traditional art (Filipino, Vietnamese, Indian, Thai) from
Wikimedia Commons / museum open-access collections. Most are public domain or CC0; **one is
CC BY 2.0 and requires visible attribution**, which the on-page source line provides. Keep the
credit line (or an equivalent) if you restyle the panel. Full details in `IMAGE_SOURCES.md`.
