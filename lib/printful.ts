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

export async function createPrintfulOrder(payload: {
  external_id: string
  recipient: {
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
  items: Array<{ sync_variant_id: number; quantity: number }>
  confirm?: boolean
}) {
  const res = await printful.post('/orders', payload)
  return res.data
}
