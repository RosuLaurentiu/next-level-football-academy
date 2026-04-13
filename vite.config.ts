import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === "github-pages" ? "/next-level-football-academy/" : "/",
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
}));
