import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// La URL base para rutas absolutas
const BASE_URL = "https://preview--park-sell-rover.lovable.app";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
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