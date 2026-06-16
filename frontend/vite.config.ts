import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  resolve: {
    alias: {
      // Vite 8's Rolldown dep-optimizer hangs forever on lucide-react's 3900+ icon
      // barrel. Instead we point every `lucide-react` import at a small pre-bundled
      // file (src/lib/lucide-icons.js) that contains only the icons we actually use.
      // Regenerate it after adding a new icon import with:  npm run build:icons
      'lucide-react': fileURLToPath(new URL('./src/lib/lucide-icons.js', import.meta.url)),
    },
  },
  optimizeDeps: {
    // Pre-bundle every real dependency up front and turn OFF runtime discovery.
    // Otherwise Vite kicks off an on-the-fly re-optimization the first time it sees
    // a not-yet-seen dep, and that Rolldown re-run intermittently hangs the dev
    // server (every request then blocks forever waiting on it).
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'jszip',
      'papaparse',
    ],
    // ffmpeg ships heavy WASM/worker bundles that also break the optimizer; it's
    // imported dynamically so excluding it is safe.
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
    noDiscovery: true,
  },
})
