import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  server: {
    host: 'observatorio.blockcode.site',
    allowedHosts: ['observatorio.blockcode.site'],
    watch: {
      usePolling: process.env.CHOKIDAR_USEPOLLING === "true"
    }
  },
  test: {
    // Bound jsdom concurrency so lazy-route checks are not starved on local validation.
    maxWorkers: 2,
    environment: "jsdom",
    exclude: [...configDefaults.exclude, "e2e/**"],
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    restoreMocks: true
  }
});
