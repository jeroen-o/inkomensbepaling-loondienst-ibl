import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// VOOR GITHUB PAGES:
// Vervang 'ibl-toetsinkomen-tool' hieronder door de exacte naam van je repository.
// Als je repo bijvoorbeeld 'ibl-rekentool' heet, gebruik dan: base: '/ibl-rekentool/',
// Voor lokaal draaien (npm run dev) maakt het niet uit.
//
// Deploy je naar een custom domein (bijv. mijn-ibl-tool.nl)? Zet base op '/'
// Deploy je naar gebruikersnaam.github.io (root)? Zet base op '/'
//
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/ibl-toetsinkomen-tool/' : '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
  },
});
