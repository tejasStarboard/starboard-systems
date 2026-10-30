import { defineConfig } from "tsup"

export default defineConfig((options) => ({
  entry: {
    index: "src/index.ts",
    "schema/index": "src/schema/index.ts",
    "schema/auth": "src/schema/auth.ts",
    "schema/geography": "src/schema/geography.ts",
    "schema/quote": "src/schema/quote.ts",
    "schema/crm": "src/schema/crm.ts",
    "schema/rates": "src/schema/rates.ts",
  },
  format: ["esm"],
  dts: true,
  clean: !options.watch,
  sourcemap: true,
  splitting: false,
  target: "es2022",
  outDir: "dist",
  external: [
    "drizzle-orm",
    "@neondatabase/serverless",
    "zod",
    "@starboard/contracts",
  ],
}))
