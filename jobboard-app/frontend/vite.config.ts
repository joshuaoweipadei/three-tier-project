import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Forward all /api requests to the Express backend
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
      // Forward WebSocket connections
      "/ws": {
        target: "ws://localhost:5001",
        ws: true,
      },
    },
  },
});