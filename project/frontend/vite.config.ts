import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@t": path.resolve(__dirname, "..", "type"),
    },
  },
  build: {
    outDir: "../../_compile/frontend",
    emptyOutDir: true,
  },
  server: {
    proxy: {
      "/ws": {
        target: "localhost:8080",
        ws: true
      },
      "^/(?!assets|node_modules|src|vite|ws|@).+$": "localhost:8080",
    }
  }
});
