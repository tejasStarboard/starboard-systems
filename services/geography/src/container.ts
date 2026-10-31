import type { GeographyConfig } from "./config"
import { createGeographyDb } from "./dao/db"
import { DrizzleGeographyDao } from "./dao/geography.dao"
import { DefaultGeographyService } from "./domain/geography.service"
import { createGeographyController } from "./http/geography.controller"
import { GooglePlacesClient } from "./integrations/google-places"

export type GeographyContainer = {
  service: DefaultGeographyService
  controller: ReturnType<typeof createGeographyController>
}

export function createContainer(config: GeographyConfig): GeographyContainer {
  const db = createGeographyDb(config.postgresUrl)
  const dao = new DrizzleGeographyDao(db)
  const places = new GooglePlacesClient(config.googleGeocodeApiKey)
  const service = new DefaultGeographyService(dao, places)
  const controller = createGeographyController(service)

  return { service, controller }
}
