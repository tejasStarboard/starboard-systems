import { defineConfig } from "tsup"

/** CLI `--watch` is reliable; `options.watch` is often unset in the config callback. */
const isWatch = process.argv.includes("--watch")

export default defineConfig({
  entry: {
    index: "src/index.ts",
  },
  format: ["esm"],
  // DTS over the builtin-manifest graph pegs a core in watch; emit types on `pnpm build` only.
  dts: !isWatch,
  clean: !isWatch,
  sourcemap: true,
  splitting: false,
  target: "es2022",
  outDir: "dist",
  // Keep workspace packages external so `--watch` does not rebundle the builtins tree.
  external: [/^@starboard\//, "zod"],
})
