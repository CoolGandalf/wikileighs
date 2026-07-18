import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  base: "/wikileighs/project-field/",
  build: {
    outDir: fileURLToPath(new URL("../public/project-field", import.meta.url)),
    emptyOutDir: true,
  },
});
