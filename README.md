# KIES 2026 — The Big Questions

Interactive constellation site for the Kaizenvest & INSEAD Education Symposium 2026, modeled on anthropic.com/path-to-hope. Ten session hubs float on a dark canvas; each of the 59 discussion questions is a satellite node wearing a piece of art. Clicking a node opens the question with an anonymous upvote button backed by Supabase.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
```

Requires `.env.local` (already present, not committed):

```
VITE_SUPABASE_URL=https://dxsygomtrvmwavubtcrw.supabase.co
VITE_SUPABASE_KEY=<publishable key>
```

Without these the site still runs; votes are then local-only.

## How it fits together

- `src/data/questions.json` — the 59 questions in 10 sessions, ids like `s03-q2` / `s03-c1` (c = contrarian; not visually distinguished on the site by design).
- `src/data/imageMap.json` — curated question→artwork mapping (each of the 40 images used 1–2 times, never twice in one session). `scripts/check-imagemap.cjs` validates it.
- `src/components/Constellation.tsx` — d3-force layout (computed once, then frozen), d3-zoom pan/zoom, CSS-driven node drift, hover highlighting.
- `src/hooks/useVotes.ts` + `src/lib/supabase.ts` — optimistic voting: one vote per question per device (random UUID in localStorage), un-votable, counts polled every 15 s.

## Supabase (project `kies-2026-big-questions`, dxsygomtrvmwavubtcrw — separate from Fund Watcher)

- `questions` table (public read) seeded from `scripts/seed.sql` (regenerate with `node scripts/gen-seed.cjs` after editing questions.json, then re-apply).
- `votes` table is **not** accessible with the publishable key; all access goes through `cast_vote` / `retract_vote` / `get_vote_counts` RPCs, so device ids stay private and bulk reads/deletes are impossible.
- Moderators: open the **`question_rankings`** view in the Supabase dashboard (Table Editor → question_rankings) for questions ranked by votes, filterable per session.

## Deploy (when ready)

`npm run build` → static `dist/`. Host anywhere (Vercel/Netlify); set the two `VITE_*` env vars in the host's settings.
