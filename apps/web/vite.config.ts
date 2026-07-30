import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3333",
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  test: {
    env: {
      VITE_API_URL: "",
    },
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}", "src/**/tests.{ts,tsx}"],
    setupFiles: "./src/test/setup.ts",
  },
});
