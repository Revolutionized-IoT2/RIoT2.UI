import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vuetify({
      autoImport: true,
    }),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Views are split per route (src/router). The libraries every page needs at startup get
        // chunks of their own: they change less often than the app, so browsers keep them cached.
        // src/app.config.ts must stay in the entry chunk: entrypoint.sh renders the MQTT settings
        // into assets/index*.js only.
        manualChunks(id) {
          if (id.includes('/node_modules/mqtt/'))
            return 'mqtt';
          if (/\/node_modules\/(vue|@vue\/[^/]+|vue-router|pinia)\//.test(id))
            return 'vue';
        },
      },
    },
  },
})
