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
  const product = await prisma.product.findFirst({
    where: { id: params.id, isActive: true },
    include: {
      variants: {
        where: { isEnabled: true },
        orderBy: { name: 'asc' },
        include: {
          mockups: { orderBy: { position: 'asc' } }
        }
      }
    }
  })

  if (!product) notFound()

  const variants = product.variants.map((variant) => ({
    id: variant.id,
    name: variant.name,
    imageUrl: variant.imageUrl ?? product.thumbnailUrl ?? null,
    mockups: variant.mockups.map((mockup) => mockup.url),
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
    const alt = `${product.name} – ${variant.name}`
    const sources = variant.mockups.length ? variant.mockups : [variant.imageUrl]
    for (const url of sources) {
      if (url && !gallerySet.has(url)) {
        gallerySet.add(url)
        galleryImages.push({ url, alt })
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
          <div className="rounded-3xl border border-[rgba(82,121,111,0.45)] bg-[linear-gradient(160deg,rgba(26,77,46,0.92),rgba(10,47,31,0.9))] p-8 shadow-[0_24px_55px_-32px_rgba(0,0,0,0.55)]">
            <h2 className="text-sm font-semibold uppercase tracking-[0.25rem] text-[var(--sage)]">Story</h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--body-text-muted)]">{product.description}</p>
          </div>
        ) : null}
      </div>

      <aside className="card space-y-7 border-[rgba(82,121,111,0.45)] bg-[linear-gradient(150deg,rgba(26,77,46,0.9),rgba(10,47,31,0.95))]">
        <div className="space-y-3">
          <a className="text-xs font-semibold uppercase tracking-[0.3rem] text-[var(--sage)]" href="/products">
            ← Back to all tees
          </a>
          <h1 className="text-3xl font-semibold text-[var(--white)]">{product.name}</h1>
          {defaultVariant ? (
            <p className="text-lg text-[var(--body-text-muted)]">
              From {formatPrice(defaultVariant.price, defaultVariant.currency)}
            </p>
          ) : (
            <p className="text-sm text-[var(--sage)]">No variants available right now.</p>
          )}
        </div>

        {variants.length ? (
          <form action={addToCart} className="grid gap-5">
            <input type="hidden" name="productId" value={product.id} />
            <fieldset className="grid gap-3 text-sm font-medium text-[var(--body-text-muted)]">
              <legend className="text-[var(--accent-green)]">Variant</legend>
              <div className="grid gap-2">
                {variants.map((variant) => {
                  const primaryImage = variant.mockups[0] ?? variant.imageUrl
                  return (
                    <label
                      key={variant.id}
                      className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[rgba(82,121,111,0.45)] bg-[rgba(0,0,0,0.35)] px-3 py-2 shadow-[0_12px_28px_-22px_rgba(0,0,0,0.6)] transition hover:border-[var(--accent-green)]/60 hover:bg-[rgba(39,174,96,0.12)]"
                    >
                      <input
                        type="radio"
                        name="variantId"
                        value={variant.id}
                        defaultChecked={variant.id === defaultVariant?.id}
                        className="accent-[var(--accent-green)]"
                        required
                      />
                      {primaryImage ? (
                        <img src={primaryImage} alt={variant.name} className="h-12 w-12 rounded-xl object-cover" />
                      ) : (
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(82,121,111,0.25)] text-[10px] uppercase text-[var(--sage)]">
                          No Img
                        </span>
                      )}
                      <span className="flex flex-1 flex-col">
                        <span className="font-semibold text-[var(--white)]">{variant.name}</span>
                        <span className="text-xs text-[var(--body-text-muted)]">{formatPrice(variant.price, variant.currency)}</span>
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>

            <label className="grid gap-2 text-sm font-medium text-[var(--accent-green)]">
              Quantity
              <input
                className="w-24 rounded-2xl border border-[rgba(82,121,111,0.45)] bg-[rgba(0,0,0,0.3)] px-3 py-2 text-sm text-[var(--body-text)]"
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
          <div className="rounded-2xl border border-dashed border-[rgba(82,121,111,0.45)] bg-[rgba(0,0,0,0.25)] p-5 text-sm text-[var(--body-text-muted)]">
            We&apos;re restocking this item. Check back soon!
          </div>
        )}

        <div className="grid gap-4 rounded-2xl bg-[rgba(0,0,0,0.25)] p-5 text-sm text-[var(--body-text-muted)]">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[var(--accent-green)]" />
            Printed on premium, breathable cotton blend.
          </div>
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[var(--sage)]" />
            Packaged and shipped by Printful within 3-5 business days.
          </div>
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[var(--gold)]" />
            Every dollar of profit is donated to IBD research and patient support.
          </div>
        </div>
      </aside>
    </div>
  )
}
