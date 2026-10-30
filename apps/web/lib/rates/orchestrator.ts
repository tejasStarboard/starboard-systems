import "server-only"

import type {
  CreateRateRequest,
  CreateRateResponse,
  GetRateResponse,
  ListRatesQuery,
  Rate,
} from "@starboard/contracts"

import { getRatesClient } from "@/lib/clients/rates-client"

export async function listRatesForOrg(
  organizationId: string,
  query?: Partial<ListRatesQuery>,
  requestId?: string
): Promise<Rate[]> {
  return getRatesClient().listRates(organizationId, query, requestId)
}

export async function createRateForOrg(
  organizationId: string,
  payload: CreateRateRequest,
  requestId?: string
): Promise<CreateRateResponse> {
  return getRatesClient().createRate(organizationId, payload, requestId)
}

export async function getRateForOrg(
  organizationId: string,
  rateId: string,
  requestId?: string
): Promise<GetRateResponse> {
  return getRatesClient().getRate(organizationId, rateId, requestId)
}
