import { defineShellE2eConfig } from "@starboard/tool-e2e/playwright"

// Shell BFF e2e only (auth gates + workbench chrome).
// Extension product flows live under extensions/builtins/<ext>/e2e.
export default defineShellE2eConfig()
