import type { CrmConfig } from "./config"
import { createCrmDb } from "./dao/db"
import { DrizzleCrmDao } from "./dao/crm.dao"
import { DefaultCrmService } from "./domain/crm.service"
import { createCrmController } from "./http/crm.controller"

export type CrmContainer = {
  service: DefaultCrmService
  controller: ReturnType<typeof createCrmController>
}

export function createContainer(config: CrmConfig): CrmContainer {
  const db = createCrmDb(config.postgresUrl)
  const dao = new DrizzleCrmDao(db)
  const service = new DefaultCrmService(dao)
  const controller = createCrmController(service)

  return { service, controller }
}
