import type { ExtensionManifest } from "./manifest.js"

/** point id → ids of every manifest that defines it (registry order). */
export function getPointDefiners(
  manifests: ExtensionManifest[]
): Map<string, string[]> {
  const definers = new Map<string, string[]>()
  for (const manifest of manifests) {
    for (const point of manifest.defines?.extensionPoints ?? []) {
      definers.set(point.id, [...(definers.get(point.id) ?? []), manifest.id])
    }
  }
  return definers
}

/**
 * Cross-manifest validation (single owner per point). Returns human-readable
 * errors; empty = valid. Per-manifest rules live in the Zod schema.
 */
export function validateManifestSet(manifests: ExtensionManifest[]): string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  for (const manifest of manifests) {
    if (ids.has(manifest.id)) {
      errors.push(`Duplicate extension id "${manifest.id}"`)
    }
    ids.add(manifest.id)
  }
  for (const [pointId, owners] of getPointDefiners(manifests)) {
    if (owners.length > 1) {
      errors.push(
        `Point "${pointId}" defined by multiple extensions: ${owners.join(", ")}`
      )
    }
  }
  return errors
}
