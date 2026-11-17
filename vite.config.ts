import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const forcedSite = (env.VITE_BRAND_SITE || "").trim().toLowerCase();
  const brandBootstrap = forcedSite
    ? `<script>window.__BRAND_SITE__=${JSON.stringify(forcedSite)};</script>`
    : "";

  return {
    base: "/",
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react({
        // Use automatic JSX runtime
        jsxImportSource: "react",
      }),
      {
        // Allow each Vercel project to pin its brand before the hostname check
        // runs in index.html (and in src/lib/brandSite.ts at runtime).
        name: "brand-site-bootstrap",
        transformIndexHtml(html: string) {
          if (!brandBootstrap) return html;
          return html.replace("<head>", `<head>\n    ${brandBootstrap}`);
        },
      },
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
    },
    // Ensure errors are visible during build
    build: {
      sourcemap: true,
      minify: "esbuild",
    },
    // Handle environment variables safely
    define: {
      "process.env.NODE_ENV": JSON.stringify(mode),
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      css: true,
      exclude: ["**/node_modules/**", "**/e2e/**", "**/dist/**"],
    },
  };
});
