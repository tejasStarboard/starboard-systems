import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "templates/index": "src/templates/index.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  target: "es2022",
  outDir: "dist",
  external: ["react", "react-dom", "react/jsx-runtime", "resend", "@react-email/components"],
  esbuildOptions(options) {
    options.jsx = "automatic"
  },
})
