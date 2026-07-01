import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // All /api calls are transparently forwarded to Express
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
