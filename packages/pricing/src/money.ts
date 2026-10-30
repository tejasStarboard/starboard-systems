/** Half-up money rounding to `decimals` places (default 2). Non-finite → 0. */
export function roundMoney(value: number, decimals = 2): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  const factor = 10 ** decimals
  return (
    Math.round((value + Number.EPSILON * Math.sign(value || 1)) * factor) /
    factor
  )
}
