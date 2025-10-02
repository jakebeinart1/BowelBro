// scripts/sync_printful.ts
import 'dotenv/config'
import { prisma } from '../lib/db'
import { listSyncProducts, getSyncProduct } from '../lib/printful'

/** Convert any id-ish input to JS bigint safely */
const toBigInt = (x: unknown) => BigInt(String(x ?? '0'))

async function main() {
  let offset = 0
  const limit = 100
  let totalProducts = 0

  while (true) {
    const items = await listSyncProducts(limit, offset)
    if (!items.length) break

    for (const item of items) {
      try {
        // v1 sync item id (number-like), but we store as DB BigInt
        const productIdBI = toBigInt(item.id)

        // Fetch full detail (includes sync_variants)
        const detail = await getSyncProduct(Number(item.id))
        const prod = detail?.sync_product
        const variants = detail?.sync_variants ?? []

        // Upsert Product
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

        // Upsert Variants
        for (const v of variants) {
          const variantIdBI = toBigInt(v.id)
          const unitPrice = parseFloat(String(v.retail_price ?? '0'))
          const img = v.files?.[0]?.preview_url

          await prisma.variant.upsert({
            where: { printfulId: variantIdBI },
            update: {
              name: v.name ?? `Variant ${variantIdBI.toString()}`,
              retailPrice: unitPrice,
              imageUrl: img ?? undefined,
              productId: product.id
            },
            create: {
              printfulId: variantIdBI,
              name: v.name ?? `Variant ${variantIdBI.toString()}`,
              retailPrice: unitPrice,
              imageUrl: img ?? undefined,
              productId: product.id
            }
          })
        }

        totalProducts += 1
      } catch (e) {
        console.error('Failed to sync item', item?.id, e)
      }
    }

    // paginate
    offset += items.length
  }

  console.log(`Sync complete. Products processed: ${totalProducts}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
