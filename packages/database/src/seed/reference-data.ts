import type { Dimensions } from "../schema/quote"

export const defaultContainerTypes: Array<{
  type: string
  label: string
  dimensions: Dimensions
}> = [
  {
    type: "20GP",
    label: "20' General Purpose",
    dimensions: { length: 6.06, width: 2.44, height: 2.59 },
  },
  {
    type: "20OT",
    label: "20' Open Top",
    dimensions: { length: 6.06, width: 2.44, height: 2.59 },
  },
  {
    type: "40GP",
    label: "40' General Purpose",
    dimensions: { length: 12.19, width: 2.44, height: 2.59 },
  },
  {
    type: "40HC",
    label: "40' High Cube",
    dimensions: { length: 12.19, width: 2.44, height: 2.9 },
  },
  {
    type: "40OT",
    label: "40' Open Top",
    dimensions: { length: 12.19, width: 2.44, height: 2.59 },
  },
  {
    type: "45GP",
    label: "45' General Purpose",
    dimensions: { length: 13.72, width: 2.44, height: 2.59 },
  },
  {
    type: "45HC",
    label: "45' High Cube",
    dimensions: { length: 13.72, width: 2.44, height: 2.9 },
  },
  {
    type: "20RF",
    label: "20' Reefer",
    dimensions: { length: 6.06, width: 2.44, height: 2.59 },
  },
  {
    type: "40RF",
    label: "40' Reefer",
    dimensions: { length: 12.19, width: 2.44, height: 2.59 },
  },
  {
    type: "40RH",
    label: "40' Reefer High Cube",
    dimensions: { length: 12.19, width: 2.44, height: 2.9 },
  },
  {
    type: "40NOR",
    label: "40' Non-Operating Reefer",
    dimensions: { length: 12.19, width: 2.44, height: 2.59 },
  },
]

/** Footprint from UI; deck heights from EPAL / regional standards (meters). */
export const defaultPalletTypes: Array<{
  type: string
  label: string
  dimensions: Dimensions
}> = [
  {
    type: "EUROPEAN",
    label: "European (120 × 80 cm)",
    dimensions: { length: 1.2, width: 0.8, height: 0.144 },
  },
  {
    type: "AMERICAN",
    label: "American (122 × 102 cm)",
    dimensions: { length: 1.22, width: 1.02, height: 0.144 },
  },
  {
    type: "AUSTRALIAN",
    label: "Australian (116.5 × 116.5 cm)",
    dimensions: { length: 1.165, width: 1.165, height: 0.15 },
  },
  {
    type: "ASIAN",
    label: "Asian (110 × 110 cm)",
    dimensions: { length: 1.1, width: 1.1, height: 0.15 },
  },
  {
    type: "ISO",
    label: "ISO (120 × 100 cm)",
    dimensions: { length: 1.2, width: 1.0, height: 0.144 },
  },
  {
    type: "CUSTOM",
    label: "Custom",
    dimensions: { length: 0, width: 0, height: 0 },
  },
]
