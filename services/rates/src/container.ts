import type { RatesConfig } from "./config"
import { createRatesDb } from "./dao/db"
import { DrizzleRatesDao } from "./dao/rates.dao"
import { DefaultRatesService } from "./domain/rates.service"
import { createRatesController } from "./http/rates.controller"

export type RatesContainer = {
  service: DefaultRatesService
  controller: ReturnType<typeof createRatesController>
}

export function createContainer(config: RatesConfig): RatesContainer {
  const db = createRatesDb(config.postgresUrl)
  const dao = new DrizzleRatesDao(db)
  const service = new DefaultRatesService(dao)
  const controller = createRatesController(service)

  return { service, controller }
}
