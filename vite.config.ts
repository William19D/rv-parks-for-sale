import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import type { Connect } from 'vite';
import type { ServerResponse } from 'http';
import { Plugin } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Base consistente con las URLs que estamos usando
  base: '/rv-parks-for-sale/',
  server: {
    host: "::",
    port: 8080,
    // Add server-side handling for the missing trailing slash
    strictPort: true,
    // Add middleware to handle trailing slash redirects at the server level
    middlewares: [
      (req: Connect.IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
        // Check for missing trailing slash on all routes, not just the base URL
        const url = req.originalUrl || req.url || '';
        
        // Need to specifically check for missing trailing slash on the base path
        // This fixes the refresh issue
        if (url === '/rv-parks-for-sale') {
          console.log(`[Vite] Redirecting from ${url} to ${url}/`);
          
          // Use 301 permanent redirect to ensure browser caches the correct URL
          res.writeHead(301, { 
            Location: url + '/' + (url.includes('?') ? url.substring(url.indexOf('?')) : ''),
            'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
          });
          res.end();
          return;
        }
        
        next();
      }
    ]
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    // Add a plugin to inject <base> element for proper URL handling
    {
      name: 'inject-base-element',
      transformIndexHtml(html: string): string {
        return html.replace(
          '<head>',
          '<head>\n  <base href="/rv-parks-for-sale/" />'
        );
      }
    } as Plugin
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