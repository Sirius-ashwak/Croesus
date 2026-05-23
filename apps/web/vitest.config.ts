import { defineConfig } from "vitest/config";
import path from "node:path";

/** Unit tests for the pure calc engines (no DOM needed). */
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname) },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
