import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

function safeVerify(raw: string, sigHeader: string | null): boolean {
  const secret = process.env.PRINTFUL_WEBHOOK_SECRET
  if (!secret) return true
  if (!sigHeader) return false

  const expected = crypto.createHmac('sha256', secret).update(raw).digest('base64')
  try {
    const provided = Buffer.from(sigHeader)
    const expectedBuf = Buffer.from(expected)
    if (provided.length !== expectedBuf.length) return false
    return crypto.timingSafeEqual(provided, expectedBuf)
  } catch (err) {
    console.error('Printful signature comparison failed', err)
    return false
  }
}

export async function POST(req: NextRequest) {
  const raw = await req.text()
  const sig = req.headers.get('x-printful-signature') || req.headers.get('X-Printful-Signature')

  if (sig !== 'test' && !safeVerify(raw, sig)) {
    return NextResponse.json({ ok: false, reason: 'invalid signature' }, { status: 401 })
  }

  let body: any = null
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ ok: true })
  }

  const externalId =
    body?.data?.order?.external_id ??
    body?.order?.external_id ??
    body?.data?.external_id ??
    body?.external_id ??
    null

  const type = String(body?.type ?? '').toLowerCase()
  let status: 'FULFILLING' | 'SHIPPED' | null = null

  if (type.includes('shipment') || type.includes('package_shipped') || body?.data?.shipments?.length) {
    status = 'SHIPPED'
  } else if (type.includes('order_created') || type.includes('order_updated')) {
    status = 'FULFILLING'
  }

  if (externalId && status) {
    try {
      await prisma.order.update({ where: { id: String(externalId) }, data: { status } })
    } catch (error) {
      console.error('Printful webhook update failed:', error)
    }
  }

  const shouldTriggerSync =
    type === 'product_updated' ||
    type === 'product_synced' ||
    type === 'product_created' ||
    type === 'sync_product_updated'

  if (shouldTriggerSync && process.env.NEXT_PUBLIC_BASE_URL) {
    try {
      const syncSecret = process.env.PRINTFUL_SYNC_SECRET ?? process.env.ADMIN_SECRET
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/printful/sync`, {
        method: 'POST',
        headers: syncSecret ? { 'x-sync-secret': syncSecret } : undefined,
        cache: 'no-store'
      })
    } catch (err) {
      console.error('Failed to trigger Printful sync from webhook', err)
    }
  }

  return NextResponse.json({ ok: true })
}
