import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig, type UserConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { netlifyPlugin } from "@netlify/remix-adapter/plugin";

// Related: https://vitejs.dev/config/server-options.html#server-hmr
// see: https://vitejs.dev/config/server-options.html#server-allowedhosts
export default defineConfig({
  ssr: {
    noExternal: [/^@shopify\//],
  },
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
      ignoredRouteFiles: ["**/.*"],
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
      },
    }),
    netlifyPlugin(),
    tsconfigPaths(),
  ],
  build: {
    assetsInlineLimit: 0,
  },
  optimizeDeps: {
    // Exclude server-only modules from client bundle
    exclude: ["puppeteer", "bullmq", "ioredis", "@prisma/client"],
    include: ["@shopify/app-bridge-react"],
  },
}) satisfies UserConfig;
