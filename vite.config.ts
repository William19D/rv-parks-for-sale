import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import type { Connect } from 'vite';
import type { ServerResponse } from 'http';
import { Plugin } from 'vite';

// Función para determinar la base URL basada en el entorno
function determineBase(mode: string): string {
  // En desarrollo, usar ruta relativa
  if (mode === 'development') {
    return '/';
  }
  
  // En producción, usar la ruta específica
  // Esto se puede cambiar con variables de entorno si es necesario
  return process.env.VITE_BASE_PATH || '/rv-parks-for-sale/';
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const base = determineBase(mode);
  
  return {
    // Base dinámica basada en el entorno
    base,
    server: {
      host: "::",
      port: 8080,
      strictPort: true,
    },
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
      // Solo añadir el elemento base si no estamos en desarrollo
      mode !== 'development' && {
        name: 'inject-base-element',
        transformIndexHtml(html: string): string {
          return html.replace(
            '<head>',
            `<head>\n  <base href="${base}" />`
          );
        }
      }
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      assetsDir: "lovableassets",
    },
  };
});