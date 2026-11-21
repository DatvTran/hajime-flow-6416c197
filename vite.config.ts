import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split(".");
          const ext = info[info.length - 1];
          return `assets/[name]-[hash][extname]`;
        },
        manualChunks: {
          // Keep React + router in one chunk — function-based splitting caused
          // vendor → charts → ui → vendor circular imports and a blank boot screen.
          vendor: ["react", "react-dom", "react-router-dom"],
          ui: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-tabs",
            "lucide-react",
            "class-variance-authority",
            "clsx",
            "tailwind-merge",
          ],
          data: ["@tanstack/react-query", "react-hook-form", "@hookform/resolvers", "zod"],
          charts: ["recharts"],
          stripe: ["@stripe/react-stripe-js", "@stripe/stripe-js"],
        },
      },
    },
  },
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        target: "http://localhost:4242",
        changeOrigin: true,
        configure(proxy) {
          proxy.on("error", (_err, _req, res) => {
            const r = res as { writeHead?: (c: number, h: Record<string, string>) => void; end?: (b: string) => void; headersSent?: boolean };
            if (!r?.writeHead || r.headersSent) return;
            try {
              r.writeHead(502, { "Content-Type": "application/json" });
              r.end(
                JSON.stringify({
                  error:
                    "Stripe API is not reachable on port 4242. Start it in another terminal: npm run dev:stripe — or run both: npm run dev:full",
                }),
              );
            } catch {
              /* ignore */
            }
          });
        },
      },
    },
  },
  plugins: [
    react(),
    // The booth runs offline on an iPad at expos: the app shell is precached; /api is never cached.
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      includeAssets: ["favicon.ico", "favicon.png", "apple-touch-icon.png", "hajime-logo.png"],
      manifest: {
        name: "Hajime",
        short_name: "Hajime",
        description: "Hajime B2B operations — orders, inventory, expo booth",
        start_url: "/expo-leads/booth",
        scope: "/",
        display: "standalone",
        background_color: "#0a0a0a",
        theme_color: "#1a1d24",
        icons: [
          { src: "/favicon.png", sizes: "192x192", type: "image/png" },
          { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
        ],
      },
      workbox: {
        // Do not precache index.html — stale HTML pins old hashed bundles (demo login copy).
        globPatterns: ["**/*.{js,css,ico,png,svg,jpg,woff,woff2,ttf}"],
        globIgnores: ["**/boot.js"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//, /^\/health/],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "hajime-pages",
              networkTimeoutSeconds: 4,
            },
          },
          {
            urlPattern: /\/boot\.js/,
            handler: "NetworkFirst",
            options: {
              cacheName: "hajime-boot",
              networkTimeoutSeconds: 4,
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
});
