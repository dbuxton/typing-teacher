import { defineConfig, type Connect, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

// base must match the GitHub Pages sub-path (https://<user>.github.io/typing-teacher/).
// Dev is unaffected; pass the same base to `vite preview` to check the build.
// Test config lives in vitest.config.ts — keeping them apart avoids a clash
// between Vite 6's plugin types and the Vite that vitest bundles.

/** Absolute path to one of the site's pages. */
const page = (path: string) => fileURLToPath(new URL(path, import.meta.url))

/**
 * Two apps share this build: Typing Teacher at the root and Star Trail under
 * /star-trail/. Vite's dev and preview servers only find a nested index.html
 * when the URL ends in a slash — without one they quietly serve the ROOT page,
 * so /typing-teacher/star-trail would open Typing Teacher instead. Redirect to
 * the slashed address. (GitHub Pages already does this for real visitors.)
 */
function trailingSlash(paths: string[]): Plugin {
  const redirect: Connect.NextHandleFunction = (req, res, next) => {
    const [path, query] = (req.url ?? '').split('?')
    if (!paths.includes(path)) return next()
    res.statusCode = 301
    res.setHeader('Location', `${path}/${query ? `?${query}` : ''}`)
    res.end()
  }
  return {
    name: 'trailing-slash',
    configureServer: (server) => {
      server.middlewares.use(redirect)
    },
    configurePreviewServer: (server) => {
      server.middlewares.use(redirect)
    },
  }
}

export default defineConfig({
  base: '/typing-teacher/',
  plugins: [react(), tailwindcss(), trailingSlash(['/typing-teacher/star-trail'])],
  build: {
    rollupOptions: {
      input: {
        // Keyed `index` so Typing Teacher's bundle keeps the name it always had.
        index: page('./index.html'),
        'star-trail': page('./star-trail/index.html'),
      },
    },
  },
})
