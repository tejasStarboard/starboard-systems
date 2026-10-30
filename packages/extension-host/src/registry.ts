import { extensionManifestSchema, type ExtensionManifest } from "./manifest.js"

const stubManifests = [
  {
    id: "ingestion.fcl_v6",
    version: "0.0.0",
    displayName: "Ocean FCL ingestion (v6)",
    requiredPlan: ["credit", "enterprise"],
    contributes: {
      nav: [
        {
          id: "rates-upload",
          label: "Rate upload",
          href: "/rates/upload",
        },
      ],
      jobs: [{ type: "ingestion.fcl_v6.pipeline" }],
      api: [{ pathPrefix: "/api/extensions/ingestion.fcl_v6" }],
      uiSlots: ["rates.upload"],
    },
    worker: {
      kind: "python-dbos",
      service: "ingestion",
      plugin: "fcl_v6",
    },
    healthPath: "/health",
    enabled: false,
  },
  {
    id: "messaging.msgraph",
    version: "0.0.0",
    displayName: "Microsoft Graph email",
    requiredPlan: ["enterprise"],
    contributes: {
      nav: [
        {
          id: "inbox",
          label: "Inbox",
          href: "/messaging/inbox",
        },
      ],
      jobs: [{ type: "messaging.msgraph.sync" }],
      api: [{ pathPrefix: "/api/extensions/messaging.msgraph" }],
      uiSlots: ["messaging.inbox"],
    },
    worker: {
      kind: "python-dbos",
      service: "messaging",
      plugin: "msgraph",
    },
    healthPath: "/health",
    enabled: false,
  },
  {
    id: "spot.maersk",
    version: "0.0.0",
    displayName: "Maersk spot rates",
    requiredPlan: ["credit", "enterprise"],
    contributes: {
      jobs: [{ type: "spot.search", carrier: "maersk" }],
      api: [{ pathPrefix: "/api/extensions/spot.maersk" }],
      uiSlots: ["quote.rateSources"],
    },
    worker: {
      kind: "python-dbos",
      service: "spot",
      plugin: "maersk",
    },
    healthPath: "/health",
    enabled: false,
  },
  {
    id: "spot.cma",
    version: "0.0.0",
    displayName: "CMA CGM spot rates",
    requiredPlan: ["credit", "enterprise"],
    contributes: {
      jobs: [{ type: "spot.search", carrier: "cma" }],
      api: [{ pathPrefix: "/api/extensions/spot.cma" }],
      uiSlots: ["quote.rateSources"],
    },
    worker: {
      kind: "python-dbos",
      service: "spot",
      plugin: "cma",
    },
    healthPath: "/health",
    enabled: false,
  },
] as const satisfies readonly ExtensionManifest[]

export const extensionRegistry: ExtensionManifest[] = stubManifests.map(
  (manifest) => extensionManifestSchema.parse(manifest)
)

export function listManifests(): ExtensionManifest[] {
  return extensionRegistry.map((manifest) => ({ ...manifest }))
}
