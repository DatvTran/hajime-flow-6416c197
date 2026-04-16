import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

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
          // Core vendor libraries (loaded on every page)
          vendor: ["react", "react-dom", "react-router-dom"],
          // UI component libraries
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-tabs", "lucide-react", "class-variance-authority", "clsx", "tailwind-merge"],
          // Data & forms
          data: ["@tanstack/react-query", "react-hook-form", "@hookform/resolvers", "zod"],
          // Charts (only loaded when needed)
          charts: ["recharts"],
          // Vendor-specific (Stripe - only on checkout pages)
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
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
});
