import fs from 'fs/promises'
import path from 'path'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getMockupFileByName, getMockupSlug } from '@/lib/mockup-images'

export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
  { params }: { params: { product: string; image: string } }
) {
  const productSlug = getMockupSlug(params.product, params.product)

  const filePath = getMockupFileByName(productSlug, params.image, productSlug)
  if (!filePath) {
    return NextResponse.json({ error: 'Mockup not found' }, { status: 404 })
  }

  try {
    const data = await fs.readFile(filePath)
    const buffer = new Uint8Array(data)

    const headers = new Headers()
    const ext = path.extname(filePath).toLowerCase()
    headers.set('Content-Type', ext === '.png' ? 'image/png' : 'image/jpeg')
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    headers.set('Content-Length', String(buffer.byteLength))
    headers.set('Content-Disposition', `inline; filename="${path.basename(filePath)}"`)

    return new NextResponse(buffer, { status: 200, headers })
  } catch (error) {
    console.error('Failed to read mockup file', filePath, error)
    return NextResponse.json({ error: 'Failed to read mockup' }, { status: 500 })
  }
}
