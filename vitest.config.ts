import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

// Vitest (as Dls): tests/*.test.mjs run the real sources through tests/source-loader.cjs in Node;
// tests/**/*.test.ts mount components in jsdom (`// @vitest-environment jsdom`).
export default defineConfig({
  plugins: [vue(), vuetify({ autoImport: true })],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  test: {
    include: ['tests/**/*.test.{mjs,ts}'],
    environment: 'node',
    // tests/entrypoint.test.mjs runs the image's entrypoint with sh, which is slow on Windows.
    testTimeout: 30000,
    server: { deps: { inline: ['vuetify'] } },
  },
})
