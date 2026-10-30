# Extension host — manifests

Shell discovers extensions via `packages/extension-host` (see ticket 001). UI and BFF must not hard-code optional features.

## Manifest schema (sketch)

```ts
type ExtensionManifest = {
  id: string; // e.g. "spot.maersk"
  version: string;
  displayName: string;
  requiredPlan: Array<"credit" | "enterprise">;
  contributes: {
    nav?: Array<{ id: string; label: string; href: string }>;
    jobs?: Array<{ type: string; carrier?: string }>;
    api?: Array<{ pathPrefix: string }>;
    uiSlots?: string[]; // e.g. "quote.rateSources", "rates.upload"
  };
  worker?: {
    kind: "python-dbos";
    service: string; // "ingestion" | "messaging" | "spot"
    plugin: string;
  };
  healthPath?: string;
  enabled?: boolean; // deploy / org flag
};
```

## Registered extensions (stubs)

| id | Wave | Worker | Notes |
|----|------|--------|-------|
| `ingestion.fcl_v6` | 2 | Python ingestion | Ocean FCL only; gate-first save |
| `messaging.msgraph` | 3 | Python messaging | First email provider |
| `spot.maersk` | 4 | Python spot | API and/or scraper strategies |
| `spot.cma` | 4 | Python spot | API and/or scraper strategies |

## Planned later (not registered yet)

- `ingestion.air_v2`, `ingestion.lcl`, `ingestion.cartage_v2`, `ingestion.drayage_v2`
- `messaging.gmail`, `messaging.front`, `messaging.imap`
- More `spot.*` carriers
- Outlook add-in host, companion, public-api, intelligence.*

## Unplug checklist

1. Set `enabled: false` (or remove from registry).
2. Confirm shell hides nav / UI slots / API proxy.
3. Stop deploying the worker plugin.
4. Expand/contract drop optional schema if any.
5. Delete plugin package. Shell feature code needs **zero** surgical edits.
