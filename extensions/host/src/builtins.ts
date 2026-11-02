import { manifest as crmParties } from "@starboard/ext-crm-parties/manifest"
import { manifest as geoGazetteer } from "@starboard/ext-geo-gazetteer/manifest"
import { manifest as orgSettings } from "@starboard/ext-org-settings/manifest"
import { manifest as quotingCharges } from "@starboard/ext-quoting-charges/manifest"
import { manifest as quotingDocument } from "@starboard/ext-quoting-document/manifest"
import { manifest as ratesCatalog } from "@starboard/ext-rates-catalog/manifest"

/**
 * Driving built-in manifests (076). Layout convention:
 * `extensions/builtins/<id-with-dashes>/` → `@starboard/ext-<id-with-dashes>`,
 * each exporting a pure-data `./manifest`. Registered default-on for
 * credit + enterprise; order = activation / contribution order.
 */
export const builtinManifests: readonly unknown[] = [
  quotingDocument,
  quotingCharges,
  crmParties,
  geoGazetteer,
  ratesCatalog,
  orgSettings,
]
