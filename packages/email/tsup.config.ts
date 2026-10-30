import { defineConfig } from "tsup"

export default defineConfig((options) => ({
  entry: {
    index: "src/index.ts",
    "templates/index": "src/templates/index.ts",
  },
  format: ["esm"],
  dts: true,
  clean: !options.watch,
  sourcemap: true,
  target: "es2022",
  outDir: "dist",
  external: [
    "react",
    "react-dom",
    "react/jsx-runtime",
    "resend",
    "@react-email/components",
  ],
  esbuildOptions(esbuildOptions) {
    esbuildOptions.jsx = "automatic"
  },
}))
