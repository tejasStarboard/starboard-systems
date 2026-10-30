import type { GeographyConfig } from "./config"
import { createGeographyDb } from "./dao/db"
import { DrizzleGeographyDao } from "./dao/geography.dao"
import { DefaultGeographyService } from "./domain/geography.service"
import { createGeographyController } from "./http/geography.controller"

export type GeographyContainer = {
  service: DefaultGeographyService
  controller: ReturnType<typeof createGeographyController>
}

export function createContainer(config: GeographyConfig): GeographyContainer {
  const db = createGeographyDb(config.postgresUrl)
  const dao = new DrizzleGeographyDao(db)
  const service = new DefaultGeographyService(dao)
  const controller = createGeographyController(service)

  return { service, controller }
}
