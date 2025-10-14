import { NextRequest, NextResponse } from 'next/server'
import { listSyncProducts, getSyncProduct } from '@/lib/printful'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  // Requests must include the shared admin secret so random visitors can't trigger syncs.
  const auth = req.headers.get('x-admin-secret')
  if (!process.env.ADMIN_SECRET || auth !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let offset = 0
  let total = 0
  const limit = 100

  while (true) {
    const page = await listSyncProducts(limit, offset)
    const items = page.items
    if (!items.length) break

    for (const item of items) {
      const detail = await getSyncProduct(Number(item.id))
      const prod = detail?.sync_product
      const variants = detail?.sync_variants ?? []

      const product = await prisma.product.upsert({
        where: { printfulId: BigInt(String(item.id)) },
        update: {
          name: prod?.name ?? item.name ?? 'Unnamed',
          thumbnailUrl: prod?.thumbnail_url ?? item.thumbnail_url ?? undefined,
          description: prod?.description ?? undefined
        },
        create: {
          printfulId: BigInt(String(item.id)),
          name: prod?.name ?? item.name ?? 'Unnamed',
          thumbnailUrl: prod?.thumbnail_url ?? item.thumbnail_url ?? undefined,
          description: prod?.description ?? undefined
        }
      })

      for (const v of variants) {
        await prisma.variant.upsert({
          where: { printfulId: BigInt(String(v.id)) },
          update: {
            name: v.name ?? `Variant ${v.id}`,
            retailPrice: v.retail_price ? Number(v.retail_price) : 0,
            imageUrl: v.files?.[0]?.preview_url ?? undefined,
            productId: product.id
          },
          create: {
            printfulId: BigInt(String(v.id)),
            name: v.name ?? `Variant ${v.id}`,
            retailPrice: v.retail_price ? Number(v.retail_price) : 0,
            imageUrl: v.files?.[0]?.preview_url ?? undefined,
            productId: product.id
          }
        })
      }

      total++
    }

    const paging = page.paging
    const nextOffset = paging.offset + items.length
    const hasMore = nextOffset < paging.total || items.length === paging.limit
    if (!hasMore || nextOffset <= paging.offset) {
      offset = Math.max(nextOffset, paging.total)
      break
    }

    offset = nextOffset
  }

  return NextResponse.json({ ok: true, total })
}
