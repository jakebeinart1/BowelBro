import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { addVariantToCart } from '@/lib/cart'
import { ProductGallery } from '@/components/product-gallery'

export const runtime = 'nodejs'

function formatPrice(amount: number, currency: string) {
  if (!Number.isFinite(amount)) return '$0.00'
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount)
  } catch {
    return `$${amount.toFixed(2)}`
  }
}

export default async function ProductDetail({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      variants: {
        where: { isEnabled: true },
        orderBy: { name: 'asc' },
        include: {
          images: { orderBy: { position: 'asc' } }
        }
      }
    }
  })

  if (!product) notFound()

  const variants = product.variants.map((variant) => ({
    id: variant.id,
    name: variant.name,
    imageUrl: variant.imageUrl ?? product.thumbnailUrl ?? null,
    images: variant.images.map((image) => image.url),
    price: Number(variant.retailPrice),
    currency: (variant.currency || product.currency || 'usd').toUpperCase()
  }))

  const defaultVariant = variants[0]

  const gallerySet = new Set<string>()
  const galleryImages: Array<{ url: string; alt: string }> = []

  if (product.thumbnailUrl) {
    gallerySet.add(product.thumbnailUrl)
    galleryImages.push({ url: product.thumbnailUrl, alt: `${product.name} thumbnail` })
  }

  for (const variant of variants) {
    const variantAlt = `${product.name} – ${variant.name}`
    for (const url of variant.images) {
      if (!gallerySet.has(url)) {
        gallerySet.add(url)
        galleryImages.push({ url, alt: variantAlt })
      }
    }
  }

  if (!galleryImages.length && defaultVariant?.imageUrl) {
    galleryImages.push({ url: defaultVariant.imageUrl, alt: product.name })
  }

  async function addToCart(formData: FormData) {
    'use server'
    const productId = String(formData.get('productId') ?? '')
    const variantId = String(formData.get('variantId') ?? '')
    const quantity = Number(formData.get('quantity') ?? '1')

    if (!variantId) throw new Error('Variant is required')

    const variant = await prisma.variant.findFirst({
      where: { id: variantId, productId, isEnabled: true }
    })
    if (!variant) throw new Error('Variant unavailable')

    try {
      await addVariantToCart(variantId, quantity)
    } catch (err) {
      console.error('Failed to add to cart', err)
      throw err
    }

    revalidatePath('/cart')
    redirect('/cart')
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.4fr,1fr]">
      <div className="space-y-6">
        <ProductGallery images={galleryImages} />
        {product.description ? (
          <div className="rounded-3xl border border-[#efe6d9] bg-white/80 p-8 shadow-[0_20px_45px_-40px_rgba(39,31,24,0.55)]">
            <h2 className="text-sm font-semibold uppercase tracking-[0.25rem] text-[#8a7b70]">Story</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#544a42]">{product.description}</p>
          </div>
        ) : null}
      </div>

      <aside className="card space-y-7">
        <div className="space-y-3">
          <a className="text-xs font-semibold uppercase tracking-[0.3rem] text-[#8a7b70]" href="/products">
            ← Back to all tees
          </a>
          <h1 className="text-3xl font-semibold text-[#1f1d1a]">{product.name}</h1>
          {defaultVariant ? (
            <p className="text-lg text-[#534941]">
              From {formatPrice(defaultVariant.price, defaultVariant.currency)}
            </p>
          ) : (
            <p className="text-sm text-[#8a7b70]">No variants available right now.</p>
          )}
        </div>

        {variants.length ? (
          <form action={addToCart} className="grid gap-5">
            <input type="hidden" name="productId" value={product.id} />
            <fieldset className="grid gap-3 text-sm font-medium text-[#544a42]">
              <legend>Variant</legend>
              <div className="grid gap-2">
                {variants.map((variant) => {
                  const primaryImage = variant.images[0] ?? variant.imageUrl
                  return (
                    <label
                      key={variant.id}
                      className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#e9e1d7] bg-white px-3 py-2 shadow-sm transition hover:border-[#0f766e]/40"
                    >
                      <input
                        type="radio"
                        name="variantId"
                        value={variant.id}
                        defaultChecked={variant.id === defaultVariant?.id}
                        className="accent-[#0f766e]"
                        required
                      />
                      {primaryImage ? (
                        <img src={primaryImage} alt={variant.name} className="h-12 w-12 rounded-xl object-cover" />
                      ) : (
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f3ede4] text-[10px] uppercase text-[#8a7b70]">
                          No Img
                        </span>
                      )}
                      <span className="flex flex-1 flex-col">
                        <span className="font-semibold text-[#1f1d1a]">{variant.name}</span>
                        <span className="text-xs text-[#8a7b70]">{formatPrice(variant.price, variant.currency)}</span>
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>

            <label className="grid gap-2 text-sm font-medium text-[#544a42]">
              Quantity
              <input
                className="w-24 rounded-2xl border border-[#e9e1d7] bg-white px-3 py-2 text-sm"
                type="number"
                name="quantity"
                min="1"
                max="10"
                defaultValue="1"
              />
            </label>

            <button className="btn" type="submit">
              Add to cart
            </button>
          </form>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#e7ded2] bg-white/65 p-5 text-sm text-[#8a7b70]">
            We&apos;re restocking this item. Check back soon!
          </div>
        )}

        <div className="grid gap-4 rounded-2xl bg-[#f9f6ef] p-5 text-sm text-[#544a42]">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[#0f766e]" />
            Printed on premium, breathable cotton blend.
          </div>
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[#d97706]" />
            Packaged and shipped by Printful within 3-5 business days.
          </div>
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[#334155]" />
            Every dollar of profit is donated to IBD research and patient support.
          </div>
        </div>
      </aside>
    </div>
  )
}
