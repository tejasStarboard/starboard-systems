import "server-only"

import type {
  CreateRateRequest,
  CreateRateResponse,
  GetRateResponse,
  ListRatesQuery,
  Rate,
  UpdateRateRequest,
  UpdateRateResponse,
} from "@starboard/lib-contracts"

import {
  getRatesClient,
  type RatesClient,
} from "@/lib/domain/rates/rates.client"

export class RatesManager {
  constructor(private readonly ratesClient: RatesClient = getRatesClient()) {}

  async listRatesForOrg(
    organizationId: string,
    query?: Partial<ListRatesQuery>,
    requestId?: string
  ): Promise<Rate[]> {
    return this.ratesClient.listRates(organizationId, query, requestId)
  }

  async createRateForOrg(
    organizationId: string,
    payload: CreateRateRequest,
    requestId?: string
  ): Promise<CreateRateResponse> {
    return this.ratesClient.createRate(organizationId, payload, requestId)
  }

  async getRateForOrg(
    organizationId: string,
    rateId: string,
    requestId?: string
  ): Promise<GetRateResponse> {
    return this.ratesClient.getRate(organizationId, rateId, requestId)
  }

  async updateRateForOrg(
    organizationId: string,
    rateId: string,
    payload: UpdateRateRequest,
    requestId?: string
  ): Promise<UpdateRateResponse> {
    return this.ratesClient.updateRate(
      organizationId,
      rateId,
      payload,
      requestId
    )
  }

  async deleteRateForOrg(
    organizationId: string,
    rateId: string,
    requestId?: string
  ): Promise<void> {
    return this.ratesClient.deleteRate(organizationId, rateId, requestId)
  }
}

let ratesManager: RatesManager = new RatesManager()

export function getRatesManager(): RatesManager {
  return ratesManager
}

export function setRatesManager(manager: RatesManager) {
  ratesManager = manager
}
