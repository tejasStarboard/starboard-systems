"use client"

import { Component, type ReactNode } from "react"

/**
 * Contribution errors (map render, bad geo data) must never take the Route
 * step down: show `fallback` (the classic `PortCombobox` fields) instead.
 */
export class RouteBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
