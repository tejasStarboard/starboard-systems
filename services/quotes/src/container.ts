import type { QuotesConfig } from "./config"
import { createQuotesDb } from "./dao/db"
import { DrizzleQuotesDao } from "./dao/quotes.dao"
import { DefaultQuotesService } from "./domain/quotes.service"
import { createQuotesController } from "./http/quotes.controller"

export type QuotesContainer = {
  service: DefaultQuotesService
  controller: ReturnType<typeof createQuotesController>
}

export function createContainer(config: QuotesConfig): QuotesContainer {
  const db = createQuotesDb(config.postgresUrl)
  const dao = new DrizzleQuotesDao(db)
  const service = new DefaultQuotesService(dao)
  const controller = createQuotesController(service)

  return { service, controller }
}
