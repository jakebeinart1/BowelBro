import { prisma } from '@/lib/db'
import { listSyncProducts, getSyncProduct } from '@/lib/printful'

const toBigInt = (value: unknown) => BigInt(String(value ?? '0'))

export async function syncPrintfulProducts(limit = 100) {
  let offset = 0
  let processed = 0
  const seenProductPrintfulIds = new Set<bigint>()
  const seenVariantPrintfulIds = new Set<bigint>()

  while (true) {
    let page: Awaited<ReturnType<typeof listSyncProducts>> | null = null
    try {
      page = await listSyncProducts(limit, offset)
    } catch (err) {
      console.error('Failed to fetch product batch from Printful', err)
      break
    }

    const items = page?.items ?? []
    if (!items.length) break

    for (const item of items) {
      try {
        const productIdBI = toBigInt(item.id)
        seenProductPrintfulIds.add(productIdBI)
        const detail = await getSyncProduct(Number(item.id))
        const prod = detail?.sync_product
        const variants = detail?.sync_variants ?? []

        const product = await prisma.product.upsert({
          where: { printfulId: productIdBI },
          update: {
            name: prod?.name ?? item.name ?? 'Unnamed',
            thumbnailUrl: prod?.thumbnail_url ?? item.thumbnail_url ?? undefined,
            description: prod?.description ?? undefined,
            isActive: true
          },
          create: {
            printfulId: productIdBI,
            name: prod?.name ?? item.name ?? 'Unnamed',
            thumbnailUrl: prod?.thumbnail_url ?? item.thumbnail_url ?? undefined,
            description: prod?.description ?? undefined,
            isActive: true
          }
        })

        for (const variant of variants) {
          const variantIdBI = toBigInt(variant.id)
          seenVariantPrintfulIds.add(variantIdBI)
          const unitPrice = parseFloat(String(variant.retail_price ?? '0'))
          const preview = variant.files?.[0]?.preview_url
          const mockupFiles = (variant.files ?? []).flatMap((file) => [file?.preview_url, (file as any)?.url, (file as any)?.thumbnail_url])
          const uniqueMockups = Array.from(new Set(mockupFiles.filter((url): url is string => Boolean(url))))

          const variantRecord = await prisma.variant.upsert({
            where: { printfulId: variantIdBI },
            update: {
              name: variant.name ?? `Variant ${variantIdBI.toString()}`,
              retailPrice: unitPrice,
              imageUrl: preview ?? undefined,
              productId: product.id,
              isEnabled: true
            },
            create: {
              printfulId: variantIdBI,
              name: variant.name ?? `Variant ${variantIdBI.toString()}`,
              retailPrice: unitPrice,
              imageUrl: preview ?? undefined,
              productId: product.id,
              isEnabled: true
            }
          })

          await prisma.variantMockup.deleteMany({ where: { variantId: variantRecord.id } })

          if (uniqueMockups.length) {
            await prisma.variantMockup.createMany({
              data: uniqueMockups.map((url, index) => ({
                variantId: variantRecord.id,
                url,
                position: index
              }))
            })
          }
        }

        processed += 1
      } catch (err) {
        console.error('Printful sync failed for item', item?.id, err)
      }
    }

    const paging = page?.paging
    if (!paging) break

    const nextOffset = paging.offset + items.length
    const hasMore = nextOffset < paging.total || items.length === paging.limit
    if (!hasMore) break

    if (nextOffset <= paging.offset) {
      console.warn('[printful] Received non-incrementing paging data; stopping to avoid infinite loop.')
      break
    }

    offset = nextOffset
  }

  const productIdList = Array.from(seenProductPrintfulIds)
  const variantIdList = Array.from(seenVariantPrintfulIds)

  if (productIdList.length) {
    await prisma.product.updateMany({
      data: { isActive: false },
      where: { printfulId: { notIn: productIdList } }
    })
    await prisma.product.updateMany({
      data: { isActive: true },
      where: { printfulId: { in: productIdList } }
    })
  } else {
    console.warn('No products returned from Printful sync; skipping product deactivation to prevent unintended removal.')
  }

  if (variantIdList.length) {
    await prisma.variant.updateMany({
      data: { isEnabled: false },
      where: { printfulId: { notIn: variantIdList } }
    })
    await prisma.variant.updateMany({
      data: { isEnabled: true },
      where: { printfulId: { in: variantIdList } }
    })
  } else {
    console.warn('No variants returned from Printful sync; skipping variant deactivation to prevent unintended removal.')
  }

  return { processed }
}
