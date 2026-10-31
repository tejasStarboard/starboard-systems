/** Pure path matcher for extension BFF dispatch (no I/O). */
export function matchExtensionRoute(
  service: string,
  method: string,
  path: string[]
): string | null {
  const key = `${method}:${path.join("/")}`
  if (service === "spot") {
    if (method === "POST" && path.length === 1 && path[0] === "jobs") {
      return "spot.enqueue"
    }
    if (
      method === "GET" &&
      path[0] === "jobs" &&
      path[1] &&
      path.length === 2
    ) {
      return "spot.status"
    }
  }
  if (service === "ingestion") {
    if (method === "POST" && path.length === 1 && path[0] === "jobs") {
      return "ingestion.enqueue"
    }
    if (
      method === "GET" &&
      path[0] === "jobs" &&
      path[1] &&
      path.length === 2
    ) {
      return "ingestion.status"
    }
  }
  if (service === "messaging") {
    if (method === "GET" && key === "GET:connection")
      return "messaging.connection.get"
    if (method === "POST" && key === "POST:connection")
      return "messaging.connection.post"
    if (method === "DELETE" && key === "DELETE:connection")
      return "messaging.connection.delete"
    if (method === "GET" && key === "GET:messages") return "messaging.messages"
    if (method === "POST" && key === "POST:jobs") return "messaging.enqueue"
    if (method === "POST" && key === "POST:send") return "messaging.send"
  }
  return null
}
