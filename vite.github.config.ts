import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const repositoryBase = "/hardsteel-brasil-site/";

const rewritePublicAssetPaths = (): Plugin => ({
  name: "hardsteel-github-pages-assets",
  enforce: "pre",
  transform(code, id) {
    if (!id.replaceAll("\\", "/").endsWith("/app/page.tsx")) return null;
    return code.replaceAll('"/hardsteel-', `"${repositoryBase}hardsteel-`);
  },
});

export default defineConfig({
  base: repositoryBase,
  root: path.resolve(__dirname, "github-preview"),
  publicDir: path.resolve(__dirname, "public"),
  plugins: [rewritePublicAssetPaths(), react()],
  build: {
    emptyOutDir: true,
    outDir: path.resolve(__dirname, "github-pages"),
  },
});
