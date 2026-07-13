import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// base is set to the repo name for production builds so assets resolve under
// the GitHub Pages subpath (lucasvegamazzoni.github.io/kies-2026-site/);
// local dev stays at "/".
export default defineConfig(({ command, isPreview }) => ({
  plugins: [react()],
  base: command === 'build' || isPreview ? '/kies-2026-site/' : '/',
}))
