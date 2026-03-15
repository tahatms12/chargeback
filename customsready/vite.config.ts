import { netlifyPreset } from "@netlify/remix-adapter/preset";
import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig, type UserConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Related: https://vitejs.dev/config/server-options.html#server-hmr
// see: https://vitejs.dev/config/server-options.html#server-allowedhosts
export default defineConfig({
  server: {
    port: Number(process.env.PORT ?? 3000),
    hmr: false,
    fs: {
      // See https://vitejs.dev/config/server-options.html#server-fs-allow
      allow: ["app", "node_modules"],
    },
  },
  plugins: [
    remix({
      presets: [netlifyPreset()],
      ignoredRouteFiles: ["**/.*"],
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
      },
    }),
    tsconfigPaths(),
  ],
  build: {
    assetsInlineLimit: 0,
  },
  optimizeDeps: {
    // Exclude server-only modules from client bundle
    exclude: ["puppeteer", "bullmq", "ioredis", "@prisma/client"],
  },
}) satisfies UserConfig;
