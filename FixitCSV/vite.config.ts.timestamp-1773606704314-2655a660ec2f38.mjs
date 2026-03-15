// vite.config.ts
import { vitePlugin as remix } from "file:///C:/Users/Admin/Downloads/shopifyapps/final/chargeback/FixitCSV/node_modules/.pnpm/@remix-run+dev@2.17.4_@remix-run+react@2.17.4_react-dom@18.3.1_react@18.3.1__react@18.3.1_typ_dh347nqbfe6hov4x7ofn23k2xi/node_modules/@remix-run/dev/dist/index.js";
import { defineConfig } from "file:///C:/Users/Admin/Downloads/shopifyapps/final/chargeback/FixitCSV/node_modules/.pnpm/vite@5.4.21_@types+node@22.19.15/node_modules/vite/dist/node/index.js";
import tsconfigPaths from "file:///C:/Users/Admin/Downloads/shopifyapps/final/chargeback/FixitCSV/node_modules/.pnpm/vite-tsconfig-paths@5.1.4_typescript@5.9.3_vite@5.4.21_@types+node@22.19.15_/node_modules/vite-tsconfig-paths/dist/index.js";
import { netlifyPlugin } from "file:///C:/Users/Admin/Downloads/shopifyapps/final/chargeback/FixitCSV/node_modules/.pnpm/@netlify+remix-adapter@3.0.0_typescript@5.9.3_vite@5.4.21_@types+node@22.19.15_/node_modules/@netlify/remix-adapter/dist/plugin.mjs";
var vite_config_default = defineConfig({
  server: { port: Number(process.env.PORT ?? 3e3), hmr: false },
  ssr: {
    noExternal: [/^@shopify\//]
  },
  plugins: [
    remix({
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
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxBZG1pblxcXFxEb3dubG9hZHNcXFxcc2hvcGlmeWFwcHNcXFxcZmluYWxcXFxcY2hhcmdlYmFja1xcXFxGaXhpdENTVlwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcQWRtaW5cXFxcRG93bmxvYWRzXFxcXHNob3BpZnlhcHBzXFxcXGZpbmFsXFxcXGNoYXJnZWJhY2tcXFxcRml4aXRDU1ZcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0FkbWluL0Rvd25sb2Fkcy9zaG9waWZ5YXBwcy9maW5hbC9jaGFyZ2ViYWNrL0ZpeGl0Q1NWL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgdml0ZVBsdWdpbiBhcyByZW1peCB9IGZyb20gXCJAcmVtaXgtcnVuL2RldlwiO1xyXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xyXG5pbXBvcnQgdHNjb25maWdQYXRocyBmcm9tIFwidml0ZS10c2NvbmZpZy1wYXRoc1wiO1xyXG5pbXBvcnQgeyBuZXRsaWZ5UGx1Z2luIH0gZnJvbSBcIkBuZXRsaWZ5L3JlbWl4LWFkYXB0ZXIvcGx1Z2luXCI7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHNlcnZlcjogeyBwb3J0OiBOdW1iZXIocHJvY2Vzcy5lbnYuUE9SVCA/PyAzMDAwKSwgaG1yOiBmYWxzZSB9LFxyXG4gIHNzcjoge1xyXG4gICAgbm9FeHRlcm5hbDogWy9eQHNob3BpZnlcXC8vXSxcclxuICB9LFxyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlbWl4KHtcbiAgICAgIGlnbm9yZWRSb3V0ZUZpbGVzOiBbXCIqKi8uKlwiXSxcclxuICAgICAgZnV0dXJlOiB7XHJcbiAgICAgICAgdjNfZmV0Y2hlclBlcnNpc3Q6IHRydWUsXHJcbiAgICAgICAgdjNfcmVsYXRpdmVTcGxhdFBhdGg6IHRydWUsXHJcbiAgICAgICAgdjNfdGhyb3dBYm9ydFJlYXNvbjogdHJ1ZVxyXG4gICAgICB9XHJcbiAgICB9KSxcclxuICAgIG5ldGxpZnlQbHVnaW4oKSxcclxuICAgIHRzY29uZmlnUGF0aHMoKVxyXG4gIF0sXHJcbiAgYnVpbGQ6IHsgYXNzZXRzSW5saW5lTGltaXQ6IDAgfVxyXG59KTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE0WCxTQUFTLGNBQWMsYUFBYTtBQUNoYSxTQUFTLG9CQUFvQjtBQUM3QixPQUFPLG1CQUFtQjtBQUMxQixTQUFTLHFCQUFxQjtBQUU5QixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixRQUFRLEVBQUUsTUFBTSxPQUFPLFFBQVEsSUFBSSxRQUFRLEdBQUksR0FBRyxLQUFLLE1BQU07QUFBQSxFQUM3RCxLQUFLO0FBQUEsSUFDSCxZQUFZLENBQUMsYUFBYTtBQUFBLEVBQzVCO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsTUFDSixtQkFBbUIsQ0FBQyxPQUFPO0FBQUEsTUFDM0IsUUFBUTtBQUFBLFFBQ04sbUJBQW1CO0FBQUEsUUFDbkIsc0JBQXNCO0FBQUEsUUFDdEIscUJBQXFCO0FBQUEsTUFDdkI7QUFBQSxJQUNGLENBQUM7QUFBQSxJQUNELGNBQWM7QUFBQSxJQUNkLGNBQWM7QUFBQSxFQUNoQjtBQUFBLEVBQ0EsT0FBTyxFQUFFLG1CQUFtQixFQUFFO0FBQ2hDLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
