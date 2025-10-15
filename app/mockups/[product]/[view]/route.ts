import fs from 'fs/promises'
import path from 'path'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getMockupFile, getMockupSlug, MOCKUP_VIEWS, type MockupView } from '@/lib/mockup-images'

export const runtime = 'nodejs'

function normalizeView(viewParam: string) {
  const cleaned = viewParam.toLowerCase().replace(/\.jpg$/, '').replace(/\.jpeg$/, '')
  return cleaned
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { product: string; view: string } }
) {
  const productSlug = getMockupSlug(params.product, params.product)
  const viewKey = normalizeView(params.view)

  if (!MOCKUP_VIEWS.includes(viewKey as MockupView)) {
    return NextResponse.json({ error: 'Mockup view not found' }, { status: 404 })
  }

  const filePath = getMockupFile(productSlug, viewKey as MockupView, productSlug)
  if (!filePath) {
    return NextResponse.json({ error: 'Mockup not found' }, { status: 404 })
  }

  try {
    const data = await fs.readFile(filePath)
    const uint8 = new Uint8Array(data)
    const headers = new Headers()
    headers.set('Content-Type', 'image/jpeg')
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    headers.set('Content-Length', String(uint8.byteLength))
    headers.set('Content-Disposition', `inline; filename="${path.basename(filePath)}"`)

    return new NextResponse(uint8, { status: 200, headers })
  } catch (error) {
    console.error('Failed to read mockup file', filePath, error)
    return NextResponse.json({ error: 'Failed to read mockup' }, { status: 500 })
  }
}
