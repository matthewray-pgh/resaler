import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Served at https://<user>.github.io/Resaler/ — must match the repo name.
  base: "/Resaler/",
  server: {
    port: 5173,
  },
});
