
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Use absolute base for both development and production
  base: mode === 'development' ? '/' : 'https://preview--park-sell-rover.lovable.app/',
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
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // Ensure absolute paths for assets
          return `lovableassetts/[name]-[hash][extname]`;
        },
      },
    },
    // Ensure assets use absolute URLs
    assetsDir: 'lovableassetts',
  },
  experimental: {
    renderBuiltUrl(filename, { hostType }) {
      // Force absolute URLs for assets
      if (hostType === 'js') {
        return { runtime: `new URL(${JSON.stringify(filename)}, import.meta.url).href` };
      }
      return { relative: false };
    },
  },
}));
