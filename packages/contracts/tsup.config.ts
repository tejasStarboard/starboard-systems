import { defineConfig } from "tsup"

export default defineConfig((options) => ({
  entry: {
    index: "src/index.ts",
    quotes: "src/quotes.ts",
    surcharge: "src/surcharge.ts",
    geography: "src/geography.ts",
    crm: "src/crm.ts",
    rates: "src/rates.ts",
  },
  format: ["esm"],
  dts: true,
  clean: !options.watch,
  sourcemap: true,
  splitting: false,
  target: "es2022",
  outDir: "dist",
  external: ["zod"],
}))
