import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "schema/index": "src/schema/index.ts",
    "schema/auth": "src/schema/auth.ts",
    "schema/geography": "src/schema/geography.ts",
    "schema/quote": "src/schema/quote.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  target: "es2022",
  outDir: "dist",
  external: ["drizzle-orm", "@neondatabase/serverless", "zod"],
})
