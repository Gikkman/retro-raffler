import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@type": path.resolve(__dirname, "..", "type"),
    },
  },
  build: {
    outDir: "../../_compile/frontend",
    emptyOutDir: true,
  },
  server: {
    proxy: {
      "/api": "localhost:47911",
      "/ws": {
        target: "localhost:47911",
        ws: true
      }
    }
  }
});
