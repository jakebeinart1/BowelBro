import { headers } from 'next/headers'

/** Derive the request origin based on forwarded headers with fallbacks. */
export function getRequestOrigin() {
  const h = headers()
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? process.env.VERCEL_URL
  return `${proto}://${host}`
}
