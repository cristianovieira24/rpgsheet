import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/ficha-d-d/",
  plugins: [react()],
  build: {
    outDir: "gh-pages-dist",
    emptyOutDir: true,
  },
});
