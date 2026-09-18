import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // GitHub project pages are served from /<repository>/, while local builds
  // keep relative asset URLs so they remain easy to preview anywhere.
  base: mode === 'github-pages' ? '/boku-no-noto/' : './',
}))
