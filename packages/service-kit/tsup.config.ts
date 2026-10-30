import { defineConfig } from "tsup"

export default defineConfig((options) => ({
  entry: {
    index: "src/index.ts",
  },
  format: ["esm"],
  dts: true,
  // Avoid wiping dist while turbo starts Bun services in parallel.
  clean: !options.watch,
  sourcemap: true,
  target: "es2022",
  outDir: "dist",
  external: ["hono"],
}))
