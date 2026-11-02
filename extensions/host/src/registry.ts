import { extensionManifestSchema, type ExtensionManifest } from "./manifest.js"
import { builtinManifests } from "./builtins.js"
import { validateManifestSet } from "./validate.js"

const stubManifests = [
  {
    id: "ingestion.fcl_v6",
    version: "0.0.0",
    displayName: "Ocean FCL ingestion (v6)",
    requiredPlan: ["credit", "enterprise"],
    contributes: {
      activity: [{ id: "rates", label: "Rates", icon: "upload" }],
      views: [
        {
          id: "ingestion.fcl_v6.upload",
          name: "Rate upload",
          activityId: "rates",
          entries: [
            {
              id: "ingestion.fcl_v6.upload.link",
              label: "Upload CSV",
              href: "/rates/upload",
            },
          ],
        },
      ],
      editors: [
        {
          viewType: "rates.upload",
          displayName: "Rate upload",
          deepLink: "/rates/upload",
        },
      ],
      jobs: [{ type: "ingestion.fcl_v6.pipeline" }],
      api: [{ pathPrefix: "/api/extensions/ingestion.fcl_v6" }],
    },
    worker: {
      kind: "python-temporal",
      service: "ingestion",
      plugin: "fcl_v6",
    },
    healthPath: "/health",
    enabled: true,
  },
  {
    id: "messaging.msgraph",
    version: "0.0.0",
    displayName: "Microsoft Graph email",
    requiredPlan: ["enterprise"],
    contributes: {
      activity: [{ id: "messaging", label: "Messaging", icon: "mail" }],
      views: [
        {
          id: "messaging.msgraph.inbox",
          name: "Inbox",
          activityId: "messaging",
          entries: [
            {
              id: "messaging.msgraph.inbox.link",
              label: "Inbox",
              href: "/messaging/inbox",
            },
          ],
        },
      ],
      editors: [
        {
          viewType: "messaging.inbox",
          displayName: "Inbox",
          deepLink: "/messaging/inbox",
        },
      ],
      jobs: [{ type: "messaging.msgraph.sync" }],
      api: [{ pathPrefix: "/api/extensions/messaging.msgraph" }],
      settings: [
        {
          key: "sync_interval_minutes",
          label: "Sync interval (minutes)",
          description: "How often the mailbox sync job should run.",
          type: "number",
          default: 15,
          scope: "platform",
        },
      ],
    },
    worker: {
      kind: "python-temporal",
      service: "messaging",
      plugin: "msgraph",
    },
    healthPath: "/health",
    enabled: true,
  },
  {
    id: "spot.fake",
    version: "0.0.0",
    displayName: "Fake spot rates",
    requiredPlan: ["credit", "enterprise"],
    contributes: {
      jobs: [{ type: "spot.search", carrier: "fake" }],
      api: [{ pathPrefix: "/api/extensions/spot.fake" }],
      points: {
        "quoting.slots.rateSources": [
          {
            id: "spot.fake.source",
            label: "Fake spot rates",
            component: "rates.spotSource",
            props: { carrier: "fake" },
          },
        ],
      },
    },
    worker: {
      kind: "python-temporal",
      service: "spot",
      plugin: "fake",
    },
    healthPath: "/health",
    enabled: true,
  },
  {
    id: "spot.maersk",
    version: "0.0.0",
    displayName: "Maersk spot rates",
    requiredPlan: ["credit", "enterprise"],
    contributes: {
      jobs: [{ type: "spot.search", carrier: "maersk" }],
      api: [{ pathPrefix: "/api/extensions/spot.maersk" }],
      points: {
        "quoting.slots.rateSources": [
          {
            id: "spot.maersk.source",
            label: "Maersk spot rates",
            component: "rates.spotSource",
            props: { carrier: "maersk" },
          },
        ],
      },
      settings: [
        {
          key: "live_strategy",
          label: "Live strategy",
          description: "Use the live carrier strategy instead of the fixture.",
          type: "boolean",
          default: false,
          scope: "platform",
        },
      ],
    },
    worker: {
      kind: "python-temporal",
      service: "spot",
      plugin: "maersk",
    },
    healthPath: "/health",
    enabled: true,
  },
  {
    id: "spot.cma",
    version: "0.0.0",
    displayName: "CMA CGM spot rates",
    requiredPlan: ["credit", "enterprise"],
    contributes: {
      jobs: [{ type: "spot.search", carrier: "cma" }],
      api: [{ pathPrefix: "/api/extensions/spot.cma" }],
      points: {
        "quoting.slots.rateSources": [
          {
            id: "spot.cma.source",
            label: "CMA CGM spot rates",
            component: "rates.spotSource",
            props: { carrier: "cma" },
          },
        ],
      },
      settings: [
        {
          key: "live_strategy",
          label: "Live strategy",
          description: "Use the live carrier strategy instead of the fixture.",
          type: "boolean",
          default: false,
          scope: "platform",
        },
      ],
    },
    worker: {
      kind: "python-temporal",
      service: "spot",
      plugin: "cma",
    },
    healthPath: "/health",
    enabled: true,
  },
] as const satisfies readonly ExtensionManifest[]

export const extensionRegistry: ExtensionManifest[] = [
  ...builtinManifests,
  ...stubManifests,
].map((manifest) => extensionManifestSchema.parse(manifest))

const registryErrors = validateManifestSet(extensionRegistry)
if (registryErrors.length > 0) {
  throw new Error(`Invalid extension registry: ${registryErrors.join("; ")}`)
}

export function listManifests(): ExtensionManifest[] {
  return extensionRegistry.map((manifest) => ({ ...manifest }))
}
