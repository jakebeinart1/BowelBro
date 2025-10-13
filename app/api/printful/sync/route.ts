import { NextRequest, NextResponse } from 'next/server'
import { syncPrintfulProducts } from '@/lib/sync-printful'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const expected = process.env.PRINTFUL_SYNC_SECRET ?? process.env.ADMIN_SECRET
  if (expected) {
    const provided = req.headers.get('x-sync-secret')
    if (provided !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const result = await syncPrintfulProducts()
  return NextResponse.json({ ok: true, ...result })
}
