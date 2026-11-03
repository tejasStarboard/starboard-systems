import type { ComponentType } from "react"

import {
  editors as crmPartiesEditors,
  views as crmPartiesViews,
} from "@starboard/ext-crm-parties"
import { pointComponents as geoGazetteerPoints } from "@starboard/ext-geo-gazetteer"
import { pointComponents as quotingChargesPoints } from "@starboard/ext-quoting-charges"
import { pointComponents as quotingIncotermPoints } from "@starboard/ext-quoting-incoterm"
import { pointComponents as quotingMarkupPoints } from "@starboard/ext-quoting-markup"
import { pointComponents as quotingPdfPoints } from "@starboard/ext-quoting-pdf"
import {
  editors as ratesCatalogEditors,
  pointComponents as ratesCatalogPoints,
} from "@starboard/ext-rates-catalog"
import {
  editors as orgSettingsEditors,
  views as orgSettingsViews,
} from "@starboard/ext-org-settings"
import {
  editors as quotingDocumentEditors,
  pointComponents as quotingDocumentPoints,
  views as quotingDocumentViews,
  type BuiltinEditorProps,
  type BuiltinHost,
  type BuiltinViewProps,
} from "@starboard/ext-quoting-document"

export type { BuiltinHost }

/** Props the editor host passes to a built-in editor factory. */
export type BuiltinEditorComponent = ComponentType<BuiltinEditorProps>

/** Props the sidebar host passes to a built-in view factory. */
export type BuiltinViewComponent = ComponentType<BuiltinViewProps>

/**
 * Composition root for extension-provided UI. The kernel resolves by contributed
 * `workbench.editors` viewType / `workbench.views` id only (and only when the
 * host actually contributed it — unplug = no render). Add a package's
 * `editors` / `views` maps here when it ships real UI.
 */
export const builtinEditors: Readonly<Record<string, BuiltinEditorComponent>> =
  {
    ...quotingDocumentEditors,
    ...crmPartiesEditors,
    ...orgSettingsEditors,
    ...ratesCatalogEditors,
  }

export const builtinViews: Readonly<Record<string, BuiltinViewComponent>> = {
  ...quotingDocumentViews,
  ...crmPartiesViews,
  ...orgSettingsViews,
}

/**
 * UI factories contributed into extension-defined points (slots), keyed by
 * contribution id / `component`. Generic like editors/views: the kernel never
 * names a slot; the owning editor's slot host resolves entries from the
 * host-provided active contributions.
 */
export const builtinPointComponents: Readonly<
  Record<string, ComponentType<never>>
> = {
  ...quotingDocumentPoints,
  ...geoGazetteerPoints,
  ...quotingChargesPoints,
  ...quotingIncotermPoints,
  ...quotingMarkupPoints,
  ...quotingPdfPoints,
  ...ratesCatalogPoints,
}
