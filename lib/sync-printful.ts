import { prisma } from '@/lib/db'
import { listSyncProducts, getSyncProduct } from '@/lib/printful'

const toBigInt = (value: unknown) => BigInt(String(value ?? '0'))

export async function syncPrintfulProducts(limit = 100) {
  let offset = 0
  let processed = 0

  while (true) {
    const items = await listSyncProducts(limit, offset)
    if (!items.length) break

    for (const item of items) {
      try {
        const productIdBI = toBigInt(item.id)
        const detail = await getSyncProduct(Number(item.id))
        const prod = detail?.sync_product
        const variants = detail?.sync_variants ?? []

        const product = await prisma.product.upsert({
          where: { printfulId: productIdBI },
          update: {
            name: prod?.name ?? item.name ?? 'Unnamed',
            thumbnailUrl: prod?.thumbnail_url ?? item.thumbnail_url ?? undefined
          },
          create: {
            printfulId: productIdBI,
            name: prod?.name ?? item.name ?? 'Unnamed',
            thumbnailUrl: prod?.thumbnail_url ?? item.thumbnail_url ?? undefined
          }
        })

        for (const variant of variants) {
          const variantIdBI = toBigInt(variant.id)
          const unitPrice = parseFloat(String(variant.retail_price ?? '0'))
          const preview = variant.files?.[0]?.preview_url

          await prisma.variant.upsert({
            where: { printfulId: variantIdBI },
            update: {
              name: variant.name ?? `Variant ${variantIdBI.toString()}`,
              retailPrice: unitPrice,
              imageUrl: preview ?? undefined,
              productId: product.id
            },
            create: {
              printfulId: variantIdBI,
              name: variant.name ?? `Variant ${variantIdBI.toString()}`,
              retailPrice: unitPrice,
              imageUrl: preview ?? undefined,
              productId: product.id
            }
          })
        }

        processed += 1
      } catch (err) {
        console.error('Printful sync failed for item', item?.id, err)
      }
    }

    offset += items.length
  }

  return { processed }
}
