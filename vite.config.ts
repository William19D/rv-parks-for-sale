import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// URL base para rutas absolutas
const BASE_URL = "https://preview--park-sell-rover.lovable.app";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Usar base relativa en desarrollo y absoluta en producción
  base: mode === 'development' ? '/' : BASE_URL,
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    assetsDir: "lovableassets",
  },
}));