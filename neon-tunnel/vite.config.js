import { defineConfig } from 'vite'

export default defineConfig({
  base: './', // Makes it ready for GitHub Pages deployment
  build: {
    outDir: 'dist'
  }
})
