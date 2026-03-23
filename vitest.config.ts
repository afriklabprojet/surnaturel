import { defineConfig } from "vitest/config"
import { resolve } from "path"

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["__tests__/**/*.test.ts"],
    setupFiles: ["__tests__/setup.ts"],
  },
})
