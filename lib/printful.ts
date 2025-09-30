// lib/printful.ts
import axios from 'axios'

const PRINTFUL_API = 'https://api.printful.com'

export const printful = axios.create({
  baseURL: PRINTFUL_API,
  headers: { Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}` }
})

/** List synced products (v1). Handles both array and {items:[]} shapes. */
export async function listSyncProducts(limit = 100, offset = 0) {
  const res = await printful.get('/sync/products', { params: { limit, offset } })
  const result = res.data?.result
  const items = Array.isArray(result) ? result : result?.items ?? []
  return items as Array<{ id: number | string; name: string; thumbnail_url?: string }>
}

/** Get full details for a synced product, including variants (v1). */
export async function getSyncProduct(productId: number) {
  const res = await printful.get(`/sync/products/${productId}`)
  return res.data?.result as {
    sync_product: { id: number; name: string; thumbnail_url?: string }
    sync_variants: Array<{
      id: number | string
      name: string
      retail_price?: string | number
      files?: Array<{ preview_url?: string }>
    }>
  }
}
