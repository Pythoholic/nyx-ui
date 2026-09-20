import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";
import { routePaths } from "./src/routes.js";

function staticRouteFallbacks(): Plugin {
  return {
    name: "nyx-static-route-fallbacks",
    apply: "build",
    enforce: "post",
    generateBundle(_options, bundle) {
      const index = bundle["index.html"];
      if (!index || index.type !== "asset") {
        throw new Error("Vite did not emit the documentation index page.");
      }
      routePaths.filter((path) => path !== "/").forEach((path) => {
        this.emitFile({
          type: "asset",
          fileName: `${path.slice(1)}/index.html`,
          source: index.source,
        });
      });
      this.emitFile({ type: "asset", fileName: "404.html", source: index.source });
    },
  };
}

export default defineConfig({
  resolve: { dedupe: ["@nyx-ui/core", "@nyx-ui/plugins"] },
  plugins: [tailwindcss(), staticRouteFallbacks()],
  build: {
    emptyOutDir: true,
    outDir: "../../dist",
  },
});
