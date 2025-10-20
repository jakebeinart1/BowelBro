// lib/printful.ts
import axios, { AxiosError } from 'axios'

const PRINTFUL_API = 'https://api.printful.com'

function sanitizeEnvValue(value: string | undefined) {
  const trimmed = (value ?? '').trim().replace(/^"(.+)"$/, '$1').replace(/^'(.+)'$/, '$1')
  const withoutControl = trimmed.replace(/[\u0000-\u001F\u007F\u0080-\u00FF]+/g, '')
  const withoutPasteTokens = withoutControl
    .replace(/\[(?:200|201)~/g, '')
    .replace(/~$/g, '')
  return withoutPasteTokens.replace(/\s+/g, '')
}

const rawKey = process.env.PRINTFUL_API_KEY ?? ''
const apiKey = sanitizeEnvValue(rawKey)
const rawStoreId = process.env.PRINTFUL_STORE_ID ?? ''
const storeId = sanitizeEnvValue(rawStoreId)

if (rawKey && apiKey !== rawKey.trim()) {
  console.warn('[printful] Sanitized API key input; if sync still fails, re-enter the key without paste artefacts.')
}

if (!apiKey) {
  console.warn('[printful] PRINTFUL_API_KEY is missing or empty. Printful requests will fail.')
}

const defaultHeaders: Record<string, string> = {}

if (apiKey) {
  defaultHeaders.Authorization = `Bearer ${apiKey}`
}

if (storeId) {
  defaultHeaders['X-PF-Store-Id'] = storeId
}

export const printful = axios.create({
  baseURL: PRINTFUL_API,
  headers: Object.keys(defaultHeaders).length ? defaultHeaders : undefined
})

const MAX_RETRY_ATTEMPTS = 5
const BASE_RETRY_DELAY_MS = 750
const MAX_RETRY_DELAY_MS = 7_500

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function requestWithRetry<T>(fn: () => Promise<T>, attempt = 0): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    const axiosError = error as AxiosError
    const status = axiosError?.response?.status ?? 0
    const shouldRetry = (status === 429 || status >= 500) && attempt < MAX_RETRY_ATTEMPTS

    if (!shouldRetry) throw error

    const retryAfterHeader = axiosError.response?.headers?.['retry-after']
    const retryAfterSeconds = typeof retryAfterHeader === 'string' ? Number(retryAfterHeader) : Array.isArray(retryAfterHeader) ? Number(retryAfterHeader[0]) : NaN
    const backoff = Math.min(BASE_RETRY_DELAY_MS * 2 ** attempt, MAX_RETRY_DELAY_MS)
    const waitMs = !Number.isNaN(retryAfterSeconds) && retryAfterSeconds > 0 ? retryAfterSeconds * 1000 : backoff

    console.warn(`[printful] Request failed with status ${status}. Retrying in ${Math.round(waitMs)}ms...`)
    await delay(waitMs)
    return requestWithRetry(fn, attempt + 1)
  }
}

type SyncProductListItem = {
  id: number | string
  name: string
  thumbnail_url?: string
}

type SyncProductListResponse = {
  items: SyncProductListItem[]
  paging: {
    total: number
    limit: number
    offset: number
  }
}

function normalizePaging(value: any, fallback: { limit: number; offset: number; total: number }): SyncProductListResponse['paging'] {
  const rawPaging = value?.paging ?? value ?? {}
  const limit = Number(rawPaging?.limit ?? fallback.limit)
  const offset = Number(rawPaging?.offset ?? fallback.offset)
  const total = Number(rawPaging?.total ?? fallback.total)
  return {
    limit: Number.isFinite(limit) ? limit : fallback.limit,
    offset: Number.isFinite(offset) ? offset : fallback.offset,
    total: Number.isFinite(total) ? total : fallback.total
  }
}

function normalizeSyncProductList(data: any, fallbackPaging: { limit: number; offset: number; total: number }): SyncProductListResponse {
  const result = data?.result ?? {}
  const candidateItems = Array.isArray(result)
    ? result
    : Array.isArray(result?.items)
      ? result.items
      : Array.isArray(result?.sync_products)
        ? result.sync_products
        : Array.isArray(data?.result?.sync_products)
          ? data.result.sync_products
          : []

  const items = (candidateItems ?? []).filter(Boolean) as SyncProductListItem[]
  const pagingSource = result?.paging ?? data?.paging ?? {}
  const paging = normalizePaging(pagingSource, {
    limit: fallbackPaging.limit,
    offset: fallbackPaging.offset,
    total: fallbackPaging.offset + items.length
  })

  return {
    items,
    paging
  }
}

/** List synced products (v1). Handles both array and object payload shapes. */
export async function listSyncProducts(limit = 100, offset = 0): Promise<SyncProductListResponse> {
  const response = await requestWithRetry(() => printful.get('/sync/products', { params: { limit, offset } }))
  return normalizeSyncProductList(response.data, { limit, offset, total: offset + limit })
}

/** Get full details for a synced product, including variants (v1). */
export async function getSyncProduct(productId: number) {
  const res = await requestWithRetry(() => printful.get(`/sync/products/${productId}`))
  return res.data?.result as {
    sync_product: { id: number; name: string; thumbnail_url?: string; description?: string }
    sync_variants: Array<{
      id: number | string
      name: string
      retail_price?: string | number
      files?: Array<{ preview_url?: string; thumbnail_url?: string; url?: string }>
    }>
  }
}

export type PrintfulOrderRecipient = {
  name?: string
  email?: string
  phone?: string
  address1?: string
  address2?: string
  city?: string
  state_code?: string
  country_code?: string
  zip?: string
}

export type PrintfulSyncOrderItem = { sync_variant_id: number; quantity: number }

export type CreatePrintfulOrderPayload = {
  external_id: string
  recipient: PrintfulOrderRecipient
  items: PrintfulSyncOrderItem[]
  confirm?: boolean
}

export type PrintfulOrder = {
  id: number
  external_id?: string
  status?: string
  created?: number
  updated?: number
}

export async function createPrintfulOrder(payload: CreatePrintfulOrderPayload): Promise<PrintfulOrder | null> {
  const body: CreatePrintfulOrderPayload = {
    ...payload,
    confirm: payload.confirm ?? true
  }

  const res = await requestWithRetry(() => printful.post('/orders', body))
  return (res.data?.result as PrintfulOrder | undefined) ?? null
}

export async function getPrintfulOrderByExternalId(externalId: string): Promise<PrintfulOrder | null> {
  if (!externalId) return null

  try {
    const res = await requestWithRetry(() => printful.get(`/orders/@${encodeURIComponent(externalId)}`))
    return (res.data?.result as PrintfulOrder | undefined) ?? null
  } catch (error) {
    const axiosError = error as AxiosError
    if (axiosError.response?.status === 404) return null
    throw error
  }
}

export type ManualOrderFile = {
  type?: string | null
  placement?: string | null
  url: string
}

export type ManualOrderItem = {
  source?: 'catalog'
  catalog_variant_id?: number
  quantity: number
  files: ManualOrderFile[]
}

export type CreateManualOrderPayload = {
  external_id: string
  recipient: PrintfulOrderRecipient & { country_code: string; city: string; zip: string; address1: string }
  items: ManualOrderItem[]
  shipping?: string
}

export type ManualOrderCosts = {
  currency?: string
  subtotal?: number
  discount?: number
  shipping?: number
  digitization?: number
  tax?: number
  vat?: number
  total?: number
  calculation_status?: 'pending' | 'calculating' | 'done' | 'failed'
}

export type ManualOrder = {
  id: number
  external_id?: string
  status?: string
  shipping?: { service?: string } | null
  costs?: ManualOrderCosts | null
  items?: Array<{
    id?: number
    name?: string
    quantity?: number
  }>
}

function normalizeCalculationStatus(value: any): ManualOrderCosts['calculation_status'] {
  const raw = String(value ?? '').toLowerCase()
  if (raw === 'done') return 'done'
  if (raw === 'failed') return 'failed'
  if (raw === 'calculating') return 'calculating'
  return 'pending'
}

function handleOrderLookupError(error: unknown): ManualOrder | null {
  const axiosError = error as AxiosError
  if (axiosError?.response?.status === 404) return null
  throw error
}

export async function createManualStoreOrder(payload: CreateManualOrderPayload): Promise<ManualOrder | null> {
  const res = await requestWithRetry(() => printful.post('/v2/orders', payload))
  const order = res.data?.result as ManualOrder | undefined
  if (order?.costs) {
    order.costs.calculation_status = normalizeCalculationStatus(order.costs.calculation_status)
  }
  return order ?? null
}

export async function getManualStoreOrder(id: number): Promise<ManualOrder | null> {
  try {
    const res = await requestWithRetry(() => printful.get(`/v2/orders/${id}`))
    const order = res.data?.result as ManualOrder | undefined
    if (order?.costs) {
      order.costs.calculation_status = normalizeCalculationStatus(order.costs.calculation_status)
    }
    return order ?? null
  } catch (error) {
    return handleOrderLookupError(error)
  }
}

export async function getManualStoreOrderByExternalId(externalId: string): Promise<ManualOrder | null> {
  if (!externalId) return null
  try {
    const res = await requestWithRetry(() => printful.get(`/v2/orders/@${encodeURIComponent(externalId)}`))
    const order = res.data?.result as ManualOrder | undefined
    if (order?.costs) {
      order.costs.calculation_status = normalizeCalculationStatus(order.costs.calculation_status)
    }
    return order ?? null
  } catch (error) {
    return handleOrderLookupError(error)
  }
}

export async function confirmManualStoreOrder(orderId: number): Promise<ManualOrder | null> {
  try {
    const res = await requestWithRetry(() => printful.post(`/v2/orders/${orderId}/confirm`, {}))
    const order = res.data?.result as ManualOrder | undefined
    if (order?.costs) {
      order.costs.calculation_status = normalizeCalculationStatus(order.costs.calculation_status)
    }
    return order ?? null
  } catch (error) {
    const axiosError = error as AxiosError
    if (axiosError?.response?.status === 409) {
      return getManualStoreOrder(orderId)
    }
    throw error
  }
}

export async function waitForManualOrderCosts(orderId: number, { pollIntervalMs = 2000, timeoutMs = 5 * 60 * 1000 } = {}): Promise<ManualOrder | null> {
  const startedAt = Date.now()
  let attempt = 0

  while (Date.now() - startedAt < timeoutMs) {
    const order = await getManualStoreOrder(orderId)
    if (!order) return null

    const status = normalizeCalculationStatus(order.costs?.calculation_status)
    if (status === 'done') return order
    if (status === 'failed') {
      throw new Error(`Printful cost calculation failed for order ${orderId}`)
    }

    const nextDelay = Math.min(pollIntervalMs * Math.max(1, attempt + 1), 8000)
    await delay(nextDelay)
    attempt += 1
  }

  throw new Error(`Timed out waiting for Printful cost calculation for order ${orderId}`)
}

export async function submitManualStoreOrder(
  payload: CreateManualOrderPayload,
  options?: { pollIntervalMs?: number; timeoutMs?: number }
): Promise<ManualOrder | null> {
  let order: ManualOrder | null = null

  try {
    order = await createManualStoreOrder(payload)
  } catch (error) {
    const axiosError = error as AxiosError
    const status = axiosError?.response?.status

    if (status === 409) {
      order = await getManualStoreOrderByExternalId(payload.external_id)
      if (!order) {
        const apiMessage = (axiosError?.response?.data as any)?.error?.message ?? axiosError?.message
        throw new Error(`Printful reported a duplicate order but none was found for external_id=${payload.external_id}: ${apiMessage}`)
      }
    } else {
      const apiMessage = (axiosError?.response?.data as any)?.error?.message ?? axiosError?.message
      const validationDetails = (axiosError?.response?.data as any)?.error ?? axiosError?.response?.data
      const validationJson = validationDetails ? JSON.stringify(validationDetails) : apiMessage
      throw new Error(`Printful order creation failed (${status ?? 'unknown status'}): ${validationJson}`)
    }
  }

  if (!order) {
    order = await getManualStoreOrderByExternalId(payload.external_id)
    if (!order) {
      throw new Error(`Printful order creation failed and could not be retrieved by external_id=${payload.external_id}`)
    }
  }

  const costStatus = normalizeCalculationStatus(order.costs?.calculation_status)
  if (costStatus !== 'done') {
    order = await waitForManualOrderCosts(order.id, options)
  }

  if (!order) {
    throw new Error('Printful order retrieval failed during cost polling')
  }

  const confirmed = await confirmManualStoreOrder(order.id)
  return confirmed ?? order
}
