import tailwindcss from '@tailwindcss/postcss';
import { defineConfig } from 'vite';
import vinext from 'vinext';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS === 'true' ? '/mark-bingo/' : '/',
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [vinext()],
});
