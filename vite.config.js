import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Served at https://matthewray-pgh.github.io/resaler/ — must match the repo name.
  base: "/resaler/",
  server: {
    port: 5173,
  },
});
