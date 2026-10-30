import { defineConfig } from "tsup"

export default defineConfig((options) => ({
  entry: {
    index: "src/index.ts",
  },
  format: ["esm"],
  dts: true,
  clean: !options.watch,
  sourcemap: true,
  splitting: false,
  target: "es2022",
  outDir: "dist",
}))
