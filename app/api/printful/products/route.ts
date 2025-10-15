// app/api/printful/products/route.ts
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import { retry } from '@/lib/retry'
import { getAvailableMockupViews, getMockupPath, getPrimaryMockupImage } from '@/lib/mockup-images'

// Deeply convert BigInt -> string so JSON.stringify won't explode
function bigIntToString(value: any): any {
  if (typeof value === 'bigint') return value.toString()
  if (value instanceof Prisma.Decimal) return value.toString()
  if (Array.isArray(value)) return value.map(bigIntToString)
  if (value && typeof value === 'object') {
    const out: Record<string, any> = {}
    for (const [k, v] of Object.entries(value)) out[k] = bigIntToString(v)
    return out
  }
  return value
}

export const runtime = 'nodejs'

export async function GET() {
  const products = await retry(() =>
    prisma.product.findMany({
      where: { isActive: true },
      include: {
        variants: {
          where: { isEnabled: true },
          include: { mockups: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })
  )

  const enriched = products.map((product) => {
    const fallbackSources = [
      product.thumbnailUrl,
      ...product.variants.flatMap((variant) => [
        variant.imageUrl,
        ...variant.mockups.map((mockup) => mockup.url)
      ])
    ]
    const views = getAvailableMockupViews(product.name)
    const primary = getPrimaryMockupImage(product.name, fallbackSources)

    return {
      ...product,
      customMockups: {
        views: views.map((view) => ({ view, url: getMockupPath(product.name, view) })),
        primaryImage: primary
      }
    }
  })

  const safe = bigIntToString(enriched)
  return NextResponse.json({ products: safe })
}
