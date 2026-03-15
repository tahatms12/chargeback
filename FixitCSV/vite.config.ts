import { netlifyPreset } from "@netlify/remix-adapter/preset";
import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { netlifyPlugin } from "@netlify/remix-adapter/plugin";

export default defineConfig({
  server: { port: Number(process.env.PORT ?? 3000), hmr: false },
  ssr: {
    noExternal: [/^@shopify\//],
  },
  plugins: [
    remix({
      presets: [netlifyPreset()],
      ignoredRouteFiles: ["**/.*"],
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true
      }
    }),
    netlifyPlugin(),
    tsconfigPaths()
  ],
  build: { assetsInlineLimit: 0 }
});
