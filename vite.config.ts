import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base must match the GitHub Pages sub-path (https://<user>.github.io/typing-teacher/).
// Dev is unaffected; pass the same base to `vite preview` to check the build.
// Test config lives in vitest.config.ts — keeping them apart avoids a clash
// between Vite 6's plugin types and the Vite that vitest bundles.
export default defineConfig({
  base: '/typing-teacher/',
  plugins: [react(), tailwindcss()],
})
