#!/usr/bin/env bun
import { seedE2e } from "./seed"

seedE2e()
  .then((fixtures) => {
    console.log("e2e-seed: ready", fixtures)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
