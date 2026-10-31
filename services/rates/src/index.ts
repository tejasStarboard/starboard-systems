import { Hono } from "hono"
import {
  createRequestIdMiddleware,
  createServiceTokenMiddleware,
  logInfo,
  type ServiceVariables,
} from "@starboard/lib-service-kit"

import { loadConfig } from "./config"
import { createContainer } from "./container"

const config = loadConfig()
const { controller } = createContainer(config)

const app = new Hono<{ Variables: ServiceVariables }>()

app.use("*", createRequestIdMiddleware())

app.get("/health", (c) => c.json({ ok: true, service: config.serviceName }))

const requireServiceToken = createServiceTokenMiddleware(config.serviceToken)
app.use("/rates/*", requireServiceToken)
app.use("/rates", requireServiceToken)

app.route("/", controller)

logInfo(config.serviceName, "boot", "listening", { port: config.port })

export default {
  port: config.port,
  fetch: app.fetch,
}
