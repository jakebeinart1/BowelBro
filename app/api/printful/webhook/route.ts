import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

function verifySignature(raw: string, sig: string | null) {
  const secret = process.env.PRINTFUL_WEBHOOK_SECRET
  if (!secret) return true
  if (!sig) return false
  const expected = crypto.createHmac('sha256', secret).update(raw).digest('base64')
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
}

export async function POST(req: NextRequest) {
  const raw = await req.text()
  const sig = req.headers.get('x-printful-signature') || req.headers.get('X-Printful-Signature')
  if (!verifySignature(raw, sig)) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })

  let body: any
  try {
    body = JSON.parse(raw)
  } catch (err) {
    return NextResponse.json({ ok: true })
  }

  const ext =
    body?.data?.order?.external_id ??
    body?.order?.external_id ??
    body?.external_id ??
    null

  if (!ext) return NextResponse.json({ ok: true })

  const type = String(body?.type ?? '').toLowerCase()
  let status: 'FULFILLING' | 'SHIPPED' | null = null
  if (type.includes('package_shipped') || body?.data?.shipments?.length) status = 'SHIPPED'
  else if (type.includes('order_created') || type.includes('order_updated')) status = 'FULFILLING'

  if (status) {
    await prisma.order.update({ where: { id: String(ext) }, data: { status } }).catch(() => {})
  }
  return NextResponse.json({ ok: true })
}
