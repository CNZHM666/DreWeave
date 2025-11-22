import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';
import viteCompression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true,
    port: 4173,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      timeout: 10000,
    },
  },
  build: {
    target: 'es2017',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          charts: ['recharts'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-toast', 'lucide-react', 'sonner', 'tailwind-merge'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  },

  plugins: [
    react({
      babel: {
        plugins: mode === 'development' ? ['react-dev-locator'] : [],
      },
    }),
    // traeBadgePlugin removed to avoid possible init conflicts in production preview
    tsconfigPaths(),
    viteCompression({ algorithm: 'gzip', ext: '.gz' }),
    viteCompression({ algorithm: 'brotliCompress', ext: '.br' })
  ],
}))
